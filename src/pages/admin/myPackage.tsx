import { callGetMyPackages } from '@/config/api';
import { IUserPackage } from '@/types/backend';
import { Card, Col, Row, Button, Tag, Progress, Spin, Empty } from 'antd';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const MyPackages = () => {
    const [packages, setPackages] = useState<IUserPackage[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMyPackages();
    }, []);

    const fetchMyPackages = async () => {
        setLoading(true);
        try {
            const res = await callGetMyPackages();
            if (res?.data) {
                setPackages(res.data);
            }
        } catch (error) {
            console.error('Error fetching packages:', error);
        }
        setLoading(false);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const getStatusTag = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Tag color="green" icon={<CheckCircleOutlined />}>Đang hoạt động</Tag>;
            case 'EXPIRED':
                return <Tag color="red" icon={<CloseCircleOutlined />}>Hết hạn</Tag>;
            case 'INACTIVE':
                return <Tag color="default">Không hoạt động</Tag>;
            default:
                return <Tag>{status}</Tag>;
        }
    };

    const handleRenew = (pkg: IUserPackage) => {
        navigate('/admin/packages/order', {
            state: {
                package: pkg.servicePackage,
                orderType: 'RENEWAL',
                userPackageId: pkg.id
            }
        });
    };

    const getPackageColor = (type: string) => {
        switch (type) {
            case 'FEATURED_JOB':
                return '#ff4d4f';
            case 'PRIORITY_BOLD_TITLE':
                return '#faad14';
            case 'PRIORITY_DISPLAY':
                return '#52c41a';
            default:
                return '#1890ff';
        }
    };

    return (
        <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h1 style={{ margin: 0, fontSize: 28 }}>Gói Dịch Vụ Của Tôi</h1>
                    <Button type="primary" size="large" onClick={() => navigate('/admin/packages')}>
                        Mua thêm gói dịch vụ
                    </Button>
                </div>

                <Spin spinning={loading}>
                    {packages.length === 0 ? (
                        <Empty
                            description="Bạn chưa có gói dịch vụ nào"
                            style={{ marginTop: 100 }}
                        >
                            <Button type="primary" onClick={() => navigate('/admin/packages')}>
                                Mua gói dịch vụ ngay
                            </Button>
                        </Empty>
                    ) : (
                        <Row gutter={[16, 16]}>
                            {packages.map((pkg) => {
                                const usagePercent = (pkg.usedJobCount / pkg.servicePackage.jobLimit) * 100;
                                const timePercent = pkg.daysRemaining > 0
                                    ? (pkg.daysRemaining / pkg.servicePackage.durationDays) * 100
                                    : 0;

                                return (
                                    <Col key={pkg.id} xs={24} lg={12}>
                                        <Card
                                            style={{
                                                borderLeft: `4px solid ${getPackageColor(pkg.servicePackage.packageType)}`,
                                                height: '100%'
                                            }}
                                        >
                                            <div style={{ marginBottom: 16 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                    <h3 style={{ margin: 0, fontSize: 20 }}>
                                                        {pkg.servicePackage.name}
                                                    </h3>
                                                    {getStatusTag(pkg.status)}
                                                </div>
                                                <div style={{ color: '#1890ff', fontSize: 18, fontWeight: 'bold', marginTop: 8 }}>
                                                    {formatPrice(pkg.servicePackage.price)}
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: 16 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                    <span>Tin đã đăng:</span>
                                                    <strong>
                                                        {pkg.usedJobCount} / {pkg.servicePackage.jobLimit}
                                                    </strong>
                                                </div>
                                                <Progress
                                                    percent={usagePercent}
                                                    strokeColor={getPackageColor(pkg.servicePackage.packageType)}
                                                    showInfo={false}
                                                />
                                            </div>

                                            <div style={{ marginBottom: 16 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                    <span>
                                                        <ClockCircleOutlined /> Thời gian còn lại:
                                                    </span>
                                                    <strong>
                                                        {pkg.daysRemaining > 0 ? `${pkg.daysRemaining} ngày` : 'Hết hạn'}
                                                    </strong>
                                                </div>
                                                <Progress
                                                    percent={timePercent}
                                                    strokeColor={timePercent > 30 ? '#52c41a' : timePercent > 10 ? '#faad14' : '#ff4d4f'}
                                                    showInfo={false}
                                                />
                                            </div>

                                            <div style={{ 
                                                padding: '12px',
                                                background: '#f5f5f5',
                                                borderRadius: 4,
                                                marginBottom: 16
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <span style={{ color: '#666' }}>Ngày bắt đầu:</span>
                                                    <span>{dayjs(pkg.startDate).format('DD/MM/YYYY')}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#666' }}>Ngày hết hạn:</span>
                                                    <span style={{ color: pkg.expired ? '#ff4d4f' : 'inherit' }}>
                                                        {dayjs(pkg.endDate).format('DD/MM/YYYY')}
                                                    </span>
                                                </div>
                                            </div>

                                            <Button
                                                type={pkg.status === 'ACTIVE' ? 'default' : 'primary'}
                                                block
                                                size="large"
                                                onClick={() => handleRenew(pkg)}
                                            >
                                                Gia hạn gói dịch vụ
                                            </Button>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                    )}
                </Spin>
            </div>
        </div>
    );
};

export default MyPackages;