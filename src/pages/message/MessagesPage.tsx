import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Row, Col, Typography, Avatar, Input, Button, message as antMessage, Spin, Badge } from 'antd';
import { SendOutlined, SmileOutlined, HeartFilled } from '@ant-design/icons';
import { IMessageRoom, IMessageResponse } from '@/types/backend';
import { 
    getMyRooms, 
    getMessagesInRoom, 
    markRoomAsRead 
} from '@/config/api';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import SockJS from 'sockjs-client';
import { Client, IFrame } from '@stomp/stompjs';
import messageJobApplyStyles from '@/styles/messageJobApply.module.scss';

const { Text } = Typography;

const MessagesPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const user = useAppSelector((state) => state.account.user);
    const [rooms, setRooms] = useState<IMessageRoom[]>([]);
    const [currentRoom, setCurrentRoom] = useState<IMessageRoom | null>(null);
    const [loading, setLoading] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [chatMessages, setChatMessages] = useState<IMessageResponse[]>([]);
    const [connectingWs, setConnectingWs] = useState(false);
    
    const stompClientRef = useRef<Client | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isLoadingRoomRef = useRef<boolean>(false);
    const currentRoomIdRef = useRef<string | null>(null);
    const previousMessagesLengthRef = useRef<number>(0);
    const shouldScrollRef = useRef<boolean>(false);

    const roomIdParam = searchParams.get('roomId');

    useEffect(() => {
        fetchRooms();
        return () => {
            disconnectWebSocket();
            if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!roomIdParam || 
            isLoadingRoomRef.current || 
            currentRoomIdRef.current === roomIdParam ||
            rooms.length === 0) {
            return;
        }

        const room = rooms.find(r => r.id === roomIdParam);
        if (room) {
            handleSelectRoom(room);
        }
    }, [roomIdParam]);

    useEffect(() => {
        // Chỉ scroll khi có tin nhắn mới được thêm vào (length tăng), không scroll khi load lại
        if (chatMessages.length > previousMessagesLengthRef.current && messagesEndRef.current && shouldScrollRef.current) {
            // Sử dụng setTimeout để đảm bảo DOM đã render
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
                shouldScrollRef.current = false; // Reset flag sau khi scroll
            }, 50);
        }
        previousMessagesLengthRef.current = chatMessages.length;
    }, [chatMessages.length]);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const res = await getMyRooms();
            if (res && res.data) {
                setRooms(res.data);
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
            antMessage.error('Không thể tải danh sách cuộc trò chuyện');
        }
        setLoading(false);
    };

    const handleSelectRoom = useCallback(async (room: IMessageRoom) => {
        if (isLoadingRoomRef.current || currentRoomIdRef.current === room.id) {
            return;
        }

        isLoadingRoomRef.current = true;

        try {
            disconnectWebSocket();
            
            setCurrentRoom(room);
            currentRoomIdRef.current = room.id;
            
            if (roomIdParam !== room.id) {
                setSearchParams({ roomId: room.id });
            }
            
            setLoading(true);
            
            await markRoomAsRead(room.id);
            
            const messagesRes = await getMessagesInRoom(room.id);
            const messages = messagesRes?.data || [];
            shouldScrollRef.current = false; // Không scroll khi load lại tin nhắn
            previousMessagesLengthRef.current = 0; // Reset để không scroll khi set messages
            setChatMessages(messages);

            // ✅ Update unread count - USER xem unreadCount
            setRooms(prev => prev.map(r => 
                r.id === room.id ? { ...r, unreadCount: 0 } : r
            ));

            connectWebSocket(room.id);
            
        } catch (error: any) {
            console.error('Error loading room:', error);
            antMessage.error(error?.response?.data?.message || 'Không thể tải phòng chat');
            currentRoomIdRef.current = null;
        } finally {
            setLoading(false);
            isLoadingRoomRef.current = false;
        }
    }, [roomIdParam]);

    const connectWebSocket = (roomId: string) => {
        if (stompClientRef.current?.connected) {
            console.log('WebSocket already connected');
            return;
        }

        setConnectingWs(true);

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                antMessage.error('Không tìm thấy token đăng nhập');
                setConnectingWs(false);
                return;
            }

            const backendUrl = import.meta.env.VITE_BACKEND_URL ?? '';
            const wsUrl = backendUrl.replace(/^http/, 'ws') + '/ws';
            const socket = new SockJS(wsUrl);
            
            const stompClient = new Client({
                webSocketFactory: () => socket,
                debug: (str) => {
                    console.log('STOMP: ', str);
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
                connectHeaders: {
                    Authorization: `Bearer ${token}`,
                },
                onConnect: (frame: IFrame) => {
                    console.log('✅ WebSocket Connected');
                    
                    if (connectionTimeoutRef.current) {
                        clearTimeout(connectionTimeoutRef.current);
                        connectionTimeoutRef.current = null;
                    }
                    
                    setConnectingWs(false);

                    const subscription = stompClient.subscribe(`/topic/room/${roomId}`, (message) => {
                        try {
                            const newMessage: IMessageResponse = JSON.parse(message.body);
                            console.log('📩 Received message:', newMessage);
                            
                            // Chỉ scroll khi nhận tin nhắn từ người khác, không scroll khi mình gửi
                            if (user && newMessage.senderId !== Number(user.id)) {
                                shouldScrollRef.current = true;
                                markRoomAsRead(roomId);
                            } else {
                                shouldScrollRef.current = false; // Không scroll khi là tin nhắn của mình
                            }
                            
                            setChatMessages(prev => [...prev, newMessage]);
                            
                            setRooms(prev => prev.map(r => 
                                r.id === roomId ? {
                                    ...r,
                                    lastMessage: newMessage.content,
                                    lastMessageTime: newMessage.dateSent,
                                    lastSenderId: newMessage.senderId
                                } : r
                            ));
                        } catch (error) {
                            console.error('Error parsing message:', error);
                        }
                    });

                    console.log('✅ Subscribed to:', `/topic/room/${roomId}`);
                    antMessage.success('Đã kết nối chat');
                },
                onStompError: (frame: IFrame) => {
                    console.error('❌ STOMP error:', frame);
                    setConnectingWs(false);
                    antMessage.error(`Lỗi kết nối: ${frame.headers?.['message'] || 'Unknown error'}`);
                },
                onWebSocketClose: (event: CloseEvent) => {
                    console.log('🔌 WebSocket closed');
                    setConnectingWs(false);
                },
            });

            stompClient.activate();
            stompClientRef.current = stompClient;
            
            connectionTimeoutRef.current = setTimeout(() => {
                if (stompClientRef.current && !stompClientRef.current.connected) {
                    console.error('❌ Connection timeout');
                    setConnectingWs(false);
                    antMessage.error('Kết nối WebSocket timeout');
                    
                    try {
                        if (stompClientRef.current) {
                            stompClientRef.current.deactivate();
                        }
                    } catch (error) {
                        console.error('Error deactivating on timeout:', error);
                    }
                }
            }, 10000);

        } catch (error: any) {
            console.error('❌ WebSocket connection error:', error);
            setConnectingWs(false);
            antMessage.error(`Không thể kết nối WebSocket: ${error?.message || 'Unknown error'}`);
        }
    };

    const disconnectWebSocket = () => {
        if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
        }
        
        if (stompClientRef.current) {
            stompClientRef.current.deactivate();
            stompClientRef.current = null;
            console.log('WebSocket disconnected');
        }
    };

    const handleSendMessage = async (e?: React.MouseEvent | React.KeyboardEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        if (!chatMessage.trim()) return;
        if (!currentRoom) {
            antMessage.warning('Chưa chọn cuộc trò chuyện');
            return;
        }
        if (!stompClientRef.current?.connected) {
            antMessage.warning('Chưa kết nối WebSocket');
            return;
        }

        if (!user?.id) {
            antMessage.error('Không tìm thấy thông tin người dùng');
            return;
        }

        try {
            const messageRequest = {
                content: chatMessage.trim(),
                messageType: 'TEXT',
                messageRoomId: currentRoom.id
            };

            stompClientRef.current.publish({
                destination: '/app/chat.sendMessage',
                body: JSON.stringify(messageRequest)
            });

            setChatMessage('');
            // Không scroll khi mình gửi tin nhắn, chỉ scroll khi nhận tin nhắn từ người khác

        } catch (error) {
            console.error('Error sending message:', error);
            antMessage.error('Không thể gửi tin nhắn');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            handleSendMessage(e);
        }
    };

    // ✅ Sử dụng các field mới từ DTO
    const getCompanyInfo = (room: IMessageRoom) => {
        return {
            name: room.companyName || room.job?.company?.name || 'CÔNG TY',
            logo: room.job?.company?.logo,
            jobName: room.jobName || room.job?.name || 'Công việc'
        };
    };

    return (
        <div className={messageJobApplyStyles['message-jobapply-container']}>
            <Row gutter={0} style={{ height: 'calc(100vh - 64px)', maxHeight: 'calc(100vh - 64px)' }}>
                {/* Left Side - Chat Interface */}
                <Col xs={24} lg={12} className={messageJobApplyStyles['chat-section']}>
                    <div className={messageJobApplyStyles['chat-wrapper']}>
                        <div className={messageJobApplyStyles['top-header']}>
                            <Text className={messageJobApplyStyles['header-text']}>
                                New way to follow your chance.{' '}
                                <span className={messageJobApplyStyles['highlight-text']}>
                                    More engage, more success
                                </span>
                            </Text>
                            {connectingWs && (
                                <Text style={{ color: '#1890ff', marginLeft: '10px' }}>
                                    <Spin size="small" /> Đang kết nối...
                                </Text>
                            )}
                        </div>

                        {currentRoom && (
                            <div className={messageJobApplyStyles['contact-info']}>
                                <Avatar
                                    src={getCompanyInfo(currentRoom).logo}
                                    size={48}
                                    className={messageJobApplyStyles['contact-avatar']}
                                    style={{
                                        backgroundColor: getCompanyInfo(currentRoom).logo ? 'transparent' : '#1890ff',
                                    }}
                                >
                                    {!getCompanyInfo(currentRoom).logo && getCompanyInfo(currentRoom).name.charAt(0)}
                                </Avatar>
                                <div className={messageJobApplyStyles['contact-details']}>
                                    <Text strong className={messageJobApplyStyles['contact-name']}>
                                        Nhân Sự
                                    </Text>
                                    <Text className={messageJobApplyStyles['contact-company']}>
                                        {getCompanyInfo(currentRoom).name}
                                    </Text>
                                </div>
                            </div>
                        )}

                        <div className={messageJobApplyStyles['chat-content']}>
                            {!currentRoom ? (
                                <div className={messageJobApplyStyles['welcome-message']}>
                                    <HeartFilled style={{ fontSize: 48, color: '#1890ff' }} />
                                    <Text>Chọn một công việc để bắt đầu trò chuyện</Text>
                                </div>
                            ) : chatMessages.length === 0 ? (
                                <div className={messageJobApplyStyles['welcome-message']}>
                                    <Avatar src={getCompanyInfo(currentRoom).logo} size={48}>
                                        {!getCompanyInfo(currentRoom).logo && getCompanyInfo(currentRoom).name.charAt(0)}
                                    </Avatar>
                                    <Text strong>Nhân Sự</Text>
                                    <Text>{getCompanyInfo(currentRoom).name}</Text>
                                    <Text>
                                        Hãy bắt đầu cuộc trò chuyện <HeartFilled style={{ color: '#ff4d4f' }} />
                                    </Text>
                                </div>
                            ) : (
                                <div className={messageJobApplyStyles['messages-list']}>
                                    {chatMessages.map((msg, index) => {
                                        const isCurrentUser = user && user.id && Number(user.id) === msg.senderId;
                                        return (
                                            <div
                                                key={msg.id || index}
                                                className={`${messageJobApplyStyles['message-item']} ${
                                                    isCurrentUser
                                                        ? messageJobApplyStyles['message-user']
                                                        : messageJobApplyStyles['message-assistant']
                                                }`}
                                            >
                                                {!isCurrentUser && (
                                                    <Avatar 
                                                        size={32} 
                                                        src={msg.senderAvatarUrl || getCompanyInfo(currentRoom).logo}
                                                    >
                                                        {msg.senderUsername?.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                )}
                                                <div className={messageJobApplyStyles['message-content']}>
                                                    <Text style={{ fontSize: 12, color: '#999' }}>
                                                        {new Date(msg.dateSent).toLocaleTimeString('vi-VN', { 
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        })}
                                                    </Text>
                                                    <div>{msg.content}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {currentRoom && (
                            <div className={messageJobApplyStyles['input-wrapper']}>
                                <SmileOutlined className={messageJobApplyStyles['input-icon']} />
                                <Input
                                    variant="borderless"
                                    placeholder="Nhập tin nhắn"
                                    value={chatMessage}
                                    onChange={(e) => setChatMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className={messageJobApplyStyles['message-input']}
                                    disabled={!stompClientRef.current?.connected}
                                />
                                <Button
                                    htmlType="button"
                                    type="primary"
                                    icon={<SendOutlined />}
                                    onClick={handleSendMessage}
                                    disabled={!chatMessage.trim() || !stompClientRef.current?.connected}
                                    className={messageJobApplyStyles['send-button']}
                                    shape="circle"
                                />
                            </div>
                        )}
                    </div>
                </Col>

                {/* Right Side - Applied Jobs List */}
                <Col xs={24} lg={12} className={messageJobApplyStyles['jobs-section']}>
                    <div className={messageJobApplyStyles['jobs-wrapper']}>
                        <Text className={messageJobApplyStyles['jobs-title']}>
                            TIN TUYỂN DỤNG ĐÃ ỨNG TUYỂN
                        </Text>

                        <Spin spinning={loading}>
                            {rooms.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {rooms.map((room) => {
                                        const companyInfo = getCompanyInfo(room);
                                        const isSelected = currentRoom?.id === room.id;
                                        const unreadCount = room.unreadCount || 0;
                                        
                                        return (
                                            <div 
                                                key={room.id}
                                                className={messageJobApplyStyles['job-item']}
                                                onClick={() => handleSelectRoom(room)}
                                                style={{
                                                    cursor: 'pointer',
                                                    backgroundColor: isSelected ? '#e6f7ff' : 'white',
                                                    border: isSelected ? '2px solid #1890ff' : '1px solid #f0f0f0',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    position: 'relative'
                                                }}
                                            >
                                                {unreadCount > 0 && (
                                                    <Badge 
                                                        count={unreadCount} 
                                                        style={{ 
                                                            position: 'absolute', 
                                                            top: '8px', 
                                                            right: '8px' 
                                                        }} 
                                                    />
                                                )}
                                                <Avatar src={companyInfo.logo} size={56}>
                                                    {!companyInfo.logo && companyInfo.name.charAt(0)}
                                                </Avatar>
                                                <div className={messageJobApplyStyles['job-info']}>
                                                    <Text className={messageJobApplyStyles['job-name']} strong>
                                                        {companyInfo.jobName.length > 30 
                                                            ? `${companyInfo.jobName.substring(0, 30)}...` 
                                                            : companyInfo.jobName}
                                                    </Text>
                                                    <Text className={messageJobApplyStyles['job-company']}>
                                                        {companyInfo.name.length > 30
                                                            ? `${companyInfo.name.substring(0, 30)}...`
                                                            : companyInfo.name}
                                                    </Text>
                                                    {room.lastMessage && (
                                                        <Text 
                                                            type="secondary" 
                                                            style={{ 
                                                                fontSize: 12,
                                                                fontWeight: unreadCount > 0 ? 'bold' : 'normal'
                                                            }}
                                                        >
                                                            {room.lastMessage.length > 40 
                                                                ? `${room.lastMessage.substring(0, 40)}...` 
                                                                : room.lastMessage}
                                                        </Text>
                                                    )}
                                                    {room.lastMessageTime && (
                                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                                            {new Date(room.lastMessageTime).toLocaleString('vi-VN', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </Text>
                                                    )}
                                                </div>
                                                <Button
                                                    type={isSelected ? 'primary' : 'default'}
                                                    className={messageJobApplyStyles['message-button']}
                                                    size="small"
                                                >
                                                    {isSelected ? 'Đang chat' : 'Xem'}
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={messageJobApplyStyles['no-jobs']}>
                                    <Text>Chưa có cuộc trò chuyện nào</Text>
                                </div>
                            )}
                        </Spin>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default MessagesPage;