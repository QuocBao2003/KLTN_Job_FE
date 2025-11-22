import { ModalForm, ProFormText } from "@ant-design/pro-components";
import { Col, Form, Row, message, notification } from "antd";
import { isMobile } from 'react-device-detect';
import { callCreateJobProfession, callUpdateJobProfession } from "@/config/api";
import { IJobProfession } from "@/types/backend";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: IJobProfession | null;
    setDataInit: (v: any) => void;
    reloadTable: () => void;
}

const ModalJobProfession = (props: IProps) => {
    const { openModal, setOpenModal, reloadTable, dataInit, setDataInit } = props;
    const [form] = Form.useForm();

    const submitJobProfession = async (valuesForm: any) => {
        const { name } = valuesForm;
        if (dataInit?.id) {
            //update
            const res = await callUpdateJobProfession(dataInit.id, name);
            if (res.data) {
                message.success("Cập nhật ngành nghề thành công");
                handleReset();
                reloadTable();
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message
                });
            }
        } else {
            //create
            const res = await callCreateJobProfession(name);
            if (res.data) {
                message.success("Thêm mới ngành nghề thành công");
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
    }

    return (
        <>
            <ModalForm
                title={<>{dataInit?.id ? "Cập nhật Ngành nghề" : "Tạo mới Ngành nghề"}</>}
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
                onFinish={submitJobProfession}
                initialValues={dataInit?.id ? dataInit : {}}
            >
                <Row gutter={16}>
                    <Col span={24}>
                        <ProFormText
                            label="Tên ngành nghề"
                            name="name"
                            rules={[
                                { required: true, message: 'Vui lòng không bỏ trống' },
                                { min: 3, message: 'Tên ngành nghề phải có ít nhất 3 ký tự' }
                            ]}
                            placeholder="Nhập tên ngành nghề (VD: Software Development, Marketing, Design)"
                        />
                    </Col>
                </Row>
            </ModalForm>
        </>
    )
}

export default ModalJobProfession;