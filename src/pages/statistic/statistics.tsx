import { Card, Col, Row, Statistic, Table, Tag, message } from 'antd';
import { UserOutlined, CodeOutlined, RiseOutlined, DollarCircleOutlined, EnvironmentOutlined, TrophyOutlined } from '@ant-design/icons';
import { Line, Column, Pie } from '@ant-design/plots';
import { useEffect, useState } from 'react';
import { 
    callGetJobStatisticsByLevel, 
    callGetJobStatisticsByLocation, 
    callGetJobStatisticsByCompany,
    callFetchCompany,
    callFetchJob,
    callFetchUser,
    callFetchAllSkill,
    IJobStatistics
} from '@/config/api';

const statistics = () => {
    const [loading, setLoading] = useState(false);
    const [overviewData, setOverviewData] = useState<any[]>([]);
    const [locationData, setLocationData] = useState<any[]>([]);
    const [levelData, setLevelData] = useState<any[]>([]);
    const [companyData, setCompanyData] = useState<any[]>([]);
    const [skillsData, setSkillsData] = useState<any[]>([]);

    useEffect(() => {
        fetchAllStatistics();
    }, []);

    const fetchAllStatistics = async () => {
        setLoading(true);
        try {
            // Lấy dữ liệu tổng quan
            await fetchOverviewData();
            
            // Lấy thống kê theo location
            await fetchLocationStatistics();
            
            // Lấy thống kê theo level
            await fetchLevelStatistics();
            
            // Lấy thống kê theo company
            await fetchCompanyStatistics();
            
            // Lấy thống kê skills
            await fetchSkillsStatistics();
            
        } catch (error) {
            message.error('Không thể tải dữ liệu thống kê');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOverviewData = async () => {
        try {
            // Lấy tổng số jobs
            const jobsRes = await callFetchJob('current=1&pageSize=1');
            const totalJobs = jobsRes?.data?.meta?.total || 0;

            // Lấy tổng số companies
            const companiesRes = await callFetchCompany('current=1&pageSize=1');
            const totalCompanies = companiesRes?.data?.meta?.total || 0;

            // Lấy tổng số users (candidates)
            const usersRes = await callFetchUser('current=1&pageSize=1');
            const totalUsers = usersRes?.data?.meta?.total || 0;

            // Tính mức lương trung bình từ API statistics
            const res = await callGetJobStatisticsByLevel();
            console.log('stats raw response', res);
            const jobStats = res?.data;
            console.log('jobStats', jobStats, 'length', jobStats?.length);
            let avgSalary = 0;

            if (Array.isArray(jobStats)) {
                const totalSalary = jobStats.reduce((sum: number, item: IJobStatistics) =>
                    sum + (item.averageSalary || 0), 0);
                avgSalary = jobStats.length > 0
                    ? totalSalary / jobStats.length / 1000000
                    : 0;
            }

            setOverviewData([
                {
                    title: 'Tổng số việc làm',
                    value: totalJobs,
                    icon: <CodeOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
                    color: '#1890ff'
                },
                {
                    title: 'Tổng số công ty',
                    value: totalCompanies,
                    icon: <RiseOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
                    color: '#52c41a'
                },
                {
                    title: 'Ứng viên đang tìm việc',
                    value: totalUsers,
                    icon: <UserOutlined style={{ fontSize: 24, color: '#faad14' }} />,
                    color: '#faad14'
                },
                {
                    title: 'Mức lương trung bình',
                    value: avgSalary.toFixed(1),
                    suffix: 'triệu',
                    icon: <DollarCircleOutlined style={{ fontSize: 24, color: '#f5222d' }} />,
                    color: '#f5222d'
                }
            ]);
        } catch (error) {
            console.error('Error fetching overview:', error);
        }
    };

    const fetchLocationStatistics = async () => {
    try {
        const res = await callGetJobStatisticsByLocation();
        if (Array.isArray(res?.data)) {
            const formattedData = res.data.map((item: IJobStatistics) => ({
                location: item.location || 'Không xác định',
                value: item.jobCount
            }));
            setLocationData(formattedData);
            }
        } catch (error) {
            console.error('Error fetching location statistics:', error);
        }
    };

    const fetchLevelStatistics = async () => {
    try {
        const res = await callGetJobStatisticsByLevel();
        if (Array.isArray(res?.data)) {
            const formattedData = res.data.map((item: IJobStatistics) => ({
                level: item.level || 'Không xác định',
                count: item.jobCount,
                salary: (item.averageSalary / 1000000).toFixed(1)
            }));
            setLevelData(formattedData);
            }
        } catch (error) {
            console.error('Error fetching level statistics:', error);
        }
    }

    const fetchCompanyStatistics = async () => {
    try {
        const res = await callGetJobStatisticsByCompany();
        if (Array.isArray(res?.data)) {
            const sortedData = res.data
                .sort((a, b) => b.jobCount - a.jobCount)
                .slice(0, 10)
                .map((item, index) => ({
                    key: index + 1,
                    rank: index + 1,
                    company: item.companyName || 'Không xác định',
                    jobs: item.jobCount,
                    salary: (item.averageSalary / 1000000).toFixed(1) + ' triệu',
                    location: 'Việt Nam'
                }));
            setCompanyData(sortedData);
            }
        } catch (error) {
            console.error('Error fetching company statistics:', error);
        }
    };

    const fetchSkillsStatistics = async () => {
        try {
            const res = await callFetchAllSkill('current=1&pageSize=100');
            if (res?.data?.result && Array.isArray(res.data.result)) {
                // Giả sử bạn có thêm API để lấy số lượng job theo skill
                // Nếu không có, bạn có thể hiển thị danh sách skills
                const formattedData = res.data.result
                    .slice(0, 8)
                    .map((skill: any) => ({
                        skill: skill.name,
                        count: Math.floor(Math.random() * 500) // Tạm thời random, cần API thực
                    }));
                setSkillsData(formattedData);
            }
        } catch (error) {
            console.error('Error fetching skills statistics:', error);
        }
    };

    // Config cho biểu đồ xu hướng theo level
    const levelConfig = {
        data: levelData,
        xField: 'level',
        yField: 'count',
        point: {
            size: 5,
            shape: 'circle',
        },
        label: {
            style: {
                fill: '#aaa',
            },
        },
        smooth: true,
    };

    // Config cho biểu đồ skills
    const skillsConfig = {
        data: skillsData,
        xField: 'skill',
        yField: 'count',
        label: {
            position: 'top' as const,
            style: {
                fill: '#000',
            },
        },
        columnStyle: {
            fill: 'l(270) 0:#1890ff 1:#36cfc9',
        },
    };

    // Config cho biểu đồ location
    const locationConfig = {
        data: locationData,
        angleField: 'value',
        colorField: 'location',
        radius: 0.8,
        label: {
            type: 'outer' as const,
            content: '{name} ({percentage})',
        },
        interactions: [
            {
                type: 'element-active',
            },
        ],
    };

    // Columns cho bảng top companies
    const topCompaniesColumns = [
        {
            title: 'Hạng',
            dataIndex: 'rank',
            key: 'rank',
            width: 80,
            render: (text: number) => (
                <span style={{ fontWeight: 'bold', fontSize: 16 }}>
                    {text <= 3 ? <TrophyOutlined style={{ color: text === 1 ? '#faad14' : text === 2 ? '#d9d9d9' : '#cd7f32' }} /> : null}
                    {' ' + text}
                </span>
            )
        },
        {
            title: 'Công ty',
            dataIndex: 'company',
            key: 'company',
        },
        {
            title: 'Số việc làm',
            dataIndex: 'jobs',
            key: 'jobs',
            render: (text: number) => <Tag color="blue">{text} việc làm</Tag>
        },
        {
            title: 'Mức lương TB',
            dataIndex: 'salary',
            key: 'salary',
            render: (text: string) => <Tag color="green">{text}</Tag>
        },
        {
            title: 'Địa điểm',
            dataIndex: 'location',
            key: 'location',
            render: (text: string) => <><EnvironmentOutlined /> {text}</>
        }
    ];

    return (
        <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '24px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <h1 style={{ marginBottom: 24 }}>📊 Thống kê thị trường việc làm</h1>

                {/* Thống kê tổng quan */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    {overviewData.map((item, index) => (
                        <Col xs={24} sm={12} lg={6} key={index}>
                            <Card loading={loading}>
                                <Statistic
                                    title={item.title}
                                    value={item.value}
                                    suffix={item.suffix}
                                    prefix={item.icon}
                                    valueStyle={{ color: item.color }}
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Xu hướng tuyển dụng theo level */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} lg={16}>
                        <Card title="📈 Thống kê việc làm theo cấp độ" loading={loading}>
                            {levelData.length > 0 ? (
                                <Line {...levelConfig} height={300} />
                            ) : (
                                <p style={{ textAlign: 'center', padding: 40 }}>Chưa có dữ liệu</p>
                            )}
                        </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Card title="📍 Phân bố theo địa điểm" loading={loading}>
                            {locationData.length > 0 ? (
                                <Pie {...locationConfig} height={300} />
                            ) : (
                                <p style={{ textAlign: 'center', padding: 40 }}>Chưa có dữ liệu</p>
                            )}
                        </Card>
                    </Col>
                </Row>

                {/* Kỹ năng hot nhất */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24}>
                        <Card title="🔥 Top kỹ năng được tuyển dụng nhiều nhất" loading={loading}>
                            {skillsData.length > 0 ? (
                                <Column {...skillsConfig} height={300} />
                            ) : (
                                <p style={{ textAlign: 'center', padding: 40 }}>Chưa có dữ liệu</p>
                            )}
                        </Card>
                    </Col>
                </Row>

                {/* Top công ty */}
                <Row gutter={[16, 16]}>
                    <Col xs={24}>
                        <Card title="🏆 Top 10 công ty tuyển dụng nhiều nhất" loading={loading}>
                            <Table
                                columns={topCompaniesColumns}
                                dataSource={companyData}
                                pagination={false}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default statistics;