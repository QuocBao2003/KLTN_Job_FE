import React from 'react';
import { Card, Button, Tag, Typography } from 'antd';
import { HeartOutlined } from '@ant-design/icons';
import { IJob } from '@/types/backend';
import savejobStyles from '@/styles/savejob.module.scss';

const { Title, Text } = Typography;

interface IProps {
    job: IJob;
    onSave: (job: IJob) => void;
    onView: (job: IJob) => void;
}

const SuggestedJobCard: React.FC<IProps> = ({ job, onSave, onView }) => {
    return (
        <Card 
            className={savejobStyles['suggested-job-card']} 
            hoverable
            onClick={() => onView(job)}
            size="small"
        >
            <div className={savejobStyles['suggested-job-content']}>
                <div className={savejobStyles['job-left']}>
                    <img
                        src={`${import.meta.env.VITE_BACKEND_URL}/storage/company/${job.company?.logo}`}
                        alt={job.company?.name}
                        className={savejobStyles['company-logo-small']}
                    />
                </div>
                <div className={savejobStyles['job-right']}>
                    <Title level={5} className={savejobStyles['job-title']}>
                        {job.name}
                    </Title>
                    <Text className={savejobStyles['company-name']}>
                        {job.company?.name}
                    </Text>
                    <div className={savejobStyles['job-info']}>
                        <Tag color="green" className={savejobStyles['salary-tag']}>
                            {job.salary === 0 ? 'Thoả thuận' : (job.salary + "").replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' đ'}
                        </Tag>
                        <Tag color="default" className={savejobStyles['location-tag']}>
                            {job.location}
                        </Tag>
                    </div>
                </div>
                <div className={savejobStyles['job-actions']}>
                    <Button
                        type="text"
                        icon={<HeartOutlined />}
                        className={savejobStyles['save-btn']}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSave(job);
                        }}
                    />
                </div>
            </div>
        </Card>
    );
};

export default SuggestedJobCard;
