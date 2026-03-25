import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Product {
  id: string;
  product_id: string;
  name: string;
  name_ko?: string;
  name_en?: string;
  model_code: string;
  category_id: string;
  short_description?: string;
  description?: string;
  image_url?: string;
  image_fit?: 'contain' | 'cover';
  unit_price: number;
  stock: number;
  status: 'active' | 'inactive';
  features?: string;
  features_json?: Array<string>;
  specs?: string;
  specs_json?: Array<{ label: string; value: string }>;
  spec_image_url?: string;
  spec_image_urls?: Array<string>;
  diameter_options?: string;
  length_options?: string;
  neck_options?: string;
  options?: Array<{ name: string; values: string[] }>;
  related_product_ids?: string[];
  kit_components?: Array<{ name: string; quantity: number }>;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

// product_options 테이블 타입
export interface ProductOption {
  id: string;
  product_id: string; // uuid (products.id)
  model_code: string;
  size_info: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // category_id가 null인 경우 name_ko 기반으로 자동 추론
      const enriched = (data || []).map((p) => ({
        ...p,
        category_id: p.category_id || inferCategoryId(p.name_ko || p.name || ''),
      }));

      setProducts(enriched);
    } catch (err) {
      console.error('제품 조회 오류:', err);
      setError(err instanceof Error ? err.message : '제품을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    // Realtime: products 테이블 변경 시 자동 refetch (관리자 단가 변경 즉시 반영)
    const channel = supabase
      .channel('products_realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        () => { fetchProducts(); }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        () => { fetchProducts(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { products, loading, error, refetch: fetchProducts };
};

export const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const fetchActiveProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const fetchProductByProductId = async (productId: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('product_id', productId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const upsertProduct = async (product: Partial<Product>): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .upsert({
      ...product,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateProductStatus = async (id: string, status: 'active' | 'inactive'): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .update({ 
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
};

export const updateProductSortOrder = async (id: string, sortOrder: number): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .update({ 
      sort_order: sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
};

export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const fetchCategories = async (): Promise<Array<{ id: string; name: string; count: number }>> => {
  const { data, error } = await supabase
    .from('products')
    .select('category_id');

  if (error) throw error;

  const categoryMap = new Map<string, number>();
  
  data?.forEach((product) => {
    if (product.category_id) {
      categoryMap.set(
        product.category_id,
        (categoryMap.get(product.category_id) || 0) + 1
      );
    }
  });

  return Array.from(categoryMap.entries()).map(([id, count]) => ({
    id,
    name: getCategoryName(id),
    count,
  }));
};

/**
 * 특정 제품의 옵션(규격) 목록을 product_options 테이블에서 가져오는 훅
 */
export const useProductOptions = (productId: string | null) => {
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('product_options')
          .select('id, product_id, model_code, size_info')
          .eq('product_id', productId)
          .order('size_info', { ascending: true });
        if (!error && !cancelled) {
          setOptions(data || []);
        }
      } catch (err) {
        console.error('product_options 조회 오류:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [productId]);

  return { options, loading };
};

/**
 * 여러 제품 ID의 옵션을 한 번에 가져오는 함수 (카드 그리드 최적화용)
 */
export const fetchProductOptionsByIds = async (
  productIds: string[]
): Promise<Record<string, ProductOption[]>> => {
  if (productIds.length === 0) return {};
  const { data, error } = await supabase
    .from('product_options')
    .select('id, product_id, model_code, size_info')
    .in('product_id', productIds)
    .order('size_info', { ascending: true });
  if (error) {
    console.error('product_options 일괄 조회 오류:', error);
    return {};
  }
  const map: Record<string, ProductOption[]> = {};
  (data || []).forEach((opt) => {
    if (!map[opt.product_id]) map[opt.product_id] = [];
    map[opt.product_id].push(opt);
  });
  return map;
};

const getCategoryName = (categoryId: string): string => {
  const categoryNames: Record<string, string> = {
    'fixture': '픽스쳐',
    'abutment': '어버트먼트',
    'scanbody': '스캔바디',
    'kit': '키트',
    'accessory': '액세서리',
  };
  return categoryNames[categoryId] || categoryId;
};

/**
 * name_ko 키워드 기반으로 category_id 자동 추론
 */
export const inferCategoryId = (nameKo: string): string => {
  const n = nameKo;

  // 픽스처 / 픽스쳐
  if (
    n.includes('픽스처') ||
    n.includes('픽스쳐') ||
    n.includes('Fixture') ||
    n.includes('HS-I') ||
    n.includes('HS-VII') ||
    n.includes('HSN') ||
    n.includes('넥스쳐') ||
    n.includes('넥스츄어') ||
    n.includes('STERI-OSS') ||
    n.includes('스테리오스') ||
    n.includes('바이오템') ||
    n.includes('BIOTEM')
  ) return 'fixture';

  // 스캔바디
  if (
    n.includes('스캔바디') ||
    n.includes('Scanbody') ||
    n.includes('스캔 핀') ||
    n.includes('랩 아날로그') ||
    n.includes('아날로그')
  ) return 'scanbody';

  // 링크 어버트먼트
  if (
    n.includes('링크') ||
    n.includes('Link')
  ) return 'link';

  // 게이지 & 키트
  if (
    n.includes('게이지') ||
    n.includes('Gauge') ||
    n.includes('키트') ||
    n.includes('Kit') ||
    n.includes('본 하이비') ||
    n.includes('골이식') ||
    n.includes('드라이버') ||
    n.includes('렌치') ||
    n.includes('힐링 캡') ||
    n.includes('Healing Cap') ||
    n.includes('토크')
  ) return 'gauge-kit';

  // 어버트먼트 (가장 마지막 — 링크/스캔바디 제외 후 매칭)
  if (
    n.includes('어버트먼트') ||
    n.includes('Abutment') ||
    n.includes('밀링') ||
    n.includes('Milling') ||
    n.includes('멀티') ||
    n.includes('Multi') ||
    n.includes('앵글') ||
    n.includes('Angled')
  ) return 'abutment';

  return 'abutment'; // 기본값
};