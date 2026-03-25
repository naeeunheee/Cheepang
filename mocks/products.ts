
export interface ClinicalData {
  title: string;
  value: string;
  unit?: string;
  description?: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductData {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  modelNumber: string;
  isNew: boolean;
  images: string[];
  features: string[];
  specs: ProductSpec[];
  clinicalData: ClinicalData[];
  indications: string[];
  contraindications: string[];
  usageSteps: string[];
  certifications: string[];
  description: string;
  additionalInfo: string;
  clinicalNote?: string;
}

export const productsData: ProductData[] = [
  {
    id: 'digital-link-abutment',
    name: 'Highness Digital Link Abutment',
    subtitle: '디지털 보철 핵심 부품',
    category: '어버트먼트',
    modelNumber: 'HN-DLA-001',
    isNew: true,
    images: [
      '/assets/highness/img_link_long.png',
      '/assets/highness/img_link_short.png',
      '/assets/highness/img_link_angled.png',
    ],
    features: [
      'No Cementation 시스템 — Zirconia 파절 및 Abutment 탈락 원천 차단',
      'Double Pressing 구조로 Screw가 Crown과 Link를 동시 고정, 강력한 유지력',
      '체결 후 탈착·세척 등 주기적 관리 가능한 유지보수 친화 설계',
      '디지털 스캔바디와 완벽 호환, 효율적인 디지털 워크플로우 구현',
    ],
    specs: [
      { label: '소재', value: 'Grade 5 티타늄 (Ti-6Al-4V)' },
      { label: '표면처리', value: '기계 가공 (Machined)' },
      { label: '연결 방식', value: 'Internal Hex / Conical' },
      { label: '직경', value: '3.5 / 4.0 / 4.5 / 5.0 mm' },
      { label: '높이 (Long)', value: '4.0 / 5.0 / 6.0 / 7.0 mm' },
      { label: '높이 (Short)', value: '1.0 / 2.0 / 3.0 mm' },
      { label: '각도 옵션', value: '0° / 15° / 25°' },
      { label: '체결 토크', value: '25 Ncm' },
      { label: '인증', value: 'CE, KFDA (식약처)' },
    ],
    clinicalData: [
      { title: '5년 누적 생존율', value: '98.7', unit: '%', description: '다기관 임상 연구 결과 (n=312)' },
      { title: '평균 변연골 흡수', value: '0.18', unit: 'mm/year', description: '식립 후 3년 추적 관찰' },
      { title: '보철 탈락률', value: '0.3', unit: '%', description: 'No Cementation 시스템 적용 케이스' },
      { title: '환자 만족도', value: '96.2', unit: '%', description: '심미·기능 복합 평가 (VAS 기준)' },
    ],
    indications: [
      '단일치 결손 보철 수복',
      '다수치 결손 고정성 보철',
      '디지털 워크플로우 기반 보철 제작',
      '기존 시멘트 유지형 보철의 대체 케이스',
    ],
    contraindications: [
      '교합 공간 3mm 미만 케이스 (Short 타입 권장)',
      '심한 이갈이(Bruxism) 환자 — 야간 보호장치 병용 필수',
      '골유착 미완성 픽스처',
    ],
    usageSteps: [
      'Base Abutment를 픽스처에 체결 (15 Ncm)',
      'Digital Scanbody (B Type) 장착 후 구강 스캔',
      'CAD/CAM으로 Crown 제작',
      'Link Abutment를 Base에 연결 후 Crown 장착',
      'Screw 체결 (25 Ncm) 및 Screw hole 봉쇄',
    ],
    certifications: ['CE Mark (EU)', 'KFDA 식약처 허가', 'ISO 13485 품질경영시스템'],
    description:
      'Highness Digital Link Abutment는 시멘트를 사용하지 않는 No Cementation 시스템으로, Zirconia 파절과 Abutment 탈락 문제를 근본적으로 해결합니다. Screw가 Crown과 Link를 동시에 Double Pressing하여 강력한 유지력을 제공하며, 필요 시 탈착·세척이 가능해 장기적인 구강 위생 관리에 유리합니다.',
    additionalInfo:
      '하이니스의 독자적인 연결 시스템은 디지털 스캔바디와 완벽하게 호환되어 정확한 디지털 인상 채득과 보철 제작을 지원합니다. Long / Short / Angled 세 가지 타입으로 다양한 임상 상황에 대응할 수 있습니다.',
    clinicalNote:
      '2019~2024년 국내 3개 대학병원 공동 임상 연구에서 5년 누적 생존율 98.7%를 기록하였으며, 변연골 흡수량은 연간 평균 0.18mm로 국제 기준(0.2mm/year)을 하회하는 우수한 결과를 보였습니다.',
  },
  {
    id: 'nexture-fixture',
    name: 'Nexture Fixture',
    subtitle: '하이니스 임플란트 픽스처',
    category: '픽스처',
    modelNumber: 'HN-NF-002',
    isNew: false,
    images: [
      '/assets/highness/placeholder.png',
      '/assets/highness/placeholder.png',
      '/assets/highness/placeholder.png',
    ],
    features: [
      '혁신적인 나사산 디자인으로 초기 고정력(ISQ) 극대화',
      'SLA 표면처리로 골유착 기간 단축 (평균 6~8주)',
      '다양한 골질(D1~D4)에 적합한 범용 설계',
      '직관적인 수술 프로토콜로 시술 시간 단축',
    ],
    specs: [
      { label: '소재', value: 'Grade 4 순수 티타늄 (cp-Ti)' },
      { label: '표면처리', value: 'SLA (Sandblasted, Large-grit, Acid-etched)' },
      { label: '직경', value: '3.5 / 4.0 / 4.5 / 5.0 / 6.0 mm' },
      { label: '길이', value: '7.0 / 8.5 / 10.0 / 11.5 / 13.0 mm' },
      { label: '플랫폼', value: 'Internal Hex (Ø2.4mm)' },
      { label: '최대 식립 토크', value: '35 Ncm' },
      { label: '표면 거칠기 (Ra)', value: '1.8 ~ 2.2 μm' },
      { label: '인증', value: 'CE, FDA, KFDA (식약처)' },
    ],
    clinicalData: [
      { title: '10년 누적 생존율', value: '97.4', unit: '%', description: '장기 추적 임상 연구 (n=520)' },
      { title: '평균 ISQ (식립 직후)', value: '72.3', unit: 'ISQ', description: '전자 공명 주파수 분석' },
      { title: '골유착 완성 기간', value: '6~8', unit: '주', description: '정상 골질 기준' },
      { title: '변연골 흡수 (1년)', value: '0.21', unit: 'mm', description: '식립 후 1년 방사선 계측' },
    ],
    indications: [
      '단일치 및 다수치 결손 임플란트 식립',
      '즉시 식립 (Immediate Placement) 프로토콜',
      '골이식 동반 케이스',
      '상악동 거상술 동반 케이스',
    ],
    contraindications: [
      '조절되지 않는 당뇨 환자 (HbA1c > 8%)',
      '방사선 치료 이력 (두경부)',
      '비스포스포네이트 계열 약물 복용 중인 환자',
      '잔존 골량 부족 케이스 (골이식 선행 필요)',
    ],
    usageSteps: [
      '수술 전 CBCT 분석 및 식립 위치 계획',
      '드릴 시퀀스에 따른 식립와 형성',
      'Nexture Fixture 식립 (최종 토크 35 Ncm 이하)',
      'Cover Screw 또는 Healing Abutment 장착',
      '6~8주 골유착 기간 후 보철 단계 진행',
    ],
    certifications: ['CE Mark (EU)', 'FDA 510(k) 승인', 'KFDA 식약처 허가', 'ISO 13485'],
    description:
      'Nexture Fixture는 하이니스의 대표 임플란트 픽스처로, 혁신적인 나사산 디자인과 SLA 표면처리 기술을 결합하여 우수한 초기 고정력과 빠른 골유착을 실현합니다. 다양한 직경과 길이 옵션으로 개별 환자의 해부학적 조건에 최적화된 선택이 가능합니다.',
    additionalInfo:
      '직관적인 수술 프로토콜과 컬러 코딩 드릴 시스템으로 시술 오류를 최소화하며, 하이니스 전 제품군과 완벽하게 호환됩니다. 즉시 식립 및 즉시 부하 프로토콜도 지원합니다.',
    clinicalNote:
      '국내외 10개 기관 공동 연구에서 10년 누적 생존율 97.4%를 달성하였으며, 식립 직후 평균 ISQ 72.3으로 높은 초기 안정성을 확인하였습니다.',
  },
  {
    id: 'digital-scanbody',
    name: 'Digital Scanbody (D Type)',
    subtitle: '정밀 디지털 스캔바디',
    category: '스캔바디',
    modelNumber: 'HN-DSB-003',
    isNew: true,
    images: [
      '/assets/highness/img_scanbody_d.png',
      '/assets/highness/img_scanbody_b.png',
      '/assets/highness/img_scanbody_angled.png',
    ],
    features: [
      'Oral Scanner 스캔 시 라이브러리와 정확히 Matching — 오차 최소화',
      '3mm / 5mm 두 가지 높이로 path가 불량한 케이스도 편리하게 대응',
      '러버 인상 시 Transfer Impression Coping으로 전환 가능 (Screw 교체만으로)',
      'PEEK 소재로 경량화 및 내구성 확보, 최대 20회 재사용 가능',
    ],
    specs: [
      { label: '소재', value: 'PEEK (Polyether Ether Ketone)' },
      { label: '호환 스캐너', value: '3Shape TRIOS, Carestream, Medit, iTero 등' },
      { label: '호환 CAD', value: '3Shape Dental System, Exocad, Dental Wings' },
      { label: '직경', value: '3.5 / 4.0 / 4.5 / 5.0 mm' },
      { label: '높이', value: '10.0 mm (3mm 타입) / 12.0 mm (5mm 타입)' },
      { label: '스캔 정밀도', value: '±10 μm 이내' },
      { label: '재사용 횟수', value: '최대 20회 (멸균 후 재사용)' },
      { label: '인증', value: 'CE, KFDA (식약처)' },
    ],
    clinicalData: [
      { title: '스캔 정확도 (각도 오차)', value: '< 0.5', unit: '°', description: '6개 구강 스캐너 비교 실험' },
      { title: '라이브러리 매칭 성공률', value: '99.6', unit: '%', description: '자동 인식 성공률 (n=500)' },
      { title: '평균 스캔 소요 시간', value: '45', unit: '초', description: '단일치 기준' },
      { title: '재사용 후 정밀도 유지', value: '20', unit: '회', description: '반복 사용 정밀도 검증' },
    ],
    indications: [
      '디지털 인상 채득 (구강 스캔)',
      '러버 인상 채득 (Transfer Coping 전환 사용)',
      '즉시 보철 제작 워크플로우',
      '다수치 결손 디지털 인상',
    ],
    contraindications: [
      '심한 개구 제한 환자 (접근성 불량 시 Short 타입 사용)',
      '스캔바디 파손 또는 변형 시 즉시 교체',
    ],
    usageSteps: [
      'Base Abutment 체결 확인 (15 Ncm)',
      'Scanbody를 Base에 손으로 완전히 체결',
      '구강 스캐너로 Scanbody 및 주변 조직 스캔',
      'CAD 소프트웨어에서 라이브러리 자동 매칭 확인',
      '스캔 완료 후 Scanbody 제거 및 멸균 보관',
    ],
    certifications: ['CE Mark (EU)', 'KFDA 식약처 허가', 'ISO 13485'],
    description:
      'Digital Scanbody D Type은 하이니스 임플란트 시스템에 최적화된 고정밀 스캔바디입니다. 구강 스캐너로 스캔 시 라이브러리와 정확히 매칭되어 오차를 최소화하며, 러버 인상 시에는 Screw 교체만으로 Transfer Impression Coping으로 전환하여 사용할 수 있습니다.',
    additionalInfo:
      'PEEK 소재를 사용하여 가볍고 내구성이 뛰어나며, 적절한 멸균 처리 후 최대 20회까지 재사용이 가능합니다. 3mm / 5mm 두 가지 높이 옵션으로 접근성이 불량한 케이스에도 유연하게 대응합니다.',
    clinicalNote:
      '6종의 구강 스캐너를 대상으로 한 비교 실험에서 각도 오차 0.5° 미만, 라이브러리 자동 매칭 성공률 99.6%를 기록하였습니다.',
  },
  {
    id: 'bone-profiler',
    name: 'Bone Profiler / Drivers',
    subtitle: '임플란트 수술 기구 세트',
    category: '수술 기구',
    modelNumber: 'HN-BP-004',
    isNew: false,
    images: [
      '/assets/highness/img_kit_bone.png',
      '/assets/highness/img_kit_bone.png',
      '/assets/highness/img_kit_bone.png',
    ],
    features: [
      '인체공학적 그립 디자인으로 장시간 수술 시 피로도 최소화',
      '정밀한 토크 컨트롤 (10~35 Ncm) 로 과토크 방지',
      '컬러 코딩 드릴 시스템으로 시술 오류 최소화',
      '오토클레이브 멸균 가능 (134°C, 3bar)',
    ],
    specs: [
      { label: '소재', value: '의료용 스테인리스 스틸 (SUS 316L)' },
      { label: '토크 범위', value: '10 ~ 35 Ncm' },
      { label: '핸들 길이', value: '120 mm' },
      { label: '무게', value: '45 g' },
      { label: '멸균 방법', value: '오토클레이브 (134°C, 3bar, 18분)' },
      { label: '호환 팁', value: 'Hex 1.25mm, Torx T6, Square' },
      { label: '드릴 직경', value: '2.0 / 2.8 / 3.2 / 3.8 / 4.3 / 4.8 mm' },
      { label: '인증', value: 'CE, KFDA (식약처)' },
    ],
    clinicalData: [
      { title: '드릴 내구성 (평균 사용 횟수)', value: '50', unit: '회', description: '표준 프로토콜 기준' },
      { title: '토크 정확도', value: '±5', unit: '%', description: '교정 검증 기준' },
      { title: '멸균 후 성능 유지', value: '100', unit: '회', description: '반복 멸균 내구성 시험' },
      { title: '수술 시간 단축', value: '23', unit: '%', description: '기존 키트 대비 임상 비교' },
    ],
    indications: [
      '임플란트 식립와 형성',
      '픽스처 식립 및 토크 체결',
      '어버트먼트 체결 및 제거',
      '골이식 동반 수술',
    ],
    contraindications: [
      '드릴 날 마모 또는 변형 시 즉시 교체',
      '권장 토크 초과 사용 금지',
    ],
    usageSteps: [
      'CBCT 분석 후 드릴 시퀀스 계획',
      '파일럿 드릴 (Ø2.0mm) 로 초기 천공',
      '순차적 드릴 확장 (컬러 코딩 순서 준수)',
      '최종 드릴 후 픽스처 식립 (최대 35 Ncm)',
      '사용 후 즉시 세척 및 오토클레이브 멸균',
    ],
    certifications: ['CE Mark (EU)', 'KFDA 식약처 허가', 'ISO 13485'],
    description:
      'Bone Profiler & Drivers 세트는 임플란트 수술에 필요한 모든 기구를 체계적으로 구성한 종합 수술 키트입니다. 인체공학적 설계와 컬러 코딩 시스템으로 시술 효율성을 높이고 오류를 최소화합니다.',
    additionalInfo:
      '의료용 SUS 316L 스테인리스 스틸로 제작되어 내식성과 내구성이 뛰어나며, 오토클레이브 반복 멸균에도 성능이 유지됩니다. 하이니스 임플란트 시스템에 최적화된 드릴 시퀀스를 제공합니다.',
    clinicalNote:
      '기존 수술 키트 대비 임상 비교 연구에서 평균 수술 시간 23% 단축 효과가 확인되었으며, 드릴 내구성은 표준 프로토콜 기준 평균 50회 사용이 가능합니다.',
  },
  {
    id: 'healing-abutment',
    name: 'Healing Abutment',
    subtitle: '연조직 치유 어버트먼트',
    category: '어버트먼트',
    modelNumber: 'HN-HA-005',
    isNew: false,
    images: [
      '/assets/highness/img_base_abutment.png',
      '/assets/highness/img_base_abutment.png',
      '/assets/highness/img_base_abutment.png',
    ],
    features: [
      '최적의 연조직 치유 환경 조성 — 치은 형태 유도',
      '다양한 높이(2~6mm)와 직경(4~7mm) 옵션으로 개별 맞춤 선택',
      'Grade 5 티타늄 소재로 생체 적합성 및 내식성 우수',
      '간편한 장착 및 제거로 효율적인 치유 기간 관리',
    ],
    specs: [
      { label: '소재', value: 'Grade 5 티타늄 (Ti-6Al-4V)' },
      { label: '표면처리', value: '기계 가공 (Machined)' },
      { label: '직경', value: '4.0 / 5.0 / 6.0 / 7.0 mm' },
      { label: '높이', value: '2.0 / 3.0 / 4.0 / 5.0 / 6.0 mm' },
      { label: '연결 방식', value: 'Internal Hex' },
      { label: '체결 토크', value: '15 Ncm' },
      { label: '인증', value: 'CE, FDA, KFDA (식약처)' },
    ],
    clinicalData: [
      { title: '연조직 치유 기간', value: '4~6', unit: '주', description: '정상 치유 기준' },
      { title: '치은 형태 유지율', value: '94.8', unit: '%', description: '6개월 추적 관찰' },
      { title: '주변 조직 염증 발생률', value: '1.2', unit: '%', description: '치유 기간 중 합병증' },
      { title: '환자 불편감 (VAS)', value: '1.8', unit: '/10', description: '장착 후 1주 기준' },
    ],
    indications: [
      '임플란트 식립 후 연조직 치유 기간',
      '2단계 수술 후 치은 형태 유도',
      '즉시 식립 후 임시 보철 대체',
    ],
    contraindications: [
      '골유착 미완성 상태에서의 조기 부하 금지',
      '치은 두께 2mm 미만 케이스 (연조직 이식 선행 권장)',
    ],
    usageSteps: [
      '2단계 수술 시 Cover Screw 제거',
      '적절한 직경·높이의 Healing Abutment 선택',
      '15 Ncm 토크로 체결',
      '4~6주 치유 기간 동안 정기 점검',
      '치유 완료 후 Scanbody 또는 최종 Abutment로 교체',
    ],
    certifications: ['CE Mark (EU)', 'FDA 510(k) 승인', 'KFDA 식약처 허가', 'ISO 13485'],
    description:
      'Healing Abutment는 임플란트 식립 후 연조직의 건강한 치유와 이상적인 치은 형태 형성을 돕는 어버트먼트입니다. 다양한 크기 옵션으로 개별 환자의 해부학적 조건에 맞는 최적의 선택이 가능합니다.',
    additionalInfo:
      'Grade 5 티타늄 소재로 제작되어 생체 적합성이 우수하며, 연조직과의 친화성이 뛰어납니다. 간편한 장착과 제거가 가능하여 치유 기간 중 효율적인 관리를 지원합니다.',
    clinicalNote:
      '6개월 추적 관찰 연구에서 치은 형태 유지율 94.8%, 치유 기간 중 주변 조직 염증 발생률 1.2%로 우수한 연조직 반응을 확인하였습니다.',
  },
];
