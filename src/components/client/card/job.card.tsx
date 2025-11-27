import { callFetchJob } from '@/config/api';
import { convertSlug, getLocationName } from '@/config/utils';
import { IJob } from '@/types/backend';
import { EnvironmentOutlined, DollarOutlined  } from '@ant-design/icons';
import { Card, Col, Empty, Pagination, Row, Spin } from 'antd';
import { useState, useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import styles from 'styles/client.module.scss';
import { sfIn } from "spring-filter-query-builder";

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

interface IProps {
    showPagination?: boolean;
}

const JobCard = (props: IProps) => {
    const { showPagination = false } = props;

    const [displayJob, setDisplayJob] = useState<IJob[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(6);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState("");
    const [sortQuery, setSortQuery] = useState("sort=updatedAt,desc");
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();

    useEffect(() => {
        fetchJob();
    }, [current, pageSize, filter, sortQuery, location]);

    const fetchJob = async () => {
        setIsLoading(true);

        let query = `page=${current}&size=${pageSize}`;

        // 1. Sort
        if (sortQuery) query += `&${sortQuery}`;

        // 2. Filter RQL (Location)
        const queryLocation = searchParams.get("location");
        const filterArr = [];
        if (queryLocation) {
            filterArr.push(sfIn("location", queryLocation.split(",")).toString());
        }

        // Xử lý Name (Search Keyword)
        // Nếu backend của bạn hỗ trợ tìm tên qua param `name=...` thì dùng dòng dưới:
        const queryName = searchParams.get("name");
        if (queryName) {
            // filterArr.push(`name~'${queryName}'`); // Nếu dùng RQL
            query += `&name=${queryName}`; // Nếu backend nhận param riêng
        }

        if (filter) filterArr.push(filter);
        if (filterArr.length > 0) {
            query += `&filter=${encodeURIComponent(filterArr.join(" and "))}`;
        }

        // 3. Xử lý Skills & Profession (Backend Java Param)
        // --- CODE QUAN TRỌNG CẦN CHECK ---
        const querySkills = searchParams.get("skills");
        const queryProfessions = searchParams.get("jobProfession");
        const queryLevels = searchParams.get("level");

        if (querySkills) {
            query += `&skills=${querySkills}`;
        }
        if (queryProfessions) {
            query += `&jobProfession=${queryProfessions}`;
        }
        if (queryLevels) {
            query += `&level=${queryLevels}`;
        }
        // ----------------------------------

        const res = await callFetchJob(query);
        if (res && res.data) {
            setDisplayJob(res.data.result);
            setTotal(res.data.meta.total);
        }
        setIsLoading(false);
    }

    const handleOnchangePage = (pagination: { current: number, pageSize: number }) => {
        if (pagination && pagination.current !== current) {
            setCurrent(pagination.current)
        }
        if (pagination && pagination.pageSize !== pageSize) {
            setPageSize(pagination.pageSize)
            setCurrent(1);
        }
    }

    const handleViewDetailJob = (item: IJob) => {
        const slug = convertSlug(item.name);
        navigate(`/job/${slug}?id=${item.id}`)
    }

<<<<<<< Updated upstream
=======
    const handleSaveJob = async (e: React.MouseEvent, jobId?: number) => {
        e.stopPropagation(); // Ngăn chặn event bubble lên card
        if (!jobId) {
            message.error('Không tìm thấy ID công việc!');
            return;
        }
        try {
            // Lưu ý: callSavedJob nhận string hay number? 
            // Nếu api nhận string thì convert: jobId.toString()
            const res = await callSavedJob(jobId.toString());
            if (res && res.data) {
                message.success('Đã lưu công việc thành công!');
            }
        } catch (error) {
            message.error('Có lỗi xảy ra khi lưu công việc!');
        }
    }

    const formatSalary = (item: IJob) => {
        if (item.salaryType === "NEGOTIABLE") {
            return "Thương lượng";
        }
        if (item.salaryType === "SPECIFIC" && item.minSalary && item.maxSalary) {
            const min = item.minSalary.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            const max = item.maxSalary.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return `${min} - ${max} đ`;
        }
        return "Thương lượng";
    }

>>>>>>> Stashed changes
    return (
        <div className={`${styles["card-job-section"]}`}>
            <div className={`${styles["job-content"]}`}>
                <Spin spinning={isLoading} tip="Loading...">
                    <Row gutter={[20, 20]}>
                        <Col span={24}>
                            <div className={isMobile ? styles["dflex-mobile"] : styles["dflex-pc"]}>
                                <span className={styles["title"]}>Công Việc Mới Nhất</span>
                                {!showPagination &&
                                    <Link to="job">Xem tất cả</Link>
                                }
                            </div>
                        </Col>

                        {displayJob?.map(item => {
                            return (
<<<<<<< Updated upstream
                                <Col span={24} md={12} key={item.id}>
                                    <Card size="small" title={null} hoverable
                                        onClick={() => handleViewDetailJob(item)}
                                    >
=======
                                <Col span={24} md={8} key={item.id}>
                                    <Card
                                        size="small"
                                        title={null}
                                        hoverable
                                        className={styles["job-card-wrapper"]}
                                        onClick={() => handleViewDetailJob(item)}
                                    >
                                        <HeartOutlined
                                            className={styles["heart-icon"]}
                                            onClick={(e) => handleSaveJob(e, item.id)}
                                        />
>>>>>>> Stashed changes
                                        <div className={styles["card-job-content"]}>
                                            <div className={styles["card-job-left"]}>
                                                <img
                                                    alt="example"
                                                    src={item?.company?.logo || "https://via.placeholder.com/200x200?text=No+Logo"}
                                                />
                                            </div>
                                            <div className={styles["card-job-right"]}>
                                                <div className={styles["job-title"]}>{item.name}</div>
                                                <div className={styles["job-location"]}><EnvironmentOutlined style={{ color: 'gray' }} />&nbsp;{getLocationName(item.location)}</div>
                                                <div>
                                                    <DollarOutlined style={{ color: '#2580ff' }} />&nbsp;
                                                    <span style={{ color: '#2580ff' }}>
                                                        {(item.salary + "")?.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} đ
                                                    </span>
                                                    </div>
                                                <div className={styles["job-updatedAt"]}>{item.updatedAt ? dayjs(item.updatedAt).locale('en').fromNow() : dayjs(item.createdAt).locale('en').fromNow()}</div>
                                            </div>
                                        </div>

                                    </Card>
                                </Col>
                            )
                        })}


                        {(!displayJob || displayJob && displayJob.length === 0)
                            && !isLoading &&
                            <div className={styles["empty"]}>
                                <Empty description="Không có dữ liệu" />
                            </div>
                        }
                    </Row>
                    {showPagination && <>
                        <div style={{ marginTop: 30 }}></div>
                        <Row style={{ display: "flex", justifyContent: "center" }}>
                            <Pagination
                                current={current}
                                total={total}
                                pageSize={pageSize}
                                responsive
                                onChange={(p: number, s: number) => handleOnchangePage({ current: p, pageSize: s })}
                            />
                        </Row>
                    </>}
                </Spin>
            </div>
        </div>
    )
}

export default JobCard;