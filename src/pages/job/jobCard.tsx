import React from 'react';
import { Card, Tag, Button, Tooltip } from 'antd';
import { EnvironmentOutlined, DollarOutlined, ClockCircleOutlined, HeartOutlined, FireOutlined, StarOutlined, SketchOutlined } from '@ant-design/icons';
import { IJob } from '@/types/backend';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { useNavigate } from 'react-router-dom';
import { convertSlug, getLocationName } from '@/config/utils';
import { ThunderboltOutlined } from '@ant-design/icons'; // Import thêm icon

dayjs.extend(relativeTime);

interface IProps {
    job: IJob;
}

const JobCard = ({ job }: IProps) => {
    const navigate = useNavigate();

    const handleViewDetail = () => {
        if (job.name && job.id) {
            const slug = convertSlug(job.name);
            navigate(`/job/${slug}?id=${job.id}`);
        }
    };

    const isFeatured = job.isFeatured || false;
    const hasBoldTitle = job.hasBoldTitle || false;
    const hotJob = isFeatured && hasBoldTitle;
    const topJob = !isFeatured && hasBoldTitle;

    const formatSalary = () => {
        if (job.salaryType === 'NEGOTIABLE' || !job.minSalary || !job.maxSalary) {
            return 'Thỏa thuận';
        }
        const min = job.minSalary.toLocaleString('vi-VN');
        const max = job.maxSalary.toLocaleString('vi-VN');
        return `${min} - ${max} đ`;
    };

    const cardStyle = {
        marginBottom: 16,
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        // boxShadow: isFeatured ? '0 8px 20px rgba(237, 97, 60, 0.15)' : '0 4px 14px rgba(15, 23, 42, 0.08)',
        borderLeft: isFeatured ? '6px solid #ed613c' : '6px solid transparent',
        cursor: 'pointer'
    };

    const titleStyle = {
        color: hasBoldTitle ? '#ed613c' : '#1f2937',
        fontWeight: hasBoldTitle ? 700 : 600,
        fontSize: 18,
        lineHeight: 1.3
    };

    return (
        <Card
            hoverable
            style={cardStyle}
            bodyStyle={{ padding: isFeatured ? 20 : 16 }}
            onClick={handleViewDetail}
        >
            <div style={{ display: 'flex', gap: 18 }}>
                <div style={{ flexShrink: 0 }}>
                    <img
                        src={job.logo || 'https://via.placeholder.com/90'}
                        alt={job.company?.name || 'company'}
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: 12,
                            objectFit: 'contain',
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            padding: 8
                        }}
                    />
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={titleStyle}>{job.name}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {hotJob && (
                                <Tag
                                    icon={<FireOutlined />}
                                    style={{
                                        margin: 0,
                                        fontSize: 10,
                                        background: 'linear-gradient(to right, #ed613c, #fd953d)',
                                        color: '#fff',
                                        border: 'none'
                                    }}
                                >
                                    Hấp dẫn
                                </Tag>
                            )}
                            {topJob && (
                                <Tag
                                    color="#00b14f"
                                    icon={<SketchOutlined />}
                                    style={{
                                        margin: 0,
                                        fontSize: "11px",
                                        fontWeight: 'bold',
                                        color: 'white'
                                    }}
                                >
                                    TOP
                                </Tag>
                            )}
                        </div>
                    </div>

                    <div style={{ color: '#4b5563', fontSize: 13, fontWeight: 600 }}>
                        {job.companyName || 'Công ty không xác định'}
                    </div>

                    <div style={{ color: '#10b981', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <DollarOutlined />
                        {formatSalary()}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Tag
                            icon={<EnvironmentOutlined />}
                            color="default"
                            style={{ border: 'none', background: '#f2f4f5', color: '#555' }}
                        >
                            {getLocationName(job.location)}
                        </Tag>
                        <Tag icon={<ThunderboltOutlined />} color="orange">
                            {job.level}
                        </Tag>
                        <Tag
                            icon={<ClockCircleOutlined />}
                            color="default"
                            style={{ border: 'none', background: '#f2f4f5', color: '#555' }}
                        >
                            {job.updatedAt
                                ? dayjs(job.updatedAt).locale('vi').fromNow()
                                : dayjs(job.createdAt).locale('vi').fromNow()}
                        </Tag>
                    </div>

                    {/* <div style={{ color: '#6b7280', fontSize: 13, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {job.skills?.slice(0, 3).map(skill => (
                            <span key={skill.id}>• {skill.name}</span>
                        ))}
                        {job.skills && job.skills.length > 3 && (
                            <span>+{job.skills.length - 3}</span>
                        )}
                    </div> */}
                </div>

                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', justifyContent: 'space-between' }} onClick={e => e.stopPropagation()}>
                    <Tooltip title="Lưu tin">
                        <Button icon={<HeartOutlined />} shape="circle" />
                    </Tooltip>
                    <Button type="primary" ghost onClick={handleViewDetail}>
                        Ứng tuyển
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default JobCard;