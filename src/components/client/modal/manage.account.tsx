  import {
    Button,
    Col,
    Form,
    Modal,
    Row,
    Select,
    Tabs,
    message,
    Input,
    Card,
  } from "antd";
  import { isMobile } from "react-device-detect";
  import type { TabsProps } from "antd";
  import { IUser } from "@/types/backend";
  import { useState, useEffect } from "react";
  import {
    callGetUserById,
    callUpdateUser,
    callChangePassword,
  } from "@/config/api";
  import { useAppSelector } from "@/redux/hooks";
  
  interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
  }
  
  const UserUpdateInfo = (props: any) => {
    const [form] = Form.useForm();
    const user = useAppSelector((state) => state.account.user) as IUser;
    const [loading, setLoading] = useState(false);
  
    useEffect(() => {
      const fetchUserDetails = async () => {
        try {
          const res = await callGetUserById(user.id as string);
  
          if (res?.data) {
            form.setFieldsValue({
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
        const values = await form.validateFields();
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
  
    return (
      <Form form={form} layout="vertical">
        <Row gutter={20}>
          <Col span={12}>
            <Form.Item label="Họ tên" name="name">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Email" name="email">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Tuổi" name="age">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Giới tính" name="gender">
              <Select
                options={[
                  { label: "Nam", value: "MALE" },
                  { label: "Nữ", value: "FEMALE" },
                  { label: "Khác", value: "OTHER" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Địa chỉ" name="address">
              <Input.TextArea autoSize />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item>
          <Button type="primary" onClick={handleUpdate} loading={loading}>
            Cập nhật thông tin
          </Button>
        </Form.Item>
      </Form>
    );
  };
  
  const PasswordUpdate = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
  
    const user = useAppSelector((state) => state.account.user) as IUser;
  
    const handleChangePassword = async () => {
      try {
        const values = await form.validateFields();
        setLoading(true);
  
        const res = await callChangePassword(user.id as string, {
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        });
  
        console.log("Response từ API Update pass:");
  
        if (res?.statusCode) {
          message.success("Cập nhật mật khẩu thành công");
          form.resetFields();
        } else {
          message.error("Có lỗi xảy ra khi đổi mật khẩu");
        }
      } catch (error: any) {
        message.error(error?.response?.data?.message || "Cập nhật thất bại");
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <Card title="Cập nhật mật khẩu">
        <Form form={form} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item
            label="Mật khẩu cũ"
            name="oldPassword"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu cũ" }]}
          >
            <Input.Password />
          </Form.Item>
  
          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới" },
              { min: 6, message: "Mật khẩu ít nhất 6 ký tự" },
            ]}
          >
            <Input.Password />
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
            <Input.Password />
          </Form.Item>
  
          <Button type="primary" htmlType="submit" loading={loading}>
            Cập nhật
          </Button>
        </Form>
      </Card>
    );
  };
  
  
  const ManageAccount = (props: IProps) => {
    const { open, onClose } = props;
  
    const onChange = (key: string) => {
      // console.log(key);
    };
  
    const items: TabsProps["items"] = [
      {
        key: "user-update-info",
        label: `Cập nhật thông tin`,
        children: <UserUpdateInfo />,
      },
      {
        key: "user-password",
        label: `Thay đổi mật khẩu`,
        children: <PasswordUpdate />,
      },
    ];
  
    return (
      <>
        <Modal
          title="Quản lý tài khoản"
          open={open}
          onCancel={() => onClose(false)}
          maskClosable={false}
          footer={null}
          destroyOnClose={true}
          width={isMobile ? "100%" : "1000px"}
        >
          <div style={{ minHeight: 400 }}>
            <Tabs
              defaultActiveKey="user-update-info"
              items={items}
              onChange={onChange}
            />
          </div>
        </Modal>
      </>
    );
  };
  
  export default ManageAccount;
  