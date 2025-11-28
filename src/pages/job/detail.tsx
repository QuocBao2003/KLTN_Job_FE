import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { IJob } from "@/types/backend";
import { callFetchJobById, callSavedJob, callJobByJobProfession } from "@/config/api";
import styles from 'styles/client.module.scss';
import savejobStyles from 'styles/savejob.module.scss';
import parse from 'html-react-parser';
import { Col, Divider, message, Row, Skeleton, Tag, Card, Empty, Spin, Typography, Button, Breadcrumb } from "antd";
import { DollarOutlined, EnvironmentOutlined, HistoryOutlined, HeartOutlined } from "@ant-design/icons";
import { getLocationName, convertSlug } from "@/config/utils";
import { Link } from "react-router-dom";

const { Title, Text } = Typography;
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import ApplyModal from "@/components/client/modal/apply.modal";
dayjs.extend(relativeTime)
import {
    CalendarOutlined,
    TeamOutlined,
    RiseOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';

const ClientJobDetailPage = (props: any) => {
    const [jobDetail, setJobDetail] = useState<IJob | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [relatedJobs, setRelatedJobs] = useState<IJob[]>([]);
    const [isLoadingRelatedJobs, setIsLoadingRelatedJobs] = useState<boolean>(false);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const navigate = useNavigate();

    let location = useLocation();
    let params = new URLSearchParams(location.search);
    const id = params?.get("id"); // job id

    useEffect(() => {
        const init = async () => {
            if (id) {
                setIsLoading(true)
                const res = await callFetchJobById(id);
                console.log(res);
                if (res?.data) {
                    setJobDetail(res.data)
                }
                setIsLoading(false)
            }
        }
        init();
    }, [id]);

    useEffect(() => {
        const fetchRelatedJobs = async () => {
            if (jobDetail?.jobProfession?.id) {
                setIsLoadingRelatedJobs(true);
                try {
                    const res = await callJobByJobProfession(jobDetail.jobProfession.id);
                    console.log("related jobs", res?.data);
                    // Kiểm tra cả result và content để tương thích với cả hai format
                    const jobs = (res?.data as any)?.content || (res?.data as any)?.result || [];
                    if (jobs && Array.isArray(jobs)) {
                        // Loại bỏ job hiện tại khỏi danh sách
                        const filteredJobs = jobs.filter((job: IJob) => job.id !== jobDetail.id);
                        setRelatedJobs(filteredJobs);
                    }
                } catch (error) {
                    console.error("Error fetching related jobs:", error);
                } finally {
                    setIsLoadingRelatedJobs(false);
                }
            }
        };
        fetchRelatedJobs();
    }, [jobDetail?.jobProfession?.id, jobDetail?.id]);
    const handleClickSaveJob= async ()=>{
        if (!jobDetail?.id) {
            message.error("Không tìm thấy ID việc làm");
            return;
          }
        const res = await callSavedJob(jobDetail.id);
        if(res.data){
            message.success("Lưu việc làm thành công");
        }else{
            message.error("Lưu việc làm thất bại");
        }
    }

    const handleViewDetailJob = (item: IJob) => {
        const slug = convertSlug(item.name);
        navigate(`/job/${slug}?id=${item.id}`)
    }

    const handleSaveJob = async (e: React.MouseEvent, jobId?: string) => {
        e.stopPropagation();
        if (!jobId) {
            message.error('Không tìm thấy ID công việc!');
            return;
        }
        try {
            const res = await callSavedJob(jobId);
            if (res && res.data) {
                message.success('Đã lưu công việc thành công!');
            }
        } catch (error) {
            message.error('Có lỗi xảy ra khi lưu công việc!');
        }
    }

    const formatSalary = (item: IJob) => {
        if (item.salaryType === "NEGOTIABLE" || (item.minSalary === 0 && item.maxSalary === 0)) {
            return "Thoả thuận";
        }
        if (item.salaryType === "SPECIFIC" && item.minSalary && item.maxSalary) {
            const min = item.minSalary.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            const max = item.maxSalary.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return `${min} - ${max} triệu`;
        }
        return "Thoả thuận";
    }
    return (
        <div className={`${styles["container"]} ${styles["detail-job-section"]}`} style={{ marginTop: '15px' }}>
            <Breadcrumb 
                items={[
                    { title: <Link to="/">Trang chủ</Link> },
                    { title: <Link to="/job">Việc làm</Link> },
                    { title: <span style={{ color: '#197bcd' }}>{jobDetail?.name || 'Chi tiết việc làm'}</span> }
                ]} 
                style={{ marginBottom: '16px' }}
            />
            {isLoading ?
                <Skeleton />
                :
                <Row gutter={[20, 20]}>
                    {jobDetail && jobDetail.id &&
                        <>
                          
                         <Col span={24} md={16}>
                            {/* Card 1: Thông tin công việc và nút ứng tuyển */}
                            <Card 
                                bordered={false}
                                style={{ 
                                    backgroundColor: '#ffffff',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    borderRadius: '8px',
                                    padding: '24px'
                                }}
                            >
                                <div className={styles["header"]}>
                                    {jobDetail.name}
                                </div>

                                <div className={styles["job-info-card"]}>
                                    <div className={styles["info-row"]}>
                                        <div className={styles["info-item"]}>
                                            <div className={styles["info-label"]}>
                                                <CalendarOutlined style={{ marginRight: 6 }} />
                                                Ngày đăng
                                            </div>
                                            <div className={styles["info-value"]}>
                                                {dayjs(jobDetail.createdAt).format('DD/MM/YYYY')}
                                            </div>
                                        </div>
                                        <div className={styles["info-item"]}>
                                            <div className={styles["info-label"]}>
                                                <TeamOutlined style={{ marginRight: 6 }} />
                                                Số lượng tuyển
                                            </div>
                                            <div className={styles["info-value"]}>{jobDetail.quantity}</div>
                                        </div>
                                    </div>

                                    <div className={styles["info-row"]}>
                                        <div className={styles["info-item"]}>
                                            <div className={styles["info-label"]}>
                                                <RiseOutlined style={{ marginRight: 6 }} />
                                                Cấp bậc
                                            </div>
                                            <div className={styles["info-value"]}>
                                                {jobDetail.level || 'Nhân viên'}
                                            </div>
                                        </div>
                                        <div className={styles["info-item"]}>
                                            <div className={styles["info-label"]}>
                                                <EnvironmentOutlined style={{ marginRight: 6 }} />
                                                Vị trí
                                            </div>
                                            <div className={styles["info-value"]}>
                                                {getLocationName(jobDetail.location)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles["apply-btn-container"]}>
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className={styles["btn-apply"]}
                                    >
                                        <CheckCircleOutlined style={{ marginRight: 8 }} />
                                        Ứng tuyển
                                    </button>
                                    <button
                                        onClick={() => handleClickSaveJob()}
                                        className={styles["btn-apply"]}
                                        style={{ marginLeft: 10,width: '300px',backgroundColor: 'green' }}
                                    >
                                        <CheckCircleOutlined style={{ marginRight: 8 }} />
                                       Lưu việc làm
                                    </button>
                                </div>
                            </Card>

                            {/* Card 2: Kỹ năng và mô tả công việc */}
                            <Card 
                                bordered={false}
                                style={{ 
                                    backgroundColor: '#ffffff',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    borderRadius: '8px',
                                    padding: '24px',
                                    marginTop: '30px'
                                }}
                            >
                                <div className={styles["skills"]}>
                                    <div className={styles["section-title"]}>
                                        <CheckCircleOutlined style={{ marginRight: 6 }} />
                                        Kỹ năng yêu cầu
                                    </div>
                                    <div className={styles["skills-list"]}>
                                        {jobDetail?.skills?.map((item, index) => (
                                            <Tag key={`${index}-key`} color="#197bcd">
                                                {item.name}
                                            </Tag>
                                        ))}
                                    </div>
                                </div>

                                <Divider />
                                
                                <h3> <b>Mô tả công việc</b> </h3>
                                <div className={styles["job-description"]}>
                                    {parse(String(jobDetail.description || ''))}
                                </div>
                                <h3> <b>Yêu cầu ứng viên</b></h3>
                                <div className={styles["job-description"]}>
                                    {parse(String(jobDetail.request || ''))}
                                </div>
                              
                                <h3><b>Quyền lợi được hưởng</b></h3>
                                <div className={styles["job-description"]}>
                                    {parse(String(jobDetail.interest || ''))}
                                </div>
                                <h3><b>Địa điểm làm việc</b></h3>
                                <div className={styles["job-description"]}>
                                    {parse(String(jobDetail.worklocation || ''))}
                                </div>
                                <h3><b>Thời gian làm việc</b></h3>
                                <div className={styles["job-description"]}>
                                    {parse(String(jobDetail.worktime || ''))}
                                </div>
                            </Card>
                        </Col>

                            <Col span={24} md={8}>
                                <Card 
                                    bordered={false}
                                    style={{ 
                                        backgroundColor: '#ffffff',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        borderRadius: '8px',
                                        padding: 0,
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Company Banner */}
                                    <div style={{
                                        width: '100%',
                                        height: '120px',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        background: (jobDetail?.company as any)?.banner 
                                            ? 'transparent' 
                                            : 'linear-gradient(135deg, #197bcd 0%, #1569a3 100%)'
                                    }}>
                                        {(jobDetail?.company as any)?.banner && (
                                            <img
                                                src={(jobDetail?.company as any)?.banner}
                                                alt="company banner"
                                                style={{
                                                    width: '100%',
                                                    height: '240px',
                                                    objectFit: 'cover',
                                                    objectPosition: 'center top'
                                                }}
                                            />
                                        )}
                                    </div>

                                    {/* Company Logo - chồng lên banner */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        marginTop: '-50px',
                                        marginBottom: '20px',
                                        position: 'relative',
                                        zIndex: 1
                                    }}>
                                        <div style={{
                                            width: '120px',
                                            height: '120px',
                                            borderRadius: '50%',
                                            border: '4px solid #ffffff',
                                            overflow: 'hidden',
                                            backgroundColor: '#ffffff',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                        
                                            justifyContent: 'center'
                                        }}>
                                            <img
                                                src={jobDetail?.company?.logo || "https://via.placeholder.com/200x200?text=No+Logo"}
                                                alt="company logo"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'contain'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Company Info */}
                                    <div style={{
                                        padding: '0 20px 20px 20px',
                                        textAlign: 'center'
                                    }}>
                                        <h3 style={{
                                            margin: '0 0 12px 0',
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            color: '#333'
                                        }}>
                                            {jobDetail.company?.name}
                                        </h3>
                                        {(jobDetail?.company as any)?.address && (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                color: '#666',
                                                fontSize: '14px',
                                                marginBottom: '12px'
                                            }}>
                                                <EnvironmentOutlined />
                                                <span>{(jobDetail?.company as any)?.address}</span>
                                            </div>
                                        )}
                                        {(jobDetail?.company as any)?.description && (
                                            <div style={{
                                                color: '#666',
                                                fontSize: '13px',
                                                lineHeight: '1.5',
                                                marginTop: '12px',
                                                textAlign: 'left',
                                                maxHeight: '100px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {parse(String((jobDetail?.company as any)?.description || '').substring(0, 150))}
                                                {String((jobDetail?.company as any)?.description || '').length > 150 ? '...' : ''}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                                
                                {/* Card: Danh sách việc làm cùng ngành */}
                                <Card 
                        bordered={false}
                        style={{ 
                            backgroundColor: '#ffffff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            borderRadius: '8px',
                            padding: '20px',
                            marginTop: '20px'
                        }}
                    >
                        <div className={savejobStyles['suggested-title']}>
                            Việc tương tự
                        </div>
                        <Spin spinning={isLoadingRelatedJobs} tip="Loading...">
                            {relatedJobs && relatedJobs.length > 0 ? (
                                <div className={savejobStyles['suggested-jobs-list']}>
                                    {relatedJobs.map((item) => {
                                        return (
                                            <div 
                                                key={item.id}
                                                className={savejobStyles['suggested-job-card']}
                                                onClick={() => handleViewDetailJob(item)}
                                            >
                                                <div className={savejobStyles['suggested-job-content']}>
                                                    <div className={savejobStyles['job-left']}>
                                                        <img
                                                            src={item?.company?.logo || "https://via.placeholder.com/200x200?text=No+Logo"}
                                                            alt={item.company?.name}
                                                            className={savejobStyles['company-logo-small']}
                                                        />
                                                    </div>
                                                    <div className={savejobStyles['job-right']}>
                                                        <Text className={savejobStyles['company-name']}>
                                                            {item.company?.name}
                                                        </Text>
                                                        <Title level={5} className={savejobStyles['job-title']}>
                                                            {item.name}
                                                        </Title>
                                                        <div className={savejobStyles['job-info']}>
                                                            <span className={savejobStyles['location-icon']}>
                                                                <EnvironmentOutlined />
                                                                <span className={savejobStyles['location-text']}>
                                                                    {getLocationName(item.location)}
                                                                </span>
                                                            </span>
                                                            <span className={savejobStyles['salary-tag']}>
                                                                <DollarOutlined />
                                                                {formatSalary(item)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className={savejobStyles['job-actions']}>
                                                        <Button
                                                            type="text"
                                                            icon={<HeartOutlined />}
                                                            className={savejobStyles['save-btn']}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSaveJob(e, item.id);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                !isLoadingRelatedJobs && (
                                    <Empty description="Không có việc làm cùng ngành" />
                                )
                            )}
                        </Spin>
        </Card>
                            </Col>
                        </>
                    }
                </Row>
            }
            <ApplyModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                jobDetail={jobDetail}
            />
        </div>
    )
}
export default ClientJobDetailPage;