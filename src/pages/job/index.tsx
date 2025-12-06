import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Checkbox, Divider, Pagination, Empty, Spin, Select, Input, Button } from 'antd';
// 1. Import thêm Icon sort
import { FilterOutlined, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { callFetchAllJobProfessionSkillJob, callFetchJob } from '@/config/api';
import { IJob, IJobProfession, ISkill } from '@/types/backend';
import JobCard from './jobCard';
import { JOB_LEVELS } from './jobTypeSelector';
import { sfIn, sfLike } from "spring-filter-query-builder";

const ClientJobPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [loading, setLoading] = useState(false);
    const [jobs, setJobs] = useState<IJob[]>([]);
    const [professions, setProfessions] = useState<IJobProfession[]>([]);
    const [total, setTotal] = useState(0);

    const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

    // Mặc định là createdAt và desc (Mới nhất)
    const sortParam = searchParams.get('sort') || 'createdAt,desc';
    const [sortField, sortOrder] = sortParam.split(',');
    const [paramField, paramOrder] = sortParam.split(',');

    let currentSortField = paramField;
    if (paramField === 'minSalary' || paramField === 'maxSalary') {
        currentSortField = 'salary';
    }

    const currentSortOrder = paramOrder;

    useEffect(() => {
        const fetchMasterData = async () => {
            const res = await callFetchAllJobProfessionSkillJob();
            if (res && res.data) {
                setProfessions(res.data as IJobProfession[]);
            }
        };
        fetchMasterData();
    }, []);

    useEffect(() => {
        const professionIds = searchParams.get('jobProfession')?.split(',').filter(Boolean) || [];
        const levels = searchParams.get('level')?.split(',').filter(Boolean) || [];
        const skills = searchParams.get('skills')?.split(',').filter(Boolean) || [];

        // Đảm bảo giá trị là string array để match với Checkbox value
        setSelectedProfessions(professionIds.map(id => String(id)));
        setSelectedLevels(levels.map(id => String(id)));
        setSelectedSkills(skills.map(id => String(id)));

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

    const fetchJobs = async (params: URLSearchParams) => {
        setLoading(true);
        try {
            const current = params.get('current') || '1';
            const pageSize = params.get('pageSize') || '10';
            // Lấy trực tiếp sort từ URL để gọi API
            const sort = params.get('sort') || 'createdAt,desc';

            let query = `page=${Number(current) - 1}&size=${pageSize}&sort=${sort}`;
            const filterParts = [];

            const locationParam = params.get('location');
            if (locationParam) filterParts.push(sfIn("location", locationParam.split(",")).toString());

            const skillsParam = params.get('skills');
            if (skillsParam) filterParts.push(sfIn("skills.id", skillsParam.split(",").map(Number)).toString());

            const professionParam = params.get('jobProfession');
            if (professionParam) filterParts.push(sfIn("jobProfession.id", professionParam.split(",").map(Number)).toString());
            
            const levelParam = params.get('level');
            if (levelParam) filterParts.push(sfIn("level", levelParam.split(",")).toString());

            const keyword = params.get('name');
            if (keyword) filterParts.push(sfLike("name", `*${keyword}*`).toString());
        
            if (filterParts.length > 0) {
                const filterQuery = filterParts.join(" and ");
                query += `&filter=${encodeURIComponent(filterQuery)}`;
            }

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
        newParams.set('current', '1');
        if (value) newParams.set('name', value);
        else newParams.delete('name');
        setSearchParams(newParams);
    };

    // --- 2. HÀM XỬ LÝ SORT CHUNG (Field + Order) ---
    const handleSortUpdate = (uiField: string, uiOrder: string) => {
        const newParams = new URLSearchParams(searchParams);
        
        let dbField = uiField;

        // Nếu người dùng chọn sort theo Lương
        if (uiField === 'salary') {
            if (uiOrder === 'asc') {
                // Thấp đến Cao -> Sort theo minSalary
                dbField = 'minSalary';
            } else {
                // Cao đến Thấp -> Sort theo maxSalary
                dbField = 'maxSalary';
            }
        }
        
        // Set giá trị sort thực tế gửi cho Backend
        newParams.set('sort', `${dbField},${uiOrder}`);
        newParams.set('current', '1');
        setSearchParams(newParams);
    };

    const currentPageFromUrl = Number(searchParams.get('current')) || 1;
    const pageSizeFromUrl = Number(searchParams.get('pageSize')) || 10;
    const currentKeyword = searchParams.get('name') || '';

    return (
        <div style={{ backgroundColor: '#f4f5f5', minHeight: '100vh', padding: '20px 0' }}>
            
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 15px' }}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={6}>
                       {/* ... (Giữ nguyên phần Sidebar Filter) ... */}
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
                                    {professions.slice(0, 10).map((p) => {
                                        const professionId = p.id ? String(p.id) : '';
                                        return professionId ? (
                                            <Checkbox key={p.id} value={professionId} style={{ marginLeft: 0 }}>
                                                {p.name}
                                            </Checkbox>
                                        ) : null;
                                    })}
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
                                                {availableSkills.map((s) => {
                                                    const skillId = s.id ? String(s.id) : '';
                                                    return skillId ? (
                                                        <Checkbox key={s.id} value={skillId} style={{ marginLeft: 0 }}>
                                                            {s.name}
                                                        </Checkbox>
                                                    ) : null;
                                                })}
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
                                placeholder="Tìm kiếm công việc"
                                allowClear
                                enterButton={  <button
                                    style={{
                                        backgroundColor: "#00b14f",
                                        color: "#fff",
                                        border: "none",
                                        padding: "0 20px",
                                        height: "37px",
                                        borderRadius: "5px",
                                        fontWeight: 600,
                                        cursor: "pointer"
                                    }}
                                >
                                    Tìm kiếm
                                </button>}
                                size="large"
                                defaultValue={currentKeyword}
                                onSearch={onSearch}
                                style={{ width: '100%' }}
                                
                                
                            />
                        </div>

                        {/* --- HEADER FILTER & SORT (ĐÃ CẬP NHẬT) --- */}
                        <div style={{
                            backgroundColor: '#fff', borderRadius: 8, padding: '12px 16px',
                            marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ color: '#555' }}>Sắp xếp theo:</span>
                                
                                {/* Select chọn Field: createdAt hoặc salary */}
                                <Select
                                    value={currentSortField} 
                                    style={{ width: 150 }}
                                    bordered={false}
                                    // Khi đổi field, giữ nguyên order hiện tại
                                    onChange={(newField) => handleSortUpdate(newField, currentSortOrder)}
                                >
                                    <Select.Option value="createdAt">Ngày đăng</Select.Option>
                                    <Select.Option value="salary">Mức lương</Select.Option>
                                </Select>

                                {/* Button đảo chiều: asc <-> desc */}
                                <Button 
                                    type="text" // Dùng type text cho nhẹ nhàng
                                    icon={currentSortOrder === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
                                    // Khi click, giữ nguyên field, đổi order
                                    onClick={() => handleSortUpdate(currentSortField, currentSortOrder === 'asc' ? 'desc' : 'asc')}
                                >
                                    {currentSortOrder === 'asc' ? 'Thấp đến Cao' : 'Cao đến Thấp'}
                                </Button>
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