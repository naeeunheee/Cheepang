import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { businessNo, role, clinicName } = useAuth();

  // room_id를 거래처 사업자번호로 고정
  const roomId = businessNo || '';
  const isAdminUser = role === 'admin';

  // 메시지 로드
  const loadMessages = async () => {
    if (!roomId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // 읽지 않은 메시지 카운트 (관리자가 보낸 메시지만)
      const unread = (data || []).filter(
        (msg: Message) => !msg.is_read && msg.sender_role === 'admin'
      ).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('메시지 로드 실패:', error);
    }
  };

  // 메시지 읽음 처리
  const markAsRead = async () => {
    if (!roomId) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('room_id', roomId)
        .eq('sender_role', 'admin');

      setUnreadCount(0);
    } catch (error) {
      console.error('읽음 처리 실패:', error);
    }
  };

  // 메시지 전송
  const sendMessage = async () => {
    if (!newMessage.trim() || !businessNo || !roomId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('messages').insert({
        room_id: roomId,
        sender_id: businessNo,
        sender_name: clinicName || businessNo,
        sender_role: 'dental',
        content: newMessage.trim(),
        is_read: false,
      });

      if (error) throw error;

      setNewMessage('');
      await loadMessages();
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 실시간 구독
  useEffect(() => {
    if (!roomId) return;

    loadMessages();

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // 채팅창 열릴 때 읽음 처리
  useEffect(() => {
    if (isOpen) {
      markAsRead();
    }
  }, [isOpen]);

  // 새 메시지 도착 시 자동 스크롤 하단 이동
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!businessNo || isAdminUser) return null;

  return (
    <>
      {/* 플로팅 채팅 버튼 - 좌측 하단 소형 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 w-11 h-11 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-40 cursor-pointer opacity-80 hover:opacity-100"
        aria-label="채팅 열기"
      >
        <i className="ri-message-3-line text-lg w-5 h-5 flex items-center justify-center"></i>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 채팅창 */}
      {isOpen && (
        <div className="fixed bottom-20 left-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-12rem)] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* 헤더 */}
          <div className="bg-teal-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="ri-customer-service-2-line text-xl w-5 h-5 flex items-center justify-center"></i>
              <span className="font-semibold">관리자와 대화</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-teal-700 p-1 rounded transition-colors cursor-pointer w-8 h-8 flex items-center justify-center"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <i className="ri-chat-3-line text-4xl mb-2 w-10 h-10 flex items-center justify-center mx-auto"></i>
                <p>관리자에게 문의하세요</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender_role === 'dental';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        isMine
                          ? 'bg-teal-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      {!isMine && (
                        <div className="text-xs font-semibold mb-1">
                          관리자
                        </div>
                      )}
                      <div className="break-words">{msg.content}</div>
                      <div
                        className={`text-xs mt-1 ${
                          isMine ? 'text-teal-100' : 'text-gray-500'
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력창 */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                placeholder="메시지를 입력하세요..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isLoading}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-send-plane-fill"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}