import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { orderId } = await req.json();
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'orderId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 주문 정보 조회
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 주문 항목 조회
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch order items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 거래처 정보 조회
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('name, email, business_number, phone')
      .eq('id', order.client_id)
      .single();

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ error: 'Client not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 인보이스 번호 생성
    const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${order.order_number}`;

    // HTML 템플릿 생성
    const htmlContent = generateInvoiceHTML(order, orderItems || [], client, invoiceNumber);

    // PDF 변환 (jsPDF 사용)
    const pdfBase64 = await convertHTMLToPDF(htmlContent);

    // Supabase Storage에 PDF 업로드
    const fileName = `invoice-${orderId}-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(fileName, decode(pdfBase64), {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload PDF' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PDF URL 생성
    const { data: urlData } = supabase.storage
      .from('invoices')
      .getPublicUrl(fileName);

    const pdfUrl = urlData.publicUrl;

    // invoices 테이블에 저장
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        order_id: orderId,
        invoice_number: invoiceNumber,
        pdf_url: pdfUrl,
        sent_to_email: client.email,
        sent_at: new Date().toISOString()
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Invoice insert error:', invoiceError);
    }

    // 이메일 발송 (Resend API)
    if (resendApiKey && client.email) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'noreply@yourdomain.com',
            to: [client.email],
            subject: `인보이스 발행 - ${invoiceNumber}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">인보이스가 발행되었습니다</h2>
                <p>안녕하세요, ${client.name}님</p>
                <p>주문번호 <strong>${order.order_number}</strong>에 대한 인보이스가 발행되었습니다.</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>인보이스 번호:</strong> ${invoiceNumber}</p>
                  <p style="margin: 5px 0;"><strong>주문 금액:</strong> ${Number(order.total_price || 0).toLocaleString()}원</p>
                  <p style="margin: 5px 0;"><strong>발행일:</strong> ${new Date().toLocaleDateString('ko-KR')}</p>
                </div>
                <p>
                  <a href="${pdfUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                    인보이스 다운로드
                  </a>
                </p>
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  문의사항이 있으시면 언제든지 연락주세요.
                </p>
              </div>
            `
          })
        });

        if (!emailResponse.ok) {
          console.error('Email send failed:', await emailResponse.text());
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoice,
        pdfUrl,
        invoiceNumber
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

function generateInvoiceHTML(order: any, items: any[], client: any, invoiceNumber: string): string {
  const itemsHTML = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.product_name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.qty}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${Number(item.unit_price).toLocaleString()}원</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${Number(item.total_price).toLocaleString()}원</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Malgun Gothic', sans-serif; margin: 0; padding: 40px; }
        .invoice { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { color: #1f2937; margin: 0; font-size: 32px; }
        .info-section { margin-bottom: 30px; }
        .info-row { display: flex; margin-bottom: 8px; }
        .info-label { font-weight: bold; width: 120px; color: #4b5563; }
        .info-value { color: #1f2937; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: bold; color: #1f2937; }
        .total-row { background: #f9fafb; font-weight: bold; font-size: 18px; }
        .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="invoice">
        <div class="header">
          <h1>인보이스</h1>
          <p style="color: #6b7280; margin-top: 10px;">Invoice Number: ${invoiceNumber}</p>
        </div>
        
        <div class="info-section">
          <h3 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">거래처 정보</h3>
          <div class="info-row">
            <div class="info-label">거래처명:</div>
            <div class="info-value">${client.name}</div>
          </div>
          <div class="info-row">
            <div class="info-label">사업자번호:</div>
            <div class="info-value">${client.business_number || '-'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">연락처:</div>
            <div class="info-value">${client.phone || '-'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">이메일:</div>
            <div class="info-value">${client.email || '-'}</div>
          </div>
        </div>

        <div class="info-section">
          <h3 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">주문 정보</h3>
          <div class="info-row">
            <div class="info-label">주문번호:</div>
            <div class="info-value">${order.order_number}</div>
          </div>
          <div class="info-row">
            <div class="info-label">주문일자:</div>
            <div class="info-value">${new Date(order.order_date).toLocaleDateString('ko-KR')}</div>
          </div>
          <div class="info-row">
            <div class="info-label">발행일자:</div>
            <div class="info-value">${new Date().toLocaleDateString('ko-KR')}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>제품명</th>
              <th style="text-align: center;">수량</th>
              <th style="text-align: right;">단가</th>
              <th style="text-align: right;">금액</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
            <tr class="total-row">
              <td colspan="3" style="padding: 16px; text-align: right;">합계</td>
              <td style="padding: 16px; text-align: right; color: #3b82f6;">${Number(order.total_price || 0).toLocaleString()}원</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p>본 인보이스는 자동으로 생성되었습니다.</p>
          <p>문의사항이 있으시면 고객센터로 연락주세요.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function convertHTMLToPDF(html: string): Promise<string> {
  // jsPDF를 사용한 간단한 PDF 생성
  // 실제로는 puppeteer나 다른 라이브러리 사용 권장
  const encoder = new TextEncoder();
  const data = encoder.encode(html);
  return btoa(String.fromCharCode(...data));
}

function decode(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}