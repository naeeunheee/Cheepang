import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PaymentWebhookPayload {
  order_id?: string;
  charge_request_id?: string;
  amount: number;
  status: string;
  client_id?: string;
  client_business_number?: string;
  transaction_id?: string;
  payment_method?: string;
  pg_provider?: string;
}

serve(async (req) => {
  // CORS preflight 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Supabase 클라이언트 초기화
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // POST 요청만 허용
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 결제 데이터 파싱
    const payload: PaymentWebhookPayload = await req.json();
    console.log('Payment webhook received:', payload);

    const {
      order_id,
      charge_request_id,
      amount,
      status,
      client_id,
      client_business_number,
      transaction_id,
      payment_method = 'card',
      pg_provider = 'unknown',
    } = payload;

    // 필수 필드 검증
    if (!amount || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: amount, status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 결제 성공 상태만 처리
    if (status !== 'success' && status !== 'paid' && status !== 'completed') {
      return new Response(
        JSON.stringify({ error: 'Payment status is not success', status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // charge_request_id가 있는 경우: 포인트 충전 처리
    if (charge_request_id) {
      // 1. charge_requests 조회 및 검증
      const { data: chargeRequest, error: chargeError } = await supabase
        .from('charge_requests')
        .select('*')
        .eq('id', charge_request_id)
        .single();

      if (chargeError || !chargeRequest) {
        console.error('Charge request not found:', chargeError);
        return new Response(
          JSON.stringify({ error: 'Charge request not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 중복 처리 방지
      if (chargeRequest.status !== 'pending') {
        console.warn('Charge request already processed:', chargeRequest.status);
        return new Response(
          JSON.stringify({ error: 'Charge request already processed', status: chargeRequest.status }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 금액 일치 여부 확인
      if (chargeRequest.amount !== amount) {
        console.error('Amount mismatch:', { expected: chargeRequest.amount, received: amount });
        return new Response(
          JSON.stringify({ error: 'Amount mismatch' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const targetClientId = chargeRequest.client_id;

      // 2. charge_requests 상태 업데이트
      const { error: updateChargeError } = await supabase
        .from('charge_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          transaction_id,
          payment_method,
          pg_provider,
        })
        .eq('id', charge_request_id);

      if (updateChargeError) {
        console.error('Failed to update charge_requests:', updateChargeError);
        throw updateChargeError;
      }

      // 3. client_points 잔액 업데이트
      const { data: currentPoints, error: pointsError } = await supabase
        .from('client_points')
        .select('point_balance')
        .eq('client_id', targetClientId)
        .single();

      if (pointsError) {
        console.error('Failed to fetch client_points:', pointsError);
        throw pointsError;
      }

      const newBalance = (currentPoints?.point_balance || 0) + amount;

      const { error: updatePointsError } = await supabase
        .from('client_points')
        .update({
          point_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('client_id', targetClientId);

      if (updatePointsError) {
        console.error('Failed to update client_points:', updatePointsError);
        throw updatePointsError;
      }

      // 4. point_transactions INSERT
      const { error: transactionError } = await supabase
        .from('point_transactions')
        .insert({
          client_id: targetClientId,
          type: 'charge',
          amount,
          balance_after: newBalance,
          description: `PG 결제 완료 (${pg_provider})`,
          transaction_id,
          created_at: new Date().toISOString(),
        });

      if (transactionError) {
        console.error('Failed to insert point_transactions:', transactionError);
        throw transactionError;
      }

      console.log('Charge request processed successfully:', {
        charge_request_id,
        client_id: targetClientId,
        amount,
        new_balance: newBalance,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Charge request processed successfully',
          charge_request_id,
          new_balance: newBalance,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // order_id가 있는 경우: 주문 결제 처리
    if (order_id) {
      // 1. orders 조회 및 검증
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single();

      if (orderError || !order) {
        console.error('Order not found:', orderError);
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 중복 처리 방지
      if (order.status !== '결제대기' && order.status !== 'pending') {
        console.warn('Order already processed:', order.status);
        return new Response(
          JSON.stringify({ error: 'Order already processed', status: order.status }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 금액 일치 여부 확인
      if (order.total_price !== amount) {
        console.error('Amount mismatch:', { expected: order.total_price, received: amount });
        return new Response(
          JSON.stringify({ error: 'Amount mismatch' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 2. orders 상태 업데이트
      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({
          status: '주문확인',
          payment_status: 'paid',
          transaction_id,
          payment_method,
          pg_provider,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order_id);

      if (updateOrderError) {
        console.error('Failed to update orders:', updateOrderError);
        throw updateOrderError;
      }

      console.log('Order payment processed successfully:', {
        order_id,
        amount,
        status: '주문확인',
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Order payment processed successfully',
          order_id,
          status: '주문확인',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // charge_request_id와 order_id 모두 없는 경우
    return new Response(
      JSON.stringify({ error: 'Missing charge_request_id or order_id' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Payment webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
