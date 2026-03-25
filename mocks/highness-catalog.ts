// ─────────────────────────────────────────────
// 상위 카테고리 (Category)
// ─────────────────────────────────────────────
export interface HignessCategory {
  id: string;
  name_ko: string;
  name_en: string;
  description: string;
  hero_image_url: string;
  sort_order: number;
}

export const highnessCategories: HignessCategory[] = [
  {
    id: 'fixture',
    name_ko: '픽스쳐',
    name_en: 'Fixture',
    description:
      '하이니스 임플란트 픽스쳐. Bone Level (HS-I, HS-VII, HSN-I, HSN-VII)과 Tissue Level (넥스츄어, 넥스츄어7) 총 6가지 모델로 다양한 임상 상황에 최적화된 픽스쳐를 제공합니다.',
    hero_image_url: 'https://static.readdy.ai/image/4634c18daa6eee5863d25b64dc634e79/0d748788222b43ab6e8373d7c2bd2a2c.png',
    sort_order: 0,
  },
  {
    id: 'abutment',
    name_ko: '어버트먼트',
    name_en: 'Abutment',
    description:
      '임플란트와 보철물을 연결하는 핵심 부품. Base, Angled, Multi, Milling 타입으로 다양한 임상 상황에 대응합니다.',
    hero_image_url: 'https://highnessimplant.com/pages/layout/_highness/images/sub/product_sy1_img4.png',
    sort_order: 1,
  },
  {
    id: 'scanbody',
    name_ko: '스캔바디',
    name_en: 'Scanbody',
    description:
      '디지털 구강 스캔에 최적화된 정밀 스캔바디. 라이브러리 자동 매칭으로 오차를 최소화합니다.',
    hero_image_url: 'https://highnessimplant.com/pages/layout/_highness/images/sub/product_sy1_img13.png',
    sort_order: 2,
  },
  {
    id: 'link',
    name_ko: '링크 어버트먼트',
    name_en: 'Link Abutment',
    description:
      'No Cementation 시스템으로 Zirconia 파절과 탈락을 원천 차단. Long / Short / Angled / Internal 타입 제공.',
    hero_image_url: 'https://highnessimplant.com/pages/layout/_highness/images/sub/product_sy1_img8.png',
    sort_order: 3,
  },
  {
    id: 'gauge-kit',
    name_ko: '게이지 & 키트',
    name_en: 'Gauge & Kit',
    description:
      '정확한 측정과 수술 효율을 높이는 게이지 세트 및 본 키트. 체계적인 임상 워크플로우를 지원합니다.',
    hero_image_url: 'https://highnessimplant.com/upload_files/common_file/product/202508/175575980810.png',
    sort_order: 4,
  },
];

// ─────────────────────────────────────────────
// 옵션 타입
// ─────────────────────────────────────────────
export interface ProductOption {
  label: string;
  values: string[];
}

// ─────────────────────────────────────────────
// 하위 제품 (Product)
// ─────────────────────────────────────────────
export interface HignessProduct {
  id: string;
  category_id: string;
  name_ko: string;
  name_en: string;
  model_code: string;
  short_desc: string;
  image_url: string;
  spec_image_urls?: string[];
  object_fit?: 'contain' | 'cover';
  options: ProductOption[];
  specs: { label: string; value: string }[];
  features: string[];
  related_product_ids: string[];
  sort_order: number;
  status: 'active' | 'inactive';
  detail_page_id?: string;
  base_price: number;
  kit_components?: KitComponent[];
  kit_type?: 'simple' | 'full' | 'perfect' | 'standard';
  kit_price_simple?: number;
  kit_price_full?: number;
  sub_type?: 'bone_level' | 'tissue_level';
}

export interface KitComponent {
  name: string;
  code: string;
  qty_desc: string;
  note: string;
  image_url?: string;
  included_in?: ('simple' | 'full' | 'all')[];
}

export const highnessProducts: HignessProduct[] = [
  // ===== FIXTURES =====
  {
    id: 'fx-bl-001',
    category_id: 'fixture',
    name_ko: 'HS-I',
    name_en: 'HS-I',
    model_code: 'HS-I',
    short_desc: 'Bone Level 임플란트 시스템의 기본 모델. Internal Hex + 11° Morse Taper 연결 구조로 우수한 안정성을 제공합니다.',
    image_url: 'https://public.readdy.ai/ai/img_res/8e294cf2-e04f-4d0a-815b-bd6ff3fa7ab0.png',
    spec_image_urls: [
      'https://highnessimplant.com/upload_files/common_file/product/202302/16766015455.png',
      'https://highnessimplant.com/upload_files/common_file/product/202302/167660154510.png',
      'https://highnessimplant.com/upload_files/common_file/product/202302/167660154511.png',
    ],
    object_fit: 'contain',
    sub_type: 'bone_level',
    options: [
      { label: '직경', values: ['Ø3.5', 'Ø4.0', 'Ø4.5', 'Ø5.0'] },
      { label: '길이', values: ['8.0mm', '10.0mm', '11.5mm', '13.0mm'] },
    ],
    specs: [
      { label: '소재', value: 'Grade 4 순수 티타늄 (Cp-Ti)' },
      { label: '시스템', value: 'Bone Level' },
      { label: '직경', value: 'Ø3.5 / Ø4.0 / Ø4.5 / Ø5.0' },
      { label: '길이', value: '8.0 / 10.0 / 11.5 / 13.0 mm' },
      { label: '표면처리', value: 'SLA (Sand-blasted, Large-grit, Acid-etched)' },
      { label: '연결 방식', value: 'Internal Hex + 11° Morse Taper' },
      { label: 'Hex 사이즈', value: '2.5 Hex' },
      { label: '식립 토크', value: '최대 35 Ncm' },
      { label: '피로강도', value: '256~262 N' },
      { label: '패키징', value: '1 Fixture + 1 Cover Screw + 1 Mount' },
      { label: '인증', value: 'CE, KFDA, ISO 13485' },
    ],
    features: [
      'Bone Level 시스템의 표준형 모델',
      'Internal Hex + 11° Morse Taper 연결로 안정적인 체결',
      'SLA 표면처리로 우수한 골유착',
      '다양한 직경·길이 옵션으로 범용성 극대화',
      '256~262N 피로강도로 장기 안정성 보장',
    ],
    related_product_ids: ['ba-001', 'ba-002', 'ba-003', 'sb-003', 'sb-004', 'la-001', 'gs-001'],
    sort_order: 1,
    status: 'active',
    detail_page_id: 'fx-bl-001',
    base_price: 1000,
  },
  {
    id: 'fx-bl-007',
    category_id: 'fixture',
    name_ko: 'HS-VII',
    name_en: 'HS-VII',
    model_code: 'HS-VII',
    short_desc: 'Root Type 미세날 디자인의 Tapered Body 임플란트. 초기 고정력이 우수하며 심미 영역에 적합합니다.',
    image_url: 'https://public.readdy.ai/ai/img_res/c344800c-030b-4883-ab2a-e15186da1ba7.png',
    spec_image_urls: [
      'https://highnessimplant.com/upload_files/common_file/product/202302/16766061743.png',
      'https://highnessimplant.com/upload_files/common_file/product/202302/167660617410.png',
      'https://highnessimplant.com/upload_files/common_file/product/202302/167660617411.png',
    ],
    object_fit: 'contain',
    sub_type: 'bone_level',
    options: [
      { label: '직경', values: ['Ø3.5', 'Ø4.0', 'Ø4.5', 'Ø5.0', 'Ø6.0'] },
      { label: '길이', values: ['8.0mm', '10.0mm', '11.5mm', '13.0mm', '14.5mm'] },
    ],
    specs: [
      { label: '소재', value: 'Grade 4 순수 티타늄 (Cp-Ti)' },
      { label: '시스템', value: 'Bone Level' },
      { label: '직경', value: 'Ø3.5 / Ø4.0 / Ø4.5 / Ø5.0 / Ø6.0' },
      { label: '길이', value: '8.0 / 10.0 / 11.5 / 13.0 / 14.5 mm' },
      { label: '표면처리', value: 'SLA (Sand-blasted, Large-grit, Acid-etched)' },
      { label: '연결 방식', value: 'Internal Hex + 11° Morse Taper' },
      { label: 'Hex 사이즈', value: '2.5 Hex' },
      { label: '식립 토크', value: '최대 35 Ncm' },
      { label: '바디 형태', value: 'Root Type (미세날 Tapered body)' },
      { label: '패키징', value: '1 Fixture + 1 Cover Screw + 1 Mount' },
      { label: '인증', value: 'CE, KFDA, ISO 13485' },
    ],
    features: [
      'Root Type 미세날 디자인으로 초기 고정력 극대화',
      'Tapered body로 발치 즉시 식립(Immediate Placement) 최적화',
      '14.5mm 길이 옵션 포함으로 다양한 케이스 대응',
      '연골 케이스에서도 안정적인 식립 가능',
      '심미 영역 임플란트에 적합',
    ],
    related_product_ids: ['ba-001', 'ba-002', 'ba-003', 'sb-003', 'sb-004', 'la-001', 'gs-001'],
    sort_order: 2,
    status: 'active',
    detail_page_id: 'fx-bl-007',
    base_price: 1000,
  },
  {
    id: 'fx-bl-hsn1',
    category_id: 'fixture',
    name_ko: 'HSN-I',
    name_en: 'HSN-I',
    model_code: 'HSN-I',
    short_desc: 'HSN 표면처리 Bone Level 임플란트. Body는 HSN 처리, Neck은 Machined 처리로 연조직 부착을 최적화했습니다.',
    image_url: 'https://public.readdy.ai/ai/img_res/1ac565c5-a2be-4d9f-9887-73200ddf5cb8.png',
    spec_image_urls: [
      'https://highnessimplant.com/upload_files/common_file/product/202302/16766072784.png',
      'https://highnessimplant.com/upload_files/common_file/product/202302/167660727810.png',
      'https://highnessimplant.com/upload_files/common_file/product/202302/167660727811.png',
    ],
    object_fit: 'contain',
    sub_type: 'bone_level',
    options: [
      { label: '직경', values: ['Ø3.5', 'Ø4.0', 'Ø4.5', 'Ø5.0'] },
      { label: '길이', values: ['8.0mm', '10.0mm', '11.5mm', '13.0mm'] },
      { label: 'neck 높이', values: ['1.5mm', '2.5mm', '3.5mm'] },
    ],
    specs: [
      { label: '소재', value: 'Grade 4 순수 티타늄 (Cp-Ti)' },
      { label: '시스템', value: 'Bone Level' },
      { label: '직경', value: 'Ø3.5 / Ø4.0 / Ø4.5 / Ø5.0' },
      { label: '길이', value: '8.0 / 10.0 / 11.5 / 13.0 mm' },
      { label: 'neck 높이', value: '1.5 / 2.5 / 3.5 mm' },
      { label: '표면처리', value: 'HSN (Body) + Machined (Neck)' },
      { label: '연결 방식', value: 'Internal Hex + 11° Morse Taper' },
      { label: 'Hex 사이즈', value: '2.5 Hex' },
      { label: '식립 토크', value: '최대 35 Ncm' },
      { label: '패키징', value: '1 Fixture + 1 Healing Abutment' },
      { label: '인증', value: 'CE, KFDA, ISO 13485' },
    ],
    features: [
      'HSN 표면처리로 골유착 촉진 및 치유 기간 단축',
      'Body는 HSN, Neck은 Machined 처리로 연조직 부착 최적화',
      'neck 높이 1.5/2.5/3.5mm 옵션으로 다양한 골 높이 대응',
      'Bone Level 시스템의 장점과 HSN 표면처리 결합',
      '장기 안정성과 심미성 동시 확보',
    ],
    related_product_ids: ['ba-001', 'ba-002', 'ba-003', 'sb-003', 'sb-004', 'la-001', 'gs-001'],
    sort_order: 3,
    status: 'active',
    detail_page_id: 'fx-bl-hsn1',
    base_price: 1000,
  },
  {
    id: 'fx-bl-hsn7',
    category_id: 'fixture',
    name_ko: 'HSN-VII',
    name_en: 'HSN-VII',
    model_code: 'HSN-VII',
    short_desc: 'Root Type + HSN 표면처리 Bone Level 임플란트. 미세날 디자인과 HSN 처리로 초기 고정력과 골유착을 동시에 향상시켰습니다.',
    image_url: 'https://public.readdy.ai/ai/img_res/b93e22a6-30a1-4efc-85cf-d16bc2837f8d.png',
    spec_image_urls: [
      'https://highnessimplant.com/upload_files/common_file/product/202302/16766073361.png',
      'https://highnessimplant.com/upload_files/common_file/product/202302/167660733610.png',
      'https://highnessimplant.com/upload_files/common_file/product/202302/167660733611.png',
    ],
    object_fit: 'contain',
    sub_type: 'bone_level',
    options: [
      { label: '직경', values: ['Ø3.5', 'Ø4.0', 'Ø4.5', 'Ø5.0', 'Ø6.0'] },
      { label: '길이', values: ['8.0mm', '10.0mm', '11.5mm', '13.0mm', '14.5mm'] },
      { label: 'neck 높이', values: ['1.5mm', '2.5mm', '3.5mm'] },
    ],
    specs: [
      { label: '소재', value: 'Grade 4 순수 티타늄 (Cp-Ti)' },
      { label: '시스템', value: 'Bone Level' },
      { label: '직경', value: 'Ø3.5 / Ø4.0 / Ø4.5 / Ø5.0 / Ø6.0' },
      { label: '길이', value: '8.0 / 10.0 / 11.5 / 13.0 / 14.5 mm' },
      { label: 'neck 높이', value: '1.5 / 2.5 / 3.5 mm' },
      { label: '표면처리', value: 'HSN (Body) + Machined (Neck)' },
      { label: '연결 방식', value: 'Internal Hex + 11° Morse Taper' },
      { label: 'Hex 사이즈', value: '2.5 Hex' },
      { label: '식립 토크', value: '최대 35 Ncm' },
      { label: '바디 형태', value: 'Root Type (미세날 Tapered body)' },
      { label: '패키징', value: '1 Fixture + 1 Healing Abutment' },
      { label: '인증', value: 'CE, KFDA, ISO 13485' },
    ],
    features: [
      'Root Type 미세날 + HSN 표면처리로 초기 고정력 극대화',
      '발치 즉시 식립 및 연골 케이스에 최적화',
      '14.5mm 길이 옵션으로 다양한 임상 상황 대응',
      'neck 높이 옵션으로 골 높이에 맞춤 선택 가능',
      'HSN 처리로 골유착 촉진 및 장기 안정성 확보',
    ],
    related_product_ids: ['ba-001', 'ba-002', 'ba-003', 'sb-003', 'sb-004', 'la-001', 'gs-001'],
    sort_order: 4,
    status: 'active',
    detail_page_id: 'fx-bl-hsn7',
    base_price: 1000,
  },

  // ── Fixture - Tissue Level (넥스츄어 시리즈) ──
  {
    id: 'fx-nx-001',
    category_id: 'fixture',
    name_ko: '넥스츄어 (Nexture)',
    name_en: 'Nexture (NX-I)',
    model_code: 'NX-I',
    short_desc: '넥스츄어 시리즈 표준형 Tissue Level 픽스쳐. 독자적인 나사산 디자인으로 초기 고정력과 골유착을 동시에 최적화하며, 1회법 수술에 최적화되어 있습니다.',
    image_url: 'https://public.readdy.ai/ai/img_res/2ce8a5cd-f3b4-49c6-8ded-7574caba720e.png',
    spec_image_urls: [
      'https://highnessimplant.com/upload_files/common_file/product/202508/17545495523.png',
      'https://highnessimplant.com/upload_files/common_file/product/202508/175454955210.png',
      'https://highnessimplant.com/upload_files/common_file/product/202508/175454955211.png',
    ],
    object_fit: 'contain',
    sub_type: 'tissue_level',
    options: [
      { label: '직경', values: ['Ø3.5', 'Ø4.0', 'Ø4.5', 'Ø5.0'] },
      { label: '길이', values: ['8.0mm', '10.0mm', '11.5mm', '13.0mm'] },
      { label: 'neck 높이', values: ['1.5mm', '2.5mm', '3.5mm'] },
    ],
    specs: [
      { label: '소재', value: 'Grade 4 순수 티타늄 (Cp-Ti)' },
      { label: '시스템', value: 'Digital Prosthesis System (Tissue Level)' },
      { label: '직경', value: 'Ø3.5 / Ø4.0 / Ø4.5 / Ø5.0' },
      { label: '길이', value: '8.0 / 10.0 / 11.5 / 13.0 mm' },
      { label: 'neck 높이', value: '1.5 / 2.5 / 3.5 mm' },
      { label: '표면처리', value: 'HSN (Body) + Machined (Neck)' },
      { label: '연결 방식', value: 'Internal Hex + 11° Morse Taper' },
      { label: 'Hex 사이즈', value: '2.5 Hex' },
      { label: '식립 토크', value: '최대 35 Ncm' },
      { label: '바디 형태', value: 'Root Type (미세날 Tapered body)' },
      { label: '패키징', value: '1 Fixture + 2 Healing Abutment' },
      { label: '인증', value: 'CE, KFDA, ISO 13485' },
    ],
    features: [
      '넥스츄어 시리즈 표준형으로 범용성 극대화',
      '독자적 나사산 디자인으로 초기 고정력 우수',
      'Tissue Level 1회법 수술 가능 (2차 수술 불필요)',
      'HSN 표면처리로 골유착 촉진',
      '다양한 직경·길이 옵션으로 임상 적용 범위 확대',
      'Internal Hex + 11° Morse Taper 안정적 연결',
    ],
    related_product_ids: ['ba-001', 'ba-002', 'ba-003', 'sb-003', 'sb-004', 'la-001', 'gs-001'],
    sort_order: 5,
    status: 'active',
    detail_page_id: 'fx-nx-001',
    base_price: 1000,
  },
  {
    id: 'fx-nx-007',
    category_id: 'fixture',
    name_ko: '넥스츄어7 (Nexture7)',
    name_en: 'Nexture7 (NX-VII)',
    model_code: 'NX-VII',
    short_desc: '넥스츄어7 Root Type Tissue Level 픽스쳐. 미세날의 Tapered body로 초기 고정력을 극대화하며, 발치 즉시 식립 및 연골 케이스에 탁월한 성능을 발휘합니다.',
    image_url: 'https://public.readdy.ai/ai/img_res/ae6f20d7-d08b-4635-a3a1-f62660f7fefa.png',
    spec_image_urls: [
      'https://highnessimplant.com/upload_files/common_file/product/202508/17545495657.png',
      'https://highnessimplant.com/upload_files/common_file/product/202508/175454956510.png',
      'https://highnessimplant.com/upload_files/common_file/product/202508/175454956511.png',
    ],
    object_fit: 'contain',
    sub_type: 'tissue_level',
    options: [
      { label: '직경', values: ['Ø3.5', 'Ø4.0', 'Ø4.5', 'Ø5.0', 'Ø6.0'] },
      { label: '길이', values: ['8.0mm', '10.0mm', '11.5mm', '13.0mm', '14.5mm'] },
      { label: 'neck 높이', values: ['1.5mm', '2.5mm', '3.5mm'] },
    ],
    specs: [
      { label: '소재', value: 'Grade 4 순수 티타늄 (Cp-Ti)' },
      { label: '시스템', value: 'Tissue Level' },
      { label: '직경', value: 'Ø3.5 / Ø4.0 / Ø4.5 / Ø5.0 / Ø6.0' },
      { label: '길이', value: '8.0 / 10.0 / 11.5 / 13.0 / 14.5 mm' },
      { label: 'neck 높이', value: '1.5 / 2.5 / 3.5 mm' },
      { label: '표면처리', value: 'SLA + Machined Neck' },
      { label: '연결 방식', value: 'Internal Hex + 11° Morse Taper' },
      { label: 'Hex 사이즈', value: '2.5 Hex' },
      { label: '식립 토크', value: '최대 35 Ncm' },
      { label: '바디 형태', value: 'Root Type (미세날 Tapered body)' },
      { label: '패키징', value: '1 Fixture + 2 Healing Abutment' },
      { label: '인증', value: 'CE, KFDA, ISO 13485' },
    ],
    features: [
      'Root Type으로 bone에 가해지는 압박을 안정적으로 가해 초기 고정력 극대화',
      '미세날 Tapered body로 초기 고정력이 높음',
      '아래로 갈수록 날카로운 나사산이 삽입 압력을 증가시킴',
      '식립 시 적은 토크 사용으로 하중 분산력이 좋아 연골에 안정적인 시술 가능',
      'Tissue Level 1회법 수술 가능',
      'HSN 표면처리로 골유착 촉진',
    ],
    related_product_ids: ['ba-001', 'ba-002', 'ba-003', 'sb-003', 'sb-004', 'la-001', 'gs-001', 'gs-002'],
    sort_order: 6,
    status: 'active',
    detail_page_id: 'fx-nx-007',
    base_price: 1000,
  },

  // ── Abutment ──────────────────────────────
  {
    id: 'ba-001',
    category_id: 'abutment',
    name_ko: 'Base Abutment',
    name_en: 'Base Abutment',
    model_code: 'HN-BA',
    short_desc: 'Base Abutment 체결 후 제거할 필요가 없어 Soft Tissue의 Sealing이 안정적.',
    image_url: 'https://public.readdy.ai/ai/img_res/592a25bb-13ef-4aa5-abae-d13e1d606216.png',
    object_fit: 'contain',
    options: [
      { label: '직경', values: ['3.5mm', '4.0mm', '4.5mm', '5.0mm'] },
      { label: '높이', values: ['1.0mm', '2.0mm', '3.0mm', '4.0mm', '5.0mm', '6.0mm'] },
    ],
    specs: [
      { label: '소재', value: 'Grade 5 티타늄 (Ti-6Al-4V)' },
      { label: '직경', value: '3.5 / 4.0 / 4.5 / 5.0 mm' },
      { label: '높이', value: '1.0 ~ 6.0 mm' },
      { label: '체결 토크', value: '15 Ncm' },
      { label: '호환 픽스쳐', value: 'HS-I, HS-VII, HSN-I, HSN-VII, 넥스츄어, 넥스츄어7 전 모델' },
      { label: '인증', value: 'CE, KFDA' },
    ],
    features: [
      'Base Abutment 체결 후 제거할 필요가 없어 Soft Tissue의 Sealing이 안정적임',
      '교합력 분산에 최적화된 구조',
      '모든 하이니스 픽스쳐와 호환',
    ],
    related_product_ids: ['fx-bl-001', 'fx-bl-007', 'fx-bl-hsn1', 'fx-bl-hsn7', 'fx-nx-001', 'fx-nx-007', 'sb-003', 'sb-004', 'la-001', 'gs-001'],
    sort_order: 1,
    status: 'active',
    detail_page_id: 'base-abutment',
    base_price: 1000,
  },
  {
    id: 'ba-002',
    category_id: 'abutment',
    name_ko: 'Angled Base Abutment',
    name_en: 'Angled Base Abutment',
    model_code: 'HN-ABA',
    short_desc: '각도 보정이 필요한 케이스를 위한 경사형 어버트먼트.',
    image_url: 'https://public.readdy.ai/ai/img_res/ce334c13-b4d0-458a-8843-d547559162de.png',
    object_fit: 'contain',
    options: [
      { label: '직경', values: ['3.5mm', '4.0mm', '4.5mm', '5.0mm'] },
      { label: '각도', values: ['15°', '25°'] },
      { label: '높이', values: ['1.0mm', '2.0mm', '3.0mm'] },
    ],
    specs: [
      { label: '소재', value: 'Grade 5 티타늄 (Ti-6Al-4V)' },
      { label: '직경', value: '3.5 / 4.0 / 4.5 / 5.0 mm' },
      { label: '각도', value: '15° / 25°' },
      { label: '체결 토크', value: '15 Ncm' },
      { label: '호환 픽스쳐', value: 'HS-I, HS-VII, HSN-I, HSN-VII, 넥스츄어, 넥스츄어7 전 모델' },
      { label: '인증', value: 'CE, KFDA' },
    ],
    features: [
      '15°, 25° 각도 옵션으로 다양한 임상 상황 대응',
      'Soft Tissue Sealing 유지',
      '안정적인 교합력 분산',
      '모든 하이니스 픽스쳐와 호환',
    ],
    related_product_ids: ['fx-bl-001', 'fx-bl-007', 'fx-bl-hsn1', 'fx-bl-hsn7', 'fx-nx-001', 'fx-nx-007', 'sb-003', 'sb-004', 'la-001', 'gs-001'],
    sort_order: 2,
    status: 'active',
    detail_page_id: 'angled-base-abutment',
    base_price: 1000,
  },
  {
    id: 'ba-003',
    category_id: 'abutment',
    name_ko: 'Multi Abutment',
    name_en: 'Multi Abutment',
    model_code: 'HN-MA',
    short_desc: '다양한 각도와 높이 조합이 가능한 멀티 어버트먼트.',
    image_url: 'https://public.readdy.ai/ai/img_res/3eae81fb-17ba-4511-86ab-c7a6ca0c754d.png',
    object_fit: 'contain',
    options: [
      { label: '직경', values: ['3.5mm', '4.0mm', '4.5mm', '5.0mm'] },
      { label: '높이', values: ['1.0mm', '2.0mm', '3.0mm', '4.0mm'] },
      { label: '각도', values: ['0°', '17°', '30°'] },
    ],
    specs: [
      { label: '소재', value: 'Grade 5 티타늄 (Ti-6Al-4V)' },
      { label: '직경', value: '3.5 / 4.0 / 4.5 / 5.0 mm' },
      { label: '각도', value: '0° / 17° / 30°' },
      { label: '체결 토크', value: '25 Ncm' },
      { label: '호환 픽스쳐', value: 'HS-I, HS-VII, HSN-I, HSN-VII, 넥스츄어, 넥스츄어7 전 모델' },
      { label: '인증', value: 'CE, KFDA' },
    ],
    features: [
      '0°, 17°, 30° 각도 선택 가능',
      '다양한 임상 상황 대응',
      '우수한 호환성',
      '모든 하이니스 픽스쳐와 호환',
    ],
    related_product_ids: ['fx-bl-001', 'fx-bl-007', 'fx-bl-hsn1', 'fx-bl-hsn7', 'fx-nx-001', 'fx-nx-007', 'sb-003', 'sb-004', 'la-001', 'gs-001', 'gs-002'],
    sort_order: 3,
    status: 'active',
    detail_page_id: 'multi-abutment',
    base_price: 1000,
  },
  {
    id: 'ba-004',
    category_id: 'abutment',
    name_ko: 'Milling Abutment',
    name_en: 'Milling Abutment',
    model_code: 'HN-MLA',
    short_desc: 'CAD/CAM 밀링 가공을 위한 어버트먼트.',
    image_url: 'https://public.readdy.ai/ai/img_res/592a25bb-13ef-4aa5-abae-d13e1d606216.png',
    object_fit: 'contain',
    options: [
      { label: '직경', values: ['3.5mm', '4.0mm', '4.5mm', '5.0mm'] },
      { label: '높이', values: ['8.0mm', '10.0mm', '12.0mm'] },
    ],
    specs: [
      { label: '소재', value: 'Grade 5 티타늄 (Ti-6Al-4V)' },
      { label: '직경', value: '3.5 / 4.0 / 4.5 / 5.0 mm' },
      { label: '높이', value: '8.0 / 10.0 / 12.0 mm' },
      { label: '체결 토크', value: '25 Ncm' },
      { label: '호환 픽스쳐', value: 'HS-I, HS-VII, HSN-I, HSN-VII, 넥스츄어, 넥스츄어7 전 모델' },
      { label: '인증', value: 'CE, KFDA' },
    ],
    features: [
      '디지털 워크플로우 최적화',
      '정밀한 맞춤 제작 가능',
      '다양한 높이 옵션',
      '모든 하이니스 픽스쳐와 호환',
    ],
    related_product_ids: ['fx-bl-001', 'fx-bl-007', 'fx-bl-hsn1', 'fx-bl-hsn7', 'fx-nx-001', 'fx-nx-007', 'sb-003', 'sb-004', 'la-001', 'gs-001'],
    sort_order: 4,
    status: 'active',
    detail_page_id: 'milling-abutment',
    base_price: 1000,
  },

  // ── Scanbody ──────────────────────────────
  {
    id: 'sb-003',
    category_id: 'scanbody',
    name_ko: 'Digital Scanbody D Type',
    name_en: 'Digital Scanbody (D Type)',
    model_code: 'HN-DSB-D',
    short_desc: 'Oral Scan에 최적화된 디지털 스캔바디. 라이브러리와 정확히 Matching.',
    image_url: 'https://public.readdy.ai/ai/img_res/d72ced1c-7ef5-484c-900e-c82b95416128.png',
    object_fit: 'contain',
    options: [
      { label: '직경', values: ['3.5mm', '4.0mm', '4.5mm', '5.0mm'] },
      { label: '높이', values: ['10.0mm', '12.0mm'] },
    ],
    specs: [
      { label: '소재', value: 'PEEK' },
      { label: '직경', value: '3.5 / 4.0 / 4.5 / 5.0 mm' },
      { label: '높이', value: '10.0 / 12.0 mm' },
      { label: '스캔 정밀도', value: '±10 μm 이내' },
      { label: '호환 픽스쳐', value: 'HS-I, HS-VII, HSN-I, HSN-VII, 넥스츄어, 넥스츄어7 (Direct 체결)' },
      { label: '인증', value: 'CE, KFDA' },
    ],
    features: [
      'Oral Scanner로 Scan 시 라이브러리와 정확히 Matching됨',
      '다양한 사이즈(3mm, 5mm)와 path가 좋지 않은 경우에도 편리하게 사용',
      '러버임프레션 할 경우 transfer impression coping으로 사용가능(screw만 교체)',
      '모든 하이니스 픽스쳐에 Direct 체결 가능',
    ],
    related_product_ids: ['fx-bl-001', 'fx-bl-007', 'fx-bl-hsn1', 'fx-bl-hsn7', 'fx-nx-001', 'fx-nx-007', 'ba-001', 'ba-003', 'la-001', 'gs-001'],
    sort_order: 1,
    status: 'active',
    detail_page_id: 'digital-scanbody',
    base_price: 1000,
  },
  {
    id: 'sb-004',
    category_id: 'scanbody',
    name_ko: 'Digital Scanbody B Type',
    name_en: 'Digital Scanbody (B Type)',
    model_code: 'HN-DSB-B',
    short_desc: 'Base Abutment 전용 디지털 스캔바디.',
    image_url: 'https://public.readdy.ai/ai/img_res/ce334c13-b4d0-458a-8843-d547559162de.png',
    object_fit: 'contain',
    options: [
      { label: '직경', values: ['3.5mm', '4.0mm', '4.5mm', '5.0mm'] },
      { label: '높이', values: ['10.0mm', '12.0mm'] },
    ],
    specs: [
      { label: '소재', value: 'PEEK' },
      { label: '직경', value: '3.5 / 4.0 / 4.5 / 5.0 mm' },
      { label: '높이', value: '10.0 / 12.0 mm' },
      { label: '스캔 정밀도', value: '±10 μm 이내' },
      { label: '호환', value: 'Base Abutment(HN-BA) 체결 후 사용' },
      { label: '인증', value: 'CE, KFDA' },
    ],
    features: [
      'Base Abutment에 최적화된 설계',
      '정확한 디지털 인상 채득',
      '다양한 직경 옵션 제공',
      'Base Abutment 체결 상태에서 스캔',
    ],
    related_product_ids: ['fx-bl-001', 'fx-bl-007', 'fx-bl-hsn1', 'fx-bl-hsn7', 'fx-nx-001', 'fx-nx-007', 'ba-001', 'ba-004'],
    sort_order: 2,
    status: 'active',
    detail_page_id: 'digital-scanbody',
    base_price: 1000,
  },

  // ── Link Abutment ─────────────────────────
  {
    id: 'la-001',
    category_id: 'link',
    name_ko: 'Link Abutment (Long)',
    name_en: 'Link Abutment (Long)',
    model_code: 'HN-LA-L',
    short_desc: 'Zirconia 파절과 Abutment 탈락이 없는 No Cementation 시스템.',
    image_url: 'https://public.readdy.ai/ai/img_res/3eae81fb-17ba-4511-86ab-c7a6ca0c754d.png',
    object_fit: 'contain',
    options: [
      { label: '직경', values: ['3.5mm', '4.0mm', '4.5mm', '5.0mm'] },
      { label: '높이', values: ['4.0mm', '5.0mm', '6.0mm', '7.0mm'] },
    ],
    specs: [
      { label: '소재', value: 'Grade 5 티타늄 (Ti-6Al-4V)' },
      { label: '직경', value: '3.5 / 4.0 / 4.5 / 5.0 mm' },
      { label: '높이', value: '4.0 / 5.0 / 6.0 / 7.0 mm' },
      { label: '체결 토크', value: '25 Ncm' },
      { label: '호환 픽스쳐', value: 'HS-I, HS-VII, HSN-I, HSN-VII, 넥스츄어, 넥스츄어7 (Base Abutment 위 체결)' },
      { label: '인증', value: 'CE, KFDA' },
    ],
    features: [
      '체결이 쉽고 필요한 경우 탈착 및 세척 등 주기적인 관리 가능',
      'Screw가 Crown과 Link를 Double pressing 하고있어 유지력이 강함',
      '장기간 안정적인 보철 유지',
      'No Cementation으로 Zirconia 파절 방지',
    ],
    related_product_ids: ['fx-bl-001', 'fx-bl-007', 'fx-bl-hsn1', 'fx-bl-hsn7', 'fx-nx-001', 'fx-nx-007', 'ba-001', 'ba-003', 'gs-001'],
    sort_order: 1,
    status: 'active',
    detail_page_id: 'digital-link-abutment',
    base_price: 1000,
  },
  {
    id: 'la-002',
    category_id: 'link',
    name_ko: 'Link Abutment (Short)',
    name_en: 'Link Abutment (Short)',
    model_code: 'HN-LA-S',
    short_desc: '낮은 교합 공간을 위한 짧은 Link Abutment.',
    image_url: 'https://public.readdy.ai/ai/img_res/14a5356e-c4cf-4f2a-9909-22dea1402e1b.png',
    object_fit: 'contain',
    options: [
      { label: '직경', values: ['3.5mm', '4.0mm', '4.5mm', '5.0mm'] },
      { label: '높이', values: ['1.0mm', '2.0mm', '3.0mm'] },
    ],
    specs: [
      { label: '소재', value: 'Grade 5 티타늄 (Ti-6Al-4V)' },
      { label: '직경', value: '3.5 / 4.0 / 4.5 / 5.0 mm' },
      { label: '높이', value: '1.0 / 2.0 / 3.0 mm' },
      { label: '체결 토크', value: '25 Ncm' },
      { label: '호환 픽스쳐', value: 'HS-I, HS-VII, HSN-I, HSN-VII, 넥스츄어, 넥스츄어7 전 모델' },
      { label: '인증', value: 'CE, KFDA' },
    ],
    features: [
      'No Cementation 시스템',
      '탈착 및 관리 용이',
      'Double pressing 구조로 강력한 유지력',
      '낮은 교합 공간에 최적화',
    ],
    related_product_ids: ['fx-bl-001', 'fx-bl-007', 'fx-bl-hsn1', 'fx-bl-hsn7', 'fx-nx-001', 'fx-nx-007', 'ba-001', 'sb-003', 'gs-001'],
    sort_order: 2,
    status: 'active',
    detail_page_id: 'digital-link-abutment',
    base_price: 1000,
  },
  {
    id: 'la-003',
    category_id: 'link',
    name_ko: 'Angled Link Abutment',
    name_en: 'Angled Link Abutment',
    model_code: 'HN-ALA',
    short_desc: '각도 보정이 가능한 Link Abutment.',
    image_url: 'https://public.readdy.ai/ai/img_res/3eae81fb-17ba-4511-86ab-c7a6ca0c754d.png',
    object_fit: 'contain',
    options: [
      { label: '직경', values: ['3.5mm', '4.0mm', '4.5mm'] },
      { label: '각도', values: ['15°', '25°'] },
      { label: '높이', values: ['2.0mm', '3.0mm', '4.0mm'] },
    ],
    specs: [
      { label: '소재', value: 'Grade 5 티타늄 (Ti-6Al-4V)' },
      { label: '직경', value: '3.5 / 4.0 / 4.5 mm' },
      { label: '각도', value: '15° / 25°' },
      { label: '체결 토크', value: '25 Ncm' },
      { label: '호환', value: 'Angled Base Abutment(HN-ABA) 위 체결' },
      { label: '인증', value: 'CE, KFDA' },
    ],
    features: [
      '15°, 25° 각도 옵션',
      'No Cementation 시스템 적용',
      '심미적 보철 구현 가능',
    ],
    related_product_ids: ['fx-bl-001', 'fx-bl-007', 'fx-bl-hsn1', 'fx-bl-hsn7', 'fx-nx-001', 'fx-nx-007', 'ba-002', 'gs-001'],
    sort_order: 3,
    status: 'active',
    detail_page_id: 'digital-link-abutment',
    base_price: 1000,
  },
  {
    id: 'la-004',
    category_id: 'link',
    name_ko: 'Internal Connection Link',
    name_en: 'Internal Connection Link',
    model_code: 'HN-ICL',
    short_desc: '내부 연결 방식의 Link Abutment.',
    image_url: 'https://public.readdy.ai/ai/img_res/14a5356e-c4cf-4f2a-9909-22dea1402e1b.png',
    object_fit: 'contain',
    options: [
      { label: '직경', values: ['3.5mm', '4.0mm', '4.5mm', '5.0mm'] },
      { label: '높이', values: ['2.0mm', '3.0mm', '4.0mm', '5.0mm'] },
    ],
    specs: [
      { label: '소재', value: 'Grade 5 티타늄 (Ti-6Al-4V)' },
      { label: '직경', value: '3.5 / 4.0 / 4.5 / 5.0 mm' },
      { label: '높이', value: '2.0 / 3.0 / 4.0 / 5.0 mm' },
      { label: '체결 토크', value: '25 Ncm' },
      { label: '호환 픽스쳐', value: 'HS-I, HS-VII, HSN-I, HSN-VII, 넥스츄어, 넥스츄어7 전 모델' },
      { label: '인증', value: 'CE, KFDA' },
    ],
    features: [
      '안정적인 내부 연결 구조',
      '다양한 높이 옵션',
      '우수한 장기 안정성',
      '모든 하이니스 픽스쳐와 호환',
    ],
    related_product_ids: ['fx-bl-001', 'fx-bl-007', 'fx-bl-hsn1', 'fx-bl-hsn7', 'fx-nx-001', 'fx-nx-007', 'ba-001', 'ba-003', 'la-001', 'la-002'],
    sort_order: 4,
    status: 'active',
    detail_page_id: 'digital-link-abutment',
    base_price: 1000,
  },

  // ── Gauge & Kit ───────────────────────────
  {
    id: 'gs-001',
    category_id: 'gauge-kit',
    name_ko: 'Gauge Set (Angle / Cuff / Base)',
    name_en: 'Gauge Set (Angle / Cuff / Base)',
    model_code: 'HN-GS',
    short_desc: '정확한 측정을 위한 게이지 세트. Angle / Cuff / Base 구성.',
    image_url: 'https://highnessimplant.com/upload_files/common_file/product/202508/175575980810.png',
    object_fit: 'contain',
    options: [
      { label: '타입', values: ['Standard Set', 'Extended Set', 'Mini Set'] },
      { label: '구성', values: ['Angle Gauge', 'Cuff Gauge', 'Base Gauge', 'Full Set'] },
    ],
    specs: [
      { label: '구성', value: 'Angle / Cuff / Base 게이지' },
      { label: '소재', value: '의료용 스테인리스 스틸 (SUS 316L)' },
      { label: '측정 범위', value: '각도: 0~30°, 깊이: 0~15mm' },
      { label: '정밀도', value: '±0.1mm' },
      { label: '호환', value: '하이니스 전 픽스쳐 모델 호환 (HS-I, HS-VII, HSN-I, HSN-VII, 넥스츄어, 넥스츄어7)' },
      { label: '멸균', value: '오토클레이브 가능 (134°C)' },
      { label: '인증', value: 'CE, KFDA' },
    ],
    features: [
      'Angle, Cuff, Base 게이지 포함',
      '정확한 깊이 및 각도 측정',
      '다양한 세트 구성 (Standard / Extended / Mini)',
      '모든 하이니스 픽스쳐와 호환',
      '오토클레이브 멸균 가능',
      '의료용 스테인리스 스틸 소재',
    ],
    related_product_ids: ['fx-bl-001', 'fx-bl-007', 'fx-bl-hsn1', 'fx-bl-hsn7', 'fx-nx-001', 'fx-nx-007', 'ba-001', 'la-001', 'la-002', 'la-004', 'sb-003', 'sb-004'],
    sort_order: 1,
    status: 'active',
    detail_page_id: 'gs-001',
    base_price: 500,
  },
  {
    id: 'gs-002',
    category_id: 'gauge-kit',
    name_ko: 'Bone Kit & Bone-hi',
    name_en: 'Bone Kit & Bone-hi',
    model_code: 'HN-BK',
    short_desc: '골이식 및 임플란트 식립을 위한 종합 키트.',
    image_url: 'https://highnessimplant.com/upload_files/common_file/product/202508/175575980810.png',
    object_fit: 'contain',
    options: [
      { label: '타입', values: ['Basic Kit', 'Advanced Kit', 'Full Kit'] },
      { label: '구성품', values: ['Bone Profiler', 'Bone Spreader', 'Bone Condenser', 'Complete Set'] },
    ],
    specs: [
      { label: '구성', value: 'Bone Profiler, Spreader, Condenser 등' },
      { label: '소재', value: '의료용 스테인리스 스틸 (SUS 316L)' },
      { label: '키트 종류', value: 'Basic / Advanced / Full Kit' },
      { label: '멸균', value: '오토클레이브 (134°C, 3bar)' },
      { label: '호환', value: '하이니스 전 픽스쳐 모델 호환 (HS-I, HS-VII, HSN-I, HSN-VII, 넥스츄어, 넥스츄어7)' },
      { label: '보관', value: '전용 스테인리스 케이스 포함' },
      { label: '인증', value: 'CE, KFDA' },
    ],
    features: [
      '다양한 수술 기구 포함 (Profiler, Spreader, Condenser)',
      '체계적인 키트 구성 (Basic / Advanced / Full)',
      '효율적인 임상 워크플로우 지원',
      '모든 하이니스 픽스쳐와 호환',
      '전용 스테인리스 보관 케이스 제공',
      '오토클레이브 멸균 가능',
    ],
    related_product_ids: ['fx-bl-001', 'fx-bl-007', 'fx-bl-hsn1', 'fx-bl-hsn7', 'fx-nx-001', 'fx-nx-007', 'ba-001', 'ba-002', 'ba-003', 'sb-003', 'sb-004', 'la-001'],
    sort_order: 2,
    status: 'active',
    detail_page_id: 'gs-002',
    base_price: 800,
  },
  {
    id: 'kit-hs1-simple',
    category_id: 'gauge-kit',
    name_ko: 'HS-I Simple Kit',
    name_en: 'HS-I Simple Kit',
    model_code: 'KIT-HS1-S',
    short_desc: 'HS-I 픽스쳐 중심의 간편 키트. 기본 수술에 필요한 핵심 구성품만 담아 효율적인 임상 워크플로우를 지원합니다.',
    image_url: 'https://public.readdy.ai/ai/img_res/1099f11a-063b-42ae-91ad-8f8312709b15.png',
    object_fit: 'contain',
    options: [
      { label: '구성', values: ['Standard'] },
    ],
    specs: [
      { label: '포함 픽스쳐', value: 'HS-I (Bone Level)' },
      { label: '구성품', value: 'Fixture, Cover Screw, Mount, Healing Abutment' },
      { label: '호환 어버트먼트', value: 'Base Abutment, Multi Abutment' },
      { label: '호환 스캔바디', value: 'Digital Scanbody D/B Type' },
      { label: '멸균', value: '오토클레이브 (134°C)' },
      { label: '인증', value: 'CE, KFDA, ISO 13485' },
    ],
    features: [
      'HS-I 픽스쳐 기반의 간편 구성',
      '기본 수술에 필요한 핵심 구성품 포함',
      '합리적인 가격으로 효율적인 임상 운영',
      '전용 보관 케이스 제공',
      '오토클레이브 멸균 가능',
    ],
    kit_type: 'simple',
    kit_components: [
      { name: 'HS-I Fixture', code: 'HS-I', qty_desc: '선택 직경/길이 조합', note: 'Bone Level 표준형', image_url: 'https://highnessimplant.com/pages/layout/_highness/images/sub/product_sy1_img1.png', included_in: ['all'] },
      { name: 'Cover Screw', code: 'CS', qty_desc: '픽스쳐 수량에 맞춤', note: '각 픽스쳐 포함', image_url: 'https://highnessimplant.com/pages/layout/_highness/images/sub/product_sy1_img4.png', included_in: ['all'] },
      { name: 'Mount', code: 'MT', qty_desc: '픽스쳐 수량에 맞춤', note: '각 픽스쳐 포함', image_url: 'https://highnessimplant.com/pages/layout/_highness/images/sub/product_sy1_img4.png', included_in: ['all'] },
      { name: 'Healing Abutment', code: 'HA', qty_desc: '픽스쳐 수량에 맞춤', note: '치유 지대주', image_url: 'https://highnessimplant.com/pages/layout/_highness/images/sub/product_sy1_img4.png', included_in: ['all'] },
      { name: '전용 보관 케이스', code: 'CASE', qty_desc: '1개', note: '스테인리스 케이스', included_in: ['all'] },
    ],
    related_product_ids: ['fx-bl-001', 'ba-001', 'ba-002', 'sb-003', 'sb-004', 'la-001', 'gs-001'],
    sort_order: 3,
    status: 'active',
    detail_page_id: 'kit-hs1-simple',
    base_price: 3000,
  },
];

// ─────────────────────────────────────────────
// 헬퍼 함수
// ─────────────────────────────────────────────

/** id로 제품 찾기 */
export function getProductById(id: string): HignessProduct | undefined {
  return highnessProducts.find((p) => p.id === id);
}

/** category_id로 제품 목록 필터 (status 필터 제거 - 오버라이드 적용 후 외부에서 필터링) */
export function getProductsByCategory(categoryId: string): HignessProduct[] {
  return highnessProducts.filter(
    (p) => p.category_id === categoryId
  );
}

/** id로 카테고리 찾기 */
export function getCategoryById(id: string): HignessCategory | undefined {
  return highnessCategories.find((c) => c.id === id);
}

/** 관련 제품 목록 반환 */
export function getRelatedProducts(product: HignessProduct): HignessProduct[] {
  return product.related_product_ids
    .map((id) => getProductById(id))
    .filter((p): p is HignessProduct => p !== undefined);
}

// ─────────────────────────────────────────────
// 주문 관련 타입 (기존 호환 유지)
// ─────────────────────────────────────────────
export type OrderStatus = '주문접수' | '준비중' | '배송중' | '배송완료';

export interface MvpOrderItem {
  productId: string;
  productName: string;
  productCode?: string;          // 부모 제품 model_code (기존 호환)
  selectedOptionId?: string;     // product_options.id (선택한 옵션 UUID)
  selectedOptionModelCode?: string; // product_options.model_code (품목코드)
  sizeInfo?: string;             // product_options.size_info (규격 텍스트)
  selectedOptions: Record<string, string>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  components?: {
    productId: string;
    productName: string;
    productCode: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface MvpOrder {
  id: string;
  items: MvpOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  orderedAt: string;
  deliveredAt?: string;
  clientName: string;
  clientId?: string;
  businessNumber?: string;
  paymentMethod?: 'point' | 'card';
}

/** 제품별 사용 단계 생성 (카테고리 기반) */
export function generateUsageSteps(product: HignessProduct): string[] {
  const steps: string[] = [];

  switch (product.category_id) {
    case 'fixture':
      steps.push(
        '임플란트 구멍을 정확히 측정한 후 픽스쳐를 선택합니다.',
        '선택한 픽스쳐의 길이와 직경을 확인하고 임플란트와 맞추는 것을 권장합니다.',
        '픽스쳐를 장착한 후 임플란트를 식립합니다.',
        '식립 후 필요한 경우 보철물을 추가로 장착합니다.'
      );
      break;
    case 'abutment':
      steps.push(
        'Base Abutment 위에 어버트먼트를 체결합니다.',
        '각도 보정이 필요한 경우 Angled Base Abutment을 선택합니다.',
        '어버트먼트의 높이와 각도를 조정합니다.',
        '식립 후 필요한 경우 보철물을 추가로 장착합니다.'
      );
      break;
    case 'scanbody':
      steps.push(
        'Oral Scanner로 구강을 스캔합니다.',
        'Scan 결과에 맞는 Scanbody를 선택합니다.',
        'Scanbody를 장착한 후 임플란트를 식립합니다.',
        '식립 후 필요한 경우 보철물을 추가로 장착합니다.'
      );
      break;
    case 'link':
      steps.push(
        'Link Abutment을 선택하고 필요한 경우 Angled Link Abutment을 선택합니다.',
        'Link Abutment을 장착한 후 임플란트를 식립합니다.',
        '식립 후 필요한 경우 보철물을 추가로 장착합니다.'
      );
      break;
    case 'gauge-kit':
      steps.push(
        '임플란트 구멍을 측정합니다.',
        '측정 결과에 맞는 Gauge Set을 선택합니다.',
        'Gauge Set을 장착한 후 임플란트를 식립합니다.',
        '식립 후 필요한 경우 보철물을 추가로 장착합니다.'
      );
      break;
  }

  return steps;
}
