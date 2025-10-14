import { useState, useRef, useEffect } from "react";
import { Modal, Input, Button, Typography, Avatar, Spin } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'config/axios-customize';
import { callAskAI } from '../../../config/api';
import styles from '@/styles/ai-chat.module.scss';
import images from '@/img/images.png';
const {Text} = Typography;

interface IAIChatProps {
    open : boolean;
    onClose : (value : boolean) => void;
}

interface IChatMessage {
    role : 'user' | 'assistant';
    content : string;
}

const AIChatModal = (props : IAIChatProps) => {
    const {open, onClose} = props;
    const [loading, setLoading] = useState<boolean>(false);
    const [messages, setMessages] = useState<IChatMessage[]>([]);
    const [inputValue, setInputValue] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () =>{
        messagesEndRef.current?.scrollIntoView({behavior : 'smooth'});
    };

    useEffect(()=>{
        scrollToBottom();;
    },[messages]);
    

    const handleSendMessage = async () =>{
        if(!inputValue.trim()) return;

        const userMessage = {role : 'user' , content : inputValue} as IChatMessage;
        setMessages(prev => [...prev,userMessage]);
        setInputValue('');
        setLoading(true);
        try{
            const res = await callAskAI(inputValue);
            if(res){
                const content = res.toString();
                const assistantMessage = {role : 'assistant', content } as IChatMessage;
                setMessages(prev => [...prev,assistantMessage]);
            }
        }catch(error){
            console.log("Error calling AI Chat",error);
            const errorMessage = {role : 'assistant', content : 'An error occurred while processing your request. Please try again later.'} as IChatMessage;
            setMessages(prev => [...prev,errorMessage]);
        }finally{
            setLoading(false);
        }
    };

    const handleKeyPress = (e : React.KeyboardEvent<HTMLInputElement>) =>{
        if(e.key === 'Enter'){
            handleSendMessage();
        }
    };

    return(
        <Modal
            title={
                <div style={{display : "flex", alignItems : 'center'}}>
                    
                    <span>Chat với AI</span>
                </div>
                }
                open={open}
                onCancel={() => onClose(false)}
                footer={null}
                width={400}
                style={{
                    position: 'fixed',
                    bottom: 0, 
                    right: 0,
                    margin: 0,
                    padding: 0,
                    
                }}
                mask={false}
                closable={true}>
                    
                <div className={styles['chat-container']}>
                    <div className={styles['messages-container']}>
                        {messages.length === 0 ?(
                            <div className={styles['welcome-message']}>
                                <RobotOutlined style={{fontSize : '24px', marginBottom : '8px'}}/>
                                <Text>Xin chào! Tôi có thể giúp gì cho bạn?</Text>
                            </div>
                        ) : (
                            messages.map((msg,index) => (
                                <div 
                                key={index}
                                className={`${styles['message']} ${msg.role ==='user' ? styles['user-massage'] : styles['assistant-massage']}`}  >
                                    {msg.role === 'user' ? (
                                        <Avatar icon={<UserOutlined/>}/>
                                    ) : (""
                                        
                                    )}
                                    <div className={styles['message-content']}>
                                        <Text>{msg.content}</Text>
                                    </div>
                                </div>
                            ))
                        )}
                        {loading && (
                            <div className={styles['loading-message']}>
                                <Spin size="small"/>
                                <Text type="secondary" style={{marginLeft:10}}>AI đang trả lời</Text>
                            </div>
                        )}
                        <div ref={messagesEndRef}></div>
                    </div>
                    <div className={styles['input-container']}>
                        <Input 
                        placeholder="Nhập câu hỏi của bạn"
                        value={inputValue}
                        onChange={(e)=> setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={loading}
                        />
                        <Button
                            type="primary" 
                            icon={<SendOutlined/>}
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || loading}
                        />
                    </div>
                </div>
        </Modal>
    );
};
export default AIChatModal;