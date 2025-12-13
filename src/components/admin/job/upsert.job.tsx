import { Breadcrumb, Col, ConfigProvider, Divider, Form, Row, message, notification, Card, Tag, Button, Alert, Space, Input } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { DebounceSelect } from "../user/debouce.select";
import { FooterToolbar, ProForm, ProFormDatePicker, ProFormDigit, ProFormSelect, ProFormSwitch, ProFormText } from "@ant-design/pro-components";
import styles from 'styles/admin.module.scss';
import { LOCATION_LIST } from "@/config/utils";
import { ICompanySelect } from "../user/modal.user";
import { useState, useEffect } from 'react';
import { 
    callCreateJob, 
    callFetchCompanyByRole, 
    callFetchJobById, 
    callUpdateJob, 
    updateJobApprove, 
    updateJobReject, 
    callFetchAllJobProfessionAll,
    callGetActivePackages 
} from "@/config/api";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { CheckSquareOutlined, CrownOutlined, CheckCircleOutlined } from "@ant-design/icons";
import enUS from 'antd/lib/locale/en_US';
import dayjs from 'dayjs';
import { IJob, ISkill, SalaryTypeEnum, IUserPackage } from "@/types/backend";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { fetchSkillsByProfession } from "@/redux/slice/skillSlide";

interface ISkillSelect {
    label: string;
    value: string;
    key?: string;
}

interface IJobProfessionSelect {
    label: string;
    value: string;
    key?: string;
}

const ViewUpsertJob = (props: any) => {
    const dispatch = useAppDispatch();
    const [skills, setSkills] = useState<ISkillSelect[]>([]);
    const [jobProfessions, setJobProfessions] = useState<IJobProfessionSelect[]>([]);
    const [salaryType, setSalaryType] = useState<SalaryTypeEnum>("SPECIFIC");
    
    // ✅ THÊM MỚI: State cho package selection
    const [activePackages, setActivePackages] = useState<IUserPackage[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
    const [loadingPackages, setLoadingPackages] = useState(false);

    const navigate = useNavigate();
    const [valueDescription, setValueDescription] = useState<string>("");
    const [valueRequest, setValueRequest] = useState<string>("");
    const [valueInterest, setValueInterest] = useState<string>("");
    const [valueWorkLocation, setValueWorkLocation] = useState<string>("");
    const [valueWorkTime, setValueWorkTime] = useState<string>("");
    
    const salaryTypeOptions = [
        { label: 'Mức lương cố định', value: "SPECIFIC" as SalaryTypeEnum },
        { label: 'Thỏa thuận', value: "NEGOTIABLE" as SalaryTypeEnum },
    ];

    const levelOptions = [
        { label: 'INTERN', value: 'INTERN' },
        { label: 'FRESHER', value: 'FRESHER' },
        { label: 'JUNIOR', value: 'JUNIOR' },
        { label: 'MIDDLE', value: 'MIDDLE' },
        { label: 'SENIOR', value: 'SENIOR' },
    ];

    const skillsByProfession = useAppSelector(state => state.skill.result);

    let location = useLocation();
    let params = new URLSearchParams(location.search);
    const id = params?.get("id");
    const [dataUpdate, setDataUpdate] = useState<IJob | null>(null);
    const [form] = Form.useForm();
    const [preview, setPreview] = useState<any>({
        name: '',
        location: '',
        jobProfession: '',
        minSalary: undefined,
        maxSalary: undefined,
        salaryType: "SPECIFIC",
        quantity: undefined,
        level: '',
        startDate: undefined,
        endDate: undefined,
        active: true,
        skills: [],
        companyLogo: '',
        description: '',
        request: '',
        interest: '',
        worklocation: '',
        worktime: ''
    });
    
    const user = useAppSelector(state => state.account.user);
    const permissions = user?.role?.permissions ?? [];
    const role = user?.role?.name === "SUPER_ADMIN";
    const isHR = user?.role?.name === "HR";
    
    const approJob = permissions.some(
        item => item.apiPath === ALL_PERMISSIONS.JOBS.APPROVE.apiPath && item.method === ALL_PERMISSIONS.JOBS.APPROVE.method
    );
    const rejectJob = permissions.some(
        item => item.apiPath === ALL_PERMISSIONS.JOBS.REJECT.apiPath && item.method === ALL_PERMISSIONS.JOBS.REJECT.method
    );

    // ✅ THÊM MỚI: Fetch active packages khi HR tạo job mới
    useEffect(() => {
        if (isHR && !id) {
            fetchActivePackages();
        }
    }, [isHR, id]);

    const fetchActivePackages = async () => {
        setLoadingPackages(true);
        try {
            const res = await callGetActivePackages();
            if (res?.data) {
                setActivePackages(res.data);
                if (res.data.length === 0) {
                    message.warning('Bạn chưa có gói dịch vụ nào. Vui lòng mua gói dịch vụ trước!');
                }
            }
        } catch (error) {
            message.error('Không thể tải danh sách gói dịch vụ!');
        }
        setLoadingPackages(false);
    };

    const getPackageIcon = (type: string) => {
        switch (type) {
            case 'FEATURED_JOB':
                return <CrownOutlined style={{ color: '#ff4d4f' }} />;
            case 'PRIORITY_BOLD_TITLE':
                return <CheckCircleOutlined style={{ color: '#faad14' }} />;
            case 'PRIORITY_DISPLAY':
                return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
            default:
                return null;
        }
    };

    const getPackageColor = (type: string) => {
        switch (type) {
            case 'FEATURED_JOB':
                return '#ff4d4f';
            case 'PRIORITY_BOLD_TITLE':
                return '#faad14';
            case 'PRIORITY_DISPLAY':
                return '#52c41a';
            default:
                return '#1890ff';
        }
    };

    useEffect(() => {
        if (skillsByProfession && skillsByProfession.length > 0) {
            const temp = skillsByProfession.map(item => ({
                label: item?.name ?? "",
                value: String(item?.id),
                key: String(item?.id)
            }));
            setSkills(temp);
        }
    }, [skillsByProfession]);

    useEffect(() => {
        const init = async () => {
            const resProfessions = await callFetchAllJobProfessionAll('page=1&size=100');
            if (resProfessions && resProfessions.data) {
                const list = resProfessions.data.result;
                const tempProfessions = list.map(item => ({
                    label: item.name as string,
                    value: item.id as string,
                    key: item.id
                }));
                setJobProfessions(tempProfessions);
            }

            if (id) {
                const res = await callFetchJobById(id);
                if (res && res.data) {
                    setDataUpdate(res.data);
                    setValueDescription(res.data.description);
                    setValueRequest(res.data.request);
                    setValueInterest(res.data.interest);
                    setValueWorkLocation(res.data.worklocation);
                    setValueWorkTime(res.data.worktime);
                    setSalaryType(res.data.salaryType || "SPECIFIC");
                    if (res.data.jobProfession?.id) {
                        await dispatch(fetchSkillsByProfession({ professionId: res.data.jobProfession.id }));
                    }

                    const temp: any = res.data?.skills?.map((item: ISkill) => {
                        return {
                            label: item.name,
                            value: item.id,
                            key: item.id
                        }
                    });
                    
                    form.setFieldsValue({
                        ...res.data,
                        company: {
                            label: res.data.company?.name as string,
                            value: `${res.data.company?.id}@#$${res.data.company?.logo}` as string,
                            key: res.data.company?.id
                        },
                        jobProfession: res.data.jobProfession?.id,
                        skills: temp,
                        minSalary: res.data.minSalary,
                        maxSalary: res.data.maxSalary,
                        salaryType: res.data.salaryType || "SPECIFIC",
                        description: res.data.description,
                        request: res.data.request,
                        interest: res.data.interest,
                        worklocation: res.data.worklocation,
                        worktime: res.data.worktime
                    });
                    
                    setPreview({
                        name: res.data.name,
                        location: res.data.location,
                        jobProfession: res.data.jobProfession?.name || '',
                        minSalary: res.data.minSalary,
                        maxSalary: res.data.maxSalary,
                        salaryType: res.data.salaryType || "SPECIFIC",
                        quantity: res.data.quantity,
                        level: res.data.level,
                        startDate: res.data.startDate,
                        endDate: res.data.endDate,
                        skills: temp,
                        companyLogo: res.data.company?.logo || '',
                        description: res.data.description,
                        request: res.data.request,
                        interest: res.data.interest,
                        worklocation: res.data.worklocation,
                        worktime: res.data.worktime
                    });
                }
            }
        }
        init();
        return () => form.resetFields()
    }, [id, dispatch]);

    async function fetchCompanyList(name: string): Promise<ICompanySelect[]> {
        const res = await callFetchCompanyByRole(`page=1&size=100&name ~ '${name}'`);
        if (res && res.data) {
            const list = res.data.result;
            const temp = list.map(item => {
                return {
                    label: item.name as string,
                    value: `${item.id}@#$${item.logo}` as string
                }
            });
            return temp;
        } else return [];
    }

    const onFinish = async (values: any) => {
        try {
            // ✅ KIỂM TRA: Nếu là HR tạo mới job, phải chọn gói
            if (isHR && !dataUpdate?.id && !selectedPackage) {
                message.error('Vui lòng chọn gói dịch vụ!');
                return;
            }

            if (dataUpdate?.id) {
                // UPDATE JOB
                if (!values?.company?.value) {
                    notification.error({
                        message: 'Có lỗi xảy ra',
                        description: 'Vui lòng chọn công ty!'
                    });
                    return;
                }

                const cp = values?.company?.value?.split('@#$');
                let arrSkills = [];
                if (values?.skills && values.skills.length > 0) {
                    if (typeof values?.skills?.[0] === 'object') {
                        arrSkills = values?.skills?.map((item: any) => { return { id: item.value } });
                    } else {
                        arrSkills = values?.skills?.map((item: any) => { return { id: +item } });
                    }
                }

                let startDateValue = values.startDate;
                let endDateValue = values.endDate;
                
                if (startDateValue && typeof startDateValue.toDate === 'function') {
                    startDateValue = startDateValue.toDate();
                } else if (startDateValue instanceof Date) {
                    startDateValue = startDateValue;
                } else if (typeof startDateValue === 'string' && /[0-9]{2}[/][0-9]{2}[/][0-9]{4}$/.test(startDateValue)) {
                    startDateValue = dayjs(startDateValue, 'DD/MM/YYYY').toDate();
                } else if (startDateValue) {
                    startDateValue = dayjs(startDateValue).toDate();
                }
                
                if (endDateValue && typeof endDateValue.toDate === 'function') {
                    endDateValue = endDateValue.toDate();
                } else if (endDateValue instanceof Date) {
                    endDateValue = endDateValue;
                } else if (typeof endDateValue === 'string' && /[0-9]{2}[/][0-9]{2}[/][0-9]{4}$/.test(endDateValue)) {
                    endDateValue = dayjs(endDateValue, 'DD/MM/YYYY').toDate();
                } else if (endDateValue) {
                    endDateValue = dayjs(endDateValue).toDate();
                }

                const job = {
                    name: values.name,
                    skills: arrSkills,
                    company: {
                        id: cp && cp.length > 0 ? cp[0] : "",
                        name: values.company?.label || "",
                        logo: cp && cp.length > 1 ? cp[1] : ""
                    },
                    jobProfession: values.jobProfession ? { id: values.jobProfession } : undefined,
                    location: values.location,
                    minSalary: values.salaryType === "NEGOTIABLE" ? undefined : values.minSalary,
                    maxSalary: values.salaryType === "NEGOTIABLE" ? undefined : values.maxSalary,
                    salaryType: values.salaryType || "SPECIFIC",
                    quantity: values.quantity,
                    level: values.level,
                    description: valueDescription || "",
                    request: valueRequest || "",
                    interest: valueInterest || "",
                    worklocation: valueWorkLocation|| "",
                    worktime: valueWorkTime  || "",
                    startDate: startDateValue,
                    endDate: endDateValue,
                    status: dataUpdate?.status || "PENDING" as "PENDING" | "APPROVED" | "REJECTED",
                    active: values.active !== undefined ? values.active : true,
                };

                const res = await callUpdateJob(job, dataUpdate.id);
                if (res && res.data) {
                    message.success("Cập nhật job thành công");
                    navigate('/admin/job');
                } else {
                    notification.error({
                        message: 'Có lỗi xảy ra',
                        description: res?.message || 'Không thể cập nhật job'
                    });
                }
            } else {
                // CREATE JOB
                if (!values?.company?.value) {
                    notification.error({
                        message: 'Có lỗi xảy ra',
                        description: 'Vui lòng chọn công ty!'
                    });
                    return;
                }

                const cp = values?.company?.value?.split('@#$');
                let arrSkills = [];
                if (values?.skills && values.skills.length > 0) {
                    if (typeof values?.skills?.[0] === 'object') {
                        arrSkills = values?.skills?.map((item: any) => { return { id: item.value } });
                    } else {
                        arrSkills = values?.skills?.map((item: any) => { return { id: +item } });
                    }
                }

                let startDateValue = values.startDate;
                let endDateValue = values.endDate;
                
                if (startDateValue && typeof startDateValue.toDate === 'function') {
                    startDateValue = startDateValue.toDate();
                } else if (startDateValue instanceof Date) {
                    startDateValue = startDateValue;
                } else if (typeof startDateValue === 'string') {
                    startDateValue = dayjs(startDateValue, 'DD/MM/YYYY').toDate();
                } else if (startDateValue) {
                    startDateValue = dayjs(startDateValue).toDate();
                }
                
                if (endDateValue && typeof endDateValue.toDate === 'function') {
                    endDateValue = endDateValue.toDate();
                } else if (endDateValue instanceof Date) {
                    endDateValue = endDateValue;
                } else if (typeof endDateValue === 'string') {
                    endDateValue = dayjs(endDateValue, 'DD/MM/YYYY').toDate();
                } else if (endDateValue) {
                    endDateValue = dayjs(endDateValue).toDate();
                }

                const job = {
                    name: values.name,
                    skills: arrSkills,
                    company: {
                        id: cp && cp.length > 0 ? cp[0] : "",
                        name: values.company?.label || "",
                        logo: cp && cp.length > 1 ? cp[1] : ""
                    },
                    jobProfession: values.jobProfession ? { id: values.jobProfession } : undefined,
                    location: values.location,
                    minSalary: values.salaryType === "NEGOTIABLE" ? undefined : values.minSalary,
                    maxSalary: values.salaryType === "NEGOTIABLE" ? undefined : values.maxSalary,
                    salaryType: values.salaryType || "SPECIFIC",
                    quantity: values.quantity,
                    level: values.level,
                    description: valueDescription || "",
                    request: valueRequest || "",
                    interest: valueInterest || "",
                    worklocation: valueWorkLocation || "",
                    worktime: valueWorkTime || "",
                    startDate: startDateValue,
                    endDate: endDateValue,
                    status: "PENDING" as "PENDING" | "APPROVED" | "REJECTED",
                    active: values.active !== undefined ? values.active : true
                };

                // ✅ CALL API với userPackageId
                const res = await callCreateJob(job, selectedPackage || undefined);
                if (res && res.data) {
                    message.success("Tạo mới job thành công");
                    navigate('/admin/job');
                } else {
                    notification.error({
                        message: 'Có lỗi xảy ra',
                        description: res?.message || 'Không thể tạo mới job'
                    });
                }
            }
        } catch (error: any) {
            notification.error({
                message: 'Có lỗi xảy ra',
                description: error?.response?.data?.message || error?.message || 'Đã có lỗi xảy ra khi xử lý'
            });
        }
    }

    const formatCurrency = (value?: number | null) => {
        if (value === null || value === undefined) return '';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    };

    const renderSalaryPreview = () => {
        if (preview.salaryType === "NEGOTIABLE") {
            return "Thỏa thuận";
        }
        if (preview.minSalary && preview.maxSalary) {
            return `${formatCurrency(preview.minSalary)} - ${formatCurrency(preview.maxSalary)}`;
        }
        if (preview.minSalary) {
            return formatCurrency(preview.minSalary);
        }
        return "--";
    };

    return (
        <div className={styles["upsert-job-container"]}>
            <div className={styles["title"]}>
                <Breadcrumb
                    separator=">"
                    items={[
                        {
                            title: <Link to="/admin/job">Manage Job</Link>,
                        },
                        {
                            title: 'Upsert Job',
                        },
                    ]}
                />
            </div>
            <div>
                <ConfigProvider locale={enUS}>
                    <Row gutter={[20, 20]}>
                        <Col span={24} md={12}>
                            <Card className={styles['form-card']}>
                                {/* ✅ THÊM MỚI: Package Selection cho HR khi tạo job mới */}
                                {isHR && !id && (
                                    <>
                                        {activePackages.length === 0 && !loadingPackages ? (
                                            <Alert
                                                message="Bạn chưa có gói dịch vụ"
                                                description="Vui lòng mua gói dịch vụ để đăng tin tuyển dụng"
                                                type="warning"
                                                showIcon
                                                action={
                                                    <Button type="primary" onClick={() => window.location.href = '/admin/packages'}>
                                                        Mua gói dịch vụ
                                                    </Button>
                                                }
                                                style={{ marginBottom: 24 }}
                                            />
                                        ) : (
                                            <div style={{ marginBottom: 24 }}>
                                                <h3 style={{ marginBottom: 12 }}>Chọn gói dịch vụ để đăng tin:</h3>
                                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                                    {activePackages.map(pkg => (
                                                        <Card
                                                            key={pkg.id}
                                                            hoverable
                                                            size="small"
                                                            style={{
                                                                width: '100%',
                                                                border: selectedPackage === pkg.id 
                                                                    ? `2px solid ${getPackageColor(pkg.servicePackage.packageType)}`
                                                                    : '1px solid #d9d9d9',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={() => setSelectedPackage(pkg.id)}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'start', gap: 8 }}>
                                                                {getPackageIcon(pkg.servicePackage.packageType)}
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                                                                        {pkg.servicePackage.name}
                                                                    </div>
                                                                    <Space>
                                                                        <span style={{ fontSize: 12, color: '#666' }}>
                                                                            Còn lại: <strong>{pkg.remainingJobCount}/{pkg.servicePackage.jobLimit}</strong> tin
                                                                        </span>
                                                                        <span style={{ fontSize: 12, color: '#666' }}>
                                                                            Hạn: <strong>{pkg.daysRemaining}</strong> ngày
                                                                        </span>
                                                                    </Space>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </div>
                                                <Divider />
                                            </div>
                                        )}
                                    </>
                                )}

                                <ProForm
                                    form={form}
                                    onFinish={onFinish}
                                    layout="vertical"
                                    initialValues={{
                                        salaryType: "SPECIFIC",
                                        active: true,
                                        quantity: 1
                                    }}
                                    onValuesChange={(_, allValues) => {
                                        if (allValues.salaryType) {
                                            setSalaryType(allValues.salaryType);
                                        }
                                        const companyLogo = allValues?.company?.value?.split?.('@#$')?.[1];
                                        const jobProfessionLabel = jobProfessions.find(item => item.value === allValues.jobProfession)?.label;
                                        setPreview((prev: any) => ({
                                            ...prev,
                                            ...allValues,
                                            jobProfession: jobProfessionLabel || prev.jobProfession,
                                            skills: allValues?.skills || prev.skills,
                                            companyLogo: companyLogo || prev.companyLogo,
                                            salaryType: allValues?.salaryType || prev.salaryType || "SPECIFIC"
                                        }))
                                    }}
                                    submitter={{
                                        searchConfig: {
                                            resetText: "Hủy",
                                            submitText: <>{dataUpdate?.id ? "Cập nhật Job" : "Tạo mới Job"}</>
                                        },
                                        onReset: () => navigate('/admin/job'),
                                        render: (_: any, dom: any) => {
                                            const hasApproveRejectPermission = role && dataUpdate?.id && dataUpdate?.status === "PENDING";
                                            
                                            return (
                                                <FooterToolbar>
                                                    {hasApproveRejectPermission ? (
                                                        <>
                                                            <Button onClick={() => navigate('/admin/job')}>
                                                                Hủy
                                                            </Button>
                                                            <Button
                                                                type="primary"
                                                                style={{ marginLeft: 10 }}
                                                                onClick={async () => {
                                                                    try {
                                                                        const res = await updateJobApprove(dataUpdate.id!);
                                                                        if (res.statusCode === 200) {
                                                                            message.success("Duyệt job thành công");
                                                                            navigate('/admin/job');
                                                                        } else {
                                                                            notification.error({
                                                                                message: 'Có lỗi xảy ra'
                                                                            });
                                                                        }
                                                                    } catch (error: any) {
                                                                        notification.error({
                                                                            message: 'Có lỗi xảy ra'
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                Chấp nhận
                                                            </Button>
                                                            <Button
                                                                danger
                                                                type="primary"
                                                                style={{ marginLeft: 10 }}
                                                                onClick={async () => {
                                                                    try {
                                                                        const res = await updateJobReject(dataUpdate.id!);
                                                                        if (res.statusCode === 200) {
                                                                            message.success("Từ chối job thành công");
                                                                            navigate('/admin/job');
                                                                        } else {
                                                                            notification.error({
                                                                                message: 'Có lỗi xảy ra'
                                                                            });
                                                                        }
                                                                    } catch (error: any) {
                                                                        notification.error({
                                                                            message: 'Có lỗi xảy ra'
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                ❌ Từ chối
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        dom
                                                    )}
                                                </FooterToolbar>
                                            );
                                        },
                                        submitButtonProps: {
                                            icon: <CheckSquareOutlined />,
                                            disabled: isHR && !id && !selectedPackage
                                        },
                                    }}
                                >
                                    <Row gutter={[16, 16]}>
                                    <Col span={24}>
                                        <ProFormText
                                            label="Tên Job"
                                            name="name"
                                            rules={[
                                                { required: true, message: 'Vui lòng không bỏ trống' },
                                            ]}
                                            placeholder="Nhập tên job"
                                        />
                                    </Col>
                                    <Col span={24}>
                                        <ProFormSelect
                                            name="jobProfession"
                                            label="Ngành nghề"
                                            placeholder="Chọn ngành nghề"
                                            options={jobProfessions}
                                            rules={[{ required: true, message: 'Vui lòng chọn ngành nghề!' }]}
                                            fieldProps={{
                                                showSearch: true,
                                                optionFilterProp: 'label',
                                                onChange: (value: string) => {
                                                    if (value) {
                                                        dispatch(fetchSkillsByProfession({ professionId: value }));
                                                    } else {
                                                        setSkills([]);
                                                        form.setFieldsValue({ skills: [] });
                                                    }
                                                }
                                            }}
                                        />
                                    </Col>
                                    <Col span={24}>
                                        <ProForm.Item
                                            name="company"
                                            label="Thuộc Công Ty"
                                            rules={[{ required: true, message: 'Vui lòng chọn công ty!' }]}
                                        >
                                            <DebounceSelect
                                                allowClear
                                                showSearch
                                                placeholder="Chọn công ty"
                                                fetchOptions={fetchCompanyList}
                                                style={{ width: '100%' }}
                                            />
                                        </ProForm.Item>
                                    </Col>
                                    <Col span={24}>
                                        <ProFormSelect
                                            name="skills"
                                            label="Kỹ năng yêu cầu"
                                            options={skills}
                                            placeholder="Chọn kỹ năng"
                                            mode="multiple"
                                            fieldProps={{
                                                labelInValue: true
                                            }}
                                            rules={[{ required: true, message: 'Vui lòng chọn kỹ năng!' }]}
                                        />
                                    </Col>
                                    <Col span={24}>
                                        <ProFormSelect
                                            name="location"
                                            label="Địa điểm"
                                            options={LOCATION_LIST.filter(item => item.value !== 'ALL')}
                                            placeholder="Chọn địa điểm"
                                            rules={[{ required: true, message: 'Vui lòng chọn địa điểm!' }]}
                                        />
                                    </Col>
                                    <Col span={24}>
                                        <ProFormSelect
                                            name="salaryType"
                                            label="Loại lương"
                                            options={salaryTypeOptions}
                                            placeholder="Chọn loại lương"
                                            rules={[{ required: true, message: 'Vui lòng chọn loại lương!' }]}
                                        />
                                    </Col>
                                    <Col span={12}>
                                        <ProFormDigit
                                            label="Lương tối thiểu"
                                            name="minSalary"
                                            placeholder="Ví dụ: 10000000"
                                            fieldProps={{
                                                disabled: salaryType === "NEGOTIABLE",
                                                min: 0,
                                                formatter: (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                                                parser: (value) => +(value || '').replace(/\$\s?|(,*)/g, '')
                                            }}
                                            rules={[
                                                {
                                                    validator: (_, value) => {
                                                        if (salaryType === "NEGOTIABLE") return Promise.resolve();
                                                        if (value || value === 0) return Promise.resolve();
                                                        return Promise.reject(new Error('Vui lòng nhập lương tối thiểu!'));
                                                    }
                                                }
                                            ]}
                                        />
                                    </Col>
                                    <Col span={12}>
                                        <ProFormDigit
                                            label="Lương tối đa"
                                            name="maxSalary"
                                            placeholder="Ví dụ: 20000000"
                                            fieldProps={{
                                                disabled: salaryType === "NEGOTIABLE",
                                                min: 0,
                                                formatter: (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                                                parser: (value) => +(value || '').replace(/\$\s?|(,*)/g, '')
                                            }}
                                            rules={[
                                                {
                                                    validator: (_, value) => {
                                                        if (salaryType === "NEGOTIABLE") return Promise.resolve();
                                                        if (value || value === 0) {
                                                            const minSalaryValue = form.getFieldValue('minSalary');
                                                            if (minSalaryValue && value < minSalaryValue) {
                                                                return Promise.reject(new Error('Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu!'));
                                                            }
                                                            return Promise.resolve();
                                                        }
                                                        return Promise.reject(new Error('Vui lòng nhập lương tối đa!'));
                                                    }
                                                }
                                            ]}
                                        />
                                    </Col>
                                    <Col span={12}>
                                        <ProFormDigit
                                            label="Số lượng tuyển"
                                            name="quantity"
                                            min={1}
                                            fieldProps={{ min: 1 }}
                                            rules={[{ required: true, message: 'Vui lòng nhập số lượng tuyển!' }]}
                                        />
                                    </Col>
                                    <Col span={12}>
                                        <ProFormSelect
                                            name="level"
                                            label="Cấp bậc"
                                            options={levelOptions}
                                            placeholder="Chọn cấp bậc"
                                            rules={[{ required: true, message: 'Vui lòng chọn cấp bậc!' }]}
                                        />
                                    </Col>
                                    <Col span={12}>
                                        <ProFormDatePicker
                                            label="Ngày bắt đầu"
                                            name="startDate"
                                            fieldProps={{
                                                format: 'DD/MM/YYYY'
                                            }}
                                            rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu!' }]}
                                            placeholder="dd/mm/yyyy"
                                        />
                                    </Col>
                                    <Col span={12}>
                                        <ProFormDatePicker
                                            label="Ngày kết thúc"
                                            name="endDate"
                                            fieldProps={{
                                                format: 'DD/MM/YYYY'
                                            }}
                                            rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc!' }]}
                                            placeholder="dd/mm/yyyy"
                                        />
                                    </Col>
                                    
                                    </Row>
                                    <Divider />
                                    <Form.Item
                                        name="description"
                                        label="Mô tả công việc"
                                        rules={[{ required: true, message: 'Vui lòng nhập mô tả công việc!' }]}
                                    >
                                        <ReactQuill
                                            theme="snow"
                                            value={valueDescription}
                                            onChange={(content) => {
                                                setValueDescription(content);
                                                form.setFieldsValue({ description: content });
                                            }}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name="request"
                                        label="Yêu cầu ứng viên"
                                        rules={[{ required: true, message: 'Vui lòng nhập yêu cầu ứng viên!' }]}
                                    >
                                        <ReactQuill
                                            theme="snow"
                                            value={valueRequest}
                                            onChange={(content) => {
                                                setValueRequest(content);
                                                form.setFieldsValue({ request: content });
                                            }}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name="interest"
                                        label="Quyền lợi"
                                        rules={[{ required: true, message: 'Vui lòng nhập quyền lợi!' }]}
                                    >
                                        <ReactQuill
                                            theme="snow"
                                            value={valueInterest}
                                            onChange={(content) => {
                                                setValueInterest(content);
                                                form.setFieldsValue({ interest: content });
                                            }}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name="worklocation"
                                        label="Địa điểm làm việc chi tiết"
                                        rules={[{ required: true, message: 'Vui lòng nhập địa điểm làm việc chi tiết!' }]}
                                    >
                                        <Input.TextArea
                                            rows={3}
                                            value={valueWorkLocation}
                                            onChange={(event) => {
                                                setValueWorkLocation(event.target.value);
                                                form.setFieldsValue({ worklocation: event.target.value });
                                            }}
                                            placeholder="Ví dụ: Tầng 10, toà nhà X, quận Y"
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name="worktime"
                                        label="Thời gian làm việc"
                                        rules={[{ required: true, message: 'Vui lòng nhập thời gian làm việc!' }]}
                                    >
                                        <Input.TextArea
                                            rows={3}
                                            value={valueWorkTime}
                                            onChange={(event) => {
                                                setValueWorkTime(event.target.value);
                                                form.setFieldsValue({ worktime: event.target.value });
                                            }}
                                            placeholder="Ví dụ: Thứ 2 - Thứ 6 (9:00 - 18:00)"
                                        />
                                    </Form.Item>
                                </ProForm>
                            </Card>
                        </Col>

                        <Col span={24} md={12}>
                            <Card className={styles['job-preview']}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h2 style={{ margin: 0 }}>{preview.name || 'Tên job'}</h2>
                                        {preview.jobProfession && (
                                            <Tag color="blue" style={{ marginTop: 4 }}>
                                                {preview.jobProfession}
                                            </Tag>
                                        )}
                                    </div>
                                    {preview.companyLogo && (
                                        <img
                                            src={preview.companyLogo}
                                            alt="logo"
                                            style={{ width: 80, height: 40, objectFit: 'contain' }}
                                        />
                                    )}
                                </div>
                                <Divider />
                                <Row gutter={[16, 16]}>
                                    <Col span={12}>
                                        <div>
                                            <strong>Địa điểm</strong>
                                            <div>{preview.location || '--'}</div>
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <div>
                                            <strong>Số lượng tuyển</strong>
                                            <div>{preview.quantity || '--'}</div>
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <div>
                                            <strong>Cấp bậc</strong>
                                            <div>{preview.level || '--'}</div>
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <div>
                                            <strong>Ngày đăng</strong>
                                            <div>{preview.startDate ? dayjs(preview.startDate).format('DD/MM/YYYY') : '--'}</div>
                                        </div>
                                    </Col>
                                </Row>
                                <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                                    <strong>Mức lương</strong>
                                    <div style={{ fontSize: 18, color: '#1890ff', fontWeight: 600 }}>
                                        {renderSalaryPreview()}
                                    </div>
                                </div>
                                <Divider />
                                <h3>Kỹ năng yêu cầu</h3>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {(preview.skills || []).map((skill: any) => (
                                        <Tag key={skill?.value || skill} color="blue">
                                            {skill?.label || skill}
                                        </Tag>
                                    ))}
                                </div>
                                <Divider />
                                <h3>Mô tả công việc</h3>
                                <div
                                    dangerouslySetInnerHTML={{ __html: preview.description || '<p>Chưa có mô tả</p>' }}
                                />
                                <Divider />
                                <h3>Yêu cầu ứng viên</h3>
                                <div
                                    dangerouslySetInnerHTML={{ __html: preview.request || '<p>Chưa có yêu cầu</p>' }}
                                />
                                <Divider />
                                <h3>Quyền lợi</h3>
                                <div
                                    dangerouslySetInnerHTML={{ __html: preview.interest || '<p>Chưa có quyền lợi</p>' }}
                                />
                                <Divider />
                                <h3>Địa điểm & Thời gian làm việc</h3>
                                <p><strong>Địa điểm:</strong> {preview.worklocation || 'Chưa cập nhật'}</p>
                                <p><strong>Thời gian:</strong> {preview.worktime || 'Chưa cập nhật'}</p>
                                <Button type="primary" style={{ marginTop: 16, background: '#197bcd' }}>
                                    Ứng tuyển ngay
                                </Button>
                            </Card>
                        </Col>
                    </Row>
                </ConfigProvider>
            </div>
        </div>
    )
}

export default ViewUpsertJob;