import React, { useEffect, useState, useMemo } from 'react';
import { Modal, Input, List, Tag, Button, Checkbox, Spin, Empty, Tooltip } from 'antd';
import { RightOutlined, SearchOutlined, CheckCircleFilled } from '@ant-design/icons';
import { ProFormItem } from '@ant-design/pro-components';
import { callFetchAllJobProfessionSkillJob } from '@/config/api'; // Đảm bảo đường dẫn đúng
import { debounce, uniqBy } from 'lodash'; // Cần cài: npm i lodash
import { Form } from 'antd';

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
interface ISkill { id: number; name: string; }
interface IJob { id: number; name: string; skills?: ISkill[]; }
interface IProfession { id: number; name: string; jobs?: IJob[]; }

// Interface lưu trữ kết quả chọn để hiển thị
interface ISelectedTag {
    id: number;
    name: string;
    type: 'PROFESSION' | 'SKILL' | 'LEVEL';
}

interface IProps {
    form: any;
    fieldName: string; // Tên trường trong form (lưu mảng ID hoặc Object tùy bạn xử lý)
}

const JobTypeSelector = ({ form, fieldName }: IProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

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

    useEffect(() => {
        if (isModalOpen) {
            const rawValue = form.getFieldValue(fieldName) || [];
            // Lọc ra đâu là Profession, đâu là Skill để set vào state hiển thị
            setSelectedProfessions(rawValue.filter((i: any) => i.type === 'PROFESSION'));
            setSelectedSkills(rawValue.filter((i: any) => i.type === 'SKILL' || (!i.type && typeof i.id === 'number')));
            setSelectedLevels(rawValue.filter((i: any) => i.type === 'LEVEL'));
        }
    }, [isModalOpen]);

    // 1. Fetch Data
    const fetchData = async (keyword: string = "") => {
        setLoading(true);
        try {
            const query = keyword ? `keyword=${keyword}` : "";
            const res = await callFetchAllJobProfessionSkillJob(query);
            if (res && res.data) {
                const professions = res.data as IProfession[];
                setData(professions);

                // Mặc định ban đầu: Hover & Click vào item đầu tiên để UI không bị trống
                if (professions.length > 0 && !keyword) {
                    const firstProf = professions[0];
                    setHoveredProfession(firstProf);
                    handleViewJobsByProfession(firstProf);
                }
            }
        } catch (error) {
            console.error(error);
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
    const isProfSelected = (id: number) => selectedProfessions.some(p => p.id === id);
    const isSkillSelected = (id: number) => selectedSkills.some(s => s.id === id);
    const isLevelSelected = (id: string) => selectedLevels.some(l => l.id === id);


    // --- HANDLE CONFIRM ---
    const handleConfirm = () => {
        const displayData: ISelectedTag[] = [
            ...selectedProfessions.map(p => ({ id: p.id, name: p.name, type: 'PROFESSION' } as ISelectedTag)),
            ...selectedSkills.map(s => ({ id: s.id, name: s.name, type: 'SKILL' } as ISelectedTag)),
            ...selectedLevels.map(l => ({ id: l.id, name: l.name, type: 'LEVEL' } as ISelectedTag))
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
                        Áp dụng ({selectedProfessions.length + selectedSkills.length + selectedLevels.length})                    </Button>
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
                        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                            {/* --- CỘT 1: NHÓM NGÀNH (PROFESSION) --- */}
                            <div style={{ width: '33%', borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
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
                                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Rê chuột vào ngành để xem kỹ năng" />
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

                            {/* --- CỘT 3: LEVEL (33%) --- */}
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
                                                    padding: '10px 12px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    borderBottom: '1px solid #f5f5f5',
                                                    backgroundColor: isLevelSelected(level.id) ? '#fff7e6' : '#fff' // Highlight nhẹ
                                                }}
                                            >
                                                <Checkbox
                                                    checked={isLevelSelected(level.id)}
                                                    // Checkbox Antd cần onClick stopPropagation để tránh xung đột với row click
                                                    onClick={(e) => { e.stopPropagation(); toggleLevelSelection(level, e.target.checked); }}
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