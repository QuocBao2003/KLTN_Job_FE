import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { IJob } from "@/types/backend";
import { callFetchJobById } from "@/config/api";
import styles from 'styles/client.module.scss';
import parse from 'html-react-parser';
import { Col, Divider, Row, Skeleton, Tag } from "antd";
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

    return (
        <div className={`${styles["container"]} ${styles["detail-job-section"]}`}>
            {isLoading ?
                <Skeleton />
                :
                <Row gutter={[20, 20]}>
                    {jobDetail && jobDetail.id &&
                        <>
                          
                         <Col span={24} md={16}>
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
                            </div>

                            <Divider />

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

                            <div className={styles["job-description"]}>
                                
                                {parse(jobDetail.description)}
                            </div>
                        </Col>

                            <Col span={24} md={8}>
                                <div className={styles["company"]}>
                                    <div>
                                        <img
                                            width={"200px"}
                                            alt="example"
                                            src={`${import.meta.env.VITE_BACKEND_URL}/storage/company/${jobDetail.company?.logo}`}
                                        />
                                    </div>
                                    <div>
                                        {jobDetail.company?.name}
                                    </div>
                                </div>
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