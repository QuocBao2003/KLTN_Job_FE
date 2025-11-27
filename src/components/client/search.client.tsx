import { Button, Col, Form, Row } from 'antd';
import { EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';
import { LOCATION_LIST } from '@/config/utils';
<<<<<<< Updated upstream
import { ProForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import { useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import JobTypeSelector from '@/pages/job/jobTypeSelector';
=======
import { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import bannerPlaceholder from '@/img/baner.jpeg';
import { ProForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';
>>>>>>> Stashed changes

const SearchClient = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Khởi tạo Form Instance
    const [form] = Form.useForm();

    // 1. Sync URL -> Form (Chỉ xử lý Name và Location)
    useEffect(() => {
        const queryName = searchParams.get("name");
        const queryLocation = searchParams.get("location");

        if (queryName) {
            form.setFieldValue("name", queryName);
        }
        if (queryLocation) {
            form.setFieldValue("location", queryLocation.split(","));
        }
    }, [searchParams]);

<<<<<<< Updated upstream
=======
    const bannerImageSrc = bannerPlaceholder;

    // 2. Xử lý Submit Form
>>>>>>> Stashed changes
    const onFinish = async (values: any) => {
        const params = new URLSearchParams();

        // Chỉ append Name và Location nếu có dữ liệu
        if (values?.name) {
            params.append('name', values.name);
        }
        if (values?.location?.length) {
            params.append('location', values.location.join(','));
        }

        // Điều hướng sang trang Job kèm params
        navigate(`/job?${params.toString()}`);
    }

    return (
<<<<<<< Updated upstream
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
=======
        <>
            <div
                style={{
                    position: 'relative',
                    width: '100vw',
                    minHeight: '400px',
                    overflow: 'hidden',
                    margin: 0,
                    marginLeft: '50%',
                    transform: 'translateX(-50%)',
                }}
            >
                {/* Banner Background */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, width: '100%', height: '100%', zIndex: 0 }}>
                    <img
                        src={bannerImageSrc}
                        alt="Banner"
                        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
>>>>>>> Stashed changes
                    />
                </div>

                {/* Overlay */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 1 }} />

                {/* Form Search */}
                <div style={{
                    position: 'relative',
                    zIndex: 2,
                    padding: '80px 15px',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    width: '100%'
                }}>
                    <h2 style={{ color: 'white', marginBottom: 20, textAlign: 'center', fontSize: '2.5rem', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                        Việc Làm IT Cho Developer
                    </h2>

                    <ProForm
                        form={form}
                        onFinish={onFinish}
                        submitter={{ render: () => <></> }}
                        style={{
                            padding: '30px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                        }}
                    >
                        <Row gutter={[16, 16]}>
                            {/* 1. Keyword */}
                            <Col span={24} md={10}>
                                <ProFormText
                                    name="name"
                                    placeholder="Nhập từ khóa công việc..."
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

                            {/* 3. Button Tìm Kiếm */}
                            <Col span={24} md={8}>
                                <Button
                                    type='primary'
                                    onClick={() => form.submit()}
                                    size='large'
                                    style={{ width: '100%', background: '#00b14f', borderColor: '#00b14f', fontWeight: 'bold', height: '40px' }}
                                >
                                    TÌM KIẾM
                                </Button>
                            </Col>
                        </Row>
                    </ProForm>
                </div>
            </div>
        </>
    )
}
export default SearchClient;