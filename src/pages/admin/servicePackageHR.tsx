import { callGetServicePackages } from '@/config/api';
import { IServicePackage } from '@/types/backend';
import { Card, Col, Row, Button, Tag, Spin } from 'antd';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckOutlined, StarOutlined, CrownOutlined } from '@ant-design/icons';

const ServicePackages = () => {
    const [packages, setPackages] = useState<IServicePackage[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const res = await callGetServicePackages();
            if (res?.data) {
                setPackages(res.data);
            }
        } catch (error) {
            console.error('Error fetching packages:', error);
        }
        setLoading(false);
    };

    const getPackageIcon = (type: string) => {
        switch (type) {
            case 'FEATURED_JOB':
                return <CrownOutlined style={{ fontSize: 40, color: '#ff4d4f' }} />;
            case 'PRIORITY_BOLD_TITLE':
                return <StarOutlined style={{ fontSize: 40, color: '#faad14' }} />;
            case 'PRIORITY_DISPLAY':
                return <CheckOutlined style={{ fontSize: 40, color: '#52c41a' }} />;
            default:
                return <CheckOutlined style={{ fontSize: 40 }} />;
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleBuyPackage = (pkg: IServicePackage) => {
        navigate('/admin/packages/order', { state: { package: pkg, orderType: 'NEW_PURCHASE' } });
    };

    return (
        <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <h1 style={{ textAlign: 'center', marginBottom: 40, fontSize: 32 }}>
                    Gói Dịch Vụ Đăng Tin Tuyển Dụng
                </h1>

                <Spin spinning={loading}>
                    <Row gutter={[24, 24]}>
                        {packages.map((pkg) => (
                            <Col key={pkg.id} xs={24} md={8}>
                                <Card
                                    hoverable
                                    style={{
                                        height: '100%',
                                        borderRadius: 12,
                                        border: pkg.packageType === 'FEATURED_JOB' ? '2px solid #ff4d4f' : '1px solid #d9d9d9'
                                    }}
                                >
                                    {pkg.packageType === 'FEATURED_JOB' && (
                                        <Tag color="red" style={{ position: 'absolute', top: 10, right: 10 }}>
                                            Được khuyên dùng
                                        </Tag>
                                    )}
                                    
                                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                        {getPackageIcon(pkg.packageType)}
                                    </div>

                                    <h2 style={{ textAlign: 'center', marginBottom: 16, fontSize: 24 }}>
                                        {pkg.name}
                                    </h2>

                                    <div style={{ 
                                        textAlign: 'center', 
                                        marginBottom: 20,
                                        fontSize: 32,
                                        fontWeight: 'bold',
                                        color: '#1890ff'
                                    }}>
                                        {formatPrice(pkg.price)}
                                    </div>

                                    <div style={{ 
                                        padding: '16px 0',
                                        borderTop: '1px solid #f0f0f0',
                                        borderBottom: '1px solid #f0f0f0',
                                        marginBottom: 20
                                    }}>
                                        <p style={{ marginBottom: 8 }}>
                                            <CheckOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                                            Đăng {pkg.jobLimit} tin tuyển dụng
                                        </p>
                                        <p style={{ marginBottom: 8 }}>
                                            <CheckOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                                            Thời hạn {pkg.durationDays} ngày
                                        </p>
                                    </div>

                                    <p style={{ 
                                        color: '#666', 
                                        marginBottom: 24,
                                        minHeight: 100,
                                        textAlign: 'justify'
                                    }}>
                                        {pkg.description}
                                    </p>

                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        onClick={() => handleBuyPackage(pkg)}
                                        style={{
                                            background: pkg.packageType === 'FEATURED_JOB' ? '#ff4d4f' : undefined
                                        }}
                                    >
                                        Mua ngay
                                    </Button>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Spin>
            </div>
        </div>
    );
};

export default ServicePackages;