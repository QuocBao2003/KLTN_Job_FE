import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { ICompany, IJob } from "@/types/backend";
import { callFetchCompanyById, callFetchJobByCompanyIdAndStatus } from "@/config/api";
import styles from 'styles/client.module.scss';
import parse from 'html-react-parser';
import { Col, Divider, Row, Skeleton, Card, Spin, Empty, Button, Tag } from "antd";
import { EnvironmentOutlined, DollarOutlined, HeartOutlined } from "@ant-design/icons";
import { convertSlug, getLocationName } from '@/config/utils';
import { isMobile } from 'react-device-detect';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);


const ClientCompanyDetailPage = (props: any) => {
    const [companyDetail, setCompanyDetail] = useState<ICompany | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [jobs, setJobs] = useState<IJob[] | null>(null);
    const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(false);

    let location = useLocation();
    let params = new URLSearchParams(location.search);
    const id = params?.get("id"); // company id
    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            if (id) {
                setIsLoading(true)
                const res = await callFetchCompanyById(id);
                if (res?.data) {
                    setCompanyDetail(res.data)
                }
                setIsLoading(false)
            }
        }
        init();
    }, [id]);

    useEffect(() => {
        const fetchJobs = async () => {
            if (companyDetail?.id) {
                setIsLoadingJobs(true);
                const query = `page=1&size=9&status=ACTIVE`;
                const res = await callFetchJobByCompanyIdAndStatus(companyDetail.id, query);
                if (res && res.data) {
                    setJobs(res.data.result);
                }
                setIsLoadingJobs(false);
            }
        };
        fetchJobs();
    }, [companyDetail?.id]);

    const calculateDaysLeft = (endDate: Date | string) => {
        const end = dayjs(endDate);
        const now = dayjs();
        const days = end.diff(now, 'day');
        return days > 0 ? days : 0;
    };

    const formatSalary = (item: IJob) => {
        if (item.salaryType === "NEGOTIABLE") {
            return "Thoả thuận";
        }
        if (item.salaryType === "SPECIFIC" && item.minSalary && item.maxSalary) {
            const min = item.minSalary.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            const max = item.maxSalary.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return `${min} - ${max} đ`;
        }
        return "Thoả thuận";
    };

    return (
        <div className={`${styles["container"]} ${styles["company-detail-page"]}`}>
            {isLoading ?
                <Skeleton />
                :
                <>
                    {companyDetail && companyDetail.id &&
                        <>
                            {/* Header Banner */}
                            <div className={styles["company-header-banner"]}>
                                <div className={styles["company-header-content"]}>
                                    <div className={styles["company-logo-header"]}>
                                        <img
                                            alt={companyDetail.name}
                                            src={companyDetail?.logo || "https://via.placeholder.com/200x200?text=No+Logo"}
                                        />
                                    </div>
                                    <div className={styles["company-header-info"]}>
                                        <h1 className={styles["company-name-header"]}>{companyDetail.name}</h1>
                                        <div className={styles["company-address-header"]}>
                                            <EnvironmentOutlined />&nbsp;{companyDetail?.address}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Company Description Section */}
                            <div className={styles["company-info-section"]}>
                                <div className={styles["company-description"]}>
                                    {parse(companyDetail?.description ?? "")}
                                </div>
                            </div>

                            {/* Job Listings Section */}
                            <div className={styles["job-listings-section"]}>
                                <div className={styles["job-listings-header"]}>
                                    <h2 className={styles["job-listings-title"]}>Công Việc Đang Tuyển</h2>
                                </div>
                                <Spin spinning={isLoadingJobs} tip="Loading...">
                                    <div className={styles["job-listings-container"]}>
                                        {jobs && jobs.length > 0 ? (
                                            jobs.map(item => {
                                                const handleViewDetailJob = () => {
                                                    const slug = convertSlug(item.name);
                                                    navigate(`/job/${slug}?id=${item.id}`)
                                                };

                                                const handleApply = (e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    handleViewDetailJob();
                                                };

                                                const daysLeft = calculateDaysLeft(item.endDate);
                                                const daysLeftText = daysLeft > 0 ? `Còn ${daysLeft} ngày để ứng tuyển` : "Đã hết hạn";

                                                return (
                                                    <div 
                                                        key={item.id} 
                                                        className={styles["job-listing-card"]}
                                                        onClick={handleViewDetailJob}
                                                    >
                                                        <Button 
                                                            className={styles["save-button-top"]}
                                                            icon={<HeartOutlined />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Handle save job logic here
                                                            }}
                                                        />
                                                        <div className={styles["job-listing-left"]}>
                                                            <div className={styles["job-logo-wrapper"]}>
                                                                <img
                                                                    alt={item.company?.name || companyDetail?.name || "Company"}
                                                                    src={item?.company?.logo || companyDetail?.logo || "https://via.placeholder.com/200x200?text=No+Logo"}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className={styles["job-listing-content"]}>
                                                            <div className={styles["job-listing-header-row"]}>
                                                                <h3 className={styles["job-listing-title"]}>{item.name}</h3>
                                                            </div>
                                                            <div className={styles["job-listing-info-row"]}>
                                                                <span className={styles["job-company-name"]}>
                                                                    {item.company?.name || ""}
                                                                </span>
                                                                <span className={styles["job-separator"]}>•</span>
                                                                <span className={styles["job-salary"]}>
                                                                    <DollarOutlined />&nbsp;{formatSalary(item)}
                                                                </span>
                                                                <span className={styles["job-separator"]}>•</span>
                                                                <span className={styles["job-location"]}>
                                                                    <EnvironmentOutlined />&nbsp;{getLocationName(item.location)}
                                                                </span>
                                                                <span className={styles["job-separator"]}>•</span>
                                                                <span className={styles["job-deadline"]}>
                                                                    {daysLeftText}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className={styles["job-listing-actions"]}>
                                                            <Button 
                                                                type="primary" 
                                                                className={styles["apply-button"]}
                                                                style={{backgroundColor:"#00b14f",borderColor:"#00b14f"}}
                                                                onClick={handleApply}
                                                            >
                                                                Ứng tuyển
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            !isLoadingJobs && (
                                                <div className={styles["empty"]}>
                                                    <Empty description="Không có công việc đang tuyển" />
                                                </div>
                                            )
                                        )}
                                    </div>
                                </Spin>
                            </div>
                        </>
                    }
                </>
            }
        </div>
    )
}
export default ClientCompanyDetailPage;