import { Button, Col, Form, Row, Select, notification } from 'antd';
import { EnvironmentOutlined, MonitorOutlined, AppstoreOutlined, DollarCircleOutlined } from '@ant-design/icons';
import { LOCATION_LIST } from '@/config/utils';
import { ProForm } from '@ant-design/pro-components';
import { useEffect, useState } from 'react';
import { callFetchAllSkill } from '@/config/api';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

const SearchClient = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const optionsLocations = LOCATION_LIST;
    const [form] = Form.useForm();
    const [optionsSkills, setOptionsSkills] = useState<{
        label: string;
        value: string;
    }[]>([]);

    // Danh sách nghề nghiệp
    const optionsJobs = [
        { label: 'Frontend Developer', value: 'frontend' },
        { label: 'Backend Developer', value: 'backend' },
        { label: 'Full Stack Developer', value: 'fullstack' },
        { label: 'Mobile Developer', value: 'mobile' },
        { label: 'DevOps Engineer', value: 'devops' },
        { label: 'QA/Tester', value: 'qa' },
        { label: 'UI/UX Designer', value: 'uiux' },
        { label: 'Data Engineer', value: 'data' },
        { label: 'AI/ML Engineer', value: 'ai' },
        { label: 'Security Engineer', value: 'security' },
    ];

    // Danh sách mức lương
    const optionsSalary = [
        { label: 'Dưới 10 triệu', value: '0-10' },
        { label: '10 - 15 triệu', value: '10-15' },
        { label: '15 - 20 triệu', value: '15-20' },
        { label: '20 - 30 triệu', value: '20-30' },
        { label: '30 - 50 triệu', value: '30-50' },
        { label: 'Trên 50 triệu', value: '50-999' },
        { label: 'Thỏa thuận', value: 'negotiable' },
    ];

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        if (location.search) {
            const queryLocation = searchParams.get("location");
            const querySkills = searchParams.get("skills");
            const queryJobs = searchParams.get("jobs");
            const querySalary = searchParams.get("salary");
            
            if (queryLocation) {
                form.setFieldValue("location", queryLocation.split(","))
            }
            if (querySkills) {
                form.setFieldValue("skills", querySkills.split(","))
            }
            if (queryJobs) {
                form.setFieldValue("jobs", queryJobs.split(","))
            }
            if (querySalary) {
                form.setFieldValue("salary", querySalary.split(","))
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

    const onFinish = async (values: any) => {
        const queryParams: string[] = [];
        
        if (values?.location?.length) {
            queryParams.push(`location=${values.location.join(",")}`);
        }
        if (values?.skills?.length) {
            queryParams.push(`skills=${values.skills.join(",")}`);
        }
        if (values?.jobs?.length) {
            queryParams.push(`jobs=${values.jobs.join(",")}`);
        }
        if (values?.salary?.length) {
            queryParams.push(`salary=${values.salary.join(",")}`);
        }

        const query = queryParams.join("&");

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
                <Col span={24}><h2>Việc Làm IT Cho Developer</h2></Col>
                <Col span={24} md={12}>
                    <ProForm.Item name="skills">
                        <Select
                            mode="multiple"
                            allowClear
                            suffixIcon={null}
                            style={{ width: '100%' }}
                            placeholder={
                                <>
                                    <MonitorOutlined /> Tìm theo kỹ năng...
                                </>
                            }
                            optionLabelProp="label"
                            options={optionsSkills}
                        />
                    </ProForm.Item>
                </Col>
                <Col span={24} md={12}>
                    <ProForm.Item name="jobs">
                        <Select
                            mode="multiple"
                            allowClear
                            suffixIcon={null}
                            style={{ width: '100%' }}
                            placeholder={
                                <>
                                    <AppstoreOutlined /> Tìm theo nghề nghiệp...
                                </>
                            }
                            optionLabelProp="label"
                            options={optionsJobs}
                        />
                    </ProForm.Item>
                </Col>
                <Col span={12} md={8}>
                    <ProForm.Item name="location">
                        <Select
                            mode="multiple"
                            allowClear
                            suffixIcon={null}
                            style={{ width: '100%' }}
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
                <Col span={12} md={8}>
                    <ProForm.Item name="salary">
                        <Select
                            mode="multiple"
                            allowClear
                            suffixIcon={null}
                            style={{ width: '100%' }}
                            placeholder={
                                <>
                                    <DollarCircleOutlined /> Mức lương...
                                </>
                            }
                            optionLabelProp="label"
                            options={optionsSalary}
                        />
                    </ProForm.Item>
                </Col>
                <Col span={24} md={8}>
                    <Button type='primary' onClick={() => form.submit()} style={{ width: '100%' }}>
                        Search
                    </Button>
                </Col>
            </Row>
        </ProForm>
    )
}
export default SearchClient;