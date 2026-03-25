import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface PointData {
  id: string;
  client_id: string;
  client_name: string;
  business_number: string;
  point_balance: number;
  credit_balance: number;
  last_updated: string;
}

export interface PointTransaction {
  id: string;
  client_id: string;
  client_name: string;
  type: 'charge' | 'use' | 'adjust' | 'bonus' | 'refund';
  amount: number;
  balance_after: number;
  description: string;
  order_id?: string;
  admin_note?: string;
  created_at: string;
}

export interface ChargeRequest {
  id: string;
  client_id: string;
  client_name: string;
  business_number: string;
  amount: number;
  bonus_amount: number;
  total_amount: number;
  payment_method: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  reject_reason?: string;
}

// Supabase 조회 함수들 (페이징 적용)
// Phase 2: localStorage 폴백 완전 제거 — Supabase = 유일한 데이터 소스
const fetchPointsData = async (limit = 200): Promise<PointData[]> => {
  try {
    const { data, error } = await supabase
      .from('client_points')
      .select('id, client_id, client_name, business_number, point_balance, credit_balance, last_updated')
      .order('client_name')
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[usePoints] client_points 조회 실패:', err);
    return [];
  }
};

const fetchTransactions = async (limit = 200): Promise<PointTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('point_transactions')
      .select('id, client_id, client_name, type, amount, balance_after, description, order_id, admin_note, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[usePoints] point_transactions 조회 실패:', err);
    return [];
  }
};

const fetchChargeRequests = async (limit = 100): Promise<ChargeRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('charge_requests')
      .select('*')
      .order('requested_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[usePoints] charge_requests 조회 실패:', err);
    return [];
  }
};

// ✅ 싱글톤 Realtime 구독 관리 (중복 채널 방지)
let realtimeChannels: ReturnType<typeof supabase.channel>[] = [];
let isRealtimeSubscribed = false;

export const initPointsRealtime = (queryClient: ReturnType<typeof import('@tanstack/react-query').useQueryClient>) => {
  if (isRealtimeSubscribed) return;
  isRealtimeSubscribed = true;

  console.log('🔔 [싱글톤] Realtime 구독 시작: charge_requests, point_transactions, client_points');

  const chargeRequestsChannel = supabase
    .channel('singleton_charge_requests')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'charge_requests' }, (payload) => {
      console.log('🔔 charge_requests 변경:', payload.eventType);
      queryClient.invalidateQueries({ queryKey: ['charge_requests'] });
    })
    .subscribe();

  const pointTransactionsChannel = supabase
    .channel('singleton_point_transactions')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'point_transactions' }, (payload) => {
      console.log('🔔 point_transactions 변경:', payload.eventType);
      queryClient.invalidateQueries({ queryKey: ['point_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['client_points'] });
    })
    .subscribe();

  const clientPointsChannel = supabase
    .channel('singleton_client_points')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'client_points' }, (payload) => {
      console.log('🔔 client_points 변경:', payload.eventType);
      queryClient.invalidateQueries({ queryKey: ['client_points'] });
    })
    .subscribe();

  realtimeChannels = [chargeRequestsChannel, pointTransactionsChannel, clientPointsChannel];
};

export const cleanupPointsRealtime = () => {
  if (!isRealtimeSubscribed) return;
  console.log('🔕 [싱글톤] Realtime 구독 해제');
  realtimeChannels.forEach(ch => supabase.removeChannel(ch));
  realtimeChannels = [];
  isRealtimeSubscribed = false;
};

export const usePoints = () => {
  const queryClient = useQueryClient();

  // React Query로 포인트 데이터 캐싱
  const { data: pointsData = [], isLoading: pointsLoading } = useQuery({
    queryKey: ['client_points'],
    queryFn: () => fetchPointsData(200),
    staleTime: 60 * 1000,
  });

  // React Query로 거래내역 캐싱
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['point_transactions'],
    queryFn: () => fetchTransactions(200),
    staleTime: 60 * 1000,
  });

  // React Query로 충전요청 캐싱
  const { data: chargeRequests = [], isLoading: chargeRequestsLoading } = useQuery({
    queryKey: ['charge_requests'],
    queryFn: () => fetchChargeRequests(100),
    staleTime: 30 * 1000,
  });

  // ✅ 싱글톤 Realtime 초기화 (중복 방지)
  useEffect(() => {
    initPointsRealtime(queryClient);
    // 훅 레벨에서는 cleanup 하지 않음 — App 레벨에서 관리
  }, [queryClient]);

  const loading = pointsLoading || transactionsLoading || chargeRequestsLoading;

  // 포인트 조정
  const adjustPoints = async (
    clientId: string,
    clientName: string,
    adjustType: 'add' | 'subtract' | 'set',
    amount: number,
    reason: string
  ) => {
    try {
      const client = pointsData.find(p => p.client_id === clientId);
      if (!client) throw new Error('거래처를 찾을 수 없습니다');

      let newBalance = client.point_balance;
      let actualAmount = amount;

      if (adjustType === 'add') {
        newBalance = client.point_balance + amount;
      } else if (adjustType === 'subtract') {
        newBalance = client.point_balance - amount;
        actualAmount = -amount;
      } else if (adjustType === 'set') {
        actualAmount = amount - client.point_balance;
        newBalance = amount;
      }

      const { error: updateError } = await supabase
        .from('client_points')
        .update({
          point_balance: newBalance,
          last_updated: new Date().toISOString()
        })
        .eq('client_id', clientId);

      if (updateError) throw updateError;

      const transaction: Omit<PointTransaction, 'id'> = {
        client_id: clientId,
        client_name: clientName,
        type: 'adjust',
        amount: actualAmount,
        balance_after: newBalance,
        description: reason,
        admin_note: `관리자 조정 (${adjustType === 'add' ? '추가' : adjustType === 'subtract' ? '차감' : '설정'})`,
        created_at: new Date().toISOString()
      };
      await supabase.from('point_transactions').insert([transaction]);

      // 캐시 무효화 (자동 재조회)
      queryClient.invalidateQueries({ queryKey: ['client_points'] });
      queryClient.invalidateQueries({ queryKey: ['point_transactions'] });

      return { success: true };
    } catch (err) {
      console.error('포인트 조정 실패:', err);
      throw err;
    }
  };

  // 충전 요청 승인
  const approveChargeRequest = async (requestId: string, adminName: string) => {
    try {
      const request = chargeRequests.find(r => r.id === requestId);
      if (!request) throw new Error('충전 요청을 찾을 수 없습니다');

      const client = pointsData.find(p => p.client_id === request.client_id);
      if (!client) throw new Error('거래처를 찾을 수 없습니다');

      const newBalance = client.point_balance + request.total_amount;

      // ① client_points 업데이트
      const { error: updateError } = await supabase
        .from('client_points')
        .update({ point_balance: newBalance, last_updated: new Date().toISOString() })
        .eq('client_id', request.client_id);

      if (updateError) throw updateError;

      // ② clients 테이블 point_balance 동기화 (거래처 상세 페이지 실시간 반영)
      await supabase
        .from('clients')
        .update({ point_balance: newBalance })
        .eq('business_number', request.business_number);

      // ③ charge_requests 상태 업데이트
      const { error: requestError } = await supabase
        .from('charge_requests')
        .update({ status: 'approved', processed_at: new Date().toISOString(), processed_by: adminName })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // ④ 충전 거래 내역 기록
      const chargeTransaction: Omit<PointTransaction, 'id'> = {
        client_id: request.client_id,
        client_name: request.client_name,
        type: 'charge',
        amount: request.amount,
        balance_after: client.point_balance + request.amount,
        description: `포인트 충전 (${request.payment_method})`,
        created_at: new Date().toISOString()
      };
      await supabase.from('point_transactions').insert([chargeTransaction]);

      // ⑤ 보너스 거래 내역 기록
      if (request.bonus_amount > 0) {
        const bonusTransaction: Omit<PointTransaction, 'id'> = {
          client_id: request.client_id,
          client_name: request.client_name,
          type: 'bonus',
          amount: request.bonus_amount,
          balance_after: newBalance,
          description: `충전 보너스 (${((request.bonus_amount / request.amount) * 100).toFixed(0)}%)`,
          created_at: new Date().toISOString()
        };
        await supabase.from('point_transactions').insert([bonusTransaction]);
      }

      // ⑥ 캐시 무효화 (자동 재조회)
      queryClient.invalidateQueries({ queryKey: ['client_points'] });
      queryClient.invalidateQueries({ queryKey: ['point_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['charge_requests'] });

      return { success: true };
    } catch (err) {
      console.error('충전 승인 실패:', err);
      throw err;
    }
  };

  // 충전 요청 거절
  const rejectChargeRequest = async (requestId: string, adminName: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('charge_requests')
        .update({ status: 'rejected', processed_at: new Date().toISOString(), processed_by: adminName, reject_reason: reason })
        .eq('id', requestId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['charge_requests'] });
      return { success: true };
    } catch (err) {
      console.error('충전 거절 실패:', err);
      throw err;
    }
  };

  // 포인트 차감 (주문 시 사용)
  const deductPoints = async (
    businessNumber: string,
    clientName: string,
    amount: number,
    orderId: string
  ): Promise<boolean> => {
    try {
      const client = pointsData.find(
        p => p.business_number === businessNumber
      );
      
      if (!client) {
        console.error('거래처를 찾을 수 없습니다');
        return false;
      }

      if (client.point_balance < amount) {
        console.error('포인트가 부족합니다');
        return false;
      }

      const newBalance = client.point_balance - amount;

      const { error: updateError } = await supabase
        .from('client_points')
        .update({
          point_balance: newBalance,
          last_updated: new Date().toISOString()
        })
        .eq('client_id', client.client_id);

      if (updateError) {
        console.error('포인트 차감 실패:', updateError);
        return false;
      }

      const { error: txError } = await supabase
        .from('point_transactions')
        .insert([{
          client_id: client.client_id,
          client_name: clientName,
          type: 'use',
          amount: -amount,
          balance_after: newBalance,
          description: `주문 결제 (${orderId})`,
          order_id: orderId,
          created_at: new Date().toISOString()
        }]);

      if (txError) {
        console.error('거래 내역 저장 실패:', txError);
      }

      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['client_points'] });
      queryClient.invalidateQueries({ queryKey: ['point_transactions'] });

      return true;
    } catch (err) {
      console.error('포인트 차감 오류:', err);
      return false;
    }
  };

  // 포인트 충전
  const chargePoints = async (
    businessNumber: string,
    clientName: string,
    amount: number,
    description: string
  ): Promise<boolean> => {
    try {
      const client = pointsData.find(
        p => p.business_number === businessNumber
      );
      
      if (!client) {
        console.error('거래처를 찾을 수 없습니다');
        return false;
      }

      const newBalance = client.point_balance + amount;

      const { error: updateError } = await supabase
        .from('client_points')
        .update({
          point_balance: newBalance,
          last_updated: new Date().toISOString()
        })
        .eq('client_id', client.client_id);

      if (updateError) {
        console.error('포인트 충전 실패:', updateError);
        return false;
      }

      const { error: txError } = await supabase
        .from('point_transactions')
        .insert([{
          client_id: client.client_id,
          client_name: clientName,
          type: 'charge',
          amount: amount,
          balance_after: newBalance,
          description: description,
          created_at: new Date().toISOString()
        }]);

      if (txError) {
        console.error('거래 내역 저장 실패:', txError);
      }

      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['client_points'] });
      queryClient.invalidateQueries({ queryKey: ['point_transactions'] });

      return true;
    } catch (err) {
      console.error('포인트 충전 오류:', err);
      return false;
    }
  };

  const getClientTransactions = (clientId: string) => {
    return transactions.filter(t => t.client_id === clientId);
  };

  const getClientPoint = (businessNumber: string): PointData | null => {
    if (!businessNumber) return null;
    return pointsData.find(
      p => p.business_number === businessNumber
    ) || null;
  };

  return {
    pointsData,
    transactions,
    chargeRequests,
    loading,
    error: null,
    adjustPoints,
    approveChargeRequest,
    rejectChargeRequest,
    getClientTransactions,
    getClientPoint,
    deductPoints,
    chargePoints,
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['client_points'] });
      queryClient.invalidateQueries({ queryKey: ['point_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['charge_requests'] });
    }
  };
};