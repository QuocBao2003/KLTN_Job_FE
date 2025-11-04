import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Row, Col, Typography, Avatar, Input, Button, message as antMessage, Spin } from 'antd';
import { SendOutlined, SmileOutlined, HeartFilled } from '@ant-design/icons';
import { IResume, IMessageRoom, IMessageResponse } from '@/types/backend';
import { callFetchResumeByUser, createRoomMessage, getMessagesInRoom } from '@/config/api';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import SockJS from 'sockjs-client';
import { Stomp, Client, IFrame } from '@stomp/stompjs';
import messageJobApplyStyles from '@/styles/messageJobApply.module.scss';

const { Text } = Typography;

const MessageJobApply = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const user = useAppSelector((state) => state.account.user);
    const [listCV, setListCV] = useState<IResume[]>([]);
    const [loading, setLoading] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [chatMessages, setChatMessages] = useState<IMessageResponse[]>([]);
    const [currentRoom, setCurrentRoom] = useState<IMessageRoom | null>(null);
    const [connectingWs, setConnectingWs] = useState(false);
    
    const stompClientRef = useRef<Client | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const roomIdParam = searchParams.get('roomId');
    const jobIdParam = searchParams.get('jobId');

    useEffect(() => {
        fetchAppliedJobs();
        return () => {
            disconnectWebSocket();
            // Clear timeout khi component unmount
            if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (roomIdParam) {
            initializeChatRoom();
        }
    }, [roomIdParam]);

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchAppliedJobs = async () => {
        setLoading(true);
        try {
            const res = await callFetchResumeByUser();
            if (res && res.data) {
                const list: IResume[] = Array.isArray(res.data.result) ? res.data.result : [];
                setListCV(list);
            }
        } catch (error) {
            console.error('Error fetching applied jobs:', error);
            antMessage.error('Không thể tải danh sách việc làm đã ứng tuyển');
            setListCV([]);
        }
        setLoading(false);
    };

    const initializeChatRoom = async () => {
        if (!roomIdParam) return;

        try {
            setLoading(true);
            
            // Lấy lịch sử tin nhắn
            const messagesRes = await getMessagesInRoom(roomIdParam);
            const messages = messagesRes?.data || [];
            setChatMessages(messages);

            // Kết nối WebSocket
            connectWebSocket(roomIdParam);
            
        } catch (error: any) {
            console.error('Error initializing chat room:', error);
            antMessage.error(error?.response?.data?.message || 'Không thể tải phòng chat');
        } finally {
            setLoading(false);
        }
    };

    const connectWebSocket = (roomId: string) => {
        if (stompClientRef.current?.connected) {
            console.log('WebSocket already connected');
            return;
        }

        // Disconnect existing connection if any
        if (stompClientRef.current) {
            try {
                if (stompClientRef.current.connected) {
                    stompClientRef.current.deactivate();
                }
            } catch (error) {
                console.error('Error deactivating old client:', error);
            } finally {
                stompClientRef.current = null;
            }
        }

        setConnectingWs(true);

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                antMessage.error('Không tìm thấy token đăng nhập');
                setConnectingWs(false);
                return;
            }

            const wsUrl = `${import.meta.env.VITE_BACKEND_URL}/ws`;
            console.log('🔌 Connecting to WebSocket:', wsUrl);
            console.log('🔌 Token (first 50 chars):', token.substring(0, 50) + '...');
            
            const socket = new SockJS(wsUrl);
            
            // Thêm event listeners cho socket để debug
            socket.onopen = () => {
                console.log('✅ SockJS Socket Opened');
            };
            
            socket.onclose = (event) => {
                console.log('🔌 SockJS Socket Closed:', event.code, event.reason);
            };
            
            socket.onerror = (error) => {
                console.error('❌ SockJS Socket Error:', error);
            };
            
            // ✅ Sử dụng Client class (phiên bản @stomp/stompjs 7.x)
            const stompClient = new Client({
                webSocketFactory: () => socket,
                debug: (str) => {
                    // Log tất cả STOMP messages để debug
                    if (str.includes('>>>') || str.includes('<<<')) {
                        console.log('STOMP Frame: ', str);
                    } else {
                        console.log('STOMP: ', str);
                    }
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
                connectHeaders: {
                    Authorization: `Bearer ${token}`,
                },
                onConnect: (frame: IFrame) => {
                    console.log('✅ WebSocket Connected:', frame);
                    console.log('✅ Connection headers:', frame.headers);
                    console.log('✅ CONNECTED frame received!');
                    
                    // Clear timeout nếu connection thành công
                    if (connectionTimeoutRef.current) {
                        clearTimeout(connectionTimeoutRef.current);
                        connectionTimeoutRef.current = null;
                    }
                    
                    setConnectingWs(false);

                    // ✅ Subscribe để nhận tin nhắn (sử dụng stompClient từ closure)
                    const subscription = stompClient.subscribe(`/topic/room/${roomId}`, (message) => {
                        try {
                            const newMessage: IMessageResponse = JSON.parse(message.body);
                            console.log('📩 Received message:', newMessage);
                            setChatMessages(prev => [...prev, newMessage]);
                        } catch (error) {
                            console.error('Error parsing message:', error);
                        }
                    });

                    console.log('✅ Subscribed to:', `/topic/room/${roomId}`, subscription);
                    antMessage.success('Đã kết nối chat');
                },
                onStompError: (frame: IFrame) => {
                    console.error('❌ STOMP error:', frame);
                    console.error('❌ Error command:', frame.command);
                    console.error('❌ Error headers:', JSON.stringify(frame.headers, null, 2));
                    console.error('❌ Error body:', frame.body);
                    
                    // Clear timeout
                    if (connectionTimeoutRef.current) {
                        clearTimeout(connectionTimeoutRef.current);
                        connectionTimeoutRef.current = null;
                    }
                    
                    setConnectingWs(false);
                    
                    const errorMsg = frame.headers?.['message'] || frame.body || 'Lỗi kết nối WebSocket';
                    antMessage.error(`Lỗi kết nối: ${errorMsg}`);
                },
                onWebSocketError: (error: Event) => {
                    console.error('❌ WebSocket error:', error);
                    console.error('❌ Error type:', error.type);
                    console.error('❌ Error target:', error.target);
                    setConnectingWs(false);
                    antMessage.error('Lỗi kết nối WebSocket. Vui lòng thử lại.');
                },
                onWebSocketClose: (event: CloseEvent) => {
                    console.log('🔌 WebSocket closed:', event);
                    console.log('🔌 Close code:', event.code);
                    console.log('🔌 Close reason:', event.reason);
                    console.log('🔌 Was clean:', event.wasClean);
                    
                    // Clear timeout
                    if (connectionTimeoutRef.current) {
                        clearTimeout(connectionTimeoutRef.current);
                        connectionTimeoutRef.current = null;
                    }
                    
                    setConnectingWs(false);
                    
                    // Nếu đóng không clean (code != 1000), có thể là lỗi
                    if (!event.wasClean && event.code !== 1000) {
                        antMessage.warning('Kết nối WebSocket bị đóng bất thường');
                    } else if (event.wasClean && event.code === 1000) {
                        console.log('✅ WebSocket closed normally (clean close)');
                    }
                },
            });

            // ✅ Kích hoạt kết nối
            stompClient.activate();
            stompClientRef.current = stompClient;
            
            // ⚠️ Thêm timeout: Nếu không nhận được CONNECTED trong 10 giây, coi như lỗi
            connectionTimeoutRef.current = setTimeout(() => {
                if (stompClientRef.current && !stompClientRef.current.connected) {
                    console.error('❌ Connection timeout: Không nhận được CONNECTED frame trong 10 giây');
                    console.error('❌ Có thể backend không xử lý CONNECT frame hoặc từ chối kết nối');
                    setConnectingWs(false);
                    antMessage.error('Kết nối WebSocket timeout. Vui lòng kiểm tra backend hoặc thử lại.');
                    
                    // Cố gắng disconnect
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
        // Clear timeout nếu có
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

    const handleSendMessage = async () => {
        if (!chatMessage.trim()) return;
        if (!roomIdParam) {
            antMessage.warning('Chưa có phòng chat');
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
                messageRoomId: roomIdParam // ✅ Đảm bảo đây là UUID string
            };

            console.log('Sending message:', messageRequest);

            // Gửi qua WebSocket
            stompClientRef.current.publish({
                destination: '/app/chat.sendMessage',
                body: JSON.stringify(messageRequest)
            });

            setChatMessage('');

        } catch (error) {
            console.error('Error sending message:', error);
            antMessage.error('Không thể gửi tin nhắn');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const handleCreateRoom = async () => {
        if (!jobIdParam) {
            antMessage.warning('Không tìm thấy thông tin công việc');
            return;
        }

        try {
            antMessage.loading({ content: 'Đang tạo phòng chat...', key: 'createRoom' });
            
            // ✅ Gọi API đúng format
            const res = await createRoomMessage(jobIdParam);
            
            if (res && res.data) {
                const room = res.data;
                setCurrentRoom(room);
                antMessage.success({ content: 'Đã tạo phòng chat!', key: 'createRoom' });
                
                // ✅ Cập nhật URL với roomId
                setSearchParams({
                    roomId: room.id,
                    jobId: jobIdParam
                });
                
                // Khởi tạo chat room
                await initializeChatRoom();
            }
        } catch (error: any) {
            console.error('Error creating room:', error);
            antMessage.error({ 
                content: error?.response?.data?.message || 'Không thể tạo phòng chat', 
                key: 'createRoom' 
            });
        }
    };


    const selectedResume = useMemo(() => {
        if (!listCV.length) return null;
        
        if (jobIdParam) {
            const found = listCV.find((resume) => {
                const job = typeof resume.jobId === 'object' ? resume.jobId : null;
                const jobFull = (resume as any)?.job || null;
                const jobId = job?.id || jobFull?.id || null;
                return String(jobId) === jobIdParam;
            });
            return found || listCV[0];
        }
        
        return listCV[0];
    }, [listCV, jobIdParam]);

    const company = selectedResume && typeof selectedResume.companyId === 'object' ? selectedResume.companyId : null;
    const job = selectedResume && typeof selectedResume.jobId === 'object' ? selectedResume.jobId : null;
    const jobFull = (selectedResume as any)?.job || null;
    
    const companyName = company?.name || (selectedResume as any)?.companyName || 'CÔNG TY';
    const companyLogo = company?.logo || (selectedResume as any)?.companyLogo;
    const jobName = job?.name || jobFull?.name || 'Công việc';
    const companyLogoUrl = companyLogo
        ? `${import.meta.env.VITE_BACKEND_URL}/storage/company/${companyLogo}`
        : null;

    return (
        <div className={messageJobApplyStyles['message-jobapply-container']}>
            <Row gutter={0} style={{ height: '100vh' }}>
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

                        <div className={messageJobApplyStyles['contact-info']}>
                            <Avatar
                                src={companyLogoUrl}
                                size={48}
                                className={messageJobApplyStyles['contact-avatar']}
                                style={{
                                    backgroundColor: companyLogoUrl ? 'transparent' : '#1890ff',
                                }}
                            >
                                {!companyLogoUrl && companyName.charAt(0)}
                            </Avatar>
                            <div className={messageJobApplyStyles['contact-details']}>
                                <Text strong className={messageJobApplyStyles['contact-name']}>
                                    Nhân Sự
                                </Text>
                                <Text className={messageJobApplyStyles['contact-company']}>
                                    {companyName}
                                </Text>
                            </div>
                        </div>

                        <div className={messageJobApplyStyles['chat-content']}>
                            {!roomIdParam ? (
                                <div className={messageJobApplyStyles['welcome-message']}>
                                    <Avatar src={companyLogoUrl} size={48}>
                                        {!companyLogoUrl && companyName.charAt(0)}
                                    </Avatar>
                                    <Text strong>Nhân Sự</Text>
                                    <Text>{companyName}</Text>
                                    <Button type="primary" onClick={handleCreateRoom} loading={loading}>
                                        Bắt đầu trò chuyện
                                    </Button>
                                </div>
                            ) : chatMessages.length === 0 ? (
                                <div className={messageJobApplyStyles['welcome-message']}>
                                    <Avatar src={companyLogoUrl} size={48}>
                                        {!companyLogoUrl && companyName.charAt(0)}
                                    </Avatar>
                                    <Text strong>Nhân Sự</Text>
                                    <Text>{companyName}</Text>
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
                                                        src={msg.senderAvatarUrl || companyLogoUrl}
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

                        {roomIdParam && (
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
                            {selectedResume ? (
                                <div className={messageJobApplyStyles['job-item']}>
                                    <Avatar src={companyLogoUrl} size={56}>
                                        {!companyLogoUrl && companyName.charAt(0)}
                                    </Avatar>
                                    <div className={messageJobApplyStyles['job-info']}>
                                        <Text className={messageJobApplyStyles['job-name']}>
                                            {jobName.length > 20 ? `${jobName.substring(0, 20)}...` : jobName}
                                        </Text>
                                        <Text className={messageJobApplyStyles['job-company']}>
                                            {companyName.length > 20
                                                ? `${companyName.substring(0, 20)}...`
                                                : companyName}
                                        </Text>
                                    </div>
                                    {roomIdParam ? (
                                        <Button
                                            type={stompClientRef.current?.connected ? 'primary' : 'default'}
                                            className={messageJobApplyStyles['message-button']}
                                            disabled
                                        >
                                            {stompClientRef.current?.connected ? 'Đang chat' : 'Kết nối...'}
                                        </Button>
                                    ) : (
                                        <Button
                                            type="primary"
                                            className={messageJobApplyStyles['message-button']}
                                            onClick={handleCreateRoom}
                                            loading={loading}
                                        >
                                            Nhắn tin
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className={messageJobApplyStyles['no-jobs']}>
                                    <Text>Chưa có việc làm nào đã ứng tuyển</Text>
                                </div>
                            )}
                        </Spin>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default MessageJobApply;