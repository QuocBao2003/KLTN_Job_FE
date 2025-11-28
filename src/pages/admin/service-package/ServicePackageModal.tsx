import { 
    callCreateServicePackage, 
    callUpdateServicePackage 
} from '@/config/api';
import { IServicePackage } from '@/types/backend';
import { 
    Modal, 
    Form, 
    Input, 
    InputNumber, 
    Select, 
    Switch, 
    message 
} from 'antd';
import { useState, useEffect } from 'react';

const { TextArea } = Input;
const { Option } = Select;

interface IProps {
    visible: boolean;
    editingPackage: IServicePackage | null;
    onClose: () => void;
    onSuccess: () => void;
}

const ServicePackageModal = ({ visible, editingPackage, onClose, onSuccess }: IProps) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && editingPackage) {
            form.setFieldsValue({
                name: editingPackage.name,
                description: editingPackage.description,
                price: editingPackage.price,
                packageType: editingPackage.packageType,
                jobLimit: editingPackage.jobLimit,
                durationDays: editingPackage.durationDays,
                active: editingPackage.active,
            });
        } else {
            form.resetFields();
        }
    }, [visible, editingPackage]);

    const handleSubmit = async (values: any) => {
        setLoading(true);
        try {
            if (editingPackage) {
                await callUpdateServicePackage(editingPackage.id, values);
                message.success('Cập nhật gói dịch vụ thành công!');
            } else {
                await callCreateServicePackage(values);
                message.success('Tạo gói dịch vụ thành công!');
            }
            onSuccess();
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
        }
        setLoading(false);
    };

    return (
        <Modal
            title={editingPackage ? 'Chỉnh sửa gói dịch vụ' : 'Thêm gói dịch vụ mới'}
            open={visible}
            onCancel={onClose}
            onOk={() => form.submit()}
            confirmLoading={loading}
            width={700}
            okText={editingPackage ? 'Cập nhật' : 'Tạo mới'}
            cancelText="Hủy"
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    jobLimit: 10,
                    durationDays: 30,
                    active: true,
                }}
            >
                <Form.Item
                    label="Tên gói dịch vụ"
                    name="name"
                    rules={[
                        { required: true, message: 'Vui lòng nhập tên gói dịch vụ!' },
                        { max: 255, message: 'Tên không được vượt quá 255 ký tự!' }
                    ]}
                >
                    <Input placeholder="VD: Ưu tiên hiển thị" />
                </Form.Item>

                <Form.Item
                    label="Mô tả"
                    name="description"
                    rules={[
                        { required: true, message: 'Vui lòng nhập mô tả!' },
                    ]}
                >
                    <TextArea 
                        rows={4} 
                        placeholder="Nhập mô tả chi tiết về gói dịch vụ"
                        showCount
                        maxLength={1000}
                    />
                </Form.Item>

                <Form.Item
                    label="Loại gói"
                    name="packageType"
                    rules={[{ required: true, message: 'Vui lòng chọn loại gói!' }]}
                >
                    <Select placeholder="Chọn loại gói">
                        <Option value="PRIORITY_DISPLAY">
                            Ưu tiên hiển thị
                        </Option>
                        <Option value="PRIORITY_BOLD_TITLE">
                            Ưu tiên hiển thị - Tiêu đề nổi bật
                        </Option>
                        <Option value="FEATURED_JOB">
                            Công việc hấp dẫn - Ưu tiên hiển thị - Tiêu đề nổi bật
                        </Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Giá (VNĐ)"
                    name="price"
                    rules={[
                        { required: true, message: 'Vui lòng nhập giá!' },
                        { type: 'number', min: 0, message: 'Giá phải lớn hơn 0!' }
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                        placeholder="500000"
                        min={0}
                    />
                </Form.Item>

                <Form.Item
                    label="Số lượng tin đăng"
                    name="jobLimit"
                    rules={[
                        { required: true, message: 'Vui lòng nhập số lượng tin!' },
                        { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0!' }
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="10"
                        min={1}
                    />
                </Form.Item>

                <Form.Item
                    label="Thời hạn (ngày)"
                    name="durationDays"
                    rules={[
                        { required: true, message: 'Vui lòng nhập thời hạn!' },
                        { type: 'number', min: 1, message: 'Thời hạn phải lớn hơn 0!' }
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="30"
                        min={1}
                    />
                </Form.Item>

                <Form.Item
                    label="Trạng thái"
                    name="active"
                    valuePropName="checked"
                >
                    <Switch 
                        checkedChildren="Hoạt động" 
                        unCheckedChildren="Ẩn"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ServicePackageModal;