import { Result, Button, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const PaymentReturn = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'loading'>('loading');
    const [orderCode, setOrderCode] = useState<string>('');
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        const status = searchParams.get('status'); // FE nhận từ backend redirect
    const orderId = searchParams.get('orderId');
    const paymentMessage = searchParams.get('message');

    if (orderId) setOrderCode(orderId);
    if (paymentMessage) setMessage(decodeURIComponent(paymentMessage));

    if (status === 'success') setPaymentStatus('success');
    else if (status === 'failed') setPaymentStatus('failed');
    else setPaymentStatus('failed'); // fallback
    }, [searchParams]);

    if (paymentStatus === 'loading') {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '100vh',
                background: '#f0f2f5',
                gap: '16px'
            }}>
                <Spin size="large" />
                <div style={{ fontSize: 16, color: '#666' }}>
                    Đang xử lý kết quả thanh toán...
                </div>
            </div>
        );
    }

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh',
            background: '#f0f2f5',
            padding: '24px'
        }}>
            {paymentStatus === 'success' ? (
                <Result
                    icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 72 }} />}
                    status="success"
                    title="Thanh toán thành công!"
                    subTitle={
                        <div style={{ fontSize: 16 }}>
                            <div style={{ marginBottom: 8 }}>
                                Mã đơn hàng: <strong>{orderCode}</strong>
                            </div>
                            <div style={{ color: '#52c41a' }}>
                                {message || 'Gói dịch vụ của bạn đã được kích hoạt thành công!'}
                            </div>
                        </div>
                    }
                    extra={[
                        <Button 
                            type="primary" 
                            key="packages" 
                            size="large"
                            onClick={() => navigate('/admin/my-packages')}
                        >
                            Xem gói dịch vụ của tôi
                        </Button>,
                        <Button 
                            key="create-job"
                            size="large"
                            onClick={() => navigate('/admin/job')}
                        >
                            Đăng tin tuyển dụng
                        </Button>,
                    ]}
                />
            ) : (
                <Result
                    icon={<CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 72 }} />}
                    status="error"
                    title="Thanh toán thất bại!"
                    subTitle={
                        <div style={{ fontSize: 16 }}>
                            {orderCode && (
                                <div style={{ marginBottom: 8 }}>
                                    Mã đơn hàng: <strong>{orderCode}</strong>
                                </div>
                            )}
                            <div style={{ color: '#ff4d4f' }}>
                                {message || 'Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại!'}
                            </div>
                        </div>
                    }
                    extra={[
                        <Button 
                            type="primary" 
                            key="retry"
                            size="large"
                            onClick={() => navigate('/admin/packages')}
                        >
                            Thử lại
                        </Button>,
                        <Button 
                            key="home"
                            size="large"
                            onClick={() => navigate('/')}
                        >
                            Về trang chủ
                        </Button>,
                    ]}
                />
            )}
        </div>
    );
};

export default PaymentReturn;