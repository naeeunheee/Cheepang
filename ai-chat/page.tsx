import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Message {
  id: number;
  role: 'user' | 'ai';
  text: string;
  loading?: boolean;
}

const BRAND_BLUE = '#2563EB';

const WELCOME_MESSAGE: Message = {
  id: 0,
  role: 'ai',
  text: '안녕하세요! 치팡 AI 상담소입니다 🦷\n치과 재료, 주문, 배송 등 궁금한 점을 물어보세요.',
};

const QUICK_REPLIES = [
  { label: '🔩 스크류 풀림', text: '스크류가 풀려요' },
  { label: '💥 스크류 파절', text: '스크류가 부러졌어요' },
  { label: '🏥 임상 상담', text: '임상 케이스 상담하고 싶어요' },
  { label: '🔧 기공소 호환', text: '기공소 호환 방법 알려주세요' },
  { label: '📦 배송 문의', text: '배송은 얼마나 걸려요' },
  { label: '💰 가격 문의', text: '가격이 얼마예요' },
];

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
    return {
      answer: (bestMatch as (typeof knowledge)[number]).answer,
      category: (bestMatch as (typeof knowledge)[number]).category,
    };
  }
  return {
    answer: '해당 내용은 담당자 확인이 필요합니다.\n\n📦 제품 문의: 📞 010-8950-3379\n🚚 배송·주문 문의: 📞 1522-4936\n💬 카카오톡: 010-5341-1522',
    category: '기타',
  };
}

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
        max_tokens: 1024,
        system: `당신은 (주)하이니스중부지사 치팡 B2B 플랫폼의 상담 AI입니다.
반드시 아래 규칙을 따르세요.

[답변 규칙]
1. 알고 있는 내용만 답변하세요
2. 모르거나 확실하지 않은 내용은 절대 추측하거나 지어내지 마세요
3. 존재하지 않는 서비스, 기능, 링크를 안내하지 마세요

[카테고리별 답변 규칙 - 매우 중요]
질문 내용을 먼저 파악하고 관련 카테고리만 안내하세요.

1. 제품/임상 관련 질문 (스크류 풀림, 파절, 공차, 사용법, 호환성, 교합, 심미 등)
   → 제품 관련 답변만 제공
   → 배송·주문 내용 절대 언급 금지
   → 해결 안 되면: 📞 제품문의 010-8950-3379

2. 주문/배송 관련 질문 (배송 기간, 주문 방법, 재고 확인 등)
   → 주문·배송 안내만 제공
   → 제품 임상 내용 절대 언급 금지
   → 문의: 📞 1522-4936 / 💬 카카오톡 010-5341-1522

3. 패키지/단가 관련 질문
   → "패키지 단가는 담당 영업직원을 통해 개별 안내드리고 있습니다. 담당 직원에게 직접 문의해 주세요."
   → 전화번호 언급 금지

[핵심 원칙]
- 질문과 관련 없는 카테고리 내용은 절대 함께 안내하지 마세요
- 질문에 딱 맞는 내용만 간결하게 답변하세요
- 확실하지 않은 내용은 해당 카테고리 담당 문의처로 연결하세요

[절대 금지]
- 패키지 단가 직접 안내
- 없는 서비스 안내
- 가격 임의 추측
- 사실이 아닌 내용 답변`,
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

// ─── 로딩 점 ─────────────────────────────────────────────────────────────────
function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-2 h-2 rounded-full"
          style={{
            background: '#94A3B8',
            animation: 'aiBounce 1.2s infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── 메시지 렌더러 ──────────────────────────────────────────────────────────
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
                  <p key={j} className={`text-sm leading-relaxed ${isHeader ? 'font-bold mb-1.5' : ''}`}
                    style={{ color: isHeader ? '#15803D' : '#166534' }}>
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

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────
export default function AiChatPage() {
  const navigate = useNavigate();
  const { businessNo, clinicName, role } = useAuth();
  const session = businessNo ? { businessNo, clinicName, role } : null;
  const isLoggedIn = !!businessNo;

  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const idRef = useRef(1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isLoggedIn) inputRef.current?.focus();
  }, [isLoggedIn]);

  const handleReset = () => {
    setMessages([WELCOME_MESSAGE]);
    setShowQuickReplies(true);
    setInputValue('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading || !isLoggedIn) return;

    setShowQuickReplies(false);
    const userMsg: Message = { id: idRef.current++, role: 'user', text: text.trim() };
    const loadingId = idRef.current++;
    const loadingMsg: Message = { id: loadingId, role: 'ai', text: '', loading: true };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setIsLoading(true);

    const { answer: aiReply, category } = await sendToAI(text.trim());

    setMessages((prev) =>
      prev.map((m) => m.id === loadingId ? { ...m, text: aiReply, loading: false } : m)
    );
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
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

  return (
    <>
      <style>{`
        @keyframes aiBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        .ai-chat-scroll::-webkit-scrollbar { width: 4px; }
        .ai-chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .ai-chat-scroll::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }
        .ai-chat-scroll::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
        .chat-textarea { resize: none; scrollbar-width: none; }
        .chat-textarea::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="flex flex-col h-screen" style={{ background: '#F8FAFC' }}>

        {/* ── 헤더 ── */}
        <header
          className="shrink-0 flex items-center justify-between px-4 h-14"
          style={{ background: BRAND_BLUE }}
        >
          <button
            onClick={() => navigate(-1)}
            aria-label="뒤로가기"
            className="w-9 h-9 flex items-center justify-center rounded-full text-white cursor-pointer transition-colors hover:bg-white/20"
          >
            <i className="ri-arrow-left-line text-xl w-5 h-5 flex items-center justify-center"></i>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20">
              <i className="ri-robot-2-line text-white text-sm w-4 h-4 flex items-center justify-center"></i>
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">AI 상담소</p>
              <p className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.7)' }}>
                하이니스 지식베이스 · 즉시 답변
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            aria-label="대화 초기화"
            className="w-9 h-9 flex items-center justify-center rounded-full text-white cursor-pointer transition-colors hover:bg-white/20"
            title="대화 초기화"
          >
            <i className="ri-refresh-line text-xl w-5 h-5 flex items-center justify-center"></i>
          </button>
        </header>

        {/* ── 채팅 영역 ── */}
        <div className="flex-1 overflow-y-auto ai-chat-scroll px-4 py-5 space-y-5">

          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {/* AI 아바타 */}
              {msg.role === 'ai' && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: '#DBEAFE' }}
                >
                  <i className="ri-robot-2-line text-xs w-4 h-4 flex items-center justify-center" style={{ color: BRAND_BLUE }}></i>
                </div>
              )}

              {/* 말풍선 */}
              <div
                className="max-w-[76%] px-4 py-3"
                style={
                  msg.role === 'user'
                    ? {
                        background: BRAND_BLUE,
                        borderRadius: '16px 16px 4px 16px',
                        color: '#fff',
                      }
                    : {
                        background: '#FFFFFF',
                        border: '1px solid #E8EDF2',
                        borderRadius: '16px 16px 16px 4px',
                      }
                }
              >
                {msg.loading ? (
                  <LoadingDots />
                ) : msg.role === 'ai' ? (
                  <AiMessageContent text={msg.text} />
                ) : (
                  <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                )}
              </div>
            </div>
          ))}

          {/* 퀵 리플라이 (환영 메시지 이후, 아직 대화 전) */}
          {showQuickReplies && isLoggedIn && (
            <div className="flex flex-wrap gap-2 pl-10 pt-1">
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr.text}
                  onClick={() => { setShowQuickReplies(false); handleSend(qr.text); }}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
                  style={{ borderColor: '#E5E7EB', color: '#6B7280', background: '#fff' }}
                >
                  {qr.label}
                </button>
              ))}
            </div>
          )}

          {/* 비로그인 안내 */}
          {!isLoggedIn && messages.length === 1 && (
            <div
              className="mx-auto max-w-xs rounded-2xl p-6 text-center mt-8"
              style={{ background: '#fff', border: '1px solid #E8EDF2' }}
            >
              <div
                className="w-12 h-12 flex items-center justify-center rounded-full mx-auto mb-3"
                style={{ background: '#DBEAFE' }}
              >
                <i className="ri-lock-line text-xl w-6 h-6 flex items-center justify-center" style={{ color: BRAND_BLUE }}></i>
              </div>
              <p className="text-sm font-bold text-gray-800 mb-1">로그인 후 이용 가능합니다</p>
              <p className="text-xs text-gray-500 mb-4">하이니스 회원만 이용할 수 있는 서비스입니다</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white whitespace-nowrap cursor-pointer transition-opacity hover:opacity-90"
                style={{ background: BRAND_BLUE }}
              >
                로그인하기
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── 입력창 ── */}
        <div
          className="shrink-0 px-4 py-3 border-t"
          style={{ background: '#fff', borderColor: '#E8EDF2' }}
        >
          {isLoggedIn ? (
            <div
              className="flex items-end gap-2 rounded-2xl px-4 py-2"
              style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}
            >
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="메시지를 입력하세요... (Shift+Enter 줄바꿈)"
                rows={1}
                className="chat-textarea flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400 disabled:opacity-50 py-1"
                style={{ fontSize: '14px', minHeight: '24px', maxHeight: '120px' }}
              />
              <button
                onClick={handleClickSend}
                disabled={isLoading || !inputValue.trim()}
                aria-label="전송"
                className="w-9 h-9 flex items-center justify-center rounded-full text-white cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 mb-0.5"
                style={{
                  background: inputValue.trim() && !isLoading ? BRAND_BLUE : '#CBD5E1',
                  transition: 'background 0.15s ease',
                }}
              >
                <i className="ri-send-plane-2-fill text-base w-4 h-4 flex items-center justify-center"></i>
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}
            >
              <span className="flex-1 text-xs text-gray-400">로그인 후 이용 가능합니다</span>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white whitespace-nowrap cursor-pointer transition-opacity hover:opacity-90"
                style={{ background: BRAND_BLUE }}
              >
                로그인
              </button>
            </div>
          )}
          <p className="text-center text-xs text-gray-400 mt-2">
            Enter 전송 · Shift+Enter 줄바꿈
          </p>
        </div>
      </div>
    </>
  );
}
