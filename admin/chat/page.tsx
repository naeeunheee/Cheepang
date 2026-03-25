import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import AdminHeader from '../../../components/feature/AdminHeader';

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

interface ChatRoom {
  room_id: string;
  client_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export default function AdminChatPage() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 채팅방 목록 로드 - clients 테이블에서 거래처명 조회
  const loadChatRooms = async () => {
    try {
      // 모든 메시지에서 room_id 추출
      const { data: allMessages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (msgError) throw msgError;

      // clients 테이블에서 거래처 정보 조회
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('business_number, name');

      if (clientError) throw clientError;

      // 거래처명 매핑
      const clientMap = new Map<string, string>();
      (clients || []).forEach((client: any) => {
        clientMap.set(client.business_number, client.name);
      });

      // room_id별로 그룹화
      const roomMap = new Map<string, ChatRoom>();
      
      (allMessages || []).forEach((msg: Message) => {
        if (!roomMap.has(msg.room_id)) {
          const unreadCount = (allMessages || []).filter(
            (m: Message) =>
              m.room_id === msg.room_id &&
              !m.is_read &&
              m.sender_role === 'dental'
          ).length;

          // clients 테이블에서 거래처명 가져오기
          const clientName = clientMap.get(msg.room_id) || msg.sender_name;

          roomMap.set(msg.room_id, {
            room_id: msg.room_id,
            client_name: clientName,
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: unreadCount,
          });
        }
      });

      setChatRooms(Array.from(roomMap.values()));
    } catch (error) {
      console.error('채팅방 목록 로드 실패:', error);
    }
  };

  // 메시지 로드
  const loadMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // 거래처가 보낸 메시지만 읽음 처리
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('room_id', roomId)
        .eq('sender_role', 'dental');

      loadChatRooms();
    } catch (error) {
      console.error('메시지 로드 실패:', error);
    }
  };

  // 메시지 전송
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('messages').insert({
        room_id: selectedRoom,
        sender_id: 'admin',
        sender_name: '관리자',
        sender_role: 'admin',
        content: newMessage.trim(),
        is_read: false,
      });

      if (error) throw error;

      setNewMessage('');
      await loadMessages(selectedRoom);
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 실시간 구독
  useEffect(() => {
    loadChatRooms();

    const channel = supabase
      .channel('admin-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadChatRooms();
          if (selectedRoom) {
            loadMessages(selectedRoom);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedRoom]);

  // 새 메시지 도착 시 자동 스크롤 하단 이동
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg h-[calc(100vh-200px)] flex">
          {/* 채팅방 목록 */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 whitespace-nowrap">
                <i className="ri-message-3-line mr-2"></i>
                채팅 목록
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {chatRooms.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                  <i className="ri-chat-off-line text-4xl mb-2"></i>
                  <p className="whitespace-nowrap">채팅 내역이 없습니다</p>
                </div>
              ) : (
                chatRooms.map((room) => (
                  <button
                    key={room.room_id}
                    onClick={() => {
                      setSelectedRoom(room.room_id);
                      loadMessages(room.room_id);
                    }}
                    className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left cursor-pointer ${
                      selectedRoom === room.room_id ? 'bg-teal-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-800 whitespace-nowrap">
                        {room.client_name}
                      </span>
                      {room.unread_count > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                          {room.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {room.last_message}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 whitespace-nowrap">
                      {new Date(room.last_message_time).toLocaleString('ko-KR')}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 채팅 영역 */}
          <div className="flex-1 flex flex-col">
            {selectedRoom ? (
              <>
                {/* 헤더 */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-800 whitespace-nowrap">
                    {chatRooms.find((r) => r.room_id === selectedRoom)?.client_name}
                  </h3>
                  <p className="text-sm text-gray-500 whitespace-nowrap">
                    사업자번호: {selectedRoom}
                  </p>
                </div>

                {/* 메시지 목록 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => {
                    const isAdmin = msg.sender_role === 'admin';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isAdmin
                              ? 'bg-teal-600 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {!isAdmin && (
                            <div className="text-xs font-semibold mb-1 whitespace-nowrap">
                              {msg.sender_name}
                            </div>
                          )}
                          <div className="break-words">{msg.content}</div>
                          <div
                            className={`text-xs mt-1 ${
                              isAdmin ? 'text-teal-100' : 'text-gray-500'
                            } whitespace-nowrap`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* 입력창 */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                      placeholder="메시지를 입력하세요..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 whitespace-nowrap"
                      disabled={isLoading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isLoading}
                      className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-send-plane-fill mr-2"></i>
                      전송
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <i className="ri-chat-3-line text-6xl mb-4"></i>
                  <p className="text-lg whitespace-nowrap">채팅방을 선택하세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}