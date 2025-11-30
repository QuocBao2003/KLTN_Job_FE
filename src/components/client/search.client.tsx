import { Button, Col, Form, Row } from 'antd';
import { EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';
import { LOCATION_LIST } from '@/config/utils';
import { ProForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import { useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import JobTypeSelector from '@/pages/job/jobTypeSelector';

const SearchClient = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [form] = Form.useForm();

    // 1. Fill dữ liệu từ URL vào Form khi reload
    // Cần gom các param rời rạc (skill, profession, level) thành 1 mảng hỗn hợp để đưa vào JobTypeSelector
    useEffect(() => {
        if (location.search) {
            const queryName = searchParams.get("name");
            const queryLocation = searchParams.get("location");
            
            // Lấy các params riêng lẻ
            const querySkills = searchParams.get("skills");
            const queryProfession = searchParams.get("jobProfession");
            const queryLevel = searchParams.get("level");

            if (queryName) form.setFieldValue("name", queryName);
            if (queryLocation) form.setFieldValue("location", queryLocation.split(","));

            // --- TÁI TẠO DỮ LIỆU CHO JOB TYPE SELECTOR ---
            const mixedData = [];

            if (queryProfession) {
                // Lưu ý: Cần name để hiển thị tag, nhưng URL chỉ có ID.
                // Tạm thời chỉ lưu ID và Type, JobTypeSelector có thể cần logic fetch lại name hoặc chấp nhận hiển thị ID nếu không có name
                queryProfession.split(",").forEach(id => {
                    mixedData.push({ id: Number(id), type: 'PROFESSION', name: `Ngành ${id}` }); // Tạm fake name
                });
            }

            if (querySkills) {
                querySkills.split(",").forEach(id => {
                    mixedData.push({ id: Number(id), type: 'SKILL', name: `Skill ${id}` });
                });
            }

            if (queryLevel) {
                queryLevel.split(",").forEach(id => {
                    mixedData.push({ id: id, type: 'LEVEL', name: id });
                });
            }

            if (mixedData.length > 0) {
                form.setFieldValue("skills", mixedData); // Field này tên là 'skills' nhưng chứa data hỗn hợp
            }
        }
    }, [location.search]);

    const onFinish = async (values: any) => {
        const params = new URLSearchParams();

        if (values?.name) params.append('name', values.name);
        if (values?.location?.length) params.append('location', values.location.join(','));

        // --- PHÂN LOẠI DỮ LIỆU TỪ JOB TYPE SELECTOR ---
        // values.skills lúc này là mảng [{id: 1, type: 'SKILL'}, {id: 2, type: 'PROFESSION'}, ...]
        if (values?.skills?.length) {
            const professionIds: number[] = [];
            const skillIds: number[] = [];
            const levels: string[] = [];

            values.skills.forEach((item: any) => {
                if (item.type === 'PROFESSION') professionIds.push(item.id);
                else if (item.type === 'SKILL') skillIds.push(item.id);
                else if (item.type === 'LEVEL') levels.push(item.id);
                // Fallback cho trường hợp dữ liệu cũ (chỉ là số) -> mặc định là Skill
                else if (typeof item === 'number') skillIds.push(item);
            });

            if (professionIds.length) params.append('jobProfession', professionIds.join(','));
            if (skillIds.length) params.append('skills', skillIds.join(','));
            if (levels.length) params.append('level', levels.join(','));
        }
        
        navigate(`/job?${params.toString()}`);
    }

    return (
        <ProForm
            form={form}
            onFinish={onFinish}
            submitter={{ render: () => <></> }}
            style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        >
            <Row gutter={[16, 16]}>
                <Col span={24}><h2 style={{ color: '#00b14f' }}>Tìm Việc Làm IT</h2></Col>

                {/* 1. Keyword */}
                <Col span={24} md={10}>
                    <ProFormText
                        name="name"
                        placeholder="Nhập tên công việc, vị trí..."
                        fieldProps={{
                            prefix: <SearchOutlined style={{ color: '#ccc' }} />,
                            size: 'large'
                        }}
                    />
                </Col>

                {/* 2. Location */}
                <Col span={24} md={6}>
                    <ProFormSelect
                        name="location"
                        mode="multiple"
                        placeholder="Địa điểm"
                        options={LOCATION_LIST}
                        fieldProps={{
                            suffixIcon: <EnvironmentOutlined />,
                            size: 'large',
                            maxTagCount: 'responsive'
                        }}
                    />
                </Col>

                {/* 3. Search Button */}
                <Col span={24} md={8}>
                    <Button
                        type='primary'
                        onClick={() => form.submit()}
                        size='large'
                        style={{ width: '100%', background: '#00b14f', borderColor: '#00b14f', fontWeight: 'bold' }}
                    >
                        TÌM KIẾM
                    </Button>
                </Col>

                {/* 4. Job Type Selector (GỘP CHUNG 3 LOẠI) */}
                <Col span={24}>
                    <JobTypeSelector form={form} fieldName="skills" />
                </Col>
            </Row>
        </ProForm>
    )
}
export default SearchClient;