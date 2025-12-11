import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { Empty, Spin, message } from 'antd';
import { 
  callFetchAllNotifications, 
  callMarkAllNotificationsAsViewed,
  callMarkNotificationAsRead
} from '@/config/api';
import styles from '@/styles/notificationDropdown.module.scss';
import type { Notification as AppNotification } from '@/types/backend';

// WebSocket endpoint (SockJS)
const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL ?? '';
const WS_URL = (import.meta as any).env?.VITE_WS_URL || `${backendUrl}/ws`;

interface NotificationDropdownProps {
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ 
  onClose, 
  onUnreadCountChange 
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Lấy token từ localStorage
  const getToken = () => {
    return localStorage.getItem('access_token');
  };

  // THAY ĐỔI: Fetch TẤT CẢ thông báo (bao gồm cả đã đọc trong 7 ngày)
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await callFetchAllNotifications();
      
      if (res && res.data) {
        const list = res.data as unknown as AppNotification[];
        setNotifications(list);
        
        // Đếm số thông báo CHƯA XEM để hiển thị badge
        const unviewedCount = list.filter(n => !n.isViewed).length;
        onUnreadCountChange(unviewedCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      message.error('Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  // Connect WebSocket
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const socket = new SockJS(WS_URL);
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('✅ Connected to WebSocket');
      
      // Subscribe to notifications
      client.subscribe('/user/topic/notifications', (msg) => {
        const notification = JSON.parse(msg.body) as AppNotification;
        console.log('📬 New notification:', notification);

        setNotifications((prev) => {
          const next = [notification, ...prev];
          // Đếm số thông báo CHƯA XEM
          const unviewedCount = next.filter(n => !n.isViewed).length;
          onUnreadCountChange(unviewedCount);
          return next;
        });
        
        // Hiển thị Ant Design notification
        message.info({
          content: notification.title,
          duration: 3,
        });
        
        // Hiển thị browser notification
        if (window.Notification && window.Notification.permission === 'granted') {
          new window.Notification(notification.title, {
            body: notification.description,
          });
        }
      });
    };

    client.onStompError = (frame) => {
      console.error('❌ STOMP error:', frame);
    };

    client.activate();
    setStompClient(client);

    // Request browser notification permission
    if (window.Notification && window.Notification.permission === 'default') {
      window.Notification.requestPermission();
    }

    // Fetch initial notifications
    fetchNotifications();

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleCloseDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notifications.length]);

  // THAY ĐỔI: Close dropdown và đánh dấu tất cả là đã XEM (viewed)
  const handleCloseDropdown = async () => {
    // Chỉ call API nếu có thông báo chưa xem
    const hasUnviewed = notifications.some(n => !n.isViewed);
    
    if (hasUnviewed) {
      try {
        await callMarkAllNotificationsAsViewed();
        onUnreadCountChange(0); // Reset badge về 0
        
        // Update local state: đánh dấu tất cả là đã xem
        setNotifications((prev) => 
          prev.map(n => ({ ...n, isViewed: true }))
        );
      } catch (error) {
        console.error('Error marking notifications as viewed:', error);
      }
    }
    onClose();
  };

  // THAY ĐỔI: Handle notification click - chỉ đánh dấu là đã ĐỌC (read)
  const handleNotificationClick = async (notification: AppNotification) => {
    try {
      // Chỉ mark as read nếu chưa đọc
      if (!notification.isRead) {
        await callMarkNotificationAsRead(notification.id);

        // Update local state: đánh dấu là đã đọc
        setNotifications((prev) =>
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
      }

      // Navigate to URL
      if (notification.navigationUrl) {
        navigate(notification.navigationUrl);
      }
      
      // Close dropdown
      onClose();
    } catch (error) {
      console.error('Error handling notification click:', error);
      message.error('Có lỗi xảy ra');
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return `${Math.floor(diffInSeconds / 604800)} tuần trước`;
  };

  // Get notification icon and color based on type
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'JOB_APPROVED':
        return { icon: '✅', color: '#52c41a', bg: '#f6ffed' };
      case 'JOB_REJECTED':
        return { icon: '❌', color: '#ff4d4f', bg: '#fff1f0' };
      case 'JOB_PENDING_APPROVAL':
        return { icon: '⏳', color: '#faad14', bg: '#fffbe6' };
      case 'RESUME_APPROVED':
        return { icon: '🎉', color: '#52c41a', bg: '#f6ffed' };
      case 'RESUME_REJECTED':
        return { icon: '😞', color: '#ff4d4f', bg: '#fff1f0' };
      case 'RESUME_PENDING':
        return { icon: '📄', color: '#1890ff', bg: '#e6f7ff' };
      default:
        return { icon: '🔔', color: '#8c8c8c', bg: '#fafafa' };
    }
  };

  // Đếm số thông báo chưa xem để hiển thị header
  const unviewedCount = notifications.filter(n => !n.isViewed).length;

  return (
    <div className={styles.notificationDropdown} ref={dropdownRef}>
      <div className={styles.notificationHeader}>
        <h3>Thông báo</h3>
        {unviewedCount > 0 && (
          <span className={styles.unreadCount}>{unviewedCount} mới</span>
        )}
      </div>

      <div className={styles.notificationList}>
        {loading ? (
          <div className={styles.notificationLoading}>
            <Spin size="large" tip="Đang tải..." />
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.noNotifications}>
            <Empty 
              description="Bạn chưa có thông báo nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          notifications.map((notification) => {
            const style = getNotificationStyle(notification.type);
            return (
              <div
                key={notification.id}
                className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div 
                  className={styles.notificationIcon}
                  // style={{ 
                  //   color: style.color,
                  //   backgroundColor: style.bg
                  // }}
                >
                  {style.icon}
                </div>
                <div className={styles.notificationContent}>
                  <h4>{notification.title}</h4>
                  <p>{notification.description}</p>
                  <span className={styles.notificationTime}>
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                </div>
                {!notification.isRead && (
                  <div className={styles.unreadDot} />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;