import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Typography, Empty, Spin, message } from 'antd';
import { MessageOutlined, EyeOutlined, DollarOutlined } from '@ant-design/icons';
import { IResume } from '@/types/backend';
import { callFetchResumeByUser, createRoomMessage } from '@/config/api';
import { convertSlug } from '@/config/utils';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import jobapplyStyles from '@/styles/jobapply.module.scss';

const { Title, Text } = Typography;

const JobApply = () => {
    const navigate = useNavigate();
    const [listCV, setListCV] = useState<IResume[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAppliedJobs();
    }, []);

    const fetchAppliedJobs = async () => {
        setLoading(true);
        try {
            const res = await callFetchResumeByUser();
            if (res && res.data) {
                const list: IResume[] = Array.isArray(res.data.result) ? res.data.result : [];
                setListCV(list);
            }
        } catch (error) {
            console.error('Error fetching applied jobs:', error);
            message.error('Không thể tải danh sách việc làm đã ứng tuyển');
            setListCV([]);
        }
        setLoading(false);
    };

    const handleViewCV = (resume: IResume) => {
        if (resume?.url) {
            window.open(resume.url, '_blank');
        } else {
            message.warning('Không tìm thấy CV');
        }
    };

    const handleMessage = async (resume: IResume) => {
        const job = typeof resume.jobId === 'object' ? resume.jobId : null;
    const jobFull = (resume as any)?.job || null;
    const jobId = job?.id || jobFull?.id || null;
    
    if (!jobId) {
        message.warning('Không tìm thấy thông tin công việc');
        return;
    }
    
    const res = await createRoomMessage(String(jobId));
    console.log(res);
    if (res && res.data) {
        const room = res.data;
        navigate(`/messages?roomId=${room.id}`);
    }
    };

    const formatSalary = (salary: number | string | undefined): string => {
        if (!salary) return 'Thoả thuận';
        if (typeof salary === 'string') {
            // Check if it's a range like "25 - 35"
            if (salary.includes('-') || salary.includes('Thoả thuận')) {
                return salary;
            }
        }
        const numSalary = typeof salary === 'string' ? parseFloat(salary) : salary;
        if (isNaN(numSalary) || numSalary === 0) return 'Thoả thuận';
        if (numSalary >= 1000000) {
            const millions = (numSalary / 1000000).toFixed(1);
            return `${millions} triệu`;
        }
        return `${numSalary.toLocaleString('vi-VN')} đ`;
    };

    const getStatusInfo = (resume: IResume) => {
        const status = resume.status;
        const appliedDate = resume.createdAt ? dayjs(resume.createdAt).format('DD-MM-YYYY HH:mm') : '';
        
        // Check history for viewed status
        if (resume.history && resume.history.length > 0) {
            const latestHistory = resume.history[resume.history.length - 1];
            if (latestHistory.status === 'REVIEWING') {
                return {
                    text: `NTD đã xem hồ sơ`,
                    color: '#ff9800'
                };
            }
            if (latestHistory.status === 'APPROVED') {
                const historyDate = latestHistory.updatedAt ? dayjs(latestHistory.updatedAt).format('DD-MM-YYYY HH:mm') : '';
                return {
                    text: `Hồ sơ phù hợp (${historyDate})`,
                    color: '#4caf50'
                };
            }
        }

        if (status === 'PENDING') {
            return {
                text: `Đã ứng tuyển đang chờ duyệt (${appliedDate})`,
                color: '#2196f3'
            };
        }

        if(status === 'REVIEWING') {
            return {
                text: `NTD đã xem hồ sơ`,
                color: '#ff9800'
            };
        }
        
        if (status === 'APPROVED') {
            return {
                text: `Hồ sơ phù hợp`,
                color: '#4caf50'
            };
        }

        if (status === 'REJECTED') {
            return {
                text: `Đã từ chối`,
                color: '#f44336'
            };
        }

        return {
            text: `Đã ứng tuyển đang chờ duyệt (${appliedDate})`,
            color: '#2196f3'
        };
    };

    return (
        <div className={jobapplyStyles['jobapply-container']}>
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={24}>
                    <div className={jobapplyStyles['jobapply-section']}>
                        {/* Header với banner xanh */}
                        <div className={jobapplyStyles['jobapply-header']}>
                            <div className={jobapplyStyles['header-content']}>
                                <Title level={2} className={jobapplyStyles['header-title']}>
                                    Việc làm đã ứng tuyển
                                </Title>
                                <Text className={jobapplyStyles['header-description']}>
                                    Xem lại danh sách những việc làm mà bạn đã nộp CV. 
                                    Theo dõi trạng thái ứng tuyển và quản lý hồ sơ của bạn.
                                </Text>
                            </div>
                            <div className={jobapplyStyles['header-decoration']}></div>
                        </div>

                        {/* Số lượng việc làm */}
                        <div className={jobapplyStyles['jobapply-count']}>
                            Danh sách {listCV.length} việc làm đã ứng tuyển
                        </div>

                        {/* Danh sách việc làm đã ứng tuyển */}
                        <Spin spinning={loading}>
                            {listCV.length > 0 ? (
                                <div className={jobapplyStyles['jobapply-list']}>
                                    {listCV.map((resume) => {
                                        const job = typeof resume.jobId === 'object' ? resume.jobId : null;
                                        const company = typeof resume.companyId === 'object' ? resume.companyId : null;
                                        const jobFull = (resume as any)?.job || null;
                                    
                                        const jobName = job?.name || jobFull?.name || 'N/A';
                                        const companyName = company?.name || (resume as any)?.companyName || 'N/A';
                                        const companyLogo = resume?.logo ;
                                        const jobSalary = jobFull?.salary || null;
                                        const jobId = job?.id || jobFull?.id || null;
                                        const appliedTime = resume.createdAt ? dayjs(resume.createdAt).format('DD-MM-YYYY HH:mm') : 'N/A';
                                        const statusInfo = getStatusInfo(resume);

                                        const handleCardClick = () => {
                                            if (jobId && jobName && jobName !== 'N/A') {
                                                const slug = convertSlug(jobName);
                                                navigate(`/job/${slug}?id=${jobId}`);
                                            }
                                        };

                                        return (
                                            <Card 
                                                key={resume.id} 
                                                className={jobapplyStyles['jobapply-card']}
                                                onClick={handleCardClick}
                                                style={{ cursor: jobId ? 'pointer' : 'default' }}
                                            >
                                                <div className={jobapplyStyles['jobapply-content']}>
                                                    {/* Logo công ty bên trái */}
                                                    <div className={jobapplyStyles['job-left']}>
                                                        <img
                                                            src={companyLogo}
                                                            alt={companyName}
                                                            className={jobapplyStyles['company-logo']}
                                                        />
                                                    </div>

                                                    {/* Thông tin việc làm ở giữa */}
                                                    <div className={jobapplyStyles['job-center']}>
                                                        <Title level={4} className={jobapplyStyles['job-title']}>
                                                            {jobName}
                                                        </Title>
                                                        <Text className={jobapplyStyles['company-name']}>
                                                            {companyName}
                                                        </Text>
                                                        <Text className={jobapplyStyles['applied-time']}>
                                                            Thời gian ứng tuyển: {appliedTime}
                                                        </Text>
                                                        <div className={jobapplyStyles['cv-info']}>
                                                            <Text className={jobapplyStyles['cv-label']}>CV đã ứng tuyển: </Text>
                                                            <a 
                                                                href={resume?.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={jobapplyStyles['cv-link']}
                                                            >
                                                                CV tải lên
                                                            </a>
                                                        </div>
                                                    </div>

                                                    {/* Lương và nút bên phải */}
                                                    <div className={jobapplyStyles['job-right']}>
                                                        <div className={jobapplyStyles['salary-section']}>
                                                            {jobSalary ? (
                                                                <Text className={jobapplyStyles['salary-text']}>
                                                                    {formatSalary(jobSalary)}
                                                                </Text>
                                                            ) : (
                                                                <Text className={jobapplyStyles['salary-text']}>
                                                                    <DollarOutlined /> Thoả thuận
                                                                </Text>
                                                            )}
                                                        </div>
                                                        <div className={jobapplyStyles['job-actions']}>
                                                            <Button 
                                                                className={jobapplyStyles['action-btn']}
                                                                icon={<MessageOutlined />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleMessage(resume);
                                                                }}
                                                            >
                                                                Nhắn tin
                                                            </Button>
                                                            <Button 
                                                                className={jobapplyStyles['action-btn']}
                                                                icon={<EyeOutlined />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleViewCV(resume);
                                                                }}
                                                            >
                                                                Xem CV
                                                            </Button>
                                                        </div>
                                                        {/* Trạng thái dưới nút */}
                                                        <Text className={jobapplyStyles['status-text']} style={{ color: statusInfo.color }}>
                                                            {statusInfo.text}
                                                        </Text>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                <Empty 
                                    description="Chưa có việc làm nào đã ứng tuyển"
                                    className={jobapplyStyles['empty-jobapply']}
                                />
                            )}
                        </Spin>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default JobApply;

