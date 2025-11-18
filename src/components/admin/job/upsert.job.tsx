import { Breadcrumb, Col, ConfigProvider, Divider, Form, Row, message, notification, Card, Tag, Button, Switch } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { DebounceSelect } from "../user/debouce.select";
import { FooterToolbar, ProForm, ProFormDatePicker, ProFormDigit, ProFormSelect, ProFormSwitch, ProFormText } from "@ant-design/pro-components";
import styles from 'styles/admin.module.scss';
import { LOCATION_LIST, SKILLS_LIST } from "@/config/utils";
import { ICompanySelect } from "../user/modal.user";
import { useState, useEffect } from 'react';
import { callCreateJob, callFetchAllSkill, callFetchCompanyByRole, callFetchJobById, callUpdateJob, updateJobApprove, updateJobReject, callFetchAllJobProfession } from "@/config/api";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { CheckSquareOutlined } from "@ant-design/icons";
import enUS from 'antd/lib/locale/en_US';
import dayjs from 'dayjs';
import { IJob, ISkill, IJobProfession, SalaryTypeEnum } from "@/types/backend";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { fetchJobProfession } from "@/redux/slice/jobProfessionSlice";
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
    const [companies, setCompanies] = useState<ICompanySelect[]>([]);
    const [skills, setSkills] = useState<ISkillSelect[]>([]);
    const [jobProfessions, setJobProfessions] = useState<IJobProfessionSelect[]>([]);
    const [salaryType, setSalaryType] = useState<SalaryTypeEnum>("SPECIFIC");

    const navigate = useNavigate();
    const [valueDescription, setValueDescription] = useState<string>("");
    const [valueRequest, setValueRequest] = useState<string>("");
    const [valueInterest, setValueInterest] = useState<string>("");
    const [valueWorkLocation, setValueWorkLocation] = useState<string>("");
    const [valueWorkTime, setValueWorkTime] = useState<string>("");
    
    // Redux selectors
    const jobProfessionData = useAppSelector(state => state.jobProfession.result);
    const skillsByProfession = useAppSelector(state => state.skill.result);



    let location = useLocation();
    let params = new URLSearchParams(location.search);
    const id = params?.get("id"); // job id
    const [dataUpdate, setDataUpdate] = useState<IJob | null>(null);
    const [form] = Form.useForm();
    const [preview, setPreview] = useState<any>({
        name: '',
        location: '',
        salary: undefined,
        quantity: undefined,
        level: '',
        startDate: undefined,
        endDate: undefined,
        active: true,
        skills: [],
        companyLogo: ''
    });
    const user = useAppSelector(state => state.account.user);
    const permissions = user?.role?.permissions ?? [];
    const role=user?.role?.name==="SUPER_ADMIN";
    console.log(role);
    const approJob = permissions.some(
        item => item.apiPath===ALL_PERMISSIONS.JOBS.APPROVE.apiPath && item.method===ALL_PERMISSIONS.JOBS.APPROVE.method
    )
    const rejectJob = permissions.some(
        item => item.apiPath===ALL_PERMISSIONS.JOBS.REJECT.apiPath && item.method===ALL_PERMISSIONS.JOBS.REJECT.method
    )
   
    // Load skills when jobProfession is selected
    useEffect(() => {
        if (skillsByProfession && skillsByProfession.length > 0) {
            const temp = skillsByProfession.map(item => ({
                label: item.name as string,
                value: item.id as string,
                key: item.id
            }));
            setSkills(temp);
        }
    }, [skillsByProfession]);

    useEffect(() => {
        console.log(approJob,rejectJob);
        const init = async () => {
            // Load job professions
            const resProfessions = await callFetchAllJobProfession('page=1&size=100');
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
                    setCompanies([
                        {
                            label: res.data.company?.name as string,
                            value: `${res.data.company?.id}@#$${res.data.company?.logo}` as string,
                            key: res.data.company?.id
                        }
                    ])

                    // Load skills by profession if jobProfession exists
                    if (res.data.jobProfession?.id) {
                        await dispatch(fetchSkillsByProfession({ professionId: res.data.jobProfession.id }));
                    }

                    //skills
                    const temp: any = res.data?.skills?.map((item: ISkill) => {
                        return {
                            label: item.name,
                            value: item.id,
                            key: item.id
                        }
                    })
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
                        salaryType: res.data.salaryType || "SPECIFIC"
                    })
                    setPreview({
                        name: res.data.name,
                        location: res.data.location,
                        minSalary: res.data.minSalary,
                        maxSalary: res.data.maxSalary,
                        salaryType: res.data.salaryType || "SPECIFIC",
                        quantity: res.data.quantity,
                        level: res.data.level,
                        startDate: res.data.startDate,
                        endDate: res.data.endDate,
                        skills: temp,
                        companyLogo: res.data.company?.logo || ''
                    })
                }
            }
        }
        init();
        return () => form.resetFields()
    }, [id, dispatch])

    // Usage of DebounceSelect
    async function fetchCompanyList(name: string): Promise<ICompanySelect[]> {
        const res = await callFetchCompanyByRole(`page=1&size=100&name ~ '${name}'`);
        if (res && res.data) {
            const list = res.data.result;
            const temp = list.map(item => {
                return {
                    label: item.name as string,
                    value: `${item.id}@#$${item.logo}` as string
                }
            })
            return temp;
        } else return [];
    }

    async function fetchSkillList(): Promise<ISkillSelect[]> {
        const res = await callFetchAllSkill(`page=1&size=100`);
        if (res && res.data) {
            const list = res.data.result;
            const temp = list.map(item => {
                return {
                    label: item.name as string,
                    value: `${item.id}` as string
                }
            })
            return temp;
        } else return [];
    }

    const onFinish = async (values: any) => {
        try {
            if (dataUpdate?.id) {
                //update
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

                // Xử lý ngày tháng
                let startDateValue = values.startDate;
                let endDateValue = values.endDate;
                
                // Kiểm tra nếu là dayjs object (có method toDate)
                if (startDateValue && typeof startDateValue.toDate === 'function') {
                    startDateValue = startDateValue.toDate();
                } else if (startDateValue instanceof Date) {
                    // Đã là Date object
                    startDateValue = startDateValue;
                } else if (typeof startDateValue === 'string' && /[0-9]{2}[/][0-9]{2}[/][0-9]{4}$/.test(startDateValue)) {
                    startDateValue = dayjs(startDateValue, 'DD/MM/YYYY').toDate();
                } else if (startDateValue) {
                    startDateValue = dayjs(startDateValue).toDate();
                }
                
                if (endDateValue && typeof endDateValue.toDate === 'function') {
                    endDateValue = endDateValue.toDate();
                } else if (endDateValue instanceof Date) {
                    // Đã là Date object
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

                }

                const res = await callUpdateJob(job, dataUpdate.id);
                if (res && res.data) {
                    message.success("Cập nhật job thành công");
                    navigate('/admin/job')
                } else {
                    notification.error({
                        message: 'Có lỗi xảy ra',
                        description: res?.message || 'Không thể cập nhật job'
                    });
                }
            } else {
                //create
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

                // Xử lý ngày tháng
                let startDateValue = values.startDate;
                let endDateValue = values.endDate;
                
                // Kiểm tra nếu là dayjs object (có method toDate)
                if (startDateValue && typeof startDateValue.toDate === 'function') {
                    startDateValue = startDateValue.toDate();
                } else if (startDateValue instanceof Date) {
                    // Đã là Date object
                    startDateValue = startDateValue;
                } else if (typeof startDateValue === 'string') {
                    startDateValue = dayjs(startDateValue, 'DD/MM/YYYY').toDate();
                } else if (startDateValue) {
                    startDateValue = dayjs(startDateValue).toDate();
                }
                
                if (endDateValue && typeof endDateValue.toDate === 'function') {
                    endDateValue = endDateValue.toDate();
                } else if (endDateValue instanceof Date) {
                    // Đã là Date object
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
                }

                const res = await callCreateJob(job);
                if (res && res.data) {
                    message.success("Tạo mới job thành công");
                    navigate('/admin/job')
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
                description: error?.message || 'Đã có lỗi xảy ra khi xử lý'
            });
        }
    }



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
            <div >

                <ConfigProvider locale={enUS}>
                    <Row gutter={[20, 20]}>
                        <Col span={24} md={12}>
                            <Card className={styles['form-card']}>
                            <ProForm
                                form={form}
                                onFinish={onFinish}
                                layout="vertical"
                                onValuesChange={(_, allValues) => {
                                    if (allValues.salaryType) {
                                        setSalaryType(allValues.salaryType);
                                    }
                                    setPreview((prev: any) => ({
                                        ...prev,
                                        ...allValues,
                                        skills: allValues?.skills || prev.skills,
                                        companyLogo: (allValues?.company?.value?.split?.('@#$')?.[1]) || prev.companyLogo,
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
                                        // Nếu có quyền approJob và rejectJob và job đang PENDING: chỉ hiển thị approve/reject
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
                                                                    if (res.statusCode===200) {
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
                                                                   
                                                                    if (res.statusCode===200) {
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
                                                    // Nếu không có quyền: hiển thị nút submit và hủy
                                                    dom
                                                )}
                                            </FooterToolbar>
                                        );
                                    },
                                    submitButtonProps: {
                                        icon: <CheckSquareOutlined />
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
                                    label="Danh mục nghề nghiệp"
                                    options={jobProfessions}
                                    placeholder="Please select a profession"
                                    rules={[{ required: true, message: 'Vui lòng chọn danh mục nghề nghiệp!' }]}
                                    allowClear
                                    fieldProps={{
                                        onChange: async (value: string) => {
                                            if (value) {
                                                await dispatch(fetchSkillsByProfession({ professionId: value }));
                                                form.setFieldsValue({ skills: [] }); // Reset skills when profession changes
                                            } else {
                                                setSkills([]);
                                            }
                                        }
                                    }}
                                />
                            </Col>
                            <Col span={24}>
                                <ProFormSelect
                                    name="skills"
                                    label="Kỹ năng yêu cầu"
                                    options={skills}
                                    placeholder="Please select a skill"
                                    rules={[{ required: true, message: 'Vui lòng chọn kỹ năng!' }]}
                                    allowClear
                                    mode="multiple"
                                    fieldProps={{
                                        suffixIcon: null
                                    }}
                                />
                            </Col>

                            <Col span={24}>
                                <ProFormSelect
                                    name="location"
                                    label="Địa điểm"
                                    options={LOCATION_LIST.filter(item => item.value !== 'ALL')}
                                    placeholder="Please select a location"
                                    rules={[{ required: true, message: 'Vui lòng chọn địa điểm!' }]}
                                />
                            </Col>
                            <Col span={24}>
                                <ProForm.Item
                                    name="salaryType"
                                    label="Loại lương"
                                    initialValue="SPECIFIC"
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>Thương lượng</span>
                                        <Switch
                                            checked={salaryType === "NEGOTIABLE"}
                                            onChange={(checked) => {
                                                const newType: SalaryTypeEnum = checked ? "NEGOTIABLE" : "SPECIFIC";
                                                setSalaryType(newType);
                                                form.setFieldsValue({ salaryType: newType });
                                                if (checked) {
                                                    form.setFieldsValue({ minSalary: undefined, maxSalary: undefined });
                                                }
                                            }}
                                        />
                                    </div>
                                </ProForm.Item>
                            </Col>
                            {salaryType === "SPECIFIC" && (
                                <>
                                    <Col span={12}>
                                        <ProFormDigit
                                            label="Lương tối thiểu"
                                            name="minSalary"
                                            rules={[{ required: salaryType === "SPECIFIC", message: 'Vui lòng không bỏ trống' }]}
                                            placeholder="Nhập lương tối thiểu"
                                            fieldProps={{
                                                addonAfter: " đ",
                                                formatter: (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                                                parser: (value) => +(value || '').replace(/\$\s?|(,*)/g, '')
                                            }}
                                        />
                                    </Col>
                                    <Col span={12}>
                                        <ProFormDigit
                                            label="Lương tối đa"
                                            name="maxSalary"
                                            rules={[{ required: salaryType === "SPECIFIC", message: 'Vui lòng không bỏ trống' }]}
                                            placeholder="Nhập lương tối đa"
                                            fieldProps={{
                                                addonAfter: " đ",
                                                formatter: (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                                                parser: (value) => +(value || '').replace(/\$\s?|(,*)/g, '')
                                            }}
                                        />
                                    </Col>
                                </>
                            )}
                            <Col span={24}>
                                <ProFormDigit
                                    label="Số lượng"
                                    name="quantity"
                                    rules={[{ required: true, message: 'Vui lòng không bỏ trống' }]}
                                    placeholder="Nhập số lượng"
                                />
                            </Col>
                            <Col span={24}>
                                <ProFormSelect
                                    name="level"
                                    label="Trình độ"
                                    valueEnum={{
                                        INTERN: 'INTERN',
                                        FRESHER: 'FRESHER',
                                        JUNIOR: 'JUNIOR',
                                        MIDDLE: 'MIDDLE',
                                        SENIOR: 'SENIOR',
                                    }}
                                    placeholder="Please select a level"
                                    rules={[{ required: true, message: 'Vui lòng chọn level!' }]}
                                />
                            </Col>

                            {(dataUpdate?.id || !id) &&
                                <Col span={24} md={6}>
                                    <ProForm.Item
                                        name="company"
                                        label="Thuộc Công Ty"
                                        rules={[{ required: true, message: 'Vui lòng chọn company!' }]}
                                    >
                                        <DebounceSelect
                                            allowClear
                                            showSearch
                                            defaultValue={companies}
                                            value={companies}
                                            placeholder="Chọn công ty"
                                            fetchOptions={fetchCompanyList}
                                            onChange={(newValue: any) => {
                                                if (newValue?.length === 0 || newValue?.length === 1) {
                                                    setCompanies(newValue as ICompanySelect[]);
                                                }
                                            }}
                                            style={{ width: '100%' }}
                                        />
                                    </ProForm.Item>

                                </Col>
                            }

                                </Row>
                                <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <ProFormDatePicker
                                    label="Ngày bắt đầu"
                                    name="startDate"
                                    normalize={(value) => value && dayjs(value, 'DD/MM/YYYY')}
                                    fieldProps={{
                                        format: 'DD/MM/YYYY',

                                    }}
                                    rules={[{ required: true, message: 'Vui lòng chọn ngày cấp' }]}
                                    placeholder="dd/mm/yyyy"
                                />
                            </Col>
                            <Col span={24}>
                                <ProFormDatePicker
                                    label="Ngày kết thúc"
                                    name="endDate"
                                    normalize={(value) => value && dayjs(value, 'DD/MM/YYYY')}
                                    fieldProps={{
                                        format: 'DD/MM/YYYY',

                                    }}
                                    // width="auto"
                                    rules={[{ required: true, message: 'Vui lòng chọn ngày cấp' }]}
                                    placeholder="dd/mm/yyyy"
                                />
                            </Col>
                            
                            <Col span={24}>
                                <ProForm.Item
                                    name="description"
                                    label="Mô tả job"
                                    rules={[{ required: true, message: 'Vui lòng nhập miêu tả job!' }]}
                                >
                                    <ReactQuill
                                        theme="snow"
                                        value={valueDescription}
                                        onChange={setValueDescription}
                                    />
                                </ProForm.Item>
                            </Col>
                            <Col span={24}>
                                <ProForm.Item
                                    name="request"
                                    label="Yêu cầu ứng viên"
                                    rules={[{ required: true, message: 'Vui lòng nhập yêu cầu ứng viên!' }]}
                                >
                                    <ReactQuill
                                        theme="snow"
                                        value={valueRequest}
                                        onChange={setValueRequest}
                                    />
                                </ProForm.Item>
                            </Col>
                            <Col span={24}>
                                <ProForm.Item
                                    name="interest"
                                    label="Quyền lợi được hưởng"
                                    rules={[{ required: true, message: 'Vui lòng nhập quyền lợi được hưởng!' }]}
                                >
                                    <ReactQuill
                                        theme="snow"
                                        value={valueInterest}
                                        onChange={setValueInterest}
                                    />
                                </ProForm.Item>
                            </Col>
                            <Col span={24}>
                                <ProForm.Item
                                    name="workLocation"
                                    label="Địa điểm làm việc"
                                    rules={[{ required: true, message: 'Vui lòng nhập quyền lợi được hưởng!' }]}
                                >
                                    <ReactQuill
                                        theme="snow"
                                        value={valueWorkLocation}
                                        onChange={setValueWorkLocation}
                                    />
                                </ProForm.Item>
                            </Col>
                            <Col span={24}>
                                <ProForm.Item
                                    name="workTime"
                                    label="Thời gian làm việc"
                                    rules={[{ required: true, message: 'Vui lòng nhập quyền lợi được hưởng!' }]}
                                >
                                    <ReactQuill
                                        theme="snow"
                                        value={valueWorkTime}
                                        onChange={setValueWorkTime}
                                    />
                                </ProForm.Item>
                            </Col>
                                </Row>
                                <Divider />
                               
                            </ProForm>
                            </Card>
                        </Col>

                        <Col span={24} md={12}>
                            <Card className={styles['job-preview']}>
                                <div style={{display: 'flex',justifyContent: 'center'}}>
                                    <h1>Xem trước</h1>
                                </div>
                                <Divider />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2 style={{ margin: 0 }}>{preview.name || 'Tên job'}</h2>
                                    {preview.companyLogo && <img src={preview.companyLogo} alt="logo" style={{ width: 80, height: 40, objectFit: 'contain' }} />}
                                </div>
                                <div style={{ marginTop: 12, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                                    <div><strong>Ngày đăng</strong><div>{preview.startDate ? dayjs(preview.startDate).format('DD/MM/YYYY') : '-'}</div></div>
                                    <div><strong>Số lượng tuyển</strong><div>{preview.quantity || '-'}</div></div>
                                    <div><strong>Cấp bậc</strong><div>{preview.level || '-'}</div></div>
                                    <div><strong>Mức lương</strong><div>
                                        {preview.salaryType === "NEGOTIABLE" 
                                            ? "Thương lượng" 
                                            : preview.minSalary && preview.maxSalary 
                                                ? `${(preview.minSalary / 1000000).toFixed(0)} triệu - ${(preview.maxSalary / 1000000).toFixed(0)} triệu`
                                                : preview.minSalary 
                                                    ? `Từ ${(preview.minSalary / 1000000).toFixed(0)} triệu`
                                                    : '-'}
                                    </div></div>
                                </div>
                                <Button type="primary" style={{ marginTop: 16, background: '#197bcd' }}>Ứng tuyển</Button>
                                <Divider />
                                <h3>Kỹ năng yêu cầu</h3>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {(preview.skills || []).map((s: any) => (
                                        <Tag key={s.value || s} color="blue">{s.label || s}</Tag>
                                    ))}
                                </div>
                                <Divider />
                                <h3>Mô tả công việc</h3>
                                <div dangerouslySetInnerHTML={{ __html: valueDescription || '' }} />
                                <Divider />
                                <h3>Yêu cầu ứng viên</h3>
                                <div dangerouslySetInnerHTML={{ __html: valueRequest || '' }} />
                                <Divider />
                                <h3>Quyền lợi được hưởng</h3>
                                <div dangerouslySetInnerHTML={{ __html: valueInterest || '' }} />
                                <Divider />
                                <h3>Địa điểm làm việc</h3>
                                <div dangerouslySetInnerHTML={{ __html: valueWorkLocation || '' }} />
                                <Divider />
                                <h3>Thời gian làm việc</h3>
                                <div dangerouslySetInnerHTML={{ __html: valueWorkTime || '' }} />
                            </Card>
                        </Col> 
                    </Row>
                    
                </ConfigProvider>

            </div>
        </div>
    )
}

export default ViewUpsertJob;