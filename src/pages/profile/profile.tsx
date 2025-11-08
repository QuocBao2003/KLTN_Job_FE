import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Input, Select, Typography, message, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { IUser } from '@/types/backend';
import { callGetUserById, callUpdateUser, callChangePassword } from '@/config/api';
import { useAppSelector } from '@/redux/hooks';
import profileStyles from '@/styles/profile.module.scss';

const { Title, Text } = Typography;

const Profile = () => {
    const [updateForm] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const user = useAppSelector((state) => state.account.user) as IUser;
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const res = await callGetUserById(user.id as string);

                if (res?.data) {
                    updateForm.setFieldsValue({
                        name: res.data.name,
                        email: res.data.email,
                        age: res.data.age,
                        gender: res.data.gender,
                        address: res.data.address,
                    });
                }
            } catch (err) {
                console.error("Không thể lấy thông tin chi tiết user", err);
            }
        };

        if (user?.id) {
            fetchUserDetails();
        }
    }, [user]);

    const handleUpdate = async () => {
        try {
            const values = await updateForm.validateFields();
            setLoading(true);

            const payload: IUser = {
                id: user.id,
                ...values,
            };

            const res = await callUpdateUser(payload);

            if (res?.data) {
                message.success("Cập nhật thông tin cá nhân thành công");
            }
        } catch (error) {
            console.log("Validation Failed or API error:", error);
            message.error("Cập nhật thất bại");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        try {
            const values = await passwordForm.validateFields();
            setPasswordLoading(true);

            const res = await callChangePassword(user.id as string, {
                oldPassword: values.oldPassword,
                newPassword: values.newPassword,
            });

            if (res?.statusCode) {
                message.success("Cập nhật mật khẩu thành công");
                passwordForm.resetFields();
            } else {
                message.error("Có lỗi xảy ra khi đổi mật khẩu");
            }
        } catch (error: any) {
            message.error(error?.response?.data?.message || "Cập nhật thất bại");
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className={profileStyles['profile-container']}>
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={24}>
                    {/* Section: Cập nhật thông tin */}
                    <div className={profileStyles['profile-section']}>
                        {/* Header với banner xanh */}
                        <div className={profileStyles['profile-header']}>
                            <div className={profileStyles['header-content']}>
                                <Title level={2} className={profileStyles['header-title']}>
                                    <UserOutlined style={{ marginRight: 8 }} />
                                    Cập nhật thông tin
                                </Title>
                                <Text className={profileStyles['header-description']}>
                                    Quản lý thông tin cá nhân của bạn. 
                                    Cập nhật thông tin để nhà tuyển dụng có thể liên hệ với bạn một cách dễ dàng hơn.
                                </Text>
                            </div>
                            <div className={profileStyles['header-decoration']}></div>
                        </div>

                        {/* Form cập nhật thông tin */}
                        <Card className={profileStyles['profile-card']}>
                            <Form form={updateForm} layout="vertical">
                                <Row gutter={20}>
                                    <Col xs={24} sm={12}>
                                        <Form.Item label="Họ tên" name="name">
                                            <Input size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <Form.Item label="Email" name="email">
                                            <Input disabled size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <Form.Item label="Tuổi" name="age">
                                            <Input type="number" size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <Form.Item label="Giới tính" name="gender">
                                            <Select
                                                size="large"
                                                options={[
                                                    { label: "Nam", value: "MALE" },
                                                    { label: "Nữ", value: "FEMALE" },
                                                    { label: "Khác", value: "OTHER" },
                                                ]}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24}>
                                        <Form.Item label="Địa chỉ" name="address">
                                            <Input.TextArea autoSize={{ minRows: 3, maxRows: 5 }} size="large" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Form.Item>
                                    <Button 
                                        type="primary" 
                                        onClick={handleUpdate} 
                                        loading={loading}
                                        size="large"
                                        className={profileStyles['update-btn']}
                                    >
                                        Cập nhật thông tin
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Card>
                    </div>

                    {/* Section: Thay đổi mật khẩu */}
                    <div className={profileStyles['password-section']}>
                        {/* Header với banner xanh */}
                        <div className={profileStyles['password-header']}>
                            <div className={profileStyles['header-content']}>
                                <Title level={2} className={profileStyles['header-title']}>
                                    <LockOutlined style={{ marginRight: 8 }} />
                                    Thay đổi mật khẩu
                                </Title>
                                <Text className={profileStyles['header-description']}>
                                    Bảo vệ tài khoản của bạn bằng cách thay đổi mật khẩu định kỳ. 
                                    Sử dụng mật khẩu mạnh để đảm bảo an toàn.
                                </Text>
                            </div>
                            <div className={profileStyles['header-decoration']}></div>
                        </div>

                        {/* Form thay đổi mật khẩu */}
                        <Card className={profileStyles['password-card']}>
                            <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
                                <Form.Item
                                    label="Mật khẩu cũ"
                                    name="oldPassword"
                                    rules={[{ required: true, message: "Vui lòng nhập mật khẩu cũ" }]}
                                >
                                    <Input.Password size="large" />
                                </Form.Item>

                                <Form.Item
                                    label="Mật khẩu mới"
                                    name="newPassword"
                                    rules={[
                                        { required: true, message: "Vui lòng nhập mật khẩu mới" },
                                        { min: 6, message: "Mật khẩu ít nhất 6 ký tự" },
                                    ]}
                                >
                                    <Input.Password size="large" />
                                </Form.Item>

                                <Form.Item
                                    label="Xác nhận mật khẩu mới"
                                    name="confirmNewPassword"
                                    dependencies={["newPassword"]}
                                    rules={[
                                        { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue("newPassword") === value) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject("Mật khẩu xác nhận không khớp");
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password size="large" />
                                </Form.Item>

                                <Form.Item>
                                    <Button 
                                        type="primary" 
                                        htmlType="submit" 
                                        loading={passwordLoading}
                                        size="large"
                                        className={profileStyles['update-btn']}
                                    >
                                        Cập nhật mật khẩu
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Card>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default Profile;













