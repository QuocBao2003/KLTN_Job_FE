import { useState, useRef, useEffect } from "react";
import { Modal, Input, Button, Typography, Avatar, Spin, Card, message as antMessage } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, EnvironmentOutlined, FileTextOutlined, PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { callAskAI, callAskAIWithFile } from '../../../config/api';
import { IJobSuggestion, IChatResponse } from '@/types/backend';
import { convertSlug, getLocationName } from '@/config/utils';
import { useNavigate } from 'react-router-dom';
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
    jobs?: IJobSuggestion[];
    fileName?: string;
}

const AIChatModal = (props : IAIChatProps) => {
    const {open, onClose} = props;
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(false);
    const [messages, setMessages] = useState<IChatMessage[]>([]);
    const [inputValue, setInputValue] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () =>{
        messagesEndRef.current?.scrollIntoView({behavior : 'smooth'});
    };

    useEffect(()=>{
        scrollToBottom();
    },[messages]);
    

    const handleSendMessage = async () =>{
        // Kiểm tra: phải có message hoặc file
        if(!inputValue.trim() && !selectedFile) return;

        // Lưu file name trước khi clear
        const fileName = selectedFile ? selectedFile.name : undefined;
        const messageText = inputValue.trim();
        
        // Tạo user message để hiển thị ngay
        const userMessage: IChatMessage = {
            role : 'user', 
            content : messageText || '',
            fileName: fileName
        };
        setMessages(prev => [...prev, userMessage]);
        
        // Clear input và file
        setInputValue('');
        const fileToSend = selectedFile;
        setSelectedFile(null);
        setLoading(true);
        
        try{
            let res;
            if (fileToSend) {
                // Gọi API với file (message có thể rỗng hoặc có)
                // callAskAIWithFile(file: File, message?: string)
                res = await callAskAIWithFile(fileToSend, messageText || undefined);
            } else {
                // Gọi API chỉ với message (message bắt buộc phải có)
                // callAskAI(message: string)
                if (!messageText) {
                    throw new Error('Message is required when no file is selected');
                }
                res = await callAskAI(messageText);
            }
            
            // Axios interceptor đã trả về res.data, nên res là IChatResponse trực tiếp
            if(res?.data && res.data.message){
                const responseData: IChatResponse = res?.data;
                const assistantMessage: IChatMessage = {
                    role : 'assistant', 
                    content : responseData.message || '',
                    jobs: responseData.jobs || []
                };
                setMessages(prev => [...prev, assistantMessage]);
            }
        }catch(error: any){
            console.log("Error calling AI Chat", error);
            const errorMessage: IChatMessage = {
                role : 'assistant', 
                content : error?.message || error?.error || 'Có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.'
            };
            setMessages(prev => [...prev, errorMessage]);
        }finally{
            setLoading(false);
        }
    };

    const handleKeyPress = (e : React.KeyboardEvent<HTMLInputElement>) =>{
        if(e.key === 'Enter'){
            handleSendMessage();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Chỉ chấp nhận file PDF
            if (file.type !== 'application/pdf') {
                antMessage.error('Chỉ chấp nhận file PDF');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handlePlusClick = () => {
        fileInputRef.current?.click();
    };

    const handleJobClick = (job: IJobSuggestion) => {
        const slug = convertSlug(job.name);
        navigate(`/job/${slug}?id=${job.id}`);
        onClose(false);
    };

    // Tính toán width dựa trên việc có file hay không (trong messages hoặc selectedFile hiện tại)
    const hasFileInMessages = messages.some(msg => msg.fileName);
    const modalWidth = (hasFileInMessages || selectedFile) ? 600 : 400;

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
                width={modalWidth}
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
                                <div key={index}>
                                    <div 
                                        className={`${styles['message']} ${msg.role ==='user' ? styles['user-massage'] : styles['assistant-massage']}`}  
                                    >
                                        {msg.role === 'user' ? (
                                            <Avatar icon={<UserOutlined/>}/>
                                        ) : null}
                                        <div className={styles['message-content']}>
                                            {/* Hiển thị file PDF nếu có - luôn hiển thị đầu tiên trong message */}
                                            {msg.fileName && (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '10px 14px',
                                                    backgroundColor: '#fff5f5',
                                                    borderRadius: '8px',
                                                    marginBottom: msg.content ? '10px' : '0',
                                                    border: '1px solid #fecaca',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                    width: '100%',
                                                    maxWidth: '100%'
                                                }}>
                                                    <FileTextOutlined style={{ 
                                                        fontSize: '22px', 
                                                        color: '#ef4444',
                                                        flexShrink: 0
                                                    }} />
                                                    <Text style={{ 
                                                        fontSize: '14px',
                                                        fontWeight: 600,
                                                        color: '#991b1b',
                                                        wordBreak: 'break-word',
                                                        flex: 1
                                                    }}>
                                                        📄 {msg.fileName}
                                                    </Text>
                                                </div>
                                            )}
                                            {msg.content && (
                                                <Text style={{ 
                                                    display: 'block',
                                                    marginTop: msg.fileName ? '0' : '0'
                                                }}>
                                                    {msg.content}
                                                </Text>
                                            )}
                                        </div>
                                    </div>
                                    {/* Hiển thị job cards nếu có */}
                                    {msg.role === 'assistant' && msg.jobs && msg.jobs.length > 0 && (
                                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {msg.jobs.map((job) => (
                                                <Card
                                                    key={job.id}
                                                    size="small"
                                                    hoverable
                                                    onClick={() => handleJobClick(job)}
                                                    style={{ 
                                                        cursor: 'pointer',
                                                        marginBottom: '8px',
                                                        borderRadius: '8px'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                        <img
                                                            src={job.logo || "https://via.placeholder.com/50x50?text=No+Logo"}
                                                            alt={job.companyName}
                                                            style={{ 
                                                                width: '50px', 
                                                                height: '50px', 
                                                                objectFit: 'cover',
                                                                borderRadius: '4px'
                                                            }}
                                                        />
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ 
                                                                fontWeight: 'bold', 
                                                                fontSize: '14px',
                                                                marginBottom: '4px',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}>
                                                                {job.name}
                                                            </div>
                                                            <div style={{ 
                                                                fontSize: '12px', 
                                                                color: '#666',
                                                                marginBottom: '4px',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}>
                                                                {job.companyName}
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#999' }}>
                                                                <EnvironmentOutlined style={{ marginRight: '4px' }} />
                                                                {getLocationName(job.location)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
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
                        {/* Hiển thị file đã chọn trước khi gửi */}
                        {selectedFile && (
                            <div style={{ 
                                marginBottom: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '6px',
                                border: '1px solid #e0e0e0'
                            }}>
                                <FileTextOutlined style={{ 
                                    fontSize: '16px', 
                                    color: '#ef4444' 
                                }} />
                                <Text style={{ 
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: '#333',
                                    flex: 1
                                }}>
                                    {selectedFile.name}
                                </Text>
                                <Button
                                    type="text"
                                    icon={<CloseOutlined />}
                                    size="small"
                                    onClick={handleRemoveFile}
                                    disabled={loading}
                                    style={{ padding: 0, width: '20px', height: '20px' }}
                                />
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                            <Button
                                icon={<PlusOutlined />}
                                size="small"
                                onClick={handlePlusClick}
                                disabled={loading}
                                style={{ 
                                    minWidth: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            />
                            <Input 
                                placeholder="Nhập câu hỏi của bạn"
                                value={inputValue}
                                onChange={(e)=> setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={loading}
                                style={{ flex: 1 }}
                            />
                            <Button
                                type="primary" 
                                icon={<SendOutlined/>}
                                onClick={handleSendMessage}
                                disabled={(!inputValue.trim() && !selectedFile) || loading}
                            />
                        </div>
                    </div>
                </div>
        </Modal>
    );
};
export default AIChatModal;