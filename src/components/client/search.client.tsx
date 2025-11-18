import { Button, Col, Form, Row, Select, notification } from 'antd';
import { EnvironmentOutlined, MonitorOutlined } from '@ant-design/icons';
import { LOCATION_LIST } from '@/config/utils';
import { ProForm } from '@ant-design/pro-components';
import { useEffect, useState } from 'react';
import { callFetchAllSkill } from '@/config/api';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import bannerPlaceholder from '@/img/baner.jpeg';

const SearchClient = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const optionsLocations = LOCATION_LIST;
    const [form] = Form.useForm();
    const [optionsSkills, setOptionsSkills] = useState<{
        label: string;
        value: string;
    }[]>([]);

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        if (location.search) {
            const queryLocation = searchParams.get("location");
            const querySkills = searchParams.get("skills")
            if (queryLocation) {
                form.setFieldValue("location", queryLocation.split(","))
            }
            if (querySkills) {
                form.setFieldValue("skills", querySkills.split(","))
            }
        }
    }, [location.search])

    useEffect(() => {
        fetchSkill();
    }, [])

    const fetchSkill = async () => {
        let query = `page=1&size=100&sort=createdAt,desc`;

        const res = await callFetchAllSkill(query);
        if (res && res.data) {
            const arr = res?.data?.result?.map(item => {
                return {
                    label: item.name as string,
                    value: item.id + "" as string
                }
            }) ?? [];
            setOptionsSkills(arr);
        }
    }

    const bannerImageSrc = bannerPlaceholder; // Replace this import with your desired banner image path

    const onFinish = async (values: any) => {
        let query = "";
        if (values?.location?.length) {
            query = `location=${values?.location?.join(",")}`;
        }
        if (values?.skills?.length) {
            query = values.location?.length ? query + `&skills=${values?.skills?.join(",")}`
                :
                `skills=${values?.skills?.join(",")}`;
        }

        if (!query) {
            notification.error({
                message: 'Có lỗi xảy ra',
                description: "Vui lòng chọn tiêu chí để search"
            });
            return;
        }
        navigate(`/job?${query}`);
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
    )
}
export default SearchClient;