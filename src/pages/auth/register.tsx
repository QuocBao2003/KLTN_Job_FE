import { Button, Divider, Form, Input, Select, message, notification, Radio } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { callRegister, callRegisterHR } from 'config/api';
import styles from 'styles/auth.module.scss';
import { IUser } from '@/types/backend';
import Header from 'components/client/header.client';
import Footer from 'components/client/footer.client';
const { Option } = Select;


const RegisterPage = () => {
    const navigate = useNavigate();
    const [isSubmit, setIsSubmit] = useState(false);
    const location = useLocation();
    const getRoleFromSearch = () => {
        const params = new URLSearchParams(location.search);
        const role = params.get('role');
        if (role?.toLowerCase() === 'recruiter') return 'RECRUITER';
        return 'CANDIDATE';
    };
    const [selectedRole, setSelectedRole] = useState<'CANDIDATE' | 'RECRUITER'>(getRoleFromSearch);

    useEffect(() => {
        setSelectedRole(getRoleFromSearch());
    }, [location.search]);

    const roleLabel = useMemo(
        () => selectedRole === 'CANDIDATE' ? 'Ứng viên' : 'Nhà tuyển dụng',
        [selectedRole]
    );

    const handleRoleChange = (e: any) => {
        const value = e.target.value as 'CANDIDATE' | 'RECRUITER';
        setSelectedRole(value);
    };

    const onFinish = async (values: IUser) => {
        const { name, email, password, gender, address } = values;
        setIsSubmit(true);
        const apiCaller = selectedRole === 'CANDIDATE' ? callRegister : callRegisterHR;
        const res = await apiCaller(name, email, password as string, gender as string, address);
        setIsSubmit(false);

        if (res?.data?.id) {
            message.success('Đăng ký tài khoản thành công!');
            navigate('/login');
        } else {
            notification.error({
                message: "Có lỗi xảy ra",
                description:
                    res.message && Array.isArray(res.message) ? res.message[0] : res.message,
                duration: 5
            });
        }
    };


    return (
        <>
            <Header />
            <div className={styles["register-page"]}>
                <main className={styles.main} >
                    <section className={styles.wrapper} >
                        <div className={styles.heading}>
                            <h2 className={`${styles.text} ${styles["text-large"]}`}>Đăng Ký Tài Khoản</h2>
                            <Divider />
                        </div>
                        <div className={styles["role-selection"]}>
                            <p>Bạn đang đăng ký với vai trò: <span style={{ fontWeight: 'bold', color: '#1677ff' }}>{roleLabel}</span></p>
                           
                        </div>
                        <Form<IUser>
                            name="basic"
                            onFinish={onFinish}
                            autoComplete="off"
                        
                        >
                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="Họ tên"
                                name="name"
                                rules={[{ required: true, message: 'Họ tên không được để trống!' }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="Email"
                                name="email"
                                rules={[{ required: true, message: 'Email không được để trống!' }]}
                            >
                                <Input type='email' />
                            </Form.Item>
                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="Mật khẩu"
                                name="password"
                                rules={[{ required: true, message: 'Mật khẩu không được để trống!' }]}
                            >
                                <Input.Password />
                            </Form.Item>
                           
                            <Form.Item
                                labelCol={{ span: 24 }}
                                name="gender"
                                label="Giới tính"
                                rules={[{ required: true, message: 'Giới tính không được để trống!' }]}
                            >
                                <Select allowClear>
                                    <Option value="MALE">Nam</Option>
                                    <Option value="FEMALE">Nữ</Option>
                                    <Option value="OTHER">Khác</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="Địa chỉ"
                                name="address"
                                rules={[{ required: true, message: 'Địa chỉ không được để trống!' }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={isSubmit}>
                                    Đăng ký
                                </Button>
                            </Form.Item>
                            <Divider>Or</Divider>
                            <p className="text text-normal">Đã có tài khoản?
                                <span>
                                    <Link to='/login'> Đăng Nhập </Link>
                                </span>
                            </p>
                        </Form>
                    </section>
                </main>
            </div>
            <Footer />
        </>
    )
}

export default RegisterPage;