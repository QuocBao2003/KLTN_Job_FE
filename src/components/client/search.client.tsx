import { Button, Col, Form, Row } from 'antd';
import { EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';
import { LOCATION_LIST } from '@/config/utils';
import { useEffect, useState } from 'react';
import { callFetchAllSkill } from '@/config/api';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import bannerPlaceholder from '@/img/baner.jpeg';
import { ProForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';
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

    const bannerImageSrc = bannerPlaceholder; // Replace this import with your desired banner image path

    const onFinish = async (values: any) => {
        const params = new URLSearchParams();
        
        if (values?.name) params.append('name', values.name);
        if (values?.location?.length) params.append('location', values.location.join(','));
        
        // values.skills lúc này là mảng ID [1, 10, 20] do JobTypeSelector trả về
        if (values?.skills?.length) params.append('skills', values.skills.join(','));

        navigate(`/job?${params.toString()}`);
    }

    return (
        <div
            style={{
                position: 'relative',
                width: '100vw',
                minHeight: '400px',
                overflow: 'hidden',
                boxShadow: '0 12px 30px rgba(25, 123, 205, 0.12)',
                margin: 0,
                marginTop: 0,
                marginLeft: '50%',
                transform: 'translateX(-50%)',
                padding: 0,
            }}
        >
            {/* Banner background */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 0,
                }}
            >
                <img
                    src={bannerImageSrc}
                    alt="Career opportunities banner"
                    style={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        maxWidth: '100%',
                    }}
                />
            </div>

            {/* Overlay để làm tối banner một chút cho dễ đọc */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    zIndex: 1,
                }}
            />

            {/* Form tìm kiếm đè lên banner - có container với max-width */}
            <div style={{ 
                position: 'relative', 
                zIndex: 2, 
                padding: '80px 15px',
                maxWidth: '1260px',
                margin: '0 auto',
                width: '100%'
            }}>
                <ProForm
                    form={form}
                    onFinish={onFinish}
                    submitter={
                        {
                            render: () => <></>
                        }
                    }
                >
                    <Row gutter={[20, 20]}>
                        <Col span={24}>
                            <h2 style={{ color: 'white', marginBottom: 0, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                                Việc Làm IT Cho Developer
                            </h2>
                        </Col>
                        <Col span={24} md={16}>
                            <ProForm.Item
                                name="skills"
                            >
                                <Select
                                    mode="multiple"
                                    allowClear
                                    suffixIcon={null}
                                    style={{ width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                                    placeholder={
                                        <>
                                            <MonitorOutlined /> Tìm công việc theo kỹ năng...
                                        </>
                                    }
                                    optionLabelProp="label"
                                    options={optionsSkills}
                                />
                            </ProForm.Item>
                        </Col>
                        <Col span={12} md={4}>
                            <ProForm.Item
                                name="location"
                            >
                                <Select
                                    mode="multiple"
                                    allowClear
                                    suffixIcon={null}
                                    style={{ width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                                    placeholder={
                                        <>
                                            <EnvironmentOutlined /> Địa điểm...
                                        </>
                                    }
                                    optionLabelProp="label"
                                    options={optionsLocations}
                                />
                            </ProForm.Item>
                        </Col>
                        <Col span={12} md={4}>
                            <Button type='primary' onClick={() => form.submit()} style={{ width: '100%' }}>
                                Search
                            </Button>
                        </Col>
                    </Row>
                </ProForm>
            </div>
        </div>
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