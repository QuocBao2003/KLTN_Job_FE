import React from 'react';
import { Card, Tag, Avatar, Button, Tooltip } from 'antd';
import { HeartOutlined, DollarOutlined, EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { IJob } from '@/types/backend';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { useNavigate } from 'react-router-dom';
import { convertSlug } from '@/config/utils';

interface IProps {
    job: IJob;
}

const JobCard = ({ job }: IProps) => {
    const navigate = useNavigate();

    // 3. Hàm xử lý khi click để chuyển sang trang chi tiết
    const handleViewDetail = (job: IJob) => {
        if (job.name && job.id) {
            const slug = convertSlug(job.name);
            navigate(`/job/${slug}?id=${job.id}`);
        }
    };

    return (
        <Card
            hoverable
            style={{ marginBottom: 20, borderRadius: 8, border: '1px solid #f0f0f0' }}
            bodyStyle={{ padding: '16px' }}
        >
            <div style={{ display: 'flex', gap: '16px' }}>
                {/* 1. Logo Công ty */}
                <div style={{ flexShrink: 0 }}>
                    <Avatar
                        shape="square"
                        size={80}
                        src={job.logo || "https://via.placeholder.com/80"}
                        style={{ border: '1px solid #eee' }}
                    />
                </div>

                {/* 2. Nội dung chính */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Title */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{
                            margin: 0, fontSize: '18px', fontWeight: 600, color: '#333',
                            cursor: 'pointer', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}
                        onClick={() => handleViewDetail(job)}
                        >
                            {job.name}
                        </h3>
                        <div style={{ color: '#00b14f', fontWeight: 'bold', fontSize: '16px', whiteSpace: 'nowrap' }}>
                            {job.salaryType === 'NEGOTIABLE' ? 'Thỏa thuận' : `${job.minSalary}đ - ${job.maxSalary}đ`}
                        </div>
                    </div>

                    {/* Company Name */}
                    <div style={{ color: '#555', fontSize: '14px', marginBottom: '4px' }}>
                        {job.company?.name?.toUpperCase()}
                    </div>

                    {/* Tags Info: Location & Time */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <Tag icon={<EnvironmentOutlined />} color="default" style={{ border: 'none', background: '#f2f4f5' }}>
                            {job.location}
                        </Tag>
                        <Tag icon={<ClockCircleOutlined />} color="default" style={{ border: 'none', background: '#f2f4f5' }}>
                            {dayjs(job.updatedAt).fromNow()}
                        </Tag>
                    </div>

                    {/* Skills / Benefits (Optional) */}
                    <div style={{ marginTop: 4 }}>
                        {job.skills?.slice(0, 3).map((skill: any) => (
                            <span key={skill.id} style={{ fontSize: 12, marginRight: 8, color: '#666' }}>
                                • {skill.name}
                            </span>
                        ))}
                        {job.skills?.length > 3 && <span style={{ fontSize: 12, color: '#666' }}>+{job.skills.length - 3}</span>}
                    </div>
                </div>

                {/* 3. Action Button (Like) */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <Tooltip title="Lưu tin">
                        <Button icon={<HeartOutlined />} shape="circle" style={{ border: 'none', color: '#999' }} />
                    </Tooltip>

                    <Button 
                        type="primary" 
                        ghost 
                        style={{ borderColor: '#00b14f', color: '#00b14f' }}
                        onClick={() => handleViewDetail(job)}
                    >
                        Ứng tuyển
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default JobCard;