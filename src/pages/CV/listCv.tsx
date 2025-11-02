import styles from 'styles/client.module.scss';
import { Breadcrumb, Row, Col, Card, Tag, Divider, Button } from 'antd';
import { ThunderboltOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import sampleImg from '@/img/Logo-IT.png';
import { useState } from 'react';
import cv1 from '@/img/cv1.png';
import cv2 from '@/img/cv2.png';
import cv3 from '@/img/cv3.png';

interface CvCardProps {
    title: string;
    image: string;
}

const CvCard = ({ title,image }: CvCardProps) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <Card
                hoverable
                style={{ borderRadius: 8 }}
                cover={<img src={image} alt="cv" style={{ objectFit: 'cover' }} />}
            >
               
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{title}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Tag>Đơn giản</Tag>
                    <Tag>ATS</Tag>
                </div>
            </Card>
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: 16,
                    transform: 'translateX(-50%)',
                    display: hovered ? 'block' : 'none',
                }}
            >
                <Button
                    style={{
                        background: '#197bcd',
                        color: '#000',
                        border: 'none',
                        padding: '0 16px',
                        height: 36,
                        borderRadius: 6,
                        boxShadow: '0 2px 8px rgba(25,123,205,0.35)'
                    }}
                >
                    Dùng mẫu
                </Button>
            </div>
        </div>
    );
}

const PageListCV = () => {
    return (
        <div className={styles["container"]} style={{ marginTop: 20 }}>
            <Breadcrumb
                items={[
                    { title: <Link to={'/'}>Trang chủ</Link> },
                    { title: 'Việc làm' }
                ]}
            />

            <h1 style={{ fontSize: 48, margin: '16px 0 8px', lineHeight: 1.2 }}>
                Mẫu CV xin việc tiếng Việt chuẩn 2025
            </h1>
            <div style={{ color: '#666', maxWidth: 800 }}>
                Tuyển chọn 71 mẫu CV đa dạng phong cách, giúp bạn tạo dấu ấn cá nhân và kết nối mạnh mẽ hơn với nhà tuyển dụng.
            </div>

            <Row gutter={[24, 24]} style={{ marginTop: 40 }}>
                <Col xs={24} sm={12} md={8}>
                    <CvCard title="Tiêu chuẩn" image={cv1} />
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <CvCard title="Thanh Lịch" image={cv2} />
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <CvCard title="Hiện đại" image={cv3} />
                </Col>
            </Row>

            <div style={{ marginTop: 32 }}>
                <Card
                    style={{ borderRadius: 8, marginBottom: 16 }}
                    bodyStyle={{ padding: 16 }}
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ThunderboltOutlined style={{ color: '#52c41a' }} />
                            <span style={{ fontWeight: 600 }}>
                                Tạo CV online miễn phí với các mẫu CV được thiết kế sẵn chỉ với 3 bước:
                            </span>
                        </div>
                    }
                >
                    <ul style={{ margin: 0, paddingLeft: 18, color: '#4d4d4d' }}>
                        <li>
                            Bước 1: Chọn mẫu CV miễn phí mà bạn ưng ý nhất và tiến hành viết CV.
                        </li>
                        <li>
                            Bước 2: Bạn nhập thông tin cá nhân vào mẫu CV đã chọn, bao gồm thông tin cá nhân, kinh nghiệm làm việc, kỹ năng, giáo dục, và các thông tin khác.
                        </li>
                        <li>
                            Bước 3: Sau khi hoàn thiện viết CV, bạn tiến hành lưu CV lại dưới dạng PDF hoặc sử dụng link CV online để gửi cho nhà tuyển dụng. Bạn có thể tải về mẫu CV đã viết và sử dụng cho các công việc ứng tuyển sau này.
                        </li>
                    </ul>
                </Card>

                <Card
                    style={{ borderRadius: 8 }}
                    bodyStyle={{ padding: 16 }}
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                            <span style={{ fontWeight: 600 }}>Tại sao nên tạo CV online trên hệ thống của chúng tôi</span>
                        </div>
                    }
                >
                    <ul style={{ margin: 0, paddingLeft: 18, color: '#4d4d4d' }}>
                        <li>Nhiều mẫu CV đẹp, miễn phí, phù hợp nhu cầu ứng tuyển các vị trí khác nhau.</li>
                        <li>Tương tác trực quan, dễ dàng chỉnh sửa thông tin, tạo CV online nhanh chóng trong vòng 5 phút.</li>
                        <li>Nhận gợi ý cách viết CV phù hợp cùng các mẫu CV tham khảo chi tiết theo ngành nghề.</li>
                        <li>Dễ dàng đính kèm mẫu đơn xin việc </li>
                    </ul>
                </Card>
            </div>

            <Divider />
        </div>
    )
}

export default PageListCV;