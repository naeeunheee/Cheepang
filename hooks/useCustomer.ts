import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAuthUser } from '../utils/auth';
import { supabase } from '../lib/supabase';

export interface Customer {
  businessNo: string;
  clinicName: string;
  pointBalance: number;
  arBalance: number;
  creditLimit?: number;
  grade?: string;
}

/**
 * Phase 2 재작성: Supabase = 유일한 데이터 소스
 * - localStorage 폴백 완전 제거
 * - clients + client_points 병렬 조회
 * - 데이터 없으면 null (명시적)
 */
export function useCustomer(paramBusinessNo?: string | null): Customer | null {
  const { businessNo: authBusinessNo } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);

  const targetBusinessNo = paramBusinessNo || authBusinessNo || null;

  useEffect(() => {
    if (!targetBusinessNo) {
      setCustomer(null);
      return;
    }

    let cancelled = false;

    const loadCustomer = async () => {
      try {
        // Supabase 병렬 조회: clients + client_points
        const [clientResult, pointResult] = await Promise.all([
          supabase
            .from('clients')
            .select('name, credit_limit, grade')
            .eq('business_number', targetBusinessNo)
            .maybeSingle(),
          supabase
            .from('client_points')
            .select('client_name, point_balance, credit_balance')
            .eq('business_number', targetBusinessNo)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        if (clientResult.error && clientResult.error.code !== 'PGRST116') {
          console.error('[useCustomer] clients 조회 실패:', clientResult.error);
        }
        if (pointResult.error && pointResult.error.code !== 'PGRST116') {
          console.error('[useCustomer] client_points 조회 실패:', pointResult.error);
        }

        const clientData = clientResult.data;
        const pointData = pointResult.data;

        // Supabase에 데이터 없으면 null 반환 (폴백 없음)
        if (!clientData && !pointData) {
          setCustomer(null);
          return;
        }

        setCustomer({
          businessNo: targetBusinessNo,
          clinicName: clientData?.name || pointData?.client_name || targetBusinessNo,
          pointBalance: Number(pointData?.point_balance) || 0,
          arBalance: Number(pointData?.credit_balance) || 0,
          creditLimit: clientData?.credit_limit,
          grade: clientData?.grade,
        });
      } catch (error) {
        console.error('[useCustomer] Supabase 조회 에러:', error);
        if (!cancelled) setCustomer(null);
      }
    };

    loadCustomer();

    return () => { cancelled = true; };
  }, [targetBusinessNo]);

  return customer;
}

/**
 * @deprecated useAuth().businessNo 사용 권장
 * 외부 호환용 유지 (PointBadge.tsx, my-orders/page.tsx)
 * Phase 2 완료 후 제거 예정
 */
export function getCurrentBusinessNo(): string | null {
  const user = getAuthUser();
  return user?.businessNo || null;
}

/**
 * arBalance 상태에 따른 표시 텍스트 및 색상 반환
 */
export function getArBalanceStatus(arBalance: number): {
  label: string;
  colorClass: string;
  bgClass: string;
  iconClass: string;
} {
  if (arBalance > 0) {
    return {
      label: '미수 있음',
      colorClass: 'text-red-600',
      bgClass: 'bg-red-50',
      iconClass: 'text-red-500',
    };
  }
  if (arBalance === 0) {
    return {
      label: '정상',
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-50',
      iconClass: 'text-emerald-500',
    };
  }
  return {
    label: '선수금',
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    iconClass: 'text-blue-500',
  };
}