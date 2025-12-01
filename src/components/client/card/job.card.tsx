import { callFetchJob, callSavedJob } from '@/config/api';
import { convertSlug, getLocationName } from '@/config/utils';
import { IJob } from '@/types/backend';
import { EnvironmentOutlined, DollarOutlined, HeartOutlined, FireOutlined, StarOutlined, LeftOutlined, RightOutlined, SketchOutlined } from '@ant-design/icons';
import { Card, Col, Empty, Pagination, Row, Spin, message, Tag, Button } from 'antd';
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
    const [pageSize, setPageSize] = useState(9);
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
        setIsLoading(true)
        let query = `page=${current}&size=${pageSize}`;
        if (filter) {
            query += `&${filter}`;
        }
        if (sortQuery) {
            query += `&${sortQuery}`;
        }

        const queryLocation = searchParams.get("location");
        const querySkills = searchParams.get("skills")
        if (queryLocation || querySkills) {
            let q = "";
            if (queryLocation) {
                q = sfIn("location", queryLocation.split(",")).toString();
            }

            if (querySkills) {
                q = queryLocation ?
                    q + " and " + `${sfIn("skills", querySkills.split(","))}`
                    : `${sfIn("skills", querySkills.split(","))}`;
            }

            query += `&filter=${encodeURIComponent(q)}`;
        }

        const res = await callFetchJob(query);
        if (res && res.data) {
            setDisplayJob(res.data.result);
            setTotal(res.data.meta.total)
            console.log("displayJob", res.data.result);
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

    const handlePrevPage = () => {
        if (current > 1) {
            setCurrent(current - 1);
        }
    }

    const handleNextPage = () => {
        const totalPages = Math.ceil(total / pageSize);
        if (current < totalPages) {
            setCurrent(current + 1);
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

    return (
        <div className={`${styles["card-job-section"]}`}>
            <div className={`${styles["job-content"]}`}>
                <Spin spinning={isLoading} tip="Loading...">
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                            <div className={isMobile ? styles["dflex-mobile"] : styles["dflex-pc"]}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                                    <span className={styles["title"]}>Công Việc Mới Nhất</span>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <Button
                                            type="default"
                                            shape="circle"
                                            icon={<LeftOutlined />}
                                            onClick={handlePrevPage}
                                            disabled={current === 1 || isLoading}
                                            size="small"
                                        />
                                        <Button
                                            type="default"
                                            shape="circle"
                                            icon={<RightOutlined />}
                                            onClick={handleNextPage}
                                            disabled={current >= Math.ceil(total / pageSize) || isLoading}
                                            size="small"
                                        />
                                    </div>
                                </div>
                                {!showPagination &&
                                    <Link to="job">Xem tất cả</Link>
                                }
                            </div>
                        </Col>

                        {displayJob?.map(item => {
                            // Kiểm tra các feature của gói dịch vụ
                            const isFeatured = item.isFeatured || false; 
                        
                            const hasBoldTitle = item.hasBoldTitle || false;
                            const hotJob = isFeatured && hasBoldTitle; // Gói 3: FEATURED_JOB
                            const topJob = !isFeatured && hasBoldTitle;
                            return (
                                <Col span={24} md={8} key={item.id}>
                                    <Card 
                                        size="small" 
                                        title={null} 
                                        hoverable
                                        className={`${styles["job-card-wrapper"]} ${isFeatured ? styles["featured-job"] : ''}`}
                                        onClick={() => handleViewDetailJob(item)}
                                       
                                    >
                                        <HeartOutlined 
                                            className={styles["heart-icon"]}
                                            onClick={(e) => handleSaveJob(e, item.id)}
                                        />
                                        
                                        <div className={styles["card-job-content"]}>
                                            <div className={styles["card-job-left"]}>
                                                <img
                                                    alt="example"
                                                    src={item.logo || "https://via.placeholder.com/200x200?text=No+Logo"}
                                                />
                                            </div>
                                            <div className={styles["card-job-right"]}>
                                                <div 
                                                    className={styles["job-title"]}
                                                    style={{
                                                        color: hasBoldTitle ? '#ff4d4f' : undefined,
                                                        fontWeight: hasBoldTitle ? 'bold' : undefined,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        flexWrap: 'wrap'
                                                    }}
                                                >

                                                    <span>{item.name}</span>
                                                    
                                                    {hotJob && (
                                                        <Tag 
                                                            icon={<FireOutlined />}
                                                            style={{ 
                                                                margin: 0,
                                                                fontSize: '11px',
                                                                background: 'linear-gradient(to right, #ed613c, #fd953d)',
                                                                color: 'white',
                                                                border: 'none'
                                                            }}
                                                        >
                                                           Hấp dẫn
                                                        </Tag>
                                                    )}
                                                    
                                                    {topJob && (
                                                        <Tag 
                                                            color="#00b14f" 
                                                            icon={<SketchOutlined />}
                                                            style={{ 
                                                                margin: 0,
                                                                fontSize: "11px",
                                                                fontWeight: 'bold',
                                                                 color : 'white'
                                                            }}
                                                        >
                                                            TOP
                                                        </Tag>
                                                    )}
                                                </div>
                                                <div className={styles["job-location"]}>
                                                    <EnvironmentOutlined style={{ color: 'gray' }} />
                                                    &nbsp;{getLocationName(item.location)}
                                                </div>
                                                <div>
                                                    <DollarOutlined style={{ color: '#2580ff' }} />&nbsp;
                                                    <span style={{ color: '#2580ff' }}>
                                                        {formatSalary(item)}
                                                    </span>
                                                </div>
                                                <div className={styles["job-updatedAt"]}>
                                                    {item.updatedAt 
                                                        ? dayjs(item.updatedAt).locale('en').fromNow() 
                                                        : dayjs(item.createdAt).locale('en').fromNow()}
                                                </div>
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