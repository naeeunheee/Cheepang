import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface Notice {
  id: number;
  type: 'event' | 'notice';
  tag: string;
  tag_color: string;
  title: string;
  description: string;
  date: string;
  start_date?: string;
  end_date?: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export const useNotices = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchNotices = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      // 전체 활성 공지 가져오기
      const { data, error: fetchError } = await supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      // 클라이언트 사이드 날짜 필터 (오늘 기준)
      const today = new Date().toISOString().split('T')[0];
      const filtered = (data || []).filter((n: Notice) => {
        if (n.start_date && n.start_date > today) return false;
        if (n.end_date && n.end_date < today) return false;
        return true;
      });

      setNotices(filtered);
    } catch (err) {
      console.error('공지사항 불러오기 실패:', err);
      setError(err instanceof Error ? err.message : '공지사항을 불러올 수 없습니다');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchNotices();

    const handleFocus = () => {
      fetchingRef.current = false;
      fetchNotices();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchingRef.current = false;
        fetchNotices();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchNotices]);

  return { notices, loading, error, refetch: fetchNotices };
};
