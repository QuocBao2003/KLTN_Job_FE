import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { IJob } from "@/types/backend";
import { callFetchJobById, callSavedJob } from "@/config/api";
import styles from 'styles/client.module.scss';
import parse from 'html-react-parser';
import { Col, Divider, message, Row, Skeleton, Tag, Card } from "antd";
import { DollarOutlined, EnvironmentOutlined, HistoryOutlined } from "@ant-design/icons";
import { getLocationName } from "@/config/utils";
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

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    let location = useLocation();
    let params = new URLSearchParams(location.search);
    const id = params?.get("id"); // job id

    useEffect(() => {
        const init = async () => {
            if (id) {
                setIsLoading(true)
                const res = await callFetchJobById(id);
                if (res?.data) {
                    setJobDetail(res.data)
                }
                setIsLoading(false)
            }
        }
        init();
    }, [id]);
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
    return (
        <div className={`${styles["container"]} ${styles["detail-job-section"]}`} style={{ marginTop: '15px' }}>
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
                                <h3>Mô tả công việc</h3>
                                <div className={styles["job-description"]}>
                                    {parse(String(jobDetail.description || ''))}
                                </div>
                                <h3>Yêu cầu ứng viên</h3>
                                <div className={styles["job-description"]}>
                                    {parse(String(jobDetail.request || ''))}
                                </div>
                              
                                <h3>Quyền lợi được hưởng</h3>
                                <div className={styles["job-description"]}>
                                    {parse(String(jobDetail.interest || ''))}
                                </div>
                                <h3>Địa điểm làm việc</h3>
                                <div className={styles["job-description"]}>
                                    {parse(String(jobDetail.worklocation || ''))}
                                </div>
                                <h3>Thời gian làm việc</h3>
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
                                            width: '100px',
                                            height: '100px',
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
                                                    objectFit: 'cover'
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