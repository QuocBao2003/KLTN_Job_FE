import { Button, Divider, Form, Input, message, notification, Modal } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { callLogin, callForgotPassword } from "config/api";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUserLoginInfo } from "@/redux/slice/accountSlide";
import styles from "styles/auth.module.scss";
import { useAppSelector } from "@/redux/hooks";
import { FcGoogle } from "react-icons/fc";
import OAuthConfig from "config/configuration";
import Header from "components/client/header.client";
import Footer from "components/client/footer.client";
const LoginPage = () => {
  const navigate = useNavigate();
  const [isSubmit, setIsSubmit] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const dispatch = useDispatch();
  const isAuthenticated = useAppSelector(
    (state) => state.account.isAuthenticated
  );
  const handleClick = () => {
    const callbackUrl = OAuthConfig.redirectUri;
    const authUrl = OAuthConfig.authUri;
    const googleClientId = OAuthConfig.clientId;

    const targetUrl =
      `${authUrl}?client_id=${googleClientId}` +
      `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
      `&response_type=code` +
      `&scope=openid%20email%20profile` +
      `&access_type=offline` +
      `&prompt=consent`;

    console.log(targetUrl);
    window.location.href = targetUrl;
  };
  let location = useLocation();
  let params = new URLSearchParams(location.search);
  const callback = params?.get("callback");

  useEffect(() => {
    //đã login => redirect to '/'
    if (isAuthenticated) {
      // navigate('/');
      window.location.href = "/";
    }
  }, []);

  const onFinish = async (values: any) => {
    const { username, password } = values;
    setIsSubmit(true);
    const res = await callLogin(username, password);
    setIsSubmit(false);

    if (res?.data) {
      localStorage.setItem("access_token", res.data.access_token);
      dispatch(setUserLoginInfo(res.data.user));
      message.success("Đăng nhập tài khoản thành công!");
      window.location.href = callback ? callback : "/";
    } else {
      notification.error({
        message: "Có lỗi xảy ra",
        description: "Tài khoản không tồn tại",
        duration: 5,
      });
    }
  };

  return (
    <>
      <Header />
      <div className={styles["login-page"]}>
        <main className={`${styles.main} ${styles["login-layout"]}`}>
          <section className={styles.wrapper}>
              <div className={styles.heading}>
                <h2 className={`${styles.text} ${styles["text-large"]}`}>
                  Đăng Nhập
                </h2>
                <Divider />
              </div>
              <Form
                name="basic"
                // style={{ maxWidth: 600, margin: '0 auto' }}
                onFinish={onFinish}
                autoComplete="off"
              >
                <Form.Item
                  labelCol={{ span: 24 }} //whole column
                  label="Email"
                  name="username"
                  rules={[
                    { required: true, message: "Email không được để trống!" },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  labelCol={{ span: 24 }} //whole column
                  label="Mật khẩu"
                  name="password"
                  rules={[
                    { required: true, message: "Mật khẩu không được để trống!" },
                  ]}
                >
                  <Input.Password />
                </Form.Item>

                <Form.Item
                // wrapperCol={{ offset: 6, span: 16 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Button type="primary" htmlType="submit" loading={isSubmit}>
                    Đăng nhập
                  </Button>
                  <Button type="link" onClick={() => setForgotPasswordModalOpen(true)}>
                    Quên mật khẩu?
                  </Button>
                  </div>
                </Form.Item>
                <Divider>Or</Divider>
                <p className="text text-normal">
                  Chưa có tài khoản ?
                  <span>
                    <Button
                      type="link"
                      className={styles["inline-link"]}
                      onClick={() => setRoleModalOpen(true)}
                    >
                      Đăng Ký
                    </Button>
                  </span>
                </p>
                <Button
                  block
                  onClick={() => handleClick()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    height: "40px",
                  }}
                >
                  <FcGoogle />
                  Continue with Google
                </Button>
              </Form>
            </section>
        </main>
      </div>
      <Modal
        open={roleModalOpen}
        onCancel={() => setRoleModalOpen(false)}
        footer={null}
        centered
        width={820}
        className={styles["role-modal-wrapper"]}
      >
        <div className={styles["role-modal"]}>
          <div className={styles["role-header"]}>
            <h3>Chào bạn,</h3>
            <p>Bạn hãy dành ra vài giây để xác nhận thông tin dưới đây nhé! 🔔</p>
          </div>

          <div className={styles["role-intro"]}>
            <p>
              Để tối ưu tốt nhất cho trải nghiệm của bạn với TOPJob, vui lòng lựa
              chọn nhóm phù hợp nhất với bạn.
            </p>
          </div>

          <div className={styles["role-selection"]}>
            <div className={styles["role-card"]}>
              <div className={styles["role-avatar"]}>
                <img
                  src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80"
                  alt="Ứng viên"
                />
              </div>
              <div className={styles["role-content"]}>
                <h4>Tôi là ứng viên tìm việc</h4>
                
                <Button
                  type="primary"
                  shape="round"
                  size="large"
                  block
                  onClick={() => {
                    setRoleModalOpen(false);
                    navigate("/register?role=candidate");
                  }}
                >
                  Tôi là ứng viên tìm việc
                </Button>
              </div>
            </div>

            <div className={styles["role-card"]}>
              <div className={styles["role-avatar"]}>
                <img
                  src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80"
                  alt="Nhà tuyển dụng"
                />
              </div>
              <div className={styles["role-content"]}>
                <h4>Tôi là nhà tuyển dụng</h4>
                
                <Button
                  shape="round"
                  size="large"
                  block
                  onClick={() => {
                    setRoleModalOpen(false);
                    navigate("/register?role=recruiter");
                  }}
                >
                  Tôi là nhà tuyển dụng
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal
        open={forgotPasswordModalOpen}
        onCancel={() => {
          setForgotPasswordModalOpen(false);
        }}
        footer={null}
        centered
        width={450}
        title="Quên mật khẩu"
      >
        <Form
          layout="vertical"
          onFinish={async (values) => {
            setForgotPasswordLoading(true);
            try {
              const res = await callForgotPassword(values.email);
              if (res && res.data) {
                message.success(res.data.message || "Email đã được gửi thành công!");
                setForgotPasswordModalOpen(false);
              }
            } catch (error: any) {
              message.error(
                error?.response?.data?.message || "Có lỗi xảy ra khi gửi email"
              );
            } finally {
              setForgotPasswordLoading(false);
            }
          }}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email không được để trống!" },
              { type: "email", message: "Email không hợp lệ!" },
            ]}
          >
            <Input placeholder="Nhập email của bạn" size="large" />
          </Form.Item>

          <Form.Item>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button onClick={() => setForgotPasswordModalOpen(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={forgotPasswordLoading}>
                Gửi email
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
      <Footer />
    </>
  );
};

export default LoginPage;
