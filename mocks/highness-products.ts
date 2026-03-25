export interface HighnessOption {
  label: string;
  values: string[];
}

export interface HighnessProduct {
  id: number;
  name: string;
  code: string;
  category: 'Abutment' | 'Scanbody' | 'Link' | 'Gauge & Kit' | 'Fixture';
  imageKey: string;
  options: HighnessOption[];
  basePrice: number;
  description?: string;
  features?: string[];
  detailPageId?: string;
  compatibleComponents?: number[];
}

export const highnessProducts: HighnessProduct[] = [
  {
    id: 1,
    name: 'Base Abutment',
    code: 'HN-BA',
    category: 'Abutment',
    imageKey: 'img_base_abutment',
    detailPageId: 'base-abutment',
    description: '완벽한 보철을 위한 첫 단계는 Base Abutment 체결부터',
    features: [
      'Base Abutment 체결 후 제거할 필요가 없어 Soft Tissue의 Sealing이 안정적임',
      '교합력 분산에 최적화된 구조',
      '타사 임플란트와의 뛰어난 호환성'
    ],
    options: [
      { label: '직경', values: ['3.5mm', '4.0mm', '4.5mm', '5.0mm'] },
      { label: '높이', values: ['1.0mm', '2.0mm', '3.0mm', '4.0mm', '5.0mm', '6.0mm'] },
    ],
    basePrice: 1000,
    compatibleComponents: [4, 12, 13],
  },
  {
    id: 2,
    name: 'Angled Base Abutment',
    code: 'HN-ABA',
    category: 'Abutment',
    imageKey: 'img_base_angled',
    detailPageId: 'angled-base-abutment',
    description: '각도 보정이 필요한 케이스를 위한 경사형 지지대',
    features: [
      '15°, 25° 각도 옵션으로 다양한 임상 상황 대응',
      'Soft Tissue Sealing 유지',
      '안정적인 교합력 분산'
    ],
    options: [
      { label: '직경', values: ['3.5mm', '4.0mm', '4.5mm', '5.0mm'] },
      { label: '각도', values: ['15°', '25°'] },
      { label: '높이', values: ['1.0mm', '2.0mm', '3.0mm'] },
    ],
    basePrice: 1000,
    compatibleComponents: [5, 12],
  },
  {
    id: 3,
    name: 'Digital Scanbody (D Type)',
    code: 'HN-DSB-D',
    category: 'Scanbody',
    imageKey: 'img_scanbody_d',
    detailPageId: 'digital-scanbody',
    description: 'Oral Scan에 최적화된 디지털 스캔바디',
    features: [
      'Oral Scanner로 Scan 시 라이브러리와 정확히 Matching됨',
      '다양한 사이즈(3mm, 5mm)와 path가 좋지 않은 경우에도 편리하게 사용',
      '러버임프레션 할 경우 transfer impression coping으로 사용가능(screw만 교체)'
    ],
    options: [
      { label: '직경', values: ['3.5mm', '4.0mm', '4.5mm', '5.0mm'] },
      { label: '높이', values: ['10.0mm', '12.0mm'] },
    ],
    basePrice: 1000,
    compatibleComponents: [1, 6, 7],
  },
  {
    id: 4,
    name: 'Digital Scanbody (B Type)',
    code: 'HN-DSB-B',
    category: 'Scanbody',
    imageKey: 'img_scanbody_b',
    detailPageId: 'digital-scanbody',
    description: 'Base Abutment 전용 디지털 스캔바디',
    features: [
      'Base Abutment에 최적화된 설계',
      '정확한 디지털 인상 채득',
      '다양한 직경 옵션 제공'
    ],
    options: [
      { label: '직경', values: ['3.5mm', '4.0mm', '4.5mm', '5.0mm'] },
      { label: '높이', values: ['10.0mm', '12.0mm'] },
    ],
    basePrice: 1000,
    compatibleComponents: [1, 11],
  },
  {
    id: 5,
    name: 'Angled Scanbody',
    code: 'HN-ASB',
    category: 'Scanbody',
    imageKey: 'img_scanbody_angled',
    detailPageId: 'digital-scanbody',
    description: '각도형 Base Abutment 전용 스캔바디',
    features: [
      '15°, 25° 각도 Base에 정확히 매칭',
      'Taper한 디자인으로 접근성 우수',
      '디지털 워크플로우 최적화'
    ],
    options: [
      { label: '직경', values: ['3.5mm', '4.0mm', '4.5mm'] },
      { label: '각도', values: ['15°', '25°'] },
    ],
    basePrice: 1000,
    compatibleComponents: [2, 8],
  },
  {
    id: 6,
    name: 'Link Abutment (Long)',
    code: 'HN-LA-L',
    category: 'Link',
    imageKey: 'img_link_long',
    detailPageId: 'digital-link-abutment',
    description: 'Zirconia 파절과 Abutment 탈락이 없는 No Cementation',
    features: [
      '체결이 쉽고 필요한 경우 탈착 및 세척 등 주기적인 관리 가능',
      'Screw가 Crown과 Link를 Double pressing 하고있어 유지력이 강함',
      '장기간 안정적인 보철 유지'
    ],
    options: [
      { label: '직경', values: ['3.5mm', '4.0mm', '4.5mm', '5.0mm'] },
      { label: '높이', values: ['4.0mm', '5.0mm', '6.0mm', '7.0mm'] },
    ],
    basePrice: 1000,
    compatibleComponents: [3, 5, 12],
  },
  {
    id: 7,
    name: 'Link Abutment (Short)',
    code: 'HN-LA-S',
    category: 'Link',
    imageKey: 'img_link_short',
    detailPageId: 'digital-link-abutment',
    description: '낮은 교합 공간을 위한 짧은 Link Abutment',
    features: [
      'No Cementation 시스템',
      '탈착 및 관리 용이',
      'Double pressing 구조로 강력한 유지력'
    ],
    options: [
      { label: '직경', values: ['3.5mm', '4.0mm', '4.5mm', '5.0mm'] },
      { label: '높이', values: ['1.0mm', '2.0mm', '3.0mm'] },
    ],
    basePrice: 1000,
    compatibleComponents: [3, 12],
  },
  {
    id: 8,
    name: 'Angled Link Abutment',
    code: 'HN-ALA',
    category: 'Link',
    imageKey: 'img_link_angled',
    detailPageId: 'digital-link-abutment',
    description: '각도 보정이 가능한 Link Abutment',
    features: [
      '15°, 25° 각도 옵션',
      'No Cementation 시스템 적용',
      '심미적 보철 구현 가능'
    ],
    options: [
      { label: '직경', values: ['3.5mm', '4.0mm', '4.5mm'] },
      { label: '각도', values: ['15°', '25°'] },
      { label: '높이', values: ['2.0mm', '3.0mm', '4.0mm'] },
    ],
    basePrice: 1000,
    compatibleComponents: [5, 12],
  },
  {
    id: 9,
    name: 'Internal Connection Link',
    code: 'HN-ICL',
    category: 'Link',
    imageKey: 'img_link_internal',
    detailPageId: 'digital-link-abutment',
    description: '내부 연결 방식의 Link Abutment',
    features: [
      '안정적인 내부 연결 구조',
      '다양한 높이 옵션',
      '우수한 장기 안정성'
    ],
    options: [
      { label: '직경', values: ['3.5mm', '4.0mm', '4.5mm', '5.0mm'] },
      { label: '높이', values: ['2.0mm', '3.0mm', '4.0mm', '5.0mm'] },
    ],
    basePrice: 1000,
    compatibleComponents: [3, 4, 12],
  },
  {
    id: 10,
    name: 'Multi Abutment',
    code: 'HN-MA',
    category: 'Abutment',
    imageKey: 'img_multi_abutment',
    detailPageId: 'multi-abutment',
    description: '다양한 각도와 높이 조합이 가능한 멀티 어버트먼트',
    features: [
      '0°, 17°, 30° 각도 선택 가능',
      '다양한 임상 상황 대응',
      '우수한 호환성'
    ],
    options: [
      { label: '직경', values: ['3.5mm', '4.0mm', '4.5mm', '5.0mm'] },
      { label: '높이', values: ['1.0mm', '2.0mm', '3.0mm', '4.0mm'] },
      { label: '각도', values: ['0°', '17°', '30°'] },
    ],
    basePrice: 1000,
    compatibleComponents: [3, 12, 13],
  },
  {
    id: 11,
    name: 'Milling Abutment',
    code: 'HN-MLA',
    category: 'Abutment',
    imageKey: 'img_milling_abutment',
    detailPageId: 'milling-abutment',
    description: 'CAD/CAM 밀링 가공을 위한 어버트먼트',
    features: [
      '디지털 워크플로우 최적화',
      '정밀한 맞춤 제작 가능',
      '다양한 높이 옵션'
    ],
    options: [
      { label: '직경', values: ['3.5mm', '4.0mm', '4.5mm', '5.0mm'] },
      { label: '높이', values: ['8.0mm', '10.0mm', '12.0mm'] },
    ],
    basePrice: 1000,
    compatibleComponents: [4, 12],
  },
  {
    id: 12,
    name: 'Gauge Set (Angle/Cuff/Base)',
    code: 'HN-GS',
    category: 'Gauge & Kit',
    imageKey: 'img_gauge_all',
    detailPageId: 'gauge-set',
    description: '정확한 측정을 위한 게이지 세트',
    features: [
      'Angle, Cuff, Base 게이지 포함',
      '정확한 깊이 및 각도 측정',
      '다양한 세트 구성'
    ],
    options: [
      { label: '타입', values: ['Standard Set', 'Extended Set', 'Mini Set'] },
    ],
    basePrice: 1000,
    compatibleComponents: [1, 6, 7, 13],
  },
  {
    id: 13,
    name: 'Bone Kit & Bone-hi',
    code: 'HN-BK',
    category: 'Gauge & Kit',
    imageKey: 'img_kit_bone',
    detailPageId: 'bone-profiler',
    description: '골이식 및 임플란트 식립을 위한 종합 키트',
    features: [
      '다양한 수술 기구 포함',
      '체계적인 키트 구성',
      '효율적인 임상 워크플로우'
    ],
    options: [
      { label: '타입', values: ['Basic Kit', 'Advanced Kit', 'Full Kit'] },
    ],
    basePrice: 1000,
    compatibleComponents: [1, 10, 12],
  },
];

export type OrderStatus = '주문접수' | '준비중' | '배송중' | '배송완료';

export interface MvpOrderItem {
  productId: number;
  productName: string;
  productCode?: string;
  selectedOptions: Record<string, string>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  components?: {
    productId: number;
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
  clientName: string;
}
