import { callFetchCompany, callCountJobByCompanyIdAndStatus } from '@/config/api';
import { convertSlug } from '@/config/utils';
import { ICompany } from '@/types/backend';
import { Card, Col, Empty, Pagination, Row, Spin } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import styles from 'styles/client.module.scss';

interface IProps {
    showPagination?: boolean;
}

const CompanyCard = (props: IProps) => {
    const { showPagination = false } = props;

    const [searchParams] = useSearchParams();

    const [displayCompany, setDisplayCompany] = useState<ICompany[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [jobCounts, setJobCounts] = useState<Map<string, number>>(new Map());

    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(4);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState("");
    const [sortQuery, setSortQuery] = useState("sort=updatedAt,desc");
    const navigate = useNavigate();

    useEffect(() => {
        fetchCompany();
    }, [current, pageSize, filter, sortQuery, searchParams]);

    const fetchCompany = async () => {
        setIsLoading(true)
        let query = `page=${current}&size=${pageSize}`;

        // --- 4. LOGIC XÂY DỰNG FILTER TỪ URL ---
        const nameParam = searchParams.get('name');
        // const locationParam = searchParams.get('location');
        
        const filterParts = [];

        // Filter theo tên (dùng toán tử ~ like)
        if (nameParam) {
            filterParts.push(`name~'${nameParam}'`);
        }

        // Filter theo địa điểm (dùng toán tử in)
        // if (locationParam) {
        //     // URL dạng: Hanoi,Ho Chi Minh -> convert thành: 'Hanoi','Ho Chi Minh'
        //     const locations = locationParam.split(',').map(loc => `'${loc}'`).join(',');
        //     filterParts.push(`address in [${locations}]`);
        // }

        // Ghép chuỗi filter
        if (filterParts.length > 0) {
            query += `&filter=${encodeURIComponent(filterParts.join(' and '))}`;
        }
        // ---------------------------------------

        if (sortQuery) {
            query += `&${sortQuery}`;
        }

        const res = await callFetchCompany(query);
        if (res && res.data) {
            setDisplayCompany(res.data.result);
            setTotal(res.data.meta.total)
            
            // ... (Giữ nguyên phần fetch job counts) ...
            const counts = new Map<string, number>();
            const promises = res.data.result.map(async (company: ICompany) => {
                if (!company.id) return;
                try {
                    const countRes = await callCountJobByCompanyIdAndStatus(company.id);
                    if (countRes && countRes.data) {
                        const count = typeof countRes.data === 'object' && 'approvedJobsCount' in countRes.data
                            ? (countRes.data as any).approvedJobsCount
                            : countRes.data;
                        counts.set(company.id, count || 0);
                    }
                } catch (error) {
                    console.error(`Error fetching job count for company ${company.id}:`, error);
                    counts.set(company.id, 0);
                }
            });
            await Promise.all(promises);
            setJobCounts(counts);
        }
        setIsLoading(false)
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

    const handleViewDetailJob = (item: ICompany) => {
        if (item.name) {
            const slug = convertSlug(item.name);
            navigate(`/company/${slug}?id=${item.id}`)
        }
    }

    return (
        <div className={`${styles["company-section"]}`}>
            <div className={styles["company-content"]}>
                <Spin spinning={isLoading} tip="Loading...">
                    <Row gutter={[20, 20]}>
                        <Col span={24}>
                            <div className={isMobile ? styles["dflex-mobile"] : styles["dflex-pc"]}>
                                <span className={styles["title"]} style={{fontSize:"28px",fontWeight:"550",color:"#00b14f"}}>Nhà Tuyển Dụng Hàng Đầu</span>
                                {!showPagination &&
                                    <Link to="company" style={{fontSize:"16px",fontWeight:"550"}}>Xem tất cả</Link>
                                }
                            </div>
                        </Col>

                        {displayCompany?.map(item => {
                            return (
                                <Col span={24} md={6} key={item.id}>
                                    <Card
                                        onClick={() => handleViewDetailJob(item)}
                                        className={styles["company-card"]}
                                        hoverable
                                        bodyStyle={{ padding: 0 }}
                                    >
                                        <div className={styles["company-card-wrapper"]}>
                                            {/* Banner - chỉ hiển thị nửa trên */}
                                            <div className={styles["company-banner"]}>
                                                <img
                                                    src={item?.banner || "https://cdn-new.topcv.vn/unsafe/https://static.topcv.vn/v4/image/normal-company/cover/company_cover_1.jpg"}
                                                    alt="company banner"
                                                />
                                            </div>
                                            
                                            {/* Logo tròn - chồng lên banner */}
                                            <div className={styles["company-logo-wrapper"]}>
                                                <div className={styles["company-logo"]}>
                                                    <img
                                                        src={item?.logo || "https://via.placeholder.com/120x120?text=Logo"}
                                                        alt="company logo"
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* Tên công ty */}
                                            <div className={styles["company-info"]}>
                                                <h3 className={styles["company-name"]}>{item.name}</h3>
                                                {item.address && (
                                                    <div className={styles["company-address"]}>
                                                        <EnvironmentOutlined className={styles["address-icon"]} />
                                                        <span>{item.address}</span>
                                                    </div>
                                                )}
                                                {item.id && jobCounts.has(item.id) && (
                                                    <div className={styles["company-job-count"]} style={{color:"#00b14f"}}>
                                                        {jobCounts.get(item.id)} việc đang tuyển
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                            )
                        })}
                        
                        {(!displayCompany || displayCompany && displayCompany.length === 0)
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

export default CompanyCard;