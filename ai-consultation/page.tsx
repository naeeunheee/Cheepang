import { useState, useMemo, useRef, useEffect, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const HIGHNESS_BOARD_URL =
  'https://highnessimplant.com/pages/board/list.php?board_sid=55&category_code1=&menu_code=442';

const BRAND_BLUE = '#2563EB';

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  스크류풀림: { bg: 'bg-red-100', text: 'text-red-700' },
  스크류파절: { bg: 'bg-red-100', text: 'text-red-700' },
  사용난이도: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  인지도부족: { bg: 'bg-purple-100', text: 'text-purple-700' },
  기공소호환: { bg: 'bg-sky-100', text: 'text-sky-700' },
  가격: { bg: 'bg-green-100', text: 'text-green-700' },
  시멘트타입: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  교합문제: { bg: 'bg-orange-100', text: 'text-orange-700' },
  구치부: { bg: 'bg-orange-100', text: 'text-orange-700' },
  전치부심미: { bg: 'bg-pink-100', text: 'text-pink-700' },
  공차관리: { bg: 'bg-purple-100', text: 'text-purple-700' },
};

interface QnaItem {
  id: number;
  category: string;
  question: string;
  answer: string;
  solutions: string[];
}

const QNA_DATA: QnaItem[] = [
  {
    id: 1, category: '스크류풀림', question: '베이스 스크류가 자꾸 풀려요',
    answer: '하이니스 2중 스크류 체결 방식이 해결합니다. Base를 픽스처에 1차 결합 후 Link를 2차 스크류로 연결, 이중 잠금으로 측방력에 의한 풀림을 원천 차단합니다.',
    solutions: ['토크렌치 25~30Ncm 정확 체결', '장착 후 10~15분 뒤 재조임', '1개월 리콜 시 재확인', 'Cone Morse 연결 → 미세움직임 최소화'],
  },
  {
    id: 2, category: '스크류파절', question: '보철 스크류가 부러졌어요',
    answer: '과도한 측방력이 주원인. 하이니스 교합력 분산 설계로 stress 집중을 줄이며, 파절 시 전용 기구로 1~2분 내 제거, 픽스처 보존 가능합니다.',
    solutions: ['전용 제거 기구 1~2분 제거', '교합 체크 → 측방력 확인', 'Angled Abutment로 분산', 'NEXTURE: 일체형=파절 리스크 제거'],
  },
  {
    id: 3, category: '사용난이도', question: '손이 잘 안 간다 / 사용이 어렵다',
    answer: '초기 학습곡선이 있지만 시멘트 접착이 없어 steps가 줄고, 디지털 워크플로우로 기공도 간소화됩니다.',
    solutions: ['첫 3케이스 본사 기술지원 무료 동행', '스캔→Base→Link = 3단계', '시멘트 제거 0분=체어타임↓', '11도 테이퍼 호환=추가학습 최소'],
  },
  {
    id: 4, category: '인지도부족', question: '브랜드를 몰라서 환자에게 설명 어렵다',
    answer: "환자에게는 '시멘트 없어서 염증 위험↓'로 차별화. 대학병원에서도 사용하는 시스템이란 점 활용.",
    solutions: ["'시멘트 없어서 염증 위험↓'", "'나사 고정이라 문제시 바로 분리'", '유저 인터뷰 영상 활용', "'대학병원 사용 시스템' 포지셔닝"],
  },
  {
    id: 5, category: '기공소호환', question: '기공소에서 하이니스를 잘 모른다 / 거부',
    answer: 'CAD/CAM 기반이라 디지털 기공소에서 스캔바디만 있으면 기존 워크플로우 그대로 가능합니다.',
    solutions: ['전용 라이브러리 파일 전달', '스캔바디→IOS→CAD→밀링 = 표준', '협력 기공소 네트워크 소개', '11도 테이퍼=타사 라이브러리도 가능'],
  },
  {
    id: 6, category: '가격', question: '가격이 비싸다 / 타사보다 비싼 것 같다',
    answer: '소비자가는 높아 보이지만 패키지 적용 시 공급가는 타사 대비 30~50% 저렴. 케이스당 총원가로 비교해야 합니다.',
    solutions: ['단품 비교 금지 → 케이스당 총원가', '3000PKG: Fixture+Base+Link=88,300원', '타사 동일 구성: 15~20만원', '연 100케이스=600~1,100만원 절감'],
  },
  {
    id: 7, category: '시멘트타입', question: '시멘트 타입이 익숙하고 편하다',
    answer: '잔여 시멘트로 인한 주위염 리스크가 있습니다. 하이니스는 시멘트 없이 체결하므로 염증 리스크 제거.',
    solutions: ['시멘트 잔여물=주위염 원인', '스크류 유지형=분리·재장착 가능', '신규만 하이니스 적용하며 전환', '2~3케이스 체험 후 자연 전환'],
  },
  {
    id: 8, category: '교합문제', question: '구치부 교합 조정이 어렵다',
    answer: 'Sink Down 방지 구조로 교합 안정성↑. Base Cuff Gauge로 높이 사전 체크, Link 결합 후 미세 조정 가능.',
    solutions: ['Cuff Gauge로 높이 사전 체크', 'Top-Down: 최종 보철 기준 역산', 'Sink Down 없음=장착 후 변화↓', 'Link만 분리→재제작 간편'],
  },
  {
    id: 9, category: '구치부', question: '구치부 싱글 케이스 문제',
    answer: '교합력 가장 큰 부위. 2중 체결이 특히 효과적이며 NEXTURE는 즉시로딩 지원.',
    solutions: ['권장 토크 준수 25~30Ncm', 'Long Base로 응력 분산', '교합면 줄여 측방력↓', 'NEXTURE: 3Cut Edge=초기 고정↑'],
  },
  {
    id: 10, category: '전치부심미', question: '전치부 심미성이 걱정된다',
    answer: 'Angled Base로 Path 불량 시에도 스크류 유지형 가능. 시멘트라인 없이 깔끔한 마진.',
    solutions: ['Angled Base: 스크류홀 최대 25도 조정', '지르코니아 Link=자연치 색상', '시멘트라인 없음=마진 깔끔', '분리 가능=문제시 즉시 수정'],
  },
  {
    id: 11, category: '공차관리', question: '보철 적합도가 떨어진다 / 공차 관리 문제',
    answer: '하이니스 디지털 보철 시스템은 Cone Morse 11도 taper로 Micro-gap을 최소화하는 설계입니다.',
    solutions: ['Cone Morse 11도 taper=Micro-gap 최소화', 'Base+Link 2단계 정밀도 개별 관리', 'CAD/CAM 밀링=수작업 오차 제거', '문제 시 Link만 재제작'],
  },
  {
    id: 12, category: '공차관리', question: 'Micro-movement / 미세 움직임이 걱정된다',
    answer: '하이니스는 2중 체결로 상부 보철물의 미세움직임을 최소화하여 주위 조직 안정성을 확보합니다.',
    solutions: ['2중 스크류 체결=움직임 이중 잠금', 'Cone Morse 연결=마찰 고정력↑', 'Micro-leakage 감소→주위염 예방', '장기적 골흡수 방지 효과'],
  },
];

const ALL_CATEGORIES = ['전체', ...Array.from(new Set(QNA_DATA.map((q) => q.category)))];

const QUICK_REPLIES = [
  { label: '🔩 스크류 풀림', text: '스크류가 풀려요' },
  { label: '💥 스크류 파절', text: '스크류가 부러졌어요' },
  { label: '🔧 기공소 호환', text: '기공소 호환 방법 알려주세요' },
  { label: '📦 배송 문의', text: '배송은 얼마나 걸려요' },
  { label: '💰 가격 문의', text: '가격이 얼마예요' },
];

// ─── AI 로직 ──────────────────────────────────────────────────────────────
interface ChatMessage { id: number; role: 'user' | 'ai'; text: string; loading?: boolean; }

const INITIAL_CHAT_MSG: ChatMessage = {
  id: 0, role: 'ai',
  text: '안녕하세요! 치팡 AI 상담소입니다 🦷\n사용법, 오류해결, 제품 관련 궁금한 점을 물어보세요.',
};

function localAIResponse(userMessage: string): { answer: string; category: string } {
  const q = userMessage.toLowerCase();
  const knowledge = [
    { keywords: ['풀림', '풀려', '루즈', '나사', '흔들'], category: '스크류 문제', answer: '스크류 풀림은 하이니스 2중 스크류 체결 방식으로 해결됩니다.\nBase 1차 결합 후 Link 2차 스크류 이중 잠금으로 풀림을 원천 차단합니다.\n\n✅ 해결 방법:\n① 토크렌치 25~30Ncm 정확 체결\n② 장착 후 10~15분 뒤 재조임\n③ 1개월 리콜 시 재확인\n④ Cone Morse 연결로 미세움직임 최소화\n\n추가 제품 문의: 📞 010-8950-3379' },
    { keywords: ['파절', '부러', '깨짐', '파손', '부서'], category: '스크류 문제', answer: '스크류 파절은 과도한 측방력이 주원인입니다.\n\n✅ 해결 방법:\n① 전용 제거 기구 1~2분 제거\n② 교합 체크하여 측방력 확인\n③ Angled Abutment로 분산\n④ NEXTURE 일체형은 파절 리스크 제거\n\n추가 제품 문의: 📞 010-8950-3379' },
    { keywords: ['어렵', '불편', '학습', '복잡', '사용법'], category: '사용법', answer: '초기 학습곡선이 있지만 시멘트 접착이 없어 steps가 줄고 간소화됩니다.\n\n✅ 해결 방법:\n① 첫 3케이스 본사 기술지원 무료 동행\n② 스캔→Base→Link = 3단계\n③ 시멘트 제거 0분=체어타임 단축\n\n추가 제품 문의: 📞 010-8950-3379' },
    { keywords: ['가격', '단가', '비용', '얼마', '패키지', '원가', '비싸'], category: '가격/패키지', answer: '패키지 단가는 담당 영업직원을 통해 개별 안내드리고 있습니다.\n담당 직원에게 직접 문의해 주세요.' },
    { keywords: ['호환', '임플란트', '시스템', '오스템', 'osstem', 'dentium', '덴티움'], category: '호환성', answer: '하이니스는 14개 주요 임플란트 시스템과 호환됩니다.\n\n✅ 호환 시스템:\n① Osstem TS II/III\n② Dentium Super-Line/Implantium\n③ Neobiotech IS II/III\n④ Megagen AnyOne/Bluediamond\n⑤ Dio UF/UF II\n⑥ Straumann Bone Level 등\n\n추가 제품 문의: 📞 010-8950-3379' },
    { keywords: ['기공', '스캔', '워크플로우', 'cad', 'cam', '스캔바디'], category: '기공소/워크플로우', answer: 'CAD/CAM 기반으로 기존 기공소 워크플로우와 바로 연동 가능합니다.\n\n✅ 워크플로우:\n① 스캔바디만 있으면 기존 방식 그대로\n② 전용 라이브러리 파일 무료 제공\n③ 스캔→Base→Link 3단계로 완료\n\n추가 제품 문의: 📞 010-8950-3379' },
    { keywords: ['교합', '높이', 'sink', '게이지'], category: '교합 관리', answer: 'Sink Down 방지 구조와 Base Cuff Gauge로 높이를 사전에 정확히 확인할 수 있습니다.\n\n✅ 교합 관리:\n① Base Cuff Gauge로 높이 사전 체크\n② Top-Down 방식 권장\n③ Angled Abutment로 각도 보정\n\n추가 제품 문의: 📞 010-8950-3379' },
    { keywords: ['심미', '전치', '앞니', '지르코니아', '색상'], category: '전치부 심미', answer: '전치부 심미는 Angled Base와 지르코니아 Link로 완벽하게 해결됩니다.\n\n✅ 심미 솔루션:\n① Angled Base로 스크류홀 최대 25도 조정\n② 지르코니아 Link로 자연치 색상 구현\n③ 시멘트라인 없어 잇몸 심미 탁월\n\n추가 제품 문의: 📞 010-8950-3379' },
    { keywords: ['시멘트', 'cement', '접착'], category: '시멘트 비교', answer: '잔여 시멘트는 주위염의 주요 원인입니다.\n하이니스는 시멘트 없이 체결하므로 염증 리스크 제거.\n\n추가 제품 문의: 📞 010-8950-3379' },
    { keywords: ['공차', '정밀', '오차', '갭', '피팅'], category: '정밀도/피팅', answer: 'Cone Morse 11도 taper로 Micro-gap 최소화.\nBase+Link 2단계 정밀관리.\n\n추가 제품 문의: 📞 010-8950-3379' },
    { keywords: ['주문', '배송', '납기', '도착', '재고', '얼마나', '걸려'], category: '배송/주문', answer: '온라인 주문 시 당일~익일 배송됩니다.\n\n📞 배송·주문 문의: 1522-4936\n💬 카카오톡: 010-5341-1522\n(주)하이니스중부지사-치팡' },
    { keywords: ['임상', '케이스', '증례', '합병증', '골흡수', '주위염'], category: '임상 상담', answer: '임상 관련 전문 상담은 담당 기술지원팀에 문의해 주세요.\n\n추가 제품·임상 문의: 📞 010-8950-3379' },
  ];

  let bestMatch: (typeof knowledge)[number] | null = null;
  let bestScore = 0;
  knowledge.forEach((item) => {
    let score = 0;
    item.keywords.forEach((kw) => { if (q.includes(kw)) score += 5; });
    q.split(/\s+/).forEach((w) => {
      if (w.length < 2) return;
      item.keywords.forEach((kw) => { if (kw.includes(w) || w.includes(kw)) score += 3; });
    });
    if (score > bestScore) { bestScore = score; bestMatch = item; }
  });

  if (bestMatch && bestScore >= 3) {
    return { answer: (bestMatch as (typeof knowledge)[number]).answer, category: (bestMatch as (typeof knowledge)[number]).category };
  }
  return { answer: '해당 내용은 담당자 확인이 필요합니다.\n\n📦 제품 문의: 📞 010-8950-3379\n🚚 배송·주문 문의: 📞 1522-4936\n💬 카카오톡: 010-5341-1522', category: '기타' };
}

async function sendToAI(userMessage: string): Promise<{ answer: string; category: string }> {
  const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!API_KEY) return localAIResponse(userMessage);
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.3,
        system: `당신은 "치팡 AI 전문 상담사"입니다.

## 정체성
- 소속: (주)하이니스중부지사-치팡
- 전문 분야: 임플란트 보철 재료, 치과용 스크류, 어버트먼트, 기공 소재
- 수준: 임플란트 업계 30년 이상 실무 전문가. 하이니스 제품의 특허, 인허가, 생산, 제작 전 과정을 숙지한 전문가.
- 대상: 치과의사, 치과기공사, 치과 스탭이 실무에서 묻는 질문에 현장 전문가 수준으로 답변

## 최우선 원칙: 직접 답변이 기본값
모든 질문에 당신이 직접, 끝까지 답변하세요.
"담당자에게 문의하세요"는 아래 3가지 경우에만 허용됩니다:
1. 실시간 가격/견적/할인율 확인 (실시간 데이터 접근 불가)
2. 실제 재고 수량 확인 (실시간 재고 시스템 접근 불가)
3. 주문 건별 배송 상태 추적 (개별 송장 조회 불가)

위 3가지 외에는 절대 "담당자에게 문의하세요"라고 말하지 마세요.
기술 질문, 사용법, 오류 해결, 제품 비교, 제품 추천, 호환성, 규격 정보는 반드시 당신이 직접 답변합니다.

확실하지 않은 부분이 있더라도:
"일반적으로 ~입니다. 다만 정확한 규격은 제품 사양서에서 재확인을 권장드립니다."
이렇게 답변 + 단서를 다는 방식으로 처리하세요. 담당자에게 넘기지 마세요.

## 할루시네이션 방지
- 모르는 것: "이 부분은 정확한 사양서 확인이 필요합니다"로 명시
- 수치/규격: 확인된 것만 답변. 불확실하면 "업계 표준 기준으로는 ~이며, 정확한 수치는 사양서 확인이 필요합니다"로 처리
- "~인 것 같습니다", "아마도~", "~일 수도 있습니다" 사용 금지
- 대신: "확인된 정보에 따르면 ~입니다", "업계 표준 기준 ~입니다"

## 답변 깊이 — 전문가 수준 필수
1. 원리 설명: 왜 그런지, 어떤 메커니즘인지
2. 실무 적용: 현장에서 어떻게 적용하는지
3. 변수 고려: 상황별로 달라지는 요소 안내
4. 대안 제시: 하나의 답이 아니라 상황별 옵션 제시

## 타사 비교
- 객관적 사실 기반 비교 가능
- 하이니스 강점: 국내 자체 생산, 특허 기술, 인허가 완료, 가격 경쟁력, 빠른 배송
- 타사 비하 금지, 추측 비교 금지

## 답변 형식
긴 답변: 핵심 답변 → 상세 설명 → 실무 팁 → 참고 정보
짧은 답변: 2~3문장으로 명확하게

## 톤
- 전문적이지만 친근한 존댓말
- 핵심부터 바로 답변
- 과도한 리액션 금지, 이모지 최소화

## 하이니스 제품 정보
- 주력: 치과용 임플란트 스크류, 어버트먼트, 보철 소재
- 특허/인허가 완료, 국내 자체 생산
- 호환: 오스템, 디오, 메가젠, 네오, 덴티움 등
- 소재: 의료용 티타늄 합금(Ti-6Al-4V), 지르코니아 등

## 답변 불가 영역
- 치과 재료 무관 질문: "저는 치과 재료 전문 상담사입니다. 해당 분야 질문에 답변드리겠습니다."
- 의료 진단/처방: "임상 판단은 담당 치과의사의 영역입니다. 제품 기술 사항은 제가 안내드리겠습니다."

## 연락처 (가격/재고/배송 확인 시에만 안내)
- 제품 문의: 010-8950-3379
- 배송/주문: 1522-4936
- 카카오톡: 010-5341-1522

## 절대 금지
1. 확인 안 된 수치를 사실처럼 답변
2. 추측성 표현
3. 기술 질문에 "담당자에게 문의하세요"로 회피
4. 의료 진단/처방 제시
5. 타사 근거 없는 비하
6. 성의 없는 1~2줄 답변`,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
    if (!response.ok) return localAIResponse(userMessage);
    const data = await response.json();
    return { answer: data.content[0].text, category: 'Claude AI' };
  } catch { return localAIResponse(userMessage); }
}

// ─── 인라인 채팅 박스 ─────────────────────────────────────────────────────
function AiMessageContent({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: { type: 'normal' | 'solution'; lines: string[] }[] = [];
  let current: { type: 'normal' | 'solution'; lines: string[] } = { type: 'normal', lines: [] };
  for (const line of lines) {
    const isSol = line.trim().startsWith('✅');
    if (isSol && current.type === 'normal') { if (current.lines.length) blocks.push(current); current = { type: 'solution', lines: [line] }; }
    else if (!isSol && current.type === 'solution') { if (line.trim() !== '' || current.lines.length === 1) current.lines.push(line); else { blocks.push(current); current = { type: 'normal', lines: [line] }; } }
    else current.lines.push(line);
  }
  if (current.lines.length) blocks.push(current);
  return (
    <div className="space-y-1.5">
      {blocks.map((block, i) => block.type === 'solution' ? (
        <div key={i} className="rounded-lg p-2.5 mt-1" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          {block.lines.map((line, j) => line.trim() === '' ? null : (
            <p key={j} className={`text-xs leading-relaxed ${line.trim().startsWith('✅') ? 'font-bold mb-1' : ''}`} style={{ color: line.trim().startsWith('✅') ? '#15803D' : '#166534' }}>{line}</p>
          ))}
        </div>
      ) : (
        <div key={i}>{block.lines.map((line, j) => line.trim() === '' ? <div key={j} className="h-0.5" /> : <p key={j} className="text-xs text-gray-800 leading-relaxed">{line}</p>)}</div>
      ))}
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-2 h-2 rounded-full"
          style={{
            background: '#9CA3AF',
            animation: 'aiBounceInline 1.2s infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

interface InlineChatBoxProps { isOpen: boolean; }

function InlineChatBox({ isOpen }: InlineChatBoxProps) {
  const navigate = useNavigate();
  const { businessNo, clinicName, role } = useAuth();
  const isLoggedIn = !!businessNo;

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_CHAT_MSG]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idRef = useRef(1);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // isLoading stuck 방지 — 15초 후 자동 해제
  useEffect(() => {
    if (isLoading) {
      loadingTimerRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 15000);
    } else {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    }
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, [isLoading]);

  // 메시지 추가 시 채팅 내부 스크롤 + 페이지 스크롤
  useEffect(() => {
    if (!isOpen) return;
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && isLoggedIn) setTimeout(() => inputRef.current?.focus(), 350);
  }, [isOpen, isLoggedIn]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading || !businessNo) return;

    const userMsg: ChatMessage = { id: idRef.current++, role: 'user', text: text.trim() };
    const loadingId = idRef.current++;
    setMessages((prev) => [...prev, userMsg, { id: loadingId, role: 'ai', text: '', loading: true }]);
    setIsLoading(true);

    try {
      const { answer: aiReply, category } = await sendToAI(text.trim());
      setMessages((prev) => prev.map((m) => m.id === loadingId ? { ...m, text: aiReply, loading: false } : m));
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
      try {
        await supabase.from('ai_consultations').insert({
          client_name: clinicName || businessNo || '비로그인',
          business_number: businessNo || null,
          question: text.trim(), answer: aiReply, category,
        });
      } catch { /* 무시 */ }
    } catch {
      setMessages((prev) => prev.map((m) => m.id === loadingId ? { ...m, text: '일시적인 오류가 발생했습니다. 다시 시도해주세요.', loading: false } : m));
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if ((e.nativeEvent as InputEvent).isComposing) return;
      if (!inputValue.trim() || isLoading) return;
      const text = inputValue.trim(); setInputValue(''); handleSend(text);
    }
  };

  // AI 답변을 1개 이상 받았는지 여부 (초기 인삿말 제외)
  const hasAiReply = messages.length > 1;

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* 대화 영역 */}
      <div
        ref={messagesContainerRef}
        className="overflow-y-auto p-4 space-y-3"
        style={{ maxHeight: '300px', background: '#FFFFFF', scrollBehavior: 'smooth' }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'ai' && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: '#DBEAFE' }}
              >
                <i
                  className="ri-robot-2-line w-4 h-4 flex items-center justify-center"
                  style={{ color: BRAND_BLUE, fontSize: '11px' }}
                ></i>
              </div>
            )}
            <div
              style={
                msg.role === 'user'
                  ? { background: '#2563EB', color: '#FFFFFF', borderRadius: '12px 12px 4px 12px', padding: '10px 14px', maxWidth: '80%' }
                  : { background: '#F3F4F6', color: '#111827', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', maxWidth: '80%' }
              }
            >
              {msg.loading
                ? <LoadingDots />
                : msg.role === 'ai'
                  ? <AiMessageContent text={msg.text} />
                  : <p className="text-xs leading-relaxed">{msg.text}</p>
              }
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 본사 금쪽상담소 안내 배너 — AI 답변 후 노출 */}
      {hasAiReply && (
        <div
          className="mx-3 my-2 rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}
        >
          <div className="w-7 h-7 flex items-center justify-center rounded-full shrink-0" style={{ background: '#EDE9FE' }}>
            <i className="ri-hospital-line w-4 h-4 flex items-center justify-center" style={{ color: '#7C3AED', fontSize: '13px' }}></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold" style={{ color: '#5B21B6' }}>더 자세한 임상 상담이 필요하신가요?</p>
            <p className="text-xs" style={{ color: '#7C3AED' }}>본사 김세웅의 금쪽상담소에 문의하세요</p>
          </div>
          <a
            href={HIGHNESS_BOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: '#7C3AED', color: '#FFFFFF' }}
          >
            바로가기
          </a>
        </div>
      )}

      {/* 퀵 리플라이 */}
      {isLoggedIn && messages.length === 1 && (
        <div
          className="px-3 pt-2 pb-2 flex gap-1.5 overflow-x-auto"
          style={{ borderTop: '1px solid #F3F4F6', scrollbarWidth: 'none', background: '#FFFFFF' }}
        >
          {QUICK_REPLIES.map((qr) => (
            <button
              key={qr.text}
              onClick={() => handleSend(qr.text)}
              disabled={isLoading}
              className="whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
              style={{ border: '1px solid #E5E7EB', color: '#6B7280', background: '#F9FAFB' }}
            >
              {qr.label}
            </button>
          ))}
        </div>
      )}

      {/* 입력 영역 */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid #E5E7EB', background: '#FFFFFF' }}>
        {isLoggedIn ? (
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="질문을 입력하세요..."
              className="flex-1 text-sm text-gray-800 outline-none disabled:opacity-50"
              style={{ border: '1px solid #D1D5DB', borderRadius: '8px', padding: '8px 12px', fontSize: '13px' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#93C5FD'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; }}
            />
            <button
              onClick={() => {
                if (!inputValue.trim() || isLoading) return;
                const t = inputValue.trim(); setInputValue(''); handleSend(t);
              }}
              disabled={isLoading || !inputValue.trim()}
              aria-label="전송"
              className="flex items-center justify-center text-white cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              style={{ background: '#2563EB', borderRadius: '8px', width: '36px', height: '36px' }}
            >
              <i className="ri-send-plane-2-fill w-4 h-4 flex items-center justify-center text-sm"></i>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="flex-1 text-xs text-gray-400">로그인 후 이용 가능합니다</span>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-1.5 text-xs font-bold text-white whitespace-nowrap cursor-pointer transition-opacity hover:opacity-90"
              style={{ background: '#2563EB', borderRadius: '8px' }}
            >
              로그인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── QnaCardItem ─────────────────────────────────────────────────────────────
function QnaCardItem({ item }: { item: QnaItem }) {
  const [open, setOpen] = useState(false);
  const color = CATEGORY_COLORS[item.category] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };
  const numbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-6 py-4 text-left cursor-pointer hover:bg-gray-50 transition-colors">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${color.bg} ${color.text}`}>{item.category}</span>
        <span className="flex-1 font-semibold text-gray-800 text-sm">{item.question}</span>
        <i className={`ri-arrow-down-s-line w-5 h-5 flex items-center justify-center text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}></i>
      </button>
      {open && (
        <div className="px-6 pb-5 border-t border-gray-100">
          <p className="text-sm text-gray-700 leading-relaxed mt-4 mb-4">{item.answer}</p>
          <div className="rounded-lg p-4" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <p className="text-xs font-bold mb-2.5 flex items-center gap-1" style={{ color: '#15803D' }}>
              <i className="ri-checkbox-circle-line w-4 h-4 flex items-center justify-center"></i>해결 방법
            </p>
            <ul className="space-y-1.5">
              {item.solutions.map((sol, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: '#166534' }}>
                  <span className="font-bold shrink-0" style={{ color: '#16A34A' }}>{numbers[idx] ?? `${idx + 1}.`}</span>
                  <span>{sol}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function AiConsultationPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('전체');

  const filtered = useMemo(() => {
    return QNA_DATA.filter((item) => activeCategory === '전체' || item.category === activeCategory);
  }, [activeCategory]);

  return (
    <>
      <style>{`
        @keyframes aiBounceInline {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>

      <div className="min-h-screen" style={{ background: '#F8F9FC' }}>
        <div className="max-w-4xl mx-auto px-4 md:px-6 pt-10 pb-6">

          {/* 뒤로가기 */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 cursor-pointer mb-6 transition-colors"
          >
            <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center"></i>
            돌아가기
          </button>

          {/* 타이틀 */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3 select-none">🤖</div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
              AI 상담소 — 사용법 · 오류해결 · 제품 Q&A
            </h1>
            <p className="text-sm text-gray-500">
              하이니스 제품 사용 중 궁금한 점을 검색하거나 카테고리를 선택하세요
            </p>
          </div>

          {/* AI 채팅 헤더 배너 (토글 없음 — 항상 펼침) */}
          <div
            className="w-full flex items-center gap-4 rounded-2xl px-6 py-5 mb-4"
            style={{ background: '#2563EB' }}
          >
            <div className="w-11 h-11 flex items-center justify-center rounded-full bg-white/20 shrink-0">
              <i className="ri-robot-2-line text-white text-xl w-6 h-6 flex items-center justify-center"></i>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-bold text-white mb-0.5">AI에게 직접 물어보기</p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                챗봇과 1:1 대화로 빠르게 해결하세요
              </p>
            </div>
            <div className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 shrink-0">
              <i className="ri-sparkling-2-line text-white text-sm w-4 h-4 flex items-center justify-center"></i>
            </div>
          </div>

          {/* 채팅 박스 — 항상 펼침 */}
          <div className="mb-6">
            <InlineChatBox isOpen={true} />
          </div>

          {/* 카테고리 탭 */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
            {ALL_CATEGORIES.map((cat) => {
              const active = cat === activeCategory;
              const color = cat === '전체' ? null : CATEGORY_COLORS[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    active ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                  style={active ? { background: cat === '전체' ? '#1B2A4A' : undefined } : {}}
                >
                  {active && cat !== '전체' && color ? (
                    <span className={`${color.bg} ${color.text} px-4 py-2 rounded-full text-xs font-bold`}>{cat}</span>
                  ) : cat}
                </button>
              );
            })}
          </div>

          {/* FAQ 헤더 */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: '#1B2A4A' }}>
              <i className="ri-questionnaire-line text-white text-sm w-4 h-4 flex items-center justify-center"></i>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900">자주 묻는 질문 (FAQ)</h2>
              <p className="text-xs text-gray-400">임상 현장에서 자주 나오는 질문 모음</p>
            </div>
          </div>

          {/* 결과 수 */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-400">{filtered.length}개 항목</p>
            {activeCategory !== '전체' && (
              <button
                onClick={() => setActiveCategory('전체')}
                className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer underline"
              >
                필터 초기화
              </button>
            )}
          </div>

          {/* Q&A 목록 */}
          <div className="space-y-3 mb-12">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-sm">해당 카테고리에 항목이 없습니다</p>
              </div>
            ) : (
              filtered.map((item) => <QnaCardItem key={item.id} item={item} />)
            )}
          </div>

          {/* 하단 안내 */}
          <div className="rounded-2xl p-8 text-center mb-12" style={{ background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
            <p className="text-sm font-semibold text-indigo-800 mb-1">
              더 전문적인 임상 상담은 하이니스 본사 금쪽상담소를 이용해주세요
            </p>
            <p className="text-xs text-indigo-500 mb-5">김세웅 원장의 직접 답변 · 케이스 공유</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.open(HIGHNESS_BOARD_URL, '_blank')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white cursor-pointer transition-opacity hover:opacity-90 whitespace-nowrap"
                style={{ background: '#4338CA' }}
              >
                <i className="ri-hospital-line w-4 h-4 flex items-center justify-center"></i>
                본사 상담소 바로가기
              </button>
              <a
                href="https://pf.kakao.com/_xnHxjxb"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm cursor-pointer transition-opacity hover:opacity-90 whitespace-nowrap"
                style={{ background: '#FEE500', color: '#3A1D1D' }}
              >
                <i className="ri-kakao-talk-fill w-4 h-4 flex items-center justify-center"></i>
                추가 문의는 카카오톡 상담
              </a>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
