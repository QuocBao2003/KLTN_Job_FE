import {
    Button,
    Col,
    Form,
    Modal,
    Row,
    Select,
    Table,
    Tabs,
    message,
    notification,
    Input,
    Card,
  } from "antd";
  import { isMobile } from "react-device-detect";
  import type { TabsProps } from "antd";
  import { IResume, ISubscribers, IUser } from "@/types/backend";
  import { useState, useEffect } from "react";
  import {
    callGetUserById,
    callUpdateUser,
    callCreateSubscriber,
    callFetchAllSkill,
    callFetchResumeByUser,
    callGetSubscriberSkills,
    callUpdateSubscriber,
    callChangePassword,
  } from "@/config/api";
  import type { ColumnsType } from "antd/es/table";
  import dayjs from "dayjs";
  import { MonitorOutlined } from "@ant-design/icons";
  import { SKILLS_LIST } from "@/config/utils";
  import { useAppSelector } from "@/redux/hooks";
  import { error } from "console";
  
  interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
  }
  
  const UserResume = (props: any) => {
    const [listCV, setListCV] = useState<IResume[]>([]);
    const [isFetching, setIsFetching] = useState<boolean>(false);
  
    useEffect(() => {
      const init = async () => {
        setIsFetching(true);
        const res = await callFetchResumeByUser();
        if (res && res.data) {
          setListCV(res.data.result as IResume[]);
        }
        setIsFetching(false);
      };
      init();
    }, []);
  
    const columns: ColumnsType<IResume> = [
      {
        title: "STT",
        key: "index",
        width: 50,
        align: "center",
        render: (text, record, index) => {
          return <>{index + 1}</>;
        },
      },
      {
        title: "Công Ty",
        dataIndex: "companyName",
      },
      {
        title: "Job title",
        dataIndex: ["job", "name"],
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
      },
      {
        title: "Ngày nộp CV",
        dataIndex: "createdAt",
        render(value, record, index) {
          return <>{dayjs(record.createdAt).format("DD-MM-YYYY HH:mm:ss")}</>;
        },
      },
      {
        title: "",
        dataIndex: "",
        render(value, record, index) {
          return (
            <a
              href={`${import.meta.env.VITE_BACKEND_URL}/storage/resume/${
                record?.url
              }`}
              target="_blank"
            >
              Chi tiết
            </a>
          );
        },
      },
    ];
  
    return (
      <div>
        <Table<IResume>
          columns={columns}
          dataSource={listCV}
          loading={isFetching}
          pagination={false}
        />
      </div>
    );
  };
  
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
  
  const JobByEmail = (props: any) => {
    const [form] = Form.useForm();
    const user = useAppSelector((state) => state.account.user);
    const [optionsSkills, setOptionsSkills] = useState<
      {
        label: string;
        value: string;
      }[]
    >([]);
  
    const [subscriber, setSubscriber] = useState<ISubscribers | null>(null);
  
    useEffect(() => {
      const init = async () => {
        await fetchSkill();
        const res = await callGetSubscriberSkills();
        if (res && res.data) {
          setSubscriber(res.data);
          const d = res.data.skills;
          const arr = d.map((item: any) => {
            return {
              label: item.name as string,
              value: (item.id + "") as string,
            };
          });
          form.setFieldValue("skills", arr);
        }
      };
      init();
    }, []);
  
    const fetchSkill = async () => {
      let query = `page=1&size=100&sort=createdAt,desc`;
  
      const res = await callFetchAllSkill(query);
      if (res && res.data) {
        const arr =
          res?.data?.result?.map((item) => {
            return {
              label: item.name as string,
              value: (item.id + "") as string,
            };
          }) ?? [];
        setOptionsSkills(arr);
      }
    };
  
    const onFinish = async (values: any) => {
      const { skills } = values;
  
      const arr = skills?.map((item: any) => {
        if (item?.id) return { id: item.id };
        return { id: item };
      });
  
      if (!subscriber?.id) {
        //create subscriber
        const data = {
          email: user.email,
          name: user.name,
          skills: arr,
        };
  
        const res = await callCreateSubscriber(data);
        if (res.data) {
          message.success("Cập nhật thông tin thành công");
          setSubscriber(res.data);
        } else {
          notification.error({
            message: "Có lỗi xảy ra",
            description: res.message,
          });
        }
      } else {
        //update subscriber
        const res = await callUpdateSubscriber({
          id: subscriber?.id,
          skills: arr,
        });
        if (res.data) {
          message.success("Cập nhật thông tin thành công");
          setSubscriber(res.data);
        } else {
          notification.error({
            message: "Có lỗi xảy ra",
            description: res.message,
          });
        }
      }
    };
  
    return (
      <>
        <Form onFinish={onFinish} form={form}>
          <Row gutter={[20, 20]}>
            <Col span={24}>
              <Form.Item
                label={"Kỹ năng"}
                name={"skills"}
                rules={[
                  { required: true, message: "Vui lòng chọn ít nhất 1 skill!" },
                ]}
              >
                <Select
                  mode="multiple"
                  allowClear
                  suffixIcon={null}
                  style={{ width: "100%" }}
                  placeholder={
                    <>
                      <MonitorOutlined /> Tìm theo kỹ năng...
                    </>
                  }
                  optionLabelProp="label"
                  options={optionsSkills}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Button onClick={() => form.submit()}>Cập nhật</Button>
            </Col>
          </Row>
        </Form>
      </>
    );
  };
  
  const ManageAccount = (props: IProps) => {
    const { open, onClose } = props;
  
    const onChange = (key: string) => {
      // console.log(key);
    };
  
    const items: TabsProps["items"] = [
      {
        key: "user-resume",
        label: `Nộp CV`,
        children: <UserResume />,
      },
      {
        key: "email-by-skills",
        label: `Nhận Jobs qua Email`,
        children: <JobByEmail />,
      },
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
              defaultActiveKey="user-resume"
              items={items}
              onChange={onChange}
            />
          </div>
        </Modal>
      </>
    );
  };
  
  export default ManageAccount;
  