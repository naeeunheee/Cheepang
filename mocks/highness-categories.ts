
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
    hero_image_url: 'https://highnessimplant.com/pages/layout/_highness/images/main/sys_item1.png',
    sort_order: 4,
  },
];
