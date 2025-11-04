import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Tag, Typography, Empty, Spin, message } from 'antd';
import { DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { IJob, ISaveJob } from '@/types/backend';
import { callGetSavedJobByUser } from '@/config/api';
import { convertSlug } from '@/config/utils';
import { useNavigate } from 'react-router-dom';
import savejobStyles from '@/styles/savejob.module.scss';

const { Title, Text } = Typography;

const SaveJob = () => {
    const navigate = useNavigate();
    const [savedJobs, setSavedJobs] = useState<ISaveJob[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSavedJobs();
    }, []);

    const fetchSavedJobs = async () => {
        setLoading(true);
        try {
          const res = await callGetSavedJobByUser();
          console.log(res.data);
          const list: ISaveJob[] = Array.isArray(res?.data) ? res.data : [];
          setSavedJobs(list);
        } catch (error) {
          console.error('Error fetching saved jobs:', error);
          setSavedJobs([]);
        }
        setLoading(false);
      };

    const handleViewJob = (job: Partial<IJob & ISaveJob>) => {
        if (!job?.id || !job?.name) {
            message.warning('Không tìm thấy thông tin công việc để mở chi tiết');
            return;
        }
        const slug = convertSlug(job.name as string);
        navigate(`/job/${slug}?id=${job.id}`);
    };

    const handleRemoveSavedJob = (jobId: string | undefined) => {
        if (jobId) {
            setSavedJobs(prev => prev.filter(job => job.id !== jobId));
        }
    };

    
    return (
        <div className={savejobStyles['savejob-container']}>
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={24}>
                    <div className={savejobStyles['saved-jobs-section']}>
                        {/* Header với banner xanh */}
                        <div className={savejobStyles['saved-jobs-header']}>
                            <div className={savejobStyles['header-content']}>
                                <Title level={2} className={savejobStyles['header-title']}>
                                    Việc làm đã lưu
                                </Title>
                                <Text className={savejobStyles['header-description']}>
                                    Xem lại danh sách những việc làm mà bạn đã lưu trước đó. 
                                    Ứng tuyển ngay để không bỏ lỡ cơ hội nghề nghiệp dành cho bạn.
                                </Text>
                            </div>
                            <div className={savejobStyles['header-decoration']}></div>
                        </div>

                        {/* Số lượng việc làm */}
                        <div className={savejobStyles['saved-count']}>
                            Danh sách {savedJobs.length} việc làm đã lưu
                        </div>

                        {/* Danh sách việc làm đã lưu */}
                        <Spin spinning={loading}>
                            {savedJobs.length > 0 ? (
                                <div className={savejobStyles['saved-jobs-list']}>
                                    {savedJobs.map((job) => (
                                        <Card key={job.id} className={savejobStyles['saved-job-card']} hoverable>
                                            <div className={savejobStyles['saved-job-content']}>
                                                <div className={savejobStyles['job-left']}>
                                                    {/* Không có logo trong ISaveJob, hiển thị placeholder */}
                                                    <img
                                                        src={`$${'{'}import.meta.env.VITE_BACKEND_URL{'}'}/storage/company/placeholder.png`}
                                                        alt={job.companyName ?? 'company'}
                                                        className={savejobStyles['company-logo']}
                                                    />
                                                </div>
                                                <div className={savejobStyles['job-right']}>
                                                    <div className={savejobStyles['job-title-row']}>
                                                        <div className={savejobStyles['job-title']}>
                                                            <Title level={4} style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                                                {job.name}
                                                            </Title>
                                                            <CheckCircleOutlined className={savejobStyles['verified-icon']} />
                                                        </div>
                                                    </div>
                                                    <Text className={savejobStyles['company-name']}>
                                                        {job.companyName}
                                                    </Text>
                                                    <Text className={savejobStyles['saved-time']}>
                                                        Đã lưu: {job.saveTime instanceof Date ? job.saveTime.toLocaleDateString('vi-VN') : job.saveTime}
                                                    </Text>
                                                    <div className={savejobStyles['job-tags']}>
                                                        <Tag color="default">{job.location}</Tag>
                                                    </div>
                                                    <div className={savejobStyles['job-actions']}>
                                                        <Button 
                                                            type="primary" 
                                                            className={savejobStyles['apply-btn']}
                                                            onClick={() => handleViewJob(job)}
                                                        >
                                                            Ứng tuyển
                                                        </Button>
                                                        <Button 
                                                            icon={<DeleteOutlined />}
                                                            className={savejobStyles['remove-btn']}
                                                            onClick={() => handleRemoveSavedJob(job.id)}
                                                        >
                                                            Bỏ lưu
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Empty 
                                    description="Chưa có việc làm nào được lưu"
                                    className={savejobStyles['empty-saved-jobs']}
                                />
                            )}
                        </Spin>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default SaveJob;