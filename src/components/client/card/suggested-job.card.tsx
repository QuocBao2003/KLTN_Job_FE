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
                        src={job?.company?.logo || "https://via.placeholder.com/200x200?text=No+Logo"}
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
                            {job.minSalary === 0  && job.maxSalary === 0 ? 'Thoả thuận' : (job.minSalary + "").replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' đ' +'-' +(job.maxSalary + "").replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' đ'}
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
