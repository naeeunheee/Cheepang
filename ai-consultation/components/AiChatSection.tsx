import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface Message {
  id: number;
  role: 'user' | 'ai';
  text: string;
  loading?: boolean;
}

const BRAND_BLUE = '#2563EB';

const INITIAL_MESSAGE: Message = {
  id: 0,
  role: 'ai',
  text: '안녕하세요! 하이니스 임플란트 AI 상담사입니다.\n사용법, 오류해결, 제품 궁금증 무엇이든 물어보세요.',
};

const QUICK_REPLIES = [
  { label: '🔩 스크류 풀림', text: '스크류가 풀려요' },
  { label: '💥 스크류 파절', text: '스크류가 부러졌어요' },
  { label: '🏥 임상 상담', text: '임상 케이스 상담하고 싶어요' },
  { label: '🔧 기공소 호환', text: '기공소 호환 방법 알려주세요' },
  { label: '📦 배송 문의', text: '배송은 얼마나 걸려요' },
];

const GLOBAL_STYLES = `
  @keyframes aiBounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
    40% { transform: translateY(-6px); opacity: 1; }
  }
  @keyframes aiChatOpenMobile {
    from { transform: translateY(100%); opacity: 0.85; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes aiChatCloseMobile {
    from { transform: translateY(0);    opacity: 1; }
    to   { transform: translateY(100%); opacity: 0; }
  }
  @keyframes aiChatOpenDesktop {
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes aiChatCloseDesktop {
    from { opacity: 1; transform: translateY(0) scale(1); }
    to   { opacity: 0; transform: translateY(16px) scale(0.97); }
  }
  @keyframes aiBtnFadeIn {
    from { opacity: 0; transform: scale(0.75); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* 모바일: 바텀시트 스타일 */
  .ai-chat-window {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: min(520px, 70vh);
    border-radius: 16px 16px 0 0;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
  }
  .ai-chat-window.opening {
    animation: aiChatOpenMobile 0.3s ease-out both;
  }
  .ai-chat-window.closing {
    animation: aiChatCloseMobile 0.2s ease-in both;
  }

  /* 데스크탑: 플로팅 카드 스타일 */
  @media (min-width: 768px) {
    .ai-chat-window {
      left: auto;
      right: 20px;
      bottom: 84px;
      width: 380px;
      height: min(500px, 70vh);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    }
    .ai-chat-window.opening {
      animation: aiChatOpenDesktop 0.3s ease-out both;
    }
    .ai-chat-window.closing {
      animation: aiChatCloseDesktop 0.2s ease-in both;
    }
  }

  .ai-toggle-btn {
    animation: aiBtnFadeIn 0.2s ease-out both;
  }
`;

// ─── 로컬 Q&A 엔진 ─────────────────────────────────────────────────────────
function localAIResponse(userMessage: string): { answer: string; category: string } {
  const q = userMessage.toLowerCase();
  const knowledge = [
    {
      keywords: ['풀림', '풀려', '루즈', '나사', '흔들'],
      category: '스크류 문제',
      answer: '스크류 풀림은 하이니스 2중 스크류 체결 방식으로 해결됩니다.\nBase 1차 결합 후 Link 2차 스크류 이중 잠금으로 풀림을 원천 차단합니다.\n\n✅ 해결 방법:\n① 토크렌치 25~30Ncm 정확 체결\n② 장착 후 10~15분 뒤 재조임\n③ 1개월 리콜 시 재확인\n④ Cone Morse 연결로 미세움직임 최소화\n\n추가 제품 문의: 📞 010-8950-3379',
    },
    {
      keywords: ['파절', '부러', '깨짐', '파손', '부서'],
      category: '스크류 문제',
      answer: '스크류 파절은 과도한 측방력이 주원인입니다.\n교합력 분산 설계로 stress를 줄이며, 파절 시 전용 기구로 1~2분 내 제거 가능합니다.\n\n✅ 해결 방법:\n① 전용 제거 기구 1~2분 제거\n② 교합 체크하여 측방력 확인\n③ Angled Abutment로 분산\n④ NEXTURE 일체형은 파절 리스크 제거\n\n추가 제품 문의: 📞 010-8950-3379',
    },
    {
      keywords: ['어렵', '손이', '안간다', '불편', '학습', '복잡', '사용법'],
      category: '사용법',
      answer: '초기 학습곡선이 있지만 시멘트 접착이 없어 steps가 줄고 간소화됩니다.\n\n✅ 해결 방법:\n① 첫 3케이스 본사 기술지원 무료 동행\n② 스캔→Base→Link = 3단계\n③ 시멘트 제거 0분=체어타임 단축\n④ 11도 테이퍼 호환=추가학습 최소\n\n추가 제품 문의: 📞 010-8950-3379',
    },
    {
      keywords: ['모른다', '인지도', '브랜드', '알려', '유명', '환자'],
      category: '브랜드/마케팅',
      answer: "환자에게는 '시멘트 없는 안전한 보철'로 차별화하세요.\n\n✅ 응대 방법:\n① 시멘트 없어서 염증 위험 낮음\n② 나사 고정이라 문제시 바로 분리\n③ 유저 인터뷰 영상 활용\n④ 대학병원 사용 시스템 포지셔닝\n\n추가 제품 문의: 📞 010-8950-3379",
    },
    {
      keywords: ['가격', '단가', '비용', '얼마', '패키지', '원가'],
      category: '가격/패키지',
      answer: '패키지 단가는 담당 영업직원을 통해 개별 안내드리고 있습니다.\n담당 직원에게 직접 문의해 주세요.',
    },
    {
      keywords: ['호환', '임플란트', '시스템', '오스템', 'osstem', 'dentium', '덴티움'],
      category: '호환성',
      answer: '하이니스는 14개 주요 임플란트 시스템과 호환됩니다.\n\n✅ 호환 시스템:\n① Osstem TS II/III\n② Dentium Super-Line/Implantium\n③ Neobiotech IS II/III\n④ Megagen AnyOne/Bluediamond\n⑤ Dio UF/UF II\n⑥ Straumann Bone Level 등\n\n추가 제품 문의: 📞 010-8950-3379',
    },
    {
      keywords: ['기공', '스캔', '워크플로우', 'cad', 'cam', '스캔바디'],
      category: '기공소/워크플로우',
      answer: 'CAD/CAM 기반으로 기존 기공소 워크플로우와 바로 연동 가능합니다.\n\n✅ 워크플로우:\n① 스캔바디만 있으면 기존 방식 그대로\n② 전용 라이브러리 파일 무료 제공\n③ 11도 테이퍼로 타사 라이브러리도 호환\n④ 스캔→Base→Link 3단계로 완료\n\n추가 제품 문의: 📞 010-8950-3379',
    },
    {
      keywords: ['교합', '높이', 'sink', '게이지', 'gauge'],
      category: '교합 관리',
      answer: 'Sink Down 방지 구조와 Base Cuff Gauge로 높이를 사전에 정확히 확인할 수 있습니다.\n\n✅ 교합 관리:\n① Base Cuff Gauge로 높이 사전 체크\n② Top-Down 방식 권장\n③ 교합지로 측방력 분산 확인\n④ Angled Abutment로 각도 보정\n\n추가 제품 문의: 📞 010-8950-3379',
    },
    {
      keywords: ['심미', '전치', '앞니', '지르코니아', '색상', '어버트먼트'],
      category: '전치부 심미',
      answer: '전치부 심미는 Angled Base와 지르코니아 Link로 완벽하게 해결됩니다.\n\n✅ 심미 솔루션:\n① Angled Base로 스크류홀 최대 25도 조정\n② 지르코니아 Link로 자연치 색상 구현\n③ 시멘트라인 없어 잇몸 심미 탁월\n④ 투명도 높은 지르코니아 선택 가능\n\n추가 제품 문의: 📞 010-8950-3379',
    },
    {
      keywords: ['기공소', '거부', '라이브러리', 'CAD'],
      category: '기공소/워크플로우',
      answer: 'CAD/CAM 기반이라 스캔바디만 있으면 기존 워크플로우 그대로 가능합니다.\n\n✅ 해결 방법:\n① 전용 라이브러리 파일 전달\n② 스캔바디→IOS→CAD→밀링 = 표준\n③ 협력 기공소 네트워크 소개\n④ 11도 테이퍼 타사 호환\n\n추가 제품 문의: 📞 010-8950-3379',
    },
    {
      keywords: ['비싸', '돈', '저렴', '부담'],
      category: '가격/패키지',
      answer: '패키지 단가는 담당 영업직원을 통해 개별 안내드리고 있습니다.\n담당 직원에게 직접 문의해 주세요.',
    },
    {
      keywords: ['시멘트', 'cement', '접착', '익숙'],
      category: '시멘트 비교',
      answer: '잔여 시멘트는 주위염의 주요 원인입니다.\n하이니스는 시멘트 없이 체결하므로 염증 리스크 제거.\n\n✅ 전환 방법:\n① 신규 케이스만 하이니스 적용\n② 2~3케이스 체험 후 자연 전환\n\n추가 제품 문의: 📞 010-8950-3379',
    },
    {
      keywords: ['씹', '맞지', '조정'],
      category: '교합 관리',
      answer: 'Sink Down 방지 구조로 교합 안정성이 높습니다.\n\n✅ 해결:\n① Cuff Gauge로 높이 사전 체크\n② Top-Down 방식 권장\n③ Link만 분리 재제작 간편\n\n추가 제품 문의: 📞 010-8950-3379',
    },
    {
      keywords: ['전치부'],
      category: '전치부 심미',
      answer: 'Angled Base로 스크류홀 최대 25도 조정 가능.\n시멘트라인 없이 깔끔한 마진.\n\n✅ 해결:\n① 지르코니아 Link=자연치 색상\n② 분리 가능=문제시 즉시 수정\n\n추가 제품 문의: 📞 010-8950-3379',
    },
    {
      keywords: ['공차', '정밀', '오차', '안맞', '갭', '피팅'],
      category: '정밀도/피팅',
      answer: 'Cone Morse 11도 taper로 Micro-gap 최소화.\nBase+Link 2단계 정밀관리.\n\n✅ 해결:\n① CAD/CAM 밀링=수작업 오차 제거\n② 문제 시 Link만 재제작\n\n추가 제품 문의: 📞 010-8950-3379',
    },
    {
      keywords: ['네오', '타사', 'neobiotech', 'megagen', 'dio', 'straumann'],
      category: '호환성',
      answer: '국내외 14개 시스템 호환.\nOsstem/Dentium/Neobiotech/Megagen/Dio/Straumann 등\n\n추가 제품 문의: 📞 010-8950-3379',
    },
    {
      keywords: ['nexture', '넥스쳐', '넥스츄어'],
      category: 'NEXTURE 제품',
      answer: 'NEXTURE는 Tissue Level 임플란트.\n3Cut Edge로 초기고정력 향상, 즉시로딩 지원.\n\n추가 제품 문의: 📞 010-8950-3379',
    },
    {
      keywords: ['주문', '배송', '납기', '도착', '재고', '얼마나', '걸려'],
      category: '배송/주문',
      answer: '온라인 주문 시 당일~익일 배송됩니다.\n\n📞 배송·주문 문의: 1522-4936\n💬 카카오톡: 010-5341-1522\n(주)하이니스중부지사-치팡',
    },
    {
      keywords: ['임상', '케이스', '증례', '실패', '합병증', '골흡수', '주위염', '감염'],
      category: '임상 상담',
      answer: '임상 관련 전문 상담은 담당 기술지원팀에 문의해 주세요.\n\n추가 제품·임상 문의: 📞 010-8950-3379',
    },
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
  return {
    answer: '해당 내용은 담당자 확인이 필요합니다.\n\n📦 제품 문의: 📞 010-8950-3379\n🚚 배송·주문 문의: 📞 1522-4936\n💬 카카오톡: 010-5341-1522',
    category: '기타',
  };
}

// ─── Claude API + 로컬 fallback ────────────────────────────────────────────
async function sendToAI(userMessage: string): Promise<{ answer: string; category: string }> {
  const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!API_KEY) return localAIResponse(userMessage);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
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
  } catch {
    return localAIResponse(userMessage);
  }
}

// ─── 서브 컴포넌트 ───────────────────────────────────────────────────────────
function AiMessageContent({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: { type: 'normal' | 'solution'; lines: string[] }[] = [];
  let current: { type: 'normal' | 'solution'; lines: string[] } = { type: 'normal', lines: [] };

  for (const line of lines) {
    const isSolution = line.trim().startsWith('✅');
    if (isSolution && current.type === 'normal') {
      if (current.lines.length > 0) blocks.push(current);
      current = { type: 'solution', lines: [line] };
    } else if (!isSolution && current.type === 'solution') {
      if (line.trim() !== '' || current.lines.length === 1) {
        current.lines.push(line);
      } else {
        blocks.push(current);
        current = { type: 'normal', lines: [line] };
      }
    } else {
      current.lines.push(line);
    }
  }
  if (current.lines.length > 0) blocks.push(current);

  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        if (block.type === 'solution') {
          return (
            <div key={i} className="rounded-lg p-3 mt-1" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              {block.lines.map((line, j) => {
                if (line.trim() === '') return null;
                const isHeader = line.trim().startsWith('✅');
                return (
                  <p key={j} className={`text-sm leading-relaxed ${isHeader ? 'font-bold mb-1.5' : ''}`} style={{ color: isHeader ? '#15803D' : '#166534' }}>
                    {line}
                  </p>
                );
              })}
            </div>
          );
        }
        return (
          <div key={i}>
            {block.lines.map((line, j) => {
              if (line.trim() === '') return <div key={j} className="h-1" />;
              return <p key={j} className="text-sm text-gray-800 leading-relaxed">{line}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-2 h-2 rounded-full bg-gray-400"
          style={{ animation: 'aiBounce 1.2s infinite', animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export default function AiChatSection() {
  const navigate = useNavigate();
  const { businessNo, clinicName, role } = useAuth();
  const session = businessNo ? { businessNo, clinicName, role } : null;
  const isLoggedIn = !!businessNo;

  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idRef = useRef(1);

  // ESC 키로 닫기
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isClosing]);

  // 메시지 스크롤
  useEffect(() => {
    if (isOpen && !isClosing) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isClosing]);

  // 열릴 때 입력 포커스
  useEffect(() => {
    if (isOpen && !isClosing && isLoggedIn) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, isClosing, isLoggedIn]);

  const handleOpen = () => {
    setIsClosing(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  };

  const handleToggle = () => {
    if (isOpen) handleClose();
    else handleOpen();
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading || !isLoggedIn) return;

    const userMsg: Message = { id: idRef.current++, role: 'user', text: text.trim() };
    const loadingId = idRef.current++;
    const loadingMsg: Message = { id: loadingId, role: 'ai', text: '', loading: true };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setIsLoading(true);

    const { answer: aiReply, category } = await sendToAI(text.trim());

    setMessages((prev) => prev.map((m) => m.id === loadingId ? { ...m, text: aiReply, loading: false } : m));
    setIsLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);

    try {
      await supabase.from('ai_consultations').insert({
        client_name: session?.clinicName || session?.businessNo || '비로그인',
        business_number: session?.businessNo || null,
        question: text.trim(),
        answer: aiReply,
        category,
      });
    } catch { /* 저장 실패 무시 */ }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if ((e.nativeEvent as InputEvent).isComposing) return;
      if (!inputValue.trim() || isLoading) return;
      const text = inputValue.trim();
      setInputValue('');
      handleSend(text);
    }
  };

  const handleClickSend = () => {
    if (!inputValue.trim() || isLoading) return;
    const text = inputValue.trim();
    setInputValue('');
    handleSend(text);
  };

  const handleQuickReply = (text: string) => {
    if (isLoading || !isLoggedIn) return;
    handleSend(text);
  };

  return (
    <>
      <style>{GLOBAL_STYLES}</style>

      {/* ── 채팅창 ── */}
      {isOpen && (
        <div className={`ai-chat-window ${isClosing ? 'closing' : 'opening'}`}>

          {/* 헤더 */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ background: BRAND_BLUE }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20">
                <i className="ri-robot-2-line text-white w-4 h-4 flex items-center justify-center text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">AI 상담소</p>
                <p className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  하이니스 지식베이스 기반 · 즉시 답변
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              aria-label="상담 닫기"
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer hover:bg-white/20"
            >
              <i className="ri-close-line text-white text-lg w-5 h-5 flex items-center justify-center"></i>
            </button>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: '#F8FAFC' }}>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5"
                    style={{ background: '#DBEAFE' }}
                  >
                    <i className="ri-robot-2-line text-xs w-4 h-4 flex items-center justify-center" style={{ color: BRAND_BLUE }}></i>
                  </div>
                )}
                <div
                  className={`max-w-[78%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' ? 'text-white' : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                  style={msg.role === 'user' ? { background: BRAND_BLUE } : {}}
                >
                  {msg.loading ? <LoadingDots /> : msg.role === 'ai' ? <AiMessageContent text={msg.text} /> : <p>{msg.text}</p>}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* 퀵 리플라이 */}
          {isLoggedIn && (
            <div
              className="px-3 pt-2 pb-1 flex gap-1.5 overflow-x-auto border-t border-gray-100 bg-white shrink-0"
              style={{ scrollbarWidth: 'none' }}
            >
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr.text}
                  onClick={() => handleQuickReply(qr.text)}
                  disabled={isLoading}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ border: '1px solid #E5E7EB', color: '#6B7280', background: '#FAFAFA' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#93C5FD';
                    (e.currentTarget as HTMLButtonElement).style.color = BRAND_BLUE;
                    (e.currentTarget as HTMLButtonElement).style.background = '#EFF6FF';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
                    (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
                    (e.currentTarget as HTMLButtonElement).style.background = '#FAFAFA';
                  }}
                >
                  {qr.label}
                </button>
              ))}
            </div>
          )}

          {/* 입력창 */}
          <div className="px-3 pb-3 pt-2 border-t border-gray-200 bg-white shrink-0" style={{ borderRadius: '0 0 16px 16px' }}>
            {isLoggedIn ? (
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  placeholder="궁금한 점을 입력하세요"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none transition-colors disabled:opacity-50"
                  style={{ fontSize: '14px' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#93C5FD'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                />
                <button
                  onClick={handleClickSend}
                  disabled={isLoading || !inputValue.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white whitespace-nowrap cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  style={{ background: BRAND_BLUE }}
                >
                  {isLoading ? '...' : '전송'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  disabled
                  placeholder="로그인 후 이용 가능합니다"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-400 bg-gray-50 cursor-not-allowed"
                  style={{ fontSize: '13px' }}
                />
                <button
                  onClick={() => { handleClose(); setTimeout(() => navigate('/login'), 250); }}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white whitespace-nowrap cursor-pointer transition-opacity hover:opacity-90 shrink-0"
                  style={{ background: BRAND_BLUE }}
                >
                  로그인
                </button>
              </div>
            )}
          </div>

          {/* 비로그인 오버레이 */}
          {!isLoggedIn && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-4"
              style={{ background: 'rgba(248,250,252,0.9)', backdropFilter: 'blur(4px)', top: '56px', borderRadius: '0 0 16px 16px' }}
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-full" style={{ background: '#DBEAFE' }}>
                <i className="ri-lock-line text-xl w-6 h-6 flex items-center justify-center" style={{ color: BRAND_BLUE }}></i>
              </div>
              <div className="text-center px-6">
                <p className="text-sm font-bold text-gray-800 mb-1">로그인 후 이용 가능합니다</p>
                <p className="text-xs text-gray-500">하이니스 회원만 이용할 수 있는 서비스입니다</p>
              </div>
              <button
                onClick={() => { handleClose(); setTimeout(() => navigate('/login'), 250); }}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white whitespace-nowrap cursor-pointer transition-opacity hover:opacity-90"
                style={{ background: BRAND_BLUE }}
              >
                로그인하기
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 토글 버튼 ── */}
      <button
        onClick={handleToggle}
        aria-label={isOpen ? 'AI 상담 닫기' : 'AI 상담 열기'}
        className="ai-toggle-btn fixed flex items-center justify-center rounded-full cursor-pointer active:scale-95"
        style={{
          right: '20px',
          bottom: '80px',
          width: '56px',
          height: '56px',
          zIndex: 999,
          background: BRAND_BLUE,
          borderRadius: '50%',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
      >
        {isOpen ? (
          <i className="ri-close-line text-white text-2xl w-6 h-6 flex items-center justify-center"></i>
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
              fill="white"
            />
          </svg>
        )}
      </button>
    </>
  );
}
