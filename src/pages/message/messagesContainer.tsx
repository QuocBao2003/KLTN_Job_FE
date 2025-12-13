import React from 'react';
import { useAppSelector } from '@/redux/hooks';
import MessagesPage from './MessagesPage'; // User version
import MessagesPageHR from './MessagesPageHR'; // HR version

/**
 * Container component để phân biệt hiển thị UI cho User hoặc HR
 */
const MessagesContainer = () => {
    const user = useAppSelector((state: any) => state.account.user);
    
    
    const isHR = user?.role?.name === 'HR' || user?.role?.name === 'USER';
    
    console.log('🔍 MessagesContainer - User role:', user?.role?.name);
    console.log('🔍 MessagesContainer - isHR:', isHR);
    
    
    return isHR ? <MessagesPageHR /> : <MessagesPage />;
};

export default MessagesContainer;