import { Breadcrumb, Col, ConfigProvider, Divider, Form, Row, message, notification, Card, Tag, Button } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { DebounceSelect } from "../user/debouce.select";
import { FooterToolbar, ProForm, ProFormDatePicker, ProFormDigit, ProFormSelect, ProFormSwitch, ProFormText } from "@ant-design/pro-components";
import styles from 'styles/admin.module.scss';
import { LOCATION_LIST, SKILLS_LIST } from "@/config/utils";
import { ICompanySelect } from "../user/modal.user";
import { useState, useEffect } from 'react';
import { callCreateJob, callFetchAllSkill, callFetchCompany, callFetchJobById, callUpdateJob, updateJobApprove, updateJobReject } from "@/config/api";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { CheckSquareOutlined } from "@ant-design/icons";
import enUS from 'antd/lib/locale/en_US';
import dayjs from 'dayjs';
import { IJob, ISkill } from "@/types/backend";
import { useAppSelector } from "@/redux/hooks";
import { ALL_PERMISSIONS } from "@/config/permissions";

interface ISkillSelect {
    label: string;
    value: string;
    key?: string;
}

const ViewUpsertJob = (props: any) => {
    const [companies, setCompanies] = useState<ICompanySelect[]>([]);
    const [skills, setSkills] = useState<ISkillSelect[]>([]);

    const navigate = useNavigate();
    const [value, setValue] = useState<string>("");



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
    const approJob = permissions.some(
        item => item.apiPath===ALL_PERMISSIONS.JOBS.APPROVE.apiPath && item.method===ALL_PERMISSIONS.JOBS.APPROVE.method
    )
    const rejectJob = permissions.some(
        item => item.apiPath===ALL_PERMISSIONS.JOBS.REJECT.apiPath && item.method===ALL_PERMISSIONS.JOBS.REJECT.method
    )
   
    useEffect(() => {
        console.log(approJob,rejectJob);
        const init = async () => {
            const temp = await fetchSkillList();
            setSkills(temp);

            if (id) {
                const res = await callFetchJobById(id);
                if (res && res.data) {
                    setDataUpdate(res.data);
                    setValue(res.data.description);
                    setCompanies([
                        {
                            label: res.data.company?.name as string,
                            value: `${res.data.company?.id}@#$${res.data.company?.logo}` as string,
                            key: res.data.company?.id
                        }
                    ])

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
                        skills: temp
                    })
                    setPreview({
                        name: res.data.name,
                        location: res.data.location,
                        salary: res.data.salary,
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
    }, [id])

    // Usage of DebounceSelect
    async function fetchCompanyList(name: string): Promise<ICompanySelect[]> {
        const res = await callFetchCompany(`page=1&size=100&name ~ '${name}'`);
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
        if (dataUpdate?.id) {
            //update
            const cp = values?.company?.value?.split('@#$');

            let arrSkills = [];
            if (typeof values?.skills?.[0] === 'object') {
                arrSkills = values?.skills?.map((item: any) => { return { id: item.value } });
            } else {
                arrSkills = values?.skills?.map((item: any) => { return { id: +item } });
            }

            const job = {
                name: values.name,
                skills: arrSkills,
                company: {
                    id: cp && cp.length > 0 ? cp[0] : "",
                    name: values.company.label,
                    logo: cp && cp.length > 1 ? cp[1] : ""
                },
                location: values.location,
                salary: values.salary,
                quantity: values.quantity,
                level: values.level,
                description: value,
                startDate: /[0-9]{2}[/][0-9]{2}[/][0-9]{4}$/.test(values.startDate) ? dayjs(values.startDate, 'DD/MM/YYYY').toDate() : values.startDate,
                endDate: /[0-9]{2}[/][0-9]{2}[/][0-9]{4}$/.test(values.endDate) ? dayjs(values.endDate, 'DD/MM/YYYY').toDate() : values.endDate,
                active: values.active,

            }

            const res = await callUpdateJob(job, dataUpdate.id);
            if (res.data) {
                message.success("Cập nhật job thành công");
                navigate('/admin/job')
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message
                });
            }
        } else {
            //create
            const cp = values?.company?.value?.split('@#$');
            const arrSkills = values?.skills?.map((item: string) => { return { id: +item } });
            const job = {
                name: values.name,
                skills: arrSkills,
                company: {
                    id: cp && cp.length > 0 ? cp[0] : "",
                    name: values.company.label,
                    logo: cp && cp.length > 1 ? cp[1] : ""
                },
                location: values.location,
                salary: values.salary,
                quantity: values.quantity,
                level: values.level,
                description: value,
                startDate: dayjs(values.startDate, 'DD/MM/YYYY').toDate(),
                endDate: dayjs(values.endDate, 'DD/MM/YYYY').toDate(),
                active: values.active
            }

            const res = await callCreateJob(job);
            if (res.data) {
                message.success("Tạo mới job thành công");
                navigate('/admin/job')
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message
                });
            }
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
                                    setPreview((prev: any) => ({
                                        ...prev,
                                        ...allValues,
                                        skills: allValues?.skills || prev.skills,
                                        companyLogo: (allValues?.company?.value?.split?.('@#$')?.[1]) || prev.companyLogo
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
                                        const hasApproveRejectPermission = approJob && rejectJob && dataUpdate?.id && dataUpdate?.status === "PENDING";
                                        
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
                                <ProFormDigit
                                    label="Mức lương"
                                    name="salary"
                                    rules={[{ required: true, message: 'Vui lòng không bỏ trống' }]}
                                    placeholder="Nhập mức lương"
                                    fieldProps={{
                                        addonAfter: " đ",
                                        formatter: (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                                        parser: (value) => +(value || '').replace(/\$\s?|(,*)/g, '')
                                    }}
                                />
                            </Col>
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
                                    label="Miêu tả job"
                                    rules={[{ required: true, message: 'Vui lòng nhập miêu tả job!' }]}
                                >
                                    <ReactQuill
                                        theme="snow"
                                        value={value}
                                        onChange={setValue}
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
                                <div dangerouslySetInnerHTML={{ __html: value || '' }} />
                            </Card>
                        </Col> 
                    </Row>
                    
                </ConfigProvider>

            </div>
        </div>
    )
}

export default ViewUpsertJob;