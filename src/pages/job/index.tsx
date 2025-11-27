import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Checkbox, Radio, Divider, Pagination, Empty, Spin, Select } from 'antd';
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
    const [meta, setMeta] = useState({ current: 1, pageSize: 10, total: 0 });

    // State cho filter (đồng bộ với URL)
    const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    
    // 1. Fetch Master Data
    useEffect(() => {
        const fetchMasterData = async () => {
            const res = await callFetchAllJobProfessionSkillJob();
            if (res && res.data) {
                setProfessions(res.data as IJobProfession[]);
            }
        };
        fetchMasterData();
    }, []);

    // 2. Sync URL -> State
    useEffect(() => {
        const professionIds = searchParams.get('jobProfession')?.split(',') || [];
        const levels = searchParams.get('level')?.split(',') || [];
        const skills = searchParams.get('skills')?.split(',') || []; // Lấy skills từ URL
        
        setSelectedProfessions(professionIds);
        setSelectedLevels(levels);
        setSelectedSkills(skills); // Set state skills

        // Fetch job
        fetchJobs(searchParams);
    }, [searchParams]);

    // --- LOGIC TÍNH TOÁN SKILLS (REQUIREMENT 2) ---
    const availableSkills = useMemo(() => {
        // Nếu chưa chọn ngành nào thì không hiện skill
        if (selectedProfessions.length === 0) return [];
        
        // Lọc ra các object Profession tương ứng với ID đang chọn
        // Lưu ý: selectedProfessions là mảng string, p.id là number -> cần convert String(p.id)
        const selectedProfsData = professions.filter(p => selectedProfessions.includes(String(p.id)));
        
        const allSkills: ISkill[] = [];
        selectedProfsData.forEach(prof => {
            prof.jobs?.forEach(job => {
                job.skills?.forEach(skill => {
                    // Check trùng lặp skill trước khi push
                    if (!allSkills.find(s => s.id === skill.id)) {
                        allSkills.push(skill);
                    }
                })
            })
        });
        return allSkills;
    }, [selectedProfessions, professions]);


    // 3. Fetch Jobs
    const fetchJobs = async (params: URLSearchParams) => {
        setLoading(true);
        try {
            let query = `page=${meta.current}&size=${meta.pageSize}`;
            if (params.get('name')) query += `&name=${params.get('name')}`;
            if (params.get('location')) query += `&location=${params.get('location')}`;
            if (params.get('skills')) query += `&skills=${params.get('skills')}`;
            if (params.get('jobProfession')) query += `&jobProfession=${params.get('jobProfession')}`;
            if (params.get('level')) query += `&level=${params.get('level')}`;
            
            const res = await callFetchJob(query);
            if (res && res.data) {
                setJobs(res.data.result);
                setMeta({ ...meta, total: res.data.meta.total });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // 4. Handle Filter Change
    const handleFilterChange = (key: string, values: string[]) => {
        const newParams = new URLSearchParams(searchParams);
        if (values.length > 0) {
            newParams.set(key, values.join(','));
        } else {
            newParams.delete(key);
        }
        // Khi thay đổi URL, useEffect ở trên sẽ chạy lại để fetch job và update state checkbox
        setSearchParams(newParams);
    };

    return (
        <div style={{ backgroundColor: '#f4f5f5', minHeight: '100vh', padding: '20px 0' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 15px' }}>
                <Row gutter={[24, 24]}>
                    
                    {/* --- LEFT SIDEBAR (FILTER) --- */}
                    <Col xs={24} md={6}>
                        <div style={{ backgroundColor: '#fff', borderRadius: 8, padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
                                <FilterOutlined style={{ color: '#00b14f', fontSize: 18 }} />
                                <span style={{ fontWeight: 700, fontSize: 16 }}>Lọc nâng cao</span>
                            </div>

                            {/* Group 1: Danh mục nghề (Professions) */}
                            <div style={{ marginBottom: 24 }}>
                                <h4 style={{ fontWeight: 600, marginBottom: 12 }}>Ngành nghề</h4>
                                <Checkbox.Group 
                                    style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                                    value={selectedProfessions}
                                    onChange={(vals) => handleFilterChange('jobProfession', vals as string[])}
                                >
                                    {professions.slice(0, 10).map((p) => (
                                        // QUAN TRỌNG: value phải là string
                                        <Checkbox key={p.id} value={String(p.id)} style={{ marginLeft: 0 }}>
                                            {p.name}
                                        </Checkbox>
                                    ))}
                                </Checkbox.Group>
                                {professions.length > 10 && <div style={{ color: '#00b14f', cursor: 'pointer', marginTop: 8, fontSize: 13 }}>Xem thêm</div>}
                            </div>

                            <Divider style={{ margin: '12px 0' }} />

                            {/* Group 2: Kỹ năng (Dynamic - Chỉ hiện khi có Ngành nghề được chọn) */}
                            {/* --- ĐÂY LÀ PHẦN BẠN CẦN THÊM VÀO --- */}
                            {selectedProfessions.length > 0 && availableSkills.length > 0 && (
                                <>
                                    <div style={{ marginBottom: 24 }}>
                                        <h4 style={{ fontWeight: 600, marginBottom: 12 }}>Kỹ năng chuyên môn</h4>
                                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            <Checkbox.Group 
                                                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                                                value={selectedSkills} // State này là mảng string ['1', '2']
                                                onChange={(vals) => handleFilterChange('skills', vals as string[])}
                                            >
                                                {availableSkills.map((s) => (
                                                    // QUAN TRỌNG: value={String(s.id)} để khớp với state string
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
                            {/* ------------------------------------- */}


                            {/* Group 3: Cấp bậc (Levels) */}
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

                    {/* --- RIGHT CONTENT (JOB LIST) --- */}
                    <Col xs={24} md={18}>
                        {/* Header Filter & Sort */}
                        <div style={{ 
                            backgroundColor: '#fff', borderRadius: 8, padding: '12px 16px', 
                            marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ color: '#555' }}>Tìm kiếm theo:</span>
                                <Radio.Group defaultValue="job" buttonStyle="solid">
                                    <Radio.Button value="job">Tên việc làm</Radio.Button>
                                    <Radio.Button value="company">Tên công ty</Radio.Button>
                                </Radio.Group>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ color: '#555' }}>Sắp xếp theo:</span>
                                <Select defaultValue="newest" style={{ width: 150 }} bordered={false}>
                                    <Select.Option value="ai">Search by AI</Select.Option>
                                    <Select.Option value="newest">Mới nhất</Select.Option>
                                    <Select.Option value="salary">Lương cao nhất</Select.Option>
                                </Select>
                            </div>
                        </div>

                        {/* Search keyword info (Nếu có) */}
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
                                            current={meta.current}
                                            pageSize={meta.pageSize}
                                            total={meta.total} 
                                            onChange={(page, pageSize) => setMeta({ ...meta, current: page, pageSize })}
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