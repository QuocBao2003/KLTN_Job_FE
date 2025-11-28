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
    
    // Khởi tạo Form Instance của Antd
    const [form] = Form.useForm();

    // Parse URL để fill dữ liệu khi reload (Giữ nguyên logic của bạn)
    useEffect(() => {
        if (location.search) {
            const queryName = searchParams.get("name");
            const queryLocation = searchParams.get("location");
            const querySkills = searchParams.get("skills");

            if (queryName) form.setFieldValue("name", queryName);
            if (queryLocation) form.setFieldValue("location", queryLocation.split(","));
            
            // Lưu ý: với skills cần chuyển string "1,2,3" thành mảng số [1,2,3]
            if (querySkills) {
                const skillIds = querySkills.split(",").map(Number);
                form.setFieldValue("skills", skillIds);
            }
        }
    }, [location.search]);

    const onFinish = async (values: any) => {
        const params = new URLSearchParams();
        
        if (values?.name) params.append('name', values.name);
        if (values?.location?.length) params.append('location', values.location.join(','));
        
        // values.skills lúc này là mảng ID [1, 10, 20] do JobTypeSelector trả về
        if (values?.skills?.length) params.append('skills', values.skills.join(','));

        navigate(`/job?${params.toString()}`);
    }

    return (
        <ProForm
            form={form} // Quan trọng: Pass form instance vào ProForm
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
                            prefix: <SearchOutlined style={{color: '#ccc'}}/>,
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

                {/* 4. Job Type Selector (Advanced Filter) */}
                <Col span={24}>
                    {/* Truyền form instance và tên field muốn bind dữ liệu */}
                    <JobTypeSelector form={form} fieldName="skills" />
                </Col>
            </Row>
        </ProForm>
    )
}
export default SearchClient;