/**
 * Supabase settings 테이블 래퍼
 * Phase 2 Step 4: localStorage 설정 → Supabase settings 이전
 *
 * 테이블 구조:
 *   CREATE TABLE settings (
 *     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *     key TEXT UNIQUE NOT NULL,
 *     value JSONB NOT NULL,
 *     updated_at TIMESTAMPTZ DEFAULT now()
 *   );
 */

import { supabase } from '../lib/supabase';

export async function getSetting<T = any>(key: string): Promise<T | null> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error(`[settings] "${key}" 조회 실패:`, error);
      return null;
    }

    return (data?.value as T) ?? null;
  } catch (err) {
    console.error(`[settings] "${key}" 조회 에러:`, err);
    return null;
  }
}

export async function setSetting<T = any>(key: string, value: T): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('settings')
      .upsert(
        { key, value: value as any, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) {
      console.error(`[settings] "${key}" 저장 실패:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[settings] "${key}" 저장 에러:`, err);
    return false;
  }
}

export async function deleteSetting(key: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('settings')
      .delete()
      .eq('key', key);

    if (error) {
      console.error(`[settings] "${key}" 삭제 실패:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[settings] "${key}" 삭제 에러:`, err);
    return false;
  }
}
