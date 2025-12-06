import React, { useState, useEffect } from 'react';
import {
    AppstoreOutlined,
    ExceptionOutlined,
    ApiOutlined,
    UserOutlined,
    BankOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    AliwangwangOutlined,
    BugOutlined,
    ScheduleOutlined,
    DollarOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Dropdown, Space, message, Avatar, Button } from 'antd';
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';
import { callLogout } from 'config/api';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { isMobile } from 'react-device-detect';
import type { MenuProps } from 'antd';
import { setLogoutAction } from '@/redux/slice/accountSlide';
import { ALL_PERMISSIONS } from '@/config/permissions';
import styles from '@/styles/admin.module.scss';
import { backgroundImage } from 'html2canvas/dist/types/css/property-descriptors/background-image';

const { Content, Sider } = Layout;

const LayoutAdmin = () => {
    const location = useLocation();

    const [collapsed, setCollapsed] = useState(false);
    const [activeMenu, setActiveMenu] = useState('');
    const user = useAppSelector(state => state.account.user);

    const permissions = useAppSelector(state => state.account.user.role.permissions);
    const [menuItems, setMenuItems] = useState<MenuProps['items']>([]);

    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const ACL_ENABLE = import.meta.env.VITE_ACL_ENABLE;
        if (permissions?.length || ACL_ENABLE === 'false') {

            const viewCompany = permissions?.find(item =>
                item.apiPath === ALL_PERMISSIONS.COMPANIES.GET_PAGINATE.apiPath
                && item.method === ALL_PERMISSIONS.COMPANIES.GET_PAGINATE.method
            )

            const viewUser = permissions?.find(item =>
                item.apiPath === ALL_PERMISSIONS.USERS.GET_PAGINATE.apiPath
                && item.method === ALL_PERMISSIONS.USERS.GET_PAGINATE.method
            )

            const viewJob = permissions?.find(item =>
                item.apiPath === ALL_PERMISSIONS.JOBS.GET_PAGINATE.apiPath
                && item.method === ALL_PERMISSIONS.JOBS.GET_PAGINATE.method
            )

            const viewResume = permissions?.find(item =>
                item.apiPath === ALL_PERMISSIONS.RESUMES.GET_PAGINATE.apiPath
                && item.method === ALL_PERMISSIONS.RESUMES.GET_PAGINATE.method
            )

            const viewRole = permissions?.find(item =>
                item.apiPath === ALL_PERMISSIONS.ROLES.GET_PAGINATE.apiPath
                && item.method === ALL_PERMISSIONS.ROLES.GET_PAGINATE.method
            )

            const viewPermission = permissions?.find(item =>
                item.apiPath === ALL_PERMISSIONS.PERMISSIONS.GET_PAGINATE.apiPath
                && item.method === ALL_PERMISSIONS.PERMISSIONS.GET_PAGINATE.method
            )

            const viewSkill = permissions?.find(item =>
                item.apiPath === ALL_PERMISSIONS.SKILLS.GET_PAGINATE.apiPath
                && item.method === ALL_PERMISSIONS.SKILLS.GET_PAGINATE.method
            )
            const viewJobProfession = permissions?.find(item =>
                item.apiPath === ALL_PERMISSIONS.JOBPROFESSIONS.GET_PAGINATE.apiPath
                && item.method === ALL_PERMISSIONS.JOBPROFESSIONS.GET_PAGINATE.method
            )
            const viewServicePackagesAdmin = permissions?.find(item =>
                item.apiPath === ALL_PERMISSIONS.PACKAGES.GET_ALL_ADMIN.apiPath
                && item.method === ALL_PERMISSIONS.PACKAGES.GET_ALL_ADMIN.method
            );

            const viewMyPackages = permissions?.find(item =>
                item.apiPath === ALL_PERMISSIONS.PACKAGES.GET_MY_PACKAGES.apiPath
                && item.method === ALL_PERMISSIONS.PACKAGES.GET_MY_PACKAGES.method
            );

            const full = [
                {
                    label: <Link to='/admin'>Dashboard</Link>,
                    key: '/admin',
                    icon: <AppstoreOutlined />
                },
                
                ...(viewCompany || ACL_ENABLE === 'false' ? [{
                    label: <Link to='/admin/company'>Quản lý công ty</Link>,
                    key: '/admin/company',
                    icon: <BankOutlined />,
                }] : []),
            
                ...(viewUser || ACL_ENABLE === 'false' ? [{
                    label: <Link to='/admin/user'>Quản lý User</Link>,
                    key: '/admin/user',
                    icon: <UserOutlined />
                }] : []),
                ...(viewJob || ACL_ENABLE === 'false' ? [{
                    label: <Link to='/admin/job'>Quản lý công việc</Link>,
                    key: '/admin/job',
                    icon: <ScheduleOutlined />
                }] : []),

                ...(viewResume || ACL_ENABLE === 'false' ? [{
                    label: <Link to='/admin/resume'>Quản lý ứng tuyển</Link>,
                    key: '/admin/resume',
                    icon: <AliwangwangOutlined />
                }] : []),
                ...(viewPermission || ACL_ENABLE === 'false' ? [{
                    label: <Link to='/admin/permission'>Quản lý phân quyền</Link>,
                    key: '/admin/permission',
                    icon: <ApiOutlined />
                }] : []),
                ...(viewRole || ACL_ENABLE === 'false' ? [{
                    label: <Link to='/admin/role'>Quản lý Role</Link>,
                    key: '/admin/role',
                    icon: <ExceptionOutlined />
                }] : []),
                ...(viewSkill || ACL_ENABLE === 'false' ? [{
                    label: <Link to='/admin/skill'>Quản lý kỹ năng</Link>,
                    key: '/admin/skill',
                    icon: <ExceptionOutlined />
                }] : []),
                
                ...(viewJobProfession || ACL_ENABLE === 'false' ? [{
                    label: <Link to='/admin/job-profession'>Quản lý ngành nghề</Link>,
                    key: '/admin/job-profession',
                    icon: <ExceptionOutlined />
                }] : []),
                ...(viewServicePackagesAdmin || viewMyPackages || ACL_ENABLE === 'false' ? [{
                    label: 'Quản lý gói dịch vụ',
                    key: '/admin/packages',
                    icon: <DollarOutlined />,
                    children: [
                        // Admin only - Quản lý gói dịch vụ
                        ...(viewServicePackagesAdmin || ACL_ENABLE === 'false' ? [{
                            label: <Link to='/admin/service-packages'>Quản lý gói dịch vụ</Link>,
                            key: '/admin/service-packages',
                            icon: <DollarOutlined />,
                        }] : []),
                        // HR - Xem gói của mình
                        ...(viewMyPackages || ACL_ENABLE === 'false' ? [{
                            label: <Link to='/admin/my-packages'>Gói của tôi</Link>,
                            key: '/admin/my-packages',
                            icon: <DollarOutlined />,
                        }] : []),
                    ]
                }] : []),
            ];

            setMenuItems(full);
        }
    }, 
    [permissions]
)
    useEffect(() => {
        setActiveMenu(location.pathname)
    }, [location])

    const handleLogout = async () => {
        const res = await callLogout();
        if (res && +res.statusCode === 200) {
            dispatch(setLogoutAction({}));
            message.success('Đăng xuất thành công');
            navigate('/')
        }
    }

    // if (isMobile) {
    //     items.push({
    //         label: <label
    //             style={{ cursor: 'pointer' }}
    //             onClick={() => handleLogout()}
    //         >Đăng xuất</label>,
    //         key: 'logout',
    //         icon: <LogoutOutlined />
    //     })
    // }

    const itemsDropdown = [
        {
            label: <Link to={'/'}>Trang chủ</Link>,
            key: 'home',
        },
        {
            label: <label
                style={{ cursor: 'pointer' }}
                onClick={() => handleLogout()}
            >Đăng xuất</label>,
            key: 'logout',
        },
    ];

    return (
        <>
            <Layout
                style={{ minHeight: '100vh' }}
                className={styles['layout-admin']}
            >
                {!isMobile ?
                    <Sider
                        theme='dark'
                        collapsible
                        collapsed={collapsed}
                        onCollapse={(value) => setCollapsed(value)}
                        trigger={null}
                        width={240}
                        collapsedWidth={80}
                        style={{
                            background: '  linear-gradient(to top, #30cfd0 0%, #330867 100%)',
                            color: '#fff'
                        }}>
                        <div style={{ height: 32, margin: 16, textAlign: 'center', color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
                            <BugOutlined style={{ fontSize: '20px' }} />  ADMIN
                        </div>
                        <Menu
                            theme="light"
                            style={{
                                background: 'transparent',
                                color: '#fff',
                                fontSize: '16px'
                            }}
                            selectedKeys={[activeMenu]}
                            mode="inline"
                            items={menuItems}
                            onClick={(e) => setActiveMenu(e.key)}
                        />
                    </Sider>
                    :
                    <Menu
                        theme="light"
                        style={{
                            background: ' linear-gradient(to top, #30cfd0 0%, #330867 100%)',
                            color: '#fff'
                        }}
                        selectedKeys={[activeMenu]}
                        items={menuItems}
                        onClick={(e) => setActiveMenu(e.key)}
                        mode="horizontal"
                    />
                }

                <Layout>
                    {!isMobile &&
                        <div className={styles['admin-header']} style={{ display: "flex", justifyContent: "space-between", marginRight: 20 }}>
                            <Button
                                type="text"
                                icon={collapsed ? React.createElement(MenuUnfoldOutlined) : React.createElement(MenuFoldOutlined)}
                                onClick={() => setCollapsed(!collapsed)}
                                style={{
                                    fontSize: '16px',
                                    width: 64,
                                    height: 64,
                                }}
                            />

                            <Dropdown menu={{ items: itemsDropdown }} trigger={['click']}>
                                <Space style={{ cursor: "pointer" }}>
                                    Welcome {user?.name}
                                    <Avatar> {user?.name?.substring(0, 2)?.toUpperCase()} </Avatar>

                                </Space>
                            </Dropdown>
                        </div>
                    }
                    <Content style={{ padding: '15px' }}>
                        <div className={styles['admin-content-card'] }>
                            <Outlet />
                        </div>
                    </Content>
                    {/* <Footer style={{ padding: 10, textAlign: 'center' }}>
                        React Typescript series Nest.JS &copy; Hỏi Dân IT - Made with <HeartTwoTone />
                    </Footer> */}
                </Layout>
            </Layout>

        </>
    );
};

export default LayoutAdmin;