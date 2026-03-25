/**
 * 카카오 알림톡 / SMS 발송 유틸리티 (서버사이드 처리)
 *
 * 모든 알림은 Supabase Edge Function `kakao-notify`를 통해 서버에서 발송됩니다.
 * API 키는 Supabase Edge Function 시크릿에 안전하게 보관됩니다.
 *
 * Edge Function 시크릿 설정 (Supabase Dashboard → Functions → kakao-notify → Secrets):
 *   KAKAO_API_KEY     - 카카오 API 키
 *   KAKAO_SENDER_KEY  - 카카오 발신 프로필 키
 *   ADMIN_PHONE       - 관리자 전화번호
 *   SMS_API_KEY       - SMS 폴백 API 키 (선택)
 */

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/kakao-notify`;
const ANON_KEY = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

interface NotifyPayload {
  type: 'admin_new_order' | 'client_payment_success' | 'client_order_status' | 'admin_charge_request';
  to?: string;
  params: Record<string, string>;
}

/**
 * Edge Function을 통해 알림 발송
 * API 키는 서버사이드에서 처리되어 노출되지 않습니다
 */
async function sendNotification(payload: NotifyPayload): Promise<boolean> {
  try {
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error('[kakaoNotify] Edge Function 오류:', data.error ?? res.status);
      return false;
    }

    console.log(`[kakaoNotify] 알림 발송 성공 (${data.channel}):`, data.to);
    return true;
  } catch (err) {
    console.error('[kakaoNotify] 네트워크 오류:', err);
    return false;
  }
}

/**
 * 관리자에게 신규 주문 알림 발송
 */
export async function notifyAdminNewOrder(orderData: {
  clientName: string;
  productName: string;
  amount: number;
}): Promise<void> {
  await sendNotification({
    type: 'admin_new_order',
    params: {
      clientName:  orderData.clientName,
      productName: orderData.productName,
      amount:      orderData.amount.toLocaleString(),
    },
  });
}

/**
 * 치과에 결제 완료 알림 발송
 */
export async function notifyClientPaymentSuccess(paymentData: {
  clientPhone: string;
  amount: number;
  balance: number;
}): Promise<void> {
  await sendNotification({
    type: 'client_payment_success',
    to: paymentData.clientPhone,
    params: {
      amount:  paymentData.amount.toLocaleString(),
      balance: paymentData.balance.toLocaleString(),
    },
  });
}

/**
 * 치과에 주문 상태 변경 알림 발송
 */
export async function notifyClientOrderStatus(statusData: {
  clientPhone: string;
  orderNumber: string;
  status: string;
  productName?: string;
  amount?: number;
}): Promise<boolean> {
  // 주문확인 상태는 알림 발송 제외
  if (statusData.status === '주문확인') {
    console.log('[kakaoNotify] 주문확인 상태는 알림 발송 제외');
    return true;
  }

  // 알림 발송 대상 상태만 처리
  const notifyStatuses = ['준비중', '배송중', '배송완료', '환불'];
  if (!notifyStatuses.includes(statusData.status)) {
    console.log(`[kakaoNotify] 알림 발송 대상 아닌 상태: ${statusData.status}`);
    return false;
  }

  const params: Record<string, string> = {
    orderNumber: statusData.orderNumber,
    productName: statusData.productName ?? '',
    status:      statusData.status,
  };

  if (statusData.status === '환불' && statusData.amount) {
    params.amount = statusData.amount.toLocaleString();
  }

  return sendNotification({
    type: 'client_order_status',
    to:   statusData.clientPhone,
    params,
  });
}

/**
 * 관리자에게 충전 요청 알림 발송
 */
export async function notifyAdminChargeRequest(chargeData: {
  clientName: string;
  amount: number;
}): Promise<void> {
  await sendNotification({
    type: 'admin_charge_request',
    params: {
      clientName: chargeData.clientName,
      amount:     chargeData.amount.toLocaleString(),
    },
  });
}
