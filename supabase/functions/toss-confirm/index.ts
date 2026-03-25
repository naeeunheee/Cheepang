import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  qty: number;
  unit_price: number;
  total_price: number;
}

interface Product {
  id: string;
  name: string;
  stock: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { paymentKey, orderId, amount } = await req.json();

    if (!paymentKey || !orderId || !amount) {
      return new Response(
        JSON.stringify({ error: '필수 파라미터가 누락되었습니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Toss Payments API 호출
    const tossSecretKey = Deno.env.get('TOSS_SECRET_KEY');
    if (!tossSecretKey) {
      throw new Error('TOSS_SECRET_KEY가 설정되지 않았습니다.');
    }

    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(tossSecretKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const tossData = await tossResponse.json();

    if (!tossResponse.ok) {
      return new Response(
        JSON.stringify({ error: '결제 승인에 실패했습니다.', details: tossData }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Supabase 클라이언트 초기화
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // orderId로 주문 찾기
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, client_id')
      .eq('order_number', orderId)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: '주문을 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 주문 항목 조회
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    if (itemsError) {
      throw itemsError;
    }

    // 재고 확인 및 차감
    const stockErrors: string[] = [];
    
    if (orderItems && orderItems.length > 0) {
      for (const item of orderItems as OrderItem[]) {
        if (!item.product_id) continue;

        // 현재 재고 조회
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id, name, stock')
          .eq('id', item.product_id)
          .maybeSingle();

        if (productError || !product) {
          stockErrors.push(`제품 ${item.product_name}을(를) 찾을 수 없습니다.`);
          continue;
        }

        const typedProduct = product as Product;

        // 재고 부족 확인
        if (typedProduct.stock < item.qty) {
          stockErrors.push(`제품 ${item.product_name}의 재고가 부족합니다. (현재: ${typedProduct.stock}, 필요: ${item.qty})`);
          continue;
        }

        // 원자적 재고 차감
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: typedProduct.stock - item.qty })
          .eq('id', item.product_id)
          .gte('stock', item.qty);

        if (stockError) {
          stockErrors.push(`제품 ${item.product_name}의 재고 차감에 실패했습니다.`);
        }
      }
    }

    // 재고 오류가 있으면 결제 거절
    if (stockErrors.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: '재고 부족으로 결제를 완료할 수 없습니다.', 
          details: stockErrors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // payments 테이블에 INSERT (payment_key UNIQUE 제약으로 중복 방지)
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        provider: 'toss',
        payment_key: paymentKey,
        order_id: order.id,
        amount: tossData.totalAmount,
        method: tossData.method,
        raw_json: tossData,
      });

    if (paymentError) {
      // 중복 결제 시도 (payment_key UNIQUE 위반)
      if (paymentError.code === '23505') {
        return new Response(
          JSON.stringify({ error: '이미 처리된 결제입니다.' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw paymentError;
    }

    // orders.status = 'paid' 업데이트
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', order.id);

    if (updateError) {
      throw updateError;
    }

    // 거래처 정보 조회 (이메일 발송용)
    const { data: client } = await supabase
      .from('clients')
      .select('email, name, business_name')
      .eq('id', order.client_id)
      .maybeSingle();

    // 이메일 발송 (Resend API)
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey && client?.email) {
      try {
        // 주문 항목 HTML 생성
        let itemsHtml = '';
        if (orderItems && orderItems.length > 0) {
          itemsHtml = (orderItems as OrderItem[]).map(item => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.product_name}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.qty}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.unit_price.toLocaleString()}원</td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.total_price.toLocaleString()}원</td>
            </tr>
          `).join('');
        }

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>주문 확인</title>
          </head>
          <body style="font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">주문이 완료되었습니다</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">안녕하세요, <strong>${client.name || client.business_name}</strong>님</p>
              
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 30px;">
                주문번호 <strong>${orderId}</strong>의 결제가 정상적으로 완료되었습니다.
              </p>

              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="font-size: 18px; margin-top: 0; color: #111827;">주문 상세</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #f3f4f6;">
                      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">제품명</th>
                      <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">수량</th>
                      <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">단가</th>
                      <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">합계</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="3" style="padding: 16px; text-align: right; font-weight: bold; font-size: 16px;">총 결제금액</td>
                      <td style="padding: 16px; text-align: right; font-weight: bold; font-size: 18px; color: #667eea;">${amount.toLocaleString()}원</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div style="background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; font-size: 14px; color: #1e40af;">
                  <strong>결제 방법:</strong> ${tossData.method === 'card' ? '카드' : tossData.method}
                </p>
              </div>

              <p style="font-size: 13px; color: #9ca3af; margin-top: 30px; text-align: center;">
                문의사항이 있으시면 언제든지 연락주세요.<br>
                감사합니다.
              </p>
            </div>
          </body>
          </html>
        `;

        // 거래처에게 이메일 발송
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'noreply@yourdomain.com',
            to: client.email,
            subject: `[주문 완료] ${orderId} - 결제가 완료되었습니다`,
            html: emailHtml,
          }),
        });

        // 관리자에게도 이메일 발송
        const adminEmail = Deno.env.get('ADMIN_EMAIL');
        if (adminEmail) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'noreply@yourdomain.com',
              to: adminEmail,
              subject: `[신규 주문] ${orderId} - ${client.name || client.business_name}`,
              html: emailHtml,
            }),
          });
        }
      } catch (emailError) {
        console.error('이메일 발송 실패:', emailError);
        // 이메일 실패는 결제 성공에 영향을 주지 않음
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '결제가 성공적으로 완료되었습니다.',
        payment: tossData 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});