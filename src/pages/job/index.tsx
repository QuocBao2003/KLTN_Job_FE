import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Checkbox, Radio, Divider, Pagination, Empty, Spin, Select, ConfigProvider, Input } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { callFetchAllJobProfessionSkillJob, callFetchJob } from '@/config/api';
import { IJob, IJobProfession, ISkill } from '@/types/backend';
import JobCard from './jobCard';
import { JOB_LEVELS } from './jobTypeSelector';

const ClientJobPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [loading, setLoading] = useState(false);
    const [jobs, setJobs] = useState<IJob[]>([]);
    const [professions, setProfessions] = useState<IJobProfession[]>([]);
    const [total, setTotal] = useState(0);

    const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    // Mặc định là tìm theo tên job
    const [searchType, setSearchType] = useState('job');

    useEffect(() => {
        const fetchMasterData = async () => {
            const res = await callFetchAllJobProfessionSkillJob();
            if (res && res.data) {
                setProfessions(res.data as IJobProfession[]);
            }
        };
        fetchMasterData();
    }, []);

    // 2. CORE LOGIC: Đồng bộ URL -> State & Gọi API
    useEffect(() => {
        const professionIds = searchParams.get('jobProfession')?.split(',').filter(Boolean) || [];
        const levels = searchParams.get('level')?.split(',').filter(Boolean) || [];
        const skills = searchParams.get('skills')?.split(',').filter(Boolean) || [];

        setSelectedProfessions(professionIds);
        setSelectedLevels(levels);
        setSelectedSkills(skills);

        fetchJobs(searchParams);
    }, [searchParams.toString()]);

    const availableSkills = useMemo(() => {
        if (selectedProfessions.length === 0) return [];
        const selectedProfsData = professions.filter(p => selectedProfessions.includes(String(p.id)));
        const allSkills: ISkill[] = [];
        selectedProfsData.forEach(prof => {
            prof.jobs?.forEach(job => {
                job.skills?.forEach(skill => {
                    if (!allSkills.find(s => s.id === skill.id)) {
                        allSkills.push(skill);
                    }
                })
            })
        });
        return allSkills;
    }, [selectedProfessions, professions]);

    // 3. Hàm gọi API
    const fetchJobs = async (params: URLSearchParams) => {
        setLoading(true);
        try {
            const current = params.get('current') || '1';
            const pageSize = params.get('pageSize') || '10';

            const queryParts: string[] = [];

            // Backend Spring Boot page bắt đầu từ 0
            queryParts.push(`page=${Number(current) - 1}`);
            queryParts.push(`size=${pageSize}`);

            // Sort
            const sort = params.get('sort') || 'createdAt,desc';
            queryParts.push(`sort=${sort}`);

            // --- QUAN TRỌNG: ĐỔI TÊN THAM SỐ ĐỂ KHỚP BACKEND ---

            // Lấy từ URL là 'jobProfession' -> Gửi xuống Backend là 'professionIds'
            if (params.get('jobProfession')) {
                queryParts.push(`professionIds=${encodeURIComponent(params.get('jobProfession')!)}`);
            }

            // Lấy từ URL là 'skills' -> Gửi xuống Backend là 'skillIds'
            if (params.get('skills')) {
                queryParts.push(`skillIds=${encodeURIComponent(params.get('skills')!)}`);
            }

            // Lấy từ URL là 'level' -> Gửi xuống Backend là 'jobLevels'
            if (params.get('level')) {
                queryParts.push(`jobLevels=${encodeURIComponent(params.get('level')!)}`);
            }
            // ----------------------------------------------------

            // Các field search cơ bản (name, location) giữ nguyên
            if (params.get('name')) queryParts.push(`name=${encodeURIComponent(params.get('name')!)}`);
            if (params.get('location')) queryParts.push(`location=${encodeURIComponent(params.get('location')!)}`);

            const query = queryParts.join('&');

            // Log để kiểm tra: Bạn phải thấy professionIds ở đây
            console.log(">>> API Query:", query);

            const res = await callFetchJob(query);

            if (res && res.data) {
                setJobs(res.data.result);
                setTotal(res.data.meta.total);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, values: string[]) => {
        const newParams = new URLSearchParams(searchParams);
        if (values && values.length > 0) {
            newParams.set(key, values.join(','));
        } else {
            newParams.delete(key);
        }
        newParams.set('current', '1');
        setSearchParams(newParams);
    };

    const handlePaginationChange = (page: number, pageSize: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('current', String(page));
        newParams.set('pageSize', String(pageSize));
        setSearchParams(newParams);
    };

    const onSearch = (value: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set('name', value);
        } else {
            newParams.delete('name');
        }
        newParams.set('current', '1');
        setSearchParams(newParams);
    };

    // Hàm xử lý Sort
    const handleSortChange = (value: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (value === 'newest') newParams.set('sort', 'createdAt,desc');
        else if (value === 'salary') newParams.set('sort', 'salary,desc'); // Field này cần khớp Backend

        newParams.set('current', '1');
        setSearchParams(newParams);
    }

    const currentPageFromUrl = Number(searchParams.get('current')) || 1;
    const pageSizeFromUrl = Number(searchParams.get('pageSize')) || 10;
    const currentKeyword = searchParams.get('name') || '';

    // Xác định giá trị Sort để hiển thị lên UI Select
    let currentSort = 'newest';
    const sortParam = searchParams.get('sort');
    if (sortParam === 'salary,desc') currentSort = 'salary';

    return (
        <div style={{ backgroundColor: '#f4f5f5', minHeight: '100vh', padding: '20px 0' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 15px' }}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={6}>
                        <div style={{ backgroundColor: '#fff', borderRadius: 8, padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
                                <FilterOutlined style={{ color: '#00b14f', fontSize: 18 }} />
                                <span style={{ fontWeight: 700, fontSize: 16 }}>Lọc nâng cao</span>
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <h4 style={{ fontWeight: 600, marginBottom: 12 }}>Ngành nghề</h4>
                                <Checkbox.Group
                                    style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                                    value={selectedProfessions}
                                    onChange={(vals) => handleFilterChange('jobProfession', vals as string[])}
                                >
                                    {professions.slice(0, 10).map((p) => (
                                        <Checkbox key={p.id} value={String(p.id)} style={{ marginLeft: 0 }}>
                                            {p.name}
                                        </Checkbox>
                                    ))}
                                </Checkbox.Group>
                                {professions.length > 10 && <div style={{ color: '#00b14f', cursor: 'pointer', marginTop: 8, fontSize: 13 }}>Xem thêm</div>}
                            </div>
                            <Divider style={{ margin: '12px 0' }} />
                            {selectedProfessions.length > 0 && availableSkills.length > 0 && (
                                <>
                                    <div style={{ marginBottom: 24 }}>
                                        <h4 style={{ fontWeight: 600, marginBottom: 12 }}>Kỹ năng chuyên môn</h4>
                                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            <Checkbox.Group
                                                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                                                value={selectedSkills}
                                                onChange={(vals) => handleFilterChange('skills', vals as string[])}
                                            >
                                                {availableSkills.map((s) => (
                                                    <Checkbox key={s.id} value={String(s.id)} style={{ marginLeft: 0 }}>
                                                        {s.name}
                                                    </Checkbox>
                                                ))}
                                            </Checkbox.Group>
                                        </div>
                                    </div>
                                    <Divider style={{ margin: '12px 0' }} />
                                </>
                            )}
                            <div style={{ marginBottom: 24 }}>
                                <h4 style={{ fontWeight: 600, marginBottom: 12 }}>Cấp bậc</h4>
                                <Checkbox.Group
                                    style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                                    value={selectedLevels}
                                    onChange={(vals) => handleFilterChange('level', vals as string[])}
                                >
                                    {JOB_LEVELS.map((level) => (
                                        <Checkbox key={level.id} value={level.id} style={{ marginLeft: 0 }}>
                                            {level.name}
                                        </Checkbox>
                                    ))}
                                </Checkbox.Group>
                            </div>
                        </div>
                    </Col>

                    <Col xs={24} md={18}>
                        {/* THANH TÌM KIẾM */}
                        <div style={{
                            backgroundColor: '#fff', borderRadius: 8, padding: '16px',
                            marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}>
                            <Input.Search
                                placeholder="Tìm kiếm công việc, kỹ năng, công ty..."
                                allowClear
                                enterButton="Tìm kiếm"
                                size="large"
                                defaultValue={currentKeyword}
                                onSearch={onSearch}
                                style={{ width: '100%' }}
                            />
                        </div>

                        {/* Header Filter & Sort */}
                        <div style={{
                            backgroundColor: '#fff', borderRadius: 8, padding: '12px 16px',
                            marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ color: '#555' }}>Tìm kiếm theo:</span>
                                <Radio.Group
                                    value={searchType}
                                    onChange={(e) => setSearchType(e.target.value)}
                                    buttonStyle="solid"
                                >
                                    <Radio.Button value="job">Tên việc làm</Radio.Button>
                                    <Radio.Button value="company">Tên công ty</Radio.Button>
                                </Radio.Group>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ color: '#555' }}>Sắp xếp theo:</span>
                                <Select
                                    value={currentSort} // Bind value vào state URL
                                    style={{ width: 150 }}
                                    bordered={false}
                                    onChange={handleSortChange} // Thêm sự kiện onChange
                                >
                                    <Select.Option value="newest">Mới nhất</Select.Option>
                                    <Select.Option value="salary">Lương cao nhất</Select.Option>
                                </Select>
                            </div>
                        </div>

                        {/* Search keyword info */}
                        {searchParams.get('name') && (
                            <div style={{ marginBottom: 16, fontSize: 16 }}>
                                Kết quả tìm kiếm cho: <strong>"{searchParams.get('name')}"</strong>
                            </div>
                        )}

                        {/* List Jobs */}
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>
                        ) : (
                            <>
                                {jobs.length === 0 ? (
                                    <Empty description="Không tìm thấy công việc phù hợp" />
                                ) : (
                                    jobs.map(job => (
                                        <JobCard key={job.id} job={job} />
                                    ))
                                )}

                                {/* Pagination */}
                                {jobs.length > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                                        <Pagination
                                            current={currentPageFromUrl}
                                            pageSize={pageSizeFromUrl}
                                            total={total}
                                            onChange={handlePaginationChange}
                                            showSizeChanger={false}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default ClientJobPage;