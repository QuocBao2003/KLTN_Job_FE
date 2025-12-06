import React, { useEffect, useState, useMemo } from 'react';
import { Modal, Input, List, Tag, Button, Checkbox, Spin, Empty, Tooltip } from 'antd';
import { RightOutlined, SearchOutlined, CheckCircleFilled } from '@ant-design/icons';
import { ProFormItem } from '@ant-design/pro-components';
import { callFetchAllJobProfession, callFetchAllJobProfessionSkillJob } from '@/config/api'; // Đảm bảo đường dẫn đúng
import { debounce, uniqBy } from 'lodash'; // Cần cài: npm i lodash
import { Form } from 'antd';
import { useSearchParams } from 'react-router-dom';
import logoJob from '@/img/logoJob.jpeg';

// --- JOB LEVELS ---
export const JOB_LEVELS = [
    { id: 'INTERN', name: 'Intern / Thực tập sinh' },
    { id: 'FRESHER', name: 'Fresher' },
    { id: 'JUNIOR', name: 'Junior' },
    { id: 'MIDDLE', name: 'Middle' },
    { id: 'SENIOR', name: 'Senior' },
    { id: 'LEAD', name: 'Team Lead' },
    { id: 'MANAGER', name: 'Manager' },
];

// --- Interfaces ---
interface ISkill { id: string | number; name: string; }
interface IJob { id: string | number; name: string; skills?: ISkill[]; }
interface IProfession { id: string | number; name: string; jobs?: IJob[]; }

// Interface lưu trữ kết quả chọn để hiển thị
interface ISelectedTag {
    id: number;
    name: string;
    type: 'PROFESSION' | 'SKILL' | 'LEVEL';
}

interface IProps {
    form: any;
    fieldName: string; // Tên trường trong form (lưu mảng ID hoặc Object tùy bạn xử lý)
    mode?: 'modal' | 'inline';
}

const JobTypeSelector = ({ form, fieldName, mode = 'modal' }: IProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();

    // --- Data States ---
    const [data, setData] = useState<IProfession[]>([]); // Full Data Tree

    // --- Interaction States (Dùng để điều khiển hiển thị cột) ---
    const [hoveredProfession, setHoveredProfession] = useState<IProfession | null>(null); // Điều khiển Cột 2
    const [viewMode, setViewMode] = useState<'BY_PROFESSION' | 'BY_SKILL'>('BY_PROFESSION'); // Điều khiển Cột 3

    // Dữ liệu tạm để render Cột 3
    const [jobsDisplaySource, setJobsDisplaySource] = useState<IJob[]>([]);
    const [activeFilterLabel, setActiveFilterLabel] = useState<string>(""); // Label header cho cột 3

    // --- Selection States (Lưu giá trị người dùng TICK chọn) ---
    const [selectedProfessions, setSelectedProfessions] = useState<IProfession[]>([]);
    const [selectedSkills, setSelectedSkills] = useState<ISkill[]>([]);
    const [selectedLevels, setSelectedLevels] = useState<any[]>([]);

    // Đọc từ URL params hoặc form value để highlight các item đã chọn
    useEffect(() => {
        const rawValue = form.getFieldValue(fieldName) || [];
        const professionIds = searchParams.get('jobProfession')?.split(',').filter(Boolean) || [];
        const skillIds = searchParams.get('skills')?.split(',').filter(Boolean) || [];
        
        // Nếu có URL params, dùng URL params để map với data thật
        if (professionIds.length > 0 || skillIds.length > 0) {
            const matchedProfs = data.filter(p => professionIds.includes(String(p.id)));
            const allSkills: ISkill[] = [];
            matchedProfs.forEach(prof => {
                prof.jobs?.forEach(job => {
                    job.skills?.forEach(skill => {
                        if (!allSkills.find(s => s.id === skill.id)) {
                            allSkills.push(skill);
                        }
                    });
                });
            });
            const matchedSkills = allSkills.filter(s => skillIds.includes(String(s.id)));
            
            setSelectedProfessions(matchedProfs);
            setSelectedSkills(matchedSkills);
        } else if (rawValue.length > 0) {
            // Nếu không có URL params, dùng form value
            setSelectedProfessions(rawValue.filter((i: any) => i.type === 'PROFESSION'));
            setSelectedSkills(rawValue.filter((i: any) => i.type === 'SKILL' || (!i.type && typeof i.id === 'number')));
            setSelectedLevels(rawValue.filter((i: any) => i.type === 'LEVEL'));
        } else {
            setSelectedProfessions([]);
            setSelectedSkills([]);
            setSelectedLevels([]);
        }
    }, [isModalOpen, searchParams.toString(), data, form, fieldName]);

    // 1. Fetch Data
    const fetchData = async (keyword: string = "") => {
        setLoading(true);
        try {
            const query = keyword ? `keyword=${keyword}` : "";
            const res = await callFetchAllJobProfessionSkillJob(query);
            
            if (res && res.data) {
                // FIX 1: Xử lý trường hợp dữ liệu nằm trong biến 'result' (phân trang)
                const rawData = res.data as any;
                const professions = Array.isArray(rawData) ? rawData : (rawData.result || []);

                // DEBUG: Kiểm tra cấu trúc dữ liệu trên console
                console.log("Data fetched:", professions); 

                setData(professions as IProfession[]);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSearch = useMemo(() => debounce((val: string) => fetchData(val), 500), []);

    // --- LOGIC CỘT 1 & 2 & 3 ---

    // Helper: Lấy danh sách Skill duy nhất từ một Profession (cho Cột 2)
    const getUniqueSkillsFromProfession = (profession: IProfession | null): ISkill[] => {
        if (!profession || !profession.jobs) return [];
        // Gom tất cả skill từ các job con
        const allSkills = profession.jobs.flatMap(job => job.skills || []);
        // Lọc trùng lặp theo ID
        return uniqBy(allSkills, 'id');
    };

    // Action: Khi CLICK vào tên Ngành (Cột 1) -> Hiển thị Job của Ngành đó (Cột 3)
    const handleViewJobsByProfession = (prof: IProfession) => {
        setViewMode('BY_PROFESSION');
        setJobsDisplaySource(prof.jobs || []);
        setActiveFilterLabel(`Công việc thuộc: ${prof.name}`);
    };

    // Action: Khi CLICK vào tên Skill (Cột 2) -> Hiển thị Job có Skill đó (Cột 3)
    const handleViewJobsBySkill = (skill: ISkill) => {
        if (!hoveredProfession) return;
        setViewMode('BY_SKILL');
        // Lọc trong Profession đang hover, job nào có skill này
        const filteredJobs = (hoveredProfession.jobs || []).filter(job =>
            job.skills?.some(s => s.id === skill.id)
        );
        setJobsDisplaySource(filteredJobs);
        setActiveFilterLabel(`Công việc có kỹ năng: ${skill.name}`);
    };

    // --- LOGIC CHECKBOX (SELECTION) ---

    const toggleProfessionSelection = (prof: IProfession, checked: boolean) => {
        if (checked) {
            setSelectedProfessions(prev => [...prev, prof]);
        } else {
            setSelectedProfessions(prev => prev.filter(item => item.id !== prof.id));
        }
    };

    const toggleSkillSelection = (skill: ISkill, checked: boolean) => {
        if (checked) {
            setSelectedSkills(prev => [...prev, skill]);
        } else {
            setSelectedSkills(prev => prev.filter(item => item.id !== skill.id));
        }
    };

    const toggleLevelSelection = (level: any, checked: boolean) => {
        if (checked) {
            setSelectedLevels(prev => [...prev, level]);
        } else {
            setSelectedLevels(prev => prev.filter(item => item.id !== level.id));
        }
    };

    // Kiểm tra xem có đang chọn không
    const isProfSelected = (id: number | string) => selectedProfessions.some(p => p.id === id);
    const isSkillSelected = (id: number | string) => selectedSkills.some(s => s.id === id);
    const isLevelSelected = (id: string) => selectedLevels.some(l => l.id === id);


    // --- HANDLE CONFIRM (cho mode modal) ---
    const handleConfirm = () => {
        const displayData: ISelectedTag[] = [
            ...selectedProfessions.map(p => ({ id: p.id, name: p.name, type: 'PROFESSION' } as ISelectedTag)),
            ...selectedSkills.map(s => ({ id: s.id, name: s.name, type: 'SKILL' } as ISelectedTag)),
            ...selectedLevels.map(l => ({ id: l.id, name: l.name, type: 'LEVEL' } as ISelectedTag)),
        ];

        form.setFieldValue(fieldName, displayData);
        setIsModalOpen(false);
        // form.submit(); // Tự động submit sau khi chọn xong
    };

    // Load data từ form khi mở modal (Optional - Xử lý sơ bộ để hiển thị lại cái đã chọn)
    const rawData = form.getFieldValue(fieldName);
    // Đảm bảo savedData luôn là mảng và các phần tử là Object hợp lệ
    const savedData = Array.isArray(rawData)
        ? rawData.filter((item: any) => (typeof item === 'object' && item !== null) || typeof item === 'number')
        : [];

    // --- INLINE MODE: Hiển thị giống hình (trái: ngành, phải: kỹ năng) và click là tìm kiếm ---
    const handleClickProfessionSearch = (prof: IProfession) => {
        const displayData: ISelectedTag[] = [
            { id: Number(prof.id), name: prof.name, type: 'PROFESSION' }
        ];
        form.setFieldValue(fieldName, displayData);
        if (form.submit) form.submit();
    };

    const handleClickSkillSearch = (skill: ISkill) => {
        // Khi chọn skill, cần thêm profession tương ứng vào form để checkbox được check đúng trong index.tsx
        const displayData: ISelectedTag[] = [];
        
        // Thêm profession đang hover vào form
        if (hoveredProfession) {
            displayData.push({ 
                id: Number(hoveredProfession.id), 
                name: hoveredProfession.name, 
                type: 'PROFESSION' 
            });
        }
        
        // Thêm skill được chọn
        displayData.push({ 
            id: Number(skill.id), 
            name: skill.name, 
            type: 'SKILL' 
        });
        
        form.setFieldValue(fieldName, displayData);
        if (form.submit) form.submit();
    };

    if (mode === 'inline') {
        return (
            <>
                <Form.Item name={fieldName} hidden />
                <div
                    style={{
                        display: 'flex',
                      
                        borderRadius: 16,
                        overflow: 'hidden',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                        minHeight: 260,
                        columnGap: 15,
                        padding: 8,
                    }}
                    onMouseLeave={() => setHoveredProfession(null)}
                >
                    {/* Cột 1: Nhóm ngành */}
                    <div
                        style={{ width: '38%', background: '#fff', display: 'flex', flexDirection: 'column', borderRadius: 12 }}
                    >
                        <div style={{ padding: '12px 16px', fontWeight: 600, fontSize: 16, borderBottom: '1px solid #f0f0f0',textAlign:"center" ,color:"#00b14f"}}>
                            CHỌN NHÓM NGÀNH
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <List
                                dataSource={data}
                                renderItem={(item) => {
                                    const isHovered = hoveredProfession?.id === item.id;
                                    const isSelected = selectedProfessions.some(p => p.id === item.id);
                                    return (
                                        <div
                                            onMouseEnter={() => setHoveredProfession(item)}
                                            onClick={() => handleClickProfessionSearch(item)}
                                            style={{
                                                padding: '10px 14px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                backgroundColor: isSelected ? '#e6f7ff' : (isHovered ? '#f6ffed' : '#fff'),
                                                borderBottom: '1px solid #f5f5f5',
                                                borderLeft: isSelected ? '3px solid #00b14f' : 'none',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? '#00b14f' : 'inherit' }}>
                                                {item.name}
                                            </span>
                                            {isSelected ? (
                                                <CheckCircleFilled style={{ fontSize: 14, color: '#00b14f' }} />
                                            ) : (
                                                <RightOutlined style={{ fontSize: 10, color: '#ccc' }} />
                                            )}
                                        </div>
                                    );
                                }}
                            />
                        </div>
                    </div>

                    {/* Cột 2: Kỹ năng thuộc ngành đang hover */}
                    <div style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column', borderRadius: 12 }}>
                        <div style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14, borderBottom: '1px solid #f0f0f0' }}>
                            {hoveredProfession
                                ? `Kỹ năng : ${hoveredProfession.name}`
                                : ''}
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 8px 8px' }}>
                            {!hoveredProfession ? (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img
                                        src={logoJob}
                                        alt="TOP Job"
                                        style={{ maxWidth: '60%', maxHeight: '200px', objectFit: 'contain' }}
                                    />
                                </div>
                            ) : (
                                <List
                                    dataSource={getUniqueSkillsFromProfession(hoveredProfession)}
                                    renderItem={(skill) => {
                                        const isSelected = selectedSkills.some(s => s.id === skill.id);
                                        return (
                                            <div
                                                onClick={() => handleClickSkillSearch(skill)}
                                                style={{
                                                    padding: '8px 10px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    borderRadius: 8,
                                                    marginBottom: 4,
                                                    background: isSelected ? '#e6f7ff' : '#f5f7fb',
                                                    borderLeft: isSelected ? '3px solid #00b14f' : 'none',
                                                }}
                                            >
                                                <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? '#00b14f' : 'inherit' }}>
                                                    {skill.name}
                                                </span>
                                                {isSelected ? (
                                                    <CheckCircleFilled style={{ fontSize: 14, color: '#00b14f' }} />
                                                ) : (
                                                    <RightOutlined style={{ fontSize: 10, color: '#00b14f' }} />
                                                )}
                                            </div>
                                        );
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // --- MODE MODAL (mặc định, dùng cho chỗ khác) ---
    return (
        <>
            <Form.Item name={fieldName} hidden />
            {/* UI Input Trigger */}
            <ProFormItem label="Tiêu chí tìm việc (Ngành/Kỹ năng/Cấp bậc)">
                <div
                    onClick={() => setIsModalOpen(true)}
                    style={{
                        border: '1px solid #d9d9d9', padding: '4px 11px',
                        borderRadius: '6px', minHeight: '32px', cursor: 'pointer', background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                >
                    {/* <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '90%' }}>
                        {savedData && savedData.length > 0 ? (
                            <>
                                {savedData.map((item, idx) => {
                                    // Xử lý item có thể là object hoặc số (nếu logic cũ còn sót)
                                    const name = item.name ? item.name : `ID: ${item.id || item}`;
                                    const type = item.type || 'SKILL';

                                    return (
                                        <Tag key={idx} color={type === 'PROFESSION' ? 'blue' : 'green'}>
                                            {name}
                                        </Tag>
                                    )
                                })}
                            </>
                        ) : (
                            <span style={{ color: '#bfbfbf' }}>Chọn nhóm ngành hoặc kỹ năng...</span>
                        )}
                    </div> */}
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '90%' }}>
                         {/* Logic hiển thị Tags (Update thêm màu cho Level) */}
                         {form.getFieldValue(fieldName)?.map((item: any, idx: number) => {
                             let color = 'green';
                             if (item.type === 'PROFESSION') color = 'blue';
                             if (item.type === 'LEVEL') color = 'orange'; // Màu cho Level
                             return (
                                 <Tag key={idx} color={color}>{item.name}</Tag>
                             )
                         })}
                         {(!form.getFieldValue(fieldName) || form.getFieldValue(fieldName).length === 0) && <span style={{ color: '#bfbfbf' }}>Chọn Ngành, Kỹ năng, Cấp bậc...</span>}
                    </div>
                    <RightOutlined style={{ fontSize: '10px', color: '#ccc' }} />
                </div>
            </ProFormItem>

            {/* MODAL */}
            <Modal
                title="Bộ lọc tìm kiếm công việc"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                width={1100}
                centered
                footer={[
                    <Button key="back" onClick={() => {
                        setSelectedProfessions([]);
                        setSelectedSkills([]);
                        setSelectedLevels([]);
                    }}>Xóa chọn</Button>,
                    <Button key="submit" type="primary" onClick={handleConfirm} style={{ background: '#00b14f' }}>
                        Áp dụng ({selectedProfessions.length + selectedSkills.length + selectedLevels.length})
                    </Button>
                ]}
                bodyStyle={{ padding: 0, height: '550px', overflow: 'hidden' }}
                destroyOnClose
            >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Search Header */}
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder="Tìm kiếm ngành nghề..."
                            allowClear
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Spin tip="Đang tải..." />
                        </div>
                    ) : (
                        <div
                            style={{ flex: 1, display: 'flex', overflow: 'hidden' }}
                            onMouseLeave={() => setHoveredProfession(null)}
                        >

                            {/* --- CỘT 1: NHÓM NGÀNH (PROFESSION) --- */}
                            <div
                                style={{ width: '33%', borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}
                            >
                                <div style={{ padding: '8px 12px', background: '#fafafa', fontWeight: 'bold', color: '#555', borderBottom: '1px solid #eee' }}>
                                    1. CHỌN NHÓM NGÀNH
                                </div>
                                <div style={{ overflowY: 'auto', flex: 1 }}>
                                    <List
                                        dataSource={data}
                                        renderItem={(item) => {
                                            const isHovered = hoveredProfession?.id === item.id;
                                            // View mode BY_PROFESSION và đang view đúng job của group này
                                            const isViewingJobs = viewMode === 'BY_PROFESSION' && item.jobs === jobsDisplaySource;

                                            return (
                                                <div
                                                    // Hover: Update Cột 2
                                                    onMouseEnter={() => setHoveredProfession(item)}
                                                    // Click: Update Cột 3 (View Jobs của ngành)
                                                    onClick={() => handleViewJobsByProfession(item)}
                                                    style={{
                                                        padding: '10px 12px', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: '8px',
                                                        backgroundColor: isHovered ? '#f6ffed' : '#fff', // Màu xanh lá nhạt khi hover
                                                        borderBottom: '1px solid #f5f5f5',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {/* Checkbox chọn Ngành */}
                                                    <Checkbox
                                                        checked={isProfSelected(item.id)}
                                                        onClick={(e) => e.stopPropagation()} // Chặn click row
                                                        onChange={(e) => toggleProfessionSelection(item, e.target.checked)}
                                                    />

                                                    <div style={{ flex: 1, fontWeight: isViewingJobs ? 600 : 400, color: isViewingJobs ? '#00b14f' : 'inherit' }}>
                                                        {item.name}
                                                    </div>
                                                    {isHovered && <RightOutlined style={{ fontSize: '10px', color: '#00b14f' }} />}
                                                </div>
                                            );
                                        }}
                                    />
                                </div>
                            </div>

                            {/* --- CỘT 2: KỸ NĂNG (SKILL - Theo Hover Cột 1) --- */}
                            <div style={{ width: '34%', borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '8px 12px', background: '#fafafa', fontWeight: 'bold', color: '#555', borderBottom: '1px solid #eee' }}>
                                    2. CHỌN KỸ NĂNG {hoveredProfession ? `(${hoveredProfession.name})` : ''}
                                </div>
                                <div style={{ overflowY: 'auto', flex: 1 }}>
                                    {!hoveredProfession ? (
                                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img
                                                src={logoJob}
                                                alt="TOP Job"
                                                style={{ maxWidth: '60%', maxHeight: '60%', objectFit: 'contain', opacity: 0.9 }}
                                            />
                                        </div>
                                    ) : (
                                        <List
                                            dataSource={getUniqueSkillsFromProfession(hoveredProfession)}
                                            renderItem={(skill) => {
                                                // Kiểm tra xem có đang filter theo skill này ở cột 3 không
                                                const isActiveFilter = viewMode === 'BY_SKILL' && activeFilterLabel.includes(skill.name);

                                                return (
                                                    <div
                                                        // Click: Filter Jobs theo Skill ở Cột 3
                                                        onClick={() => handleViewJobsBySkill(skill)}
                                                        style={{
                                                            padding: '10px 12px', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: '8px',
                                                            backgroundColor: isActiveFilter ? '#e6f7ff' : '#fff', // Màu xanh dương nhạt khi active
                                                            borderBottom: '1px solid #f5f5f5'
                                                        }}
                                                    >
                                                        <Checkbox
                                                            checked={isSkillSelected(skill.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={(e) => toggleSkillSelection(skill, e.target.checked)}
                                                        />
                                                        <div style={{ flex: 1, color: isActiveFilter ? '#1890ff' : 'inherit' }}>
                                                            {skill.name}
                                                        </div>
                                                        {isActiveFilter && <RightOutlined style={{ fontSize: '10px', color: '#1890ff' }} />}
                                                    </div>
                                                )
                                            }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* --- CỘT 3: CẤP BẬC (LEVEL) --- */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
                                <div style={{ padding: '8px 12px', background: '#fafafa', fontWeight: 'bold', color: '#555', borderBottom: '1px solid #eee' }}>
                                    3. CHỌN CẤP BẬC
                                </div>
                                <div style={{ overflowY: 'auto', flex: 1 }}>
                                    <List
                                        dataSource={JOB_LEVELS}
                                        renderItem={(level) => (
                                            <div
                                                onClick={() => toggleLevelSelection(level, !isLevelSelected(level.id))}
                                                style={{
                                                    padding: '10px 12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    borderBottom: '1px solid #f5f5f5',
                                                    backgroundColor: isLevelSelected(level.id) ? '#fff7e6' : '#fff',
                                                }}
                                            >
                                                <Checkbox
                                                    checked={isLevelSelected(level.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => toggleLevelSelection(level, e.target.checked)}
                                                />
                                                <div style={{ flex: 1 }}>{level.name}</div>
                                            </div>
                                        )}
                                    />
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default JobTypeSelector;