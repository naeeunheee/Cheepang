import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface AlimtalkPayload {
  type: 'admin_new_order' | 'client_payment_success' | 'client_order_status' | 'admin_charge_request';
  to?: string;        // 수신자 전화번호 (직접 지정 시)
  params: Record<string, string>;
}

// 템플릿 코드 매핑
const TEMPLATE_MAP: Record<string, string> = {
  admin_new_order:        'ADMIN_NEW_ORDER',
  client_payment_success: 'CLIENT_PAYMENT_SUCCESS',
  client_order_status:    'CLIENT_ORDER_STATUS',
  admin_charge_request:   'ADMIN_CHARGE_REQUEST',
};

// SMS 폴백 메시지 생성
function buildSmsMessage(templateCode: string, params: Record<string, string>): string {
  const templates: Record<string, string> = {
    ADMIN_NEW_ORDER: `[치팡] 신규 주문 접수\n거래처: #{clientName}\n제품: #{productName}\n금액: #{amount}원\n주문관리에서 확인해주세요.`,
    CLIENT_PAYMENT_SUCCESS: `[치팡] 결제 완료\n충전금액: #{amount}원\n잔여포인트: #{balance}원\n감사합니다.`,
    CLIENT_ORDER_STATUS: `[치팡] 주문 상태 변경\n주문번호: #{orderNumber}\n제품명: #{productName}\n상태: #{status}`,
    ADMIN_CHARGE_REQUEST: `[치팡] 포인트 충전 요청\n거래처: #{clientName}\n금액: #{amount}원\n포인트관리에서 확인해주세요.`,
  };

  let msg = templates[templateCode] ?? '치팡 알림이 도착했습니다.';
  for (const [key, value] of Object.entries(params)) {
    msg = msg.replaceAll(`#{${key}}`, value);
  }
  return msg;
}

// 카카오 알림톡 발송
async function sendKakaoAlimtalk(
  to: string,
  templateCode: string,
  params: Record<string, string>,
): Promise<boolean> {
  const apiKey    = Deno.env.get('KAKAO_API_KEY');
  const senderKey = Deno.env.get('KAKAO_SENDER_KEY');

  if (!apiKey || !senderKey) {
    console.log('[kakao-notify] 시뮬레이션 모드 — API 키 없음');
    console.log({ to, templateCode, params });
    return true; // 시뮬레이션 성공으로 처리
  }

  const res = await fetch('https://api.kakao.com/v1/alimtalk/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      sender_key:      senderKey,
      receiver:        to,
      template_code:   templateCode,
      template_params: params,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[kakao-notify] 카카오 API 오류:', res.status, errText);
    return false;
  }

  console.log('[kakao-notify] 카카오 알림톡 발송 성공:', to);
  return true;
}

// SMS 폴백 발송
async function sendSmsFallback(to: string, message: string): Promise<boolean> {
  const smsApiKey = Deno.env.get('SMS_API_KEY');

  if (!smsApiKey) {
    console.log('[kakao-notify] SMS 시뮬레이션:', { to, message });
    return true;
  }

  const res = await fetch('https://api.sms-provider.com/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${smsApiKey}`,
    },
    body: JSON.stringify({ to, message }),
  });

  if (!res.ok) {
    console.error('[kakao-notify] SMS 발송 실패:', res.status);
    return false;
  }

  console.log('[kakao-notify] SMS 폴백 발송 성공:', to);
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: AlimtalkPayload = await req.json();
    const { type, params } = payload;

    // 수신자 전화번호 결정
    let to = payload.to ?? '';
    if (!to) {
      // admin 알림은 환경변수에서 가져옴
      if (type === 'admin_new_order' || type === 'admin_charge_request') {
        to = Deno.env.get('ADMIN_PHONE') ?? '01012345678';
      }
    }

    if (!to) {
      return new Response(
        JSON.stringify({ success: false, error: '수신자 전화번호가 없습니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const templateCode = TEMPLATE_MAP[type] ?? type.toUpperCase();

    // 1차 시도: 카카오 알림톡
    const kakaoOk = await sendKakaoAlimtalk(to, templateCode, params);

    if (!kakaoOk) {
      // 2차 시도: SMS 폴백
      const smsMessage = buildSmsMessage(templateCode, params);
      const smsOk = await sendSmsFallback(to, smsMessage);

      return new Response(
        JSON.stringify({
          success: smsOk,
          channel: 'sms_fallback',
          to,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, channel: 'kakao', to }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[kakao-notify] 오류:', err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
