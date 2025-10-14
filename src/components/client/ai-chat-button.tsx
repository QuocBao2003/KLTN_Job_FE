import { useState } from 'react';
import { Button, Badge } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import AIChatModal from './modal/ai-chat-modal';
import styles from '@/styles/ai-chat.module.scss';
import images from '@/img/images.png';
const AIchatButton = () =>{
    const [openChat, setOpenChat] = useState(false);

    return(
        <>
        <Badge dot>
            <Button
                type='primary'
                shape='circle'
                icon={
                    <img src={images} alt='chat-icon' style={{width:'60px', height:'60px',borderRadius:'50%',objectFit:'cover'}}/>
                }
                size='large'
                className={styles['chat-button']}
                onClick={()=>setOpenChat(true)}/>
        </Badge>
        <AIChatModal
        open={openChat}
        onClose={()=>setOpenChat(false)}
        />
        </>
    )
};
export default AIchatButton;