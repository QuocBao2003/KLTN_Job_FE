import { callCreateOrder } from '@/config/api';
import { IServicePackage } from '@/types/backend';
import { Card, Button, Descriptions, Radio, message, Spin } from 'antd';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DollarOutlined } from '@ant-design/icons';

const PackageOrder = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'MOMO'>('MOMO');

    const pkg = location.state?.package as IServicePackage;
    const orderType = location.state?.orderType as 'NEW_PURCHASE' | 'RENEWAL';
    const userPackageId = location.state?.userPackageId as number | undefined;

    if (!pkg || !orderType) {
        navigate('/admin/packages');
        return null;
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handlePayment = async () => {
        setLoading(true);
        try {
            const res = await callCreateOrder({
                servicePackageId: pkg.id,
                userPackageId: userPackageId,
                orderType: orderType
            });

            if (res?.data?.payUrl) {
                message.success('Đang chuyển đến trang thanh toán...');
                // Chuyển hướng đến trang thanh toán MoMo
                window.location.href = res.data.payUrl;
            }
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng!');
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <Card
                    title={
                        <h2 style={{ margin: 0 }}>
                            {orderType === 'NEW_PURCHASE' ? 'Xác Nhận Đơn Hàng' : 'Gia Hạn Gói Dịch Vụ'}
                        </h2>
                    }
                    style={{ marginBottom: 24 }}
                >
                    <Spin spinning={loading}>
                        <Descriptions column={1} bordered>
                            <Descriptions.Item label="Tên gói dịch vụ">
                                <strong>{pkg.name}</strong>
                            </Descriptions.Item>
                            <Descriptions.Item label="Mô tả">
                                {pkg.description}
                            </Descriptions.Item>
                            <Descriptions.Item label="Số lượng tin đăng">
                                {pkg.jobLimit} tin
                            </Descriptions.Item>
                            <Descriptions.Item label="Thời hạn">
                                {pkg.durationDays} ngày
                            </Descriptions.Item>
                            <Descriptions.Item label="Giá">
                                <span style={{ fontSize: 24, color: '#ff4d4f', fontWeight: 'bold' }}>
                                    {formatPrice(pkg.price)}
                                </span>
                            </Descriptions.Item>
                        </Descriptions>

                        <div style={{ marginTop: 32 }}>
                            <h3>Chọn phương thức thanh toán:</h3>
                            <Radio.Group
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                style={{ width: '100%', marginTop: 16 }}
                            >
                                <Card
                                    hoverable
                                    style={{
                                        border: paymentMethod === 'MOMO' ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setPaymentMethod('MOMO')}
                                >
                                    <Radio value="MOMO" style={{ fontSize: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <img
                                                src="https://developers.momo.vn/v3/img/logo.svg"
                                                alt="MoMo"
                                                style={{ height: 40 }}
                                            />
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>Ví điện tử MoMo</div>
                                                <div style={{ fontSize: 12, color: '#666' }}>
                                                    Thanh toán nhanh chóng và bảo mật
                                                </div>
                                            </div>
                                        </div>
                                    </Radio>
                                </Card>
                            </Radio.Group>
                        </div>

                        <div style={{ marginTop: 32, textAlign: 'center' }}>
                            <Button
                                size="large"
                                style={{ marginRight: 16 }}
                                onClick={() => navigate(-1)}
                            >
                                Quay lại
                            </Button>
                            <Button
                                type="primary"
                                size="large"
                                icon={<DollarOutlined />}
                                onClick={handlePayment}
                                loading={loading}
                            >
                                Thanh toán {formatPrice(pkg.price)}
                            </Button>
                        </div>
                    </Spin>
                </Card>
            </div>
        </div>
    );
};

export default PackageOrder;