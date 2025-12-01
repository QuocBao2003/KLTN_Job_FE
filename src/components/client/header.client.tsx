import { useState, useEffect } from "react";
import {
  CodeOutlined,
  ContactsOutlined,
  FireOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  RiseOutlined,
  TwitterOutlined, BellOutlined, MessageOutlined
} from "@ant-design/icons";

import { Avatar, Drawer, Dropdown, MenuProps, Space, message, Badge } from "antd";
import { Menu, ConfigProvider } from "antd";
import styles from "@/styles/client.module.scss";
import { isMobile } from "react-device-detect";
import { FaFacebook } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { callLogout, callFetchResumeByUser, callCountUnviewedNotifications, getUnreadRoomCount, resetAllUnreadCounts  } from "@/config/api";
import { setLogoutAction } from "@/redux/slice/accountSlide";
import images from "@/img/logo.jpeg";
import NotificationDropdown from "./notification";

const Header = (props: any) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const isAuthenticated = useAppSelector(
    (state) => state.account.isAuthenticated
  );
  const user = useAppSelector((state) => state.account.user);
  const [openMobileMenu, setOpenMobileMenu] = useState<boolean>(false);
  const [appliedJobsCount, setAppliedJobsCount] = useState<number>(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [unviewedCount, setUnviewedCount] = useState<number>(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [current, setCurrent] = useState("home");
  const location = useLocation();

  useEffect(() => {
    setCurrent(location.pathname);
  }, [location]);

  // Fetch số lượng việc làm đã ứng tuyển
  useEffect(() => {
    if (isAuthenticated && user && user.role?.name === 'USER') {
      fetchAppliedJobsCount();
    }
  }, [isAuthenticated, user]);
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUnviewedCount();
    }
  }, [isAuthenticated, user]);
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUnreadMessagesCount();
      
      // Poll every 30 seconds để update count
      const interval = setInterval(() => {
        fetchUnreadMessagesCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);
  const fetchUnreadMessagesCount = async () => {
    try {
      const res = await getUnreadRoomCount();
      console.log('🔍 getTotalUnreadCount response:', res);
      console.log('📊 Unread messages count:', res?.data);
      if (res && res.data !== undefined) {
        setUnreadMessagesCount(res.data);
      }
    } catch (error: any) {
      console.error('❌ Error fetching unread messages count:', error);
      console.error('❌ Error details:', error?.response?.data);
    }
  };
  const fetchAppliedJobsCount = async () => {
    try {
      const res = await callFetchResumeByUser();
      if (res && res.data) {
        const list = Array.isArray(res.data.result) ? res.data.result : [];
        setAppliedJobsCount(list.length);
      }
    } catch (error) {
      console.error('Error fetching applied jobs count:', error);
    }
  };
  const fetchUnviewedCount = async () => {
    try {
      const res = await callCountUnviewedNotifications();
      if (res && res.data) {
        setUnviewedCount(res.data.count);
      }
    } catch (error) {
      console.error('Error fetching unviewed count:', error);
    }
  };

  const items: MenuProps["items"] = [
    {
      label: <Link to={"/"}>Trang Chủ</Link>,
      key: "/",
      // icon: <TwitterOutlined />,
    },
    {
      label: <Link to={"/job"}>Việc Làm </Link>,
      key: "/job",
      // icon: <CodeOutlined />,
    },
    {
      label: <Link to={"/company"}>Top Công ty</Link>,
      key: "/company",
      // icon: <RiseOutlined />,
    },
    {
      label: <Link to={"/listCV"}>Tạo CV</Link>,
      key: "/listCV",
    }
    
    
  ];

  const onClick: MenuProps["onClick"] = (e) => {
    setCurrent(e.key);
  };
  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
    
  };
  const handleMessageClick = async () => {
    // UI reset trước để mượt
    setUnreadMessagesCount(0);
  
    try {
      await resetAllUnreadCounts();
    } catch (error) {
      console.error('Error resetting unread counts:', error);
    } finally {
      navigate("/messages");
    }
  };
  const handleLogout = async () => {
    const res = await callLogout();
    if (res && res && +res.statusCode === 200) {
      dispatch(setLogoutAction({}));
      message.success("Đăng xuất thành công");
      navigate("/");
    }
  };

  // Kiểm tra nếu user là admin hoặc hr (không phải NORMAL_USER)
  const isAdminOrHr = user?.role?.name === 'SUPER_ADMIN' || user?.role?.name === 'HR';

  const itemsDropdown = isAdminOrHr
    ? [
        // Chỉ hiển thị Trang Quản Trị và Đăng xuất cho admin/hr
        {
          label: <Link to={"/admin"}>Trang Quản Trị</Link>,
          key: "admin",
          icon: <FireOutlined />,
        },
        {
          label: (
            <label style={{ cursor: "pointer" }} onClick={() => handleLogout()}>
              Đăng xuất
            </label>
          ),
          key: "logout",
          icon: <LogoutOutlined />,
        },
      ]
    : [
        // Hiển thị đầy đủ menu cho user thường
        {
          label: <Link to={"/savejob"}>Việc làm đã lưu</Link>,
          key: "savejob",
          icon: <ContactsOutlined />,
        },
        {
          label: appliedJobsCount > 0 ? (
            <Badge count={appliedJobsCount} size="small" offset={[8, 0]}>
              <Link to={"/jobapply"}>Việc làm đã ứng tuyển</Link>
            </Badge>
          ) : (
            <Link to={"/jobapply"}>Việc làm đã ứng tuyển</Link>
          ),
          key: "jobapply",
          icon: <ContactsOutlined />,
        },
        {
          label: <Link to="/myCv">CV của tôi</Link>,
          key: '/myCv',
          icon: <ContactsOutlined />,
        },
        {
          label: <Link to={"/profile"}>Cập nhật thông tin</Link>,
          key: "/profile",
          icon: <ContactsOutlined />,
        },
        {
          label: (
            <label style={{ cursor: "pointer" }} onClick={() => handleLogout()}>
              Đăng xuất
            </label>
          ),
          key: "logout",
          icon: <LogoutOutlined />,
        },
      ];

  const itemsMobiles = [...items, ...itemsDropdown];

  return (
    <>
      <header id="site-header" className={styles["header-section"]}>
        <div className={styles["container"]}>
          {!isMobile ? (
            <div style={{ display: "flex", gap: 30 }}>
              <div className={styles["brand"]}>
                <img
                  src={images}
                  style={{
                    width: "100px",
                    height: "50px",
                    objectFit: "contain",
                  }}
                  onClick={() => navigate("/")}
                />
              </div>
              <div className={styles["top-menu"]}>
                <ConfigProvider
                  theme={{
                    token: {
                      colorPrimary: "#197bcd",
                      colorBgContainer: "#fff",
                      colorText: "#595959",
                    },
                  }}
                >
                  <div style={{flex : 1,minWidth : 0}}>
                  <Menu
                    // onClick={onClick}
                    selectedKeys={[current]}
                    mode="horizontal"
                    items={items}
                    overflowedIndicator={null}
                    style={{ backgroundColor: '#ffffff' }}
                  />
                  </div>
                </ConfigProvider>
                <div className={styles["extra"]}>
                  {isAuthenticated === false ? (
                    <Link to={"/login"} style={{ color: "#595959" }}>Đăng Nhập</Link>
                  ) : (
                    <Space size={16}>
                      {/* Icon Message */}
                      <Badge count={unreadMessagesCount} size="small">
                        <MessageOutlined
                          style={{
                            fontSize: 20,
                            cursor: "pointer",
                            color: "#595959",
                          }}
                          onClick={() => handleMessageClick()}
                        />
                      </Badge>

                      {/* Icon Notification */}
                      <div style={{ position: "relative" }}>
                        <Badge count={unviewedCount} size="small">
                          <BellOutlined
                            style={{
                              fontSize: 20,
                              cursor: "pointer",
                              color: "#595959",
                            }}
                            onClick={handleNotificationClick}
                          />
                        </Badge>

                        {/* Notification Dropdown */}
                        {isNotificationOpen && (
                          <NotificationDropdown
                            onClose={() => setIsNotificationOpen(false)}
                            onUnreadCountChange={setUnviewedCount}
                          />
                        )}
                      </div>

                      {/* User Dropdown */}
                      <Dropdown
                        menu={{ items: itemsDropdown }}
                        trigger={["click"]}
                      >
                        <Space style={{ cursor: "pointer", color: "#595959" }}>
                          <span style={{ color: "#595959" }}>Welcome {user?.name}</span>
                          <Avatar>
                            {user?.name?.substring(0, 2)?.toUpperCase()}
                          </Avatar>
                        </Space>
                      </Dropdown>
                    </Space>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles["header-mobile"]}>
              <span>Your APP</span>
              <MenuFoldOutlined onClick={() => setOpenMobileMenu(true)} />
            </div>
          )}
        </div>
      </header>
      <Drawer
        title="Chức năng"
        placement="right"
        onClose={() => setOpenMobileMenu(false)}
        open={openMobileMenu}
      >
        <Menu
          onClick={onClick}
          selectedKeys={[current]}
          mode="vertical"
          items={itemsMobiles}
        />
      </Drawer>
    </>
  );
};

export default Header;
