
import { ModalForm, ProFormSelect, ProFormText } from "@ant-design/pro-components";
import { Col, Form, Row, message, notification } from "antd";
import { isMobile } from 'react-device-detect';
import { callCreateSkill, callUpdateSkill, callFetchAllJobProfession } from "@/config/api";
import { IJobProfession, ISkill } from "@/types/backend";
import { useEffect, useState } from "react";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: ISkill | null;
    setDataInit: (v: any) => void;
    reloadTable: () => void;
}

const ModalSkill = (props: IProps) => {
    const { openModal, setOpenModal, reloadTable, dataInit, setDataInit } = props;
    const [form] = Form.useForm();
    const [professions, setProfessions] = useState<IJobProfession[]>([]);
    const [loadingProfessions, setLoadingProfessions] = useState<boolean>(false);

    // Load danh sách Job Professions khi mở modal
    useEffect(() => {
        if (openModal) {
            fetchProfessions();
        }
    }, [openModal]);

    const fetchProfessions = async () => {
        setLoadingProfessions(true);
        try {
            // Lấy tất cả professions (không phân trang)
            const res = await callFetchAllJobProfession("page=1&size=1000");
            if (res?.data?.result) {
                setProfessions(res.data.result);
            }
        } catch (error) {
            notification.error({
                message: 'Có lỗi xảy ra',
                description: 'Không thể tải danh sách ngành nghề'
            });
        } finally {
            setLoadingProfessions(false);
        }
    };

    const submitSkill = async (valuesForm: any) => {
        const { name, professionId } = valuesForm;
        
        if (dataInit?.id) {
            //update - chỉ update name
        
            const res = await callUpdateSkill(dataInit.id.toString(), name);
            if (res.data) {
                message.success("Cập nhật skill thành công");
                handleReset();
                reloadTable();
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message
                });
            }
        } else {
            //create - cần có professionId
            if (!professionId) {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: 'Vui lòng chọn ngành nghề'
                });
                return;
            }
            
            const res = await callCreateSkill(name, professionId);
            if (res.data) {
                message.success("Thêm mới skill thành công");
                handleReset();
                reloadTable();
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message
                });
            }
        }
    }

    const handleReset = async () => {
        form.resetFields();
        setDataInit(null);
        setOpenModal(false);
        setProfessions([]);
    }

    return (
        <>
            <ModalForm
                title={<>{dataInit?.id ? "Cập nhật Skill" : "Tạo mới Skill"}</>}
                open={openModal}
                modalProps={{
                    onCancel: () => { handleReset() },
                    afterClose: () => handleReset(),
                    destroyOnClose: true,
                    width: isMobile ? "100%" : 600,
                    keyboard: false,
                    maskClosable: false,
                    okText: <>{dataInit?.id ? "Cập nhật" : "Tạo mới"}</>,
                    cancelText: "Hủy"
                }}
                scrollToFirstError={true}
                preserve={false}
                form={form}
                onFinish={submitSkill}
                initialValues={dataInit?.id ? {
                    name: dataInit.name,
                    professionId: dataInit.jobProfession?.id
                } : {}}
            >
                <Row gutter={16}>
                    <Col span={24}>
                        <ProFormSelect
                            label="Ngành nghề"
                            name="professionId"
                            rules={[
                                { required: !dataInit?.id, message: 'Vui lòng chọn ngành nghề' }
                            ]}
                            placeholder="Chọn ngành nghề"
                            options={professions.map(prof => ({
                                label: prof.name,
                                value: prof.id
                            }))}
                            disabled={!!dataInit?.id} // Disable khi update (không cho đổi profession)
                            fieldProps={{
                                loading: loadingProfessions,
                                showSearch: true,
                                filterOption: (input: string, option: any) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }}
                        />
                    </Col>
                    <Col span={24}>
                        <ProFormText
                            label="Tên skill"
                            name="name"
                            rules={[
                                { required: true, message: 'Vui lòng không bỏ trống' },
                                { min: 2, message: 'Tên skill phải có ít nhất 2 ký tự' }
                            ]}
                            placeholder="Nhập tên skill (VD: Java, React, Photoshop)"
                        />
                    </Col>
                </Row>
            </ModalForm>
        </>
    )
}

export default ModalSkill;