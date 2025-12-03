import { Card, Col, Row, Statistic, Table, DatePicker, Space, Tag, Spin, Select, Radio, Button } from "antd";
import { 
    CheckCircleOutlined, 
    CloseCircleOutlined, 
    ClockCircleOutlined,
    FileTextOutlined,
    TrophyOutlined,
    ShopOutlined,
    DownloadOutlined
} from '@ant-design/icons';
import CountUp from 'react-countup';
import { 
    BarChart, Bar, PieChart, Pie, LineChart, Line, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { useEffect, useState } from "react";
import { getHRStatistics, getAdminStatistics, IStatisticsFilter } from "@/config/api";
import { IHRStatistics, IAdminStatistics } from "@/types/backend";
import { useAppSelector } from "@/redux/hooks";
import dayjs, { Dayjs } from 'dayjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const { RangePicker } = DatePicker;
const { Option } = Select;

type TimeUnit = 'WEEK' | 'MONTH';

const DashboardPage = () => {
    const user = useAppSelector(state => state.account.user);
    console.log("user", user);
    const isHR = user?.role?.name === 'HR';
    const isAdmin = user?.role?.name === 'SUPER_ADMIN';

    const [hrStats, setHrStats] = useState<IHRStatistics | null>(null);
    const [adminStats, setAdminStats] = useState<IAdminStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>([
        dayjs().subtract(12, 'months'),
        dayjs()
    ]);
    const [timeUnit, setTimeUnit] = useState<TimeUnit>('MONTH');
    const [topLimit, setTopLimit] = useState<number>(10);

    useEffect(() => {
        fetchStatistics();
    }, [dateRange, timeUnit, topLimit]);

    const fetchStatistics = async () => {
        setLoading(true);
        try {
            const filter: IStatisticsFilter = {
                startDate: dateRange?.[0].toISOString(),
                endDate: dateRange?.[1].toISOString(),
                timeUnit: timeUnit,
                topLimit: topLimit
            };

            if (isHR) {
                const res = await getHRStatistics(filter) as any;
                if (res && res.data) {
                    setHrStats(res.data);
                } else if (res && !res.data) {
                    setHrStats(res as IHRStatistics);
                }
            } else if (isAdmin) {
                const res = await getAdminStatistics(filter) as any;
                if (res && res.data) {
                    setAdminStats(res.data);
                } else if (res && !res.data) {
                    setAdminStats(res as IAdminStatistics);
                }
            }
        } catch (error) {
            console.error("Error fetching statistics:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatPeriodLabel = (periodStart?: string, periodEnd?: string) => {
        if (!periodStart && !periodEnd) return 'N/A';
        const start = periodStart ? dayjs(periodStart).format('DD/MM/YYYY') : '';
        const end = periodEnd ? dayjs(periodEnd).format('DD/MM/YYYY') : '';
        if (start && end) {
            return start === end ? start : `${start} - ${end}`;
        }
        return start || end || 'N/A';
    };

    // Export Excel for HR
    const exportHRToExcel = () => {
        if (!hrStats) return;

        const wb = XLSX.utils.book_new();

        // Sheet 1: Tổng quan
        const dateRangeLabel = dateRange
            ? `${dateRange[0].format('DD/MM/YYYY')} - ${dateRange[1].format('DD/MM/YYYY')}`
            : 'N/A';
        const overviewData = [
            ['BÁO CÁO THỐNG KÊ - HR'],
            ['Thời gian:', dateRangeLabel],
            ['Tên công ty:', user?.company?.name || 'N/A'],
            [],
            ['TỔNG QUAN'],
            ['Tổng công việc được duyệt:', hrStats.totalApprovedJobs],
            ['Tổng công việc không được duyệt:', hrStats.totalRejectedJobs],
            ['Tổng công việc đang chờ duyệt:', hrStats.totalPendingJobs],
            ['Tổng số ứng tuyển:', hrStats.totalResumes],
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan');

        // Sheet 2: Trạng thái công việc
        const jobStatusData = [
            ['TRẠNG THÁI CÔNG VIỆC'],
            ['Trạng thái', 'Số lượng'],
            ['Đã duyệt', hrStats.totalApprovedJobs],
            ['Từ chối', hrStats.totalRejectedJobs],
            ['Chờ duyệt', hrStats.totalPendingJobs],
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(jobStatusData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Trạng thái công việc');

        // Sheet 3: Trạng thái đơn ứng tuyển
        const resumeStatusHeaders = [['TRẠNG THÁI ĐỠN ỨNG TUYỂN'], ['Trạng thái', 'Số lượng']];
        const resumeStatusRows = (hrStats.resumesByStatus ?? []).map(item => [item.status, item.count]);
        const ws3 = XLSX.utils.aoa_to_sheet([...resumeStatusHeaders, ...resumeStatusRows]);
        XLSX.utils.book_append_sheet(wb, ws3, 'Trạng thái đơn ứng tuyển');

        // Sheet 4: Danh sách công việc ứng tuyển
        const jobListHeaders = [
            ['DANH SÁCH CÔNG VIỆC ỨNG TUYỂN'],
            ['Tên công việc', 'Số đơn ứng tuyển', 'Ngày bắt đầu', 'Ngày kết thúc']
        ];
        const jobListRows = (hrStats.activeJobsWithResumes ?? []).map(job => [
            job.jobName,
            job.resumeCount,
            dayjs(job.startDate).format('DD/MM/YYYY'),
            dayjs(job.endDate).format('DD/MM/YYYY')
        ]);
        const ws4 = XLSX.utils.aoa_to_sheet([...jobListHeaders, ...jobListRows]);
        XLSX.utils.book_append_sheet(wb, ws4, 'Danh sách công việc');

        // Sheet 5: Biểu đồ theo thời gian - Jobs
        const jobsTimeSeriesHeaders = [
            [`CÔNG VIỆC TẠO THEO ${timeUnit === 'WEEK' ? 'TUẦN' : 'THÁNG'}`],
            ['Thời gian', 'Số lượng']
        ];
        const jobsTimeSeriesRows = (hrStats.jobsTimeSeries ?? []).map(item => [
            formatPeriodLabel(item.periodStart, item.periodEnd),
            item.count
        ]);
        const ws5 = XLSX.utils.aoa_to_sheet([...jobsTimeSeriesHeaders, ...jobsTimeSeriesRows]);
        XLSX.utils.book_append_sheet(wb, ws5, 'Công việc theo thời gian');

        // Sheet 6: Biểu đồ theo thời gian - Resumes
        const resumesTimeSeriesHeaders = [
            [`ĐƠN ỨNG TUYỂN THEO ${timeUnit === 'WEEK' ? 'TUẦN' : 'THÁNG'}`],
            ['Thời gian', 'Số lượng']
        ];
        const resumesTimeSeriesRows = (hrStats.resumesTimeSeries ?? []).map(item => [
            formatPeriodLabel(item.periodStart, item.periodEnd),
            item.count
        ]);
        const ws6 = XLSX.utils.aoa_to_sheet([...resumesTimeSeriesHeaders, ...resumesTimeSeriesRows]);
        XLSX.utils.book_append_sheet(wb, ws6, 'Ứng tuyển theo thời gian');

        // Xuất file
        const fileName = `HR_Statistics_${user?.company?.name}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    // Export Excel for Admin
    const exportAdminToExcel = () => {
        if (!adminStats) return;

        const wb = XLSX.utils.book_new();

        // Sheet 1: Tổng quan
        const overviewData = [
            ['BÁO CÁO THỐNG KÊ TOÀN HỆ THỐNG - ADMIN'],
            ['Thời gian:', `${dateRange?.[0].format('DD/MM/YYYY')} - ${dateRange?.[1].format('DD/MM/YYYY')}`],
            [],
            ['TỔNG QUAN'],
            ['Tổng công việc được duyệt:', adminStats.totalApprovedJobs],
            ['Tổng công việc không được duyệt:', adminStats.totalRejectedJobs],
            ['Tổng công việc đang chờ duyệt:', adminStats.totalPendingJobs],
            ['Tổng số công ty:', adminStats.totalCompanies],
            [],
            ['CÔNG TY HÀNG ĐẦU'],
            ['Tên công ty:', adminStats.topCompanyByResumes?.companyName || 'N/A'],
            ['Tổng đơn ứng tuyển:', adminStats.topCompanyByResumes?.totalResumes || 0],
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan');

        // Sheet 2: Trạng thái công việc
        const jobStatusData = [
            ['TRẠNG THÁI CÔNG VIỆC'],
            ['Trạng thái', 'Số lượng'],
            ['Đã duyệt', adminStats.totalApprovedJobs],
            ['Từ chối', adminStats.totalRejectedJobs],
            ['Chờ duyệt', adminStats.totalPendingJobs],
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(jobStatusData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Trạng thái công việc');

        // Sheet 3: Trạng thái đơn ứng tuyển
        const resumeStatusHeaders = [['TRẠNG THÁI ĐƠN ỨNG TUYỂN'], ['Trạng thái', 'Số lượng']];
        const resumeStatusRows = adminStats.resumesByStatus.map(item => [item.status, item.count]);
        const ws3 = XLSX.utils.aoa_to_sheet([...resumeStatusHeaders, ...resumeStatusRows]);
        XLSX.utils.book_append_sheet(wb, ws3, 'Trạng thái đơn ứng tuyển');

        // Sheet 4: Top công ty
        const companyHeaders = [
            [`TOP ${topLimit} CÔNG TY THEO SỐ ĐƠN ỨNG TUYỂN`],
            ['Thứ hạng', 'Tên công ty', 'Tổng ứng tuyển', 'Đã duyệt', 'Chờ duyệt', 'Từ chối']
        ];
        const companyRows = adminStats.companyResumeStatistics.map((company, index) => [
            index + 1,
            company.companyName,
            company.totalResumes,
            company.approvedResumes,
            company.pendingResumes,
            company.rejectedResumes
        ]);
        const ws4 = XLSX.utils.aoa_to_sheet([...companyHeaders, ...companyRows]);
        XLSX.utils.book_append_sheet(wb, ws4, 'Top công ty');

        // Sheet 5: Biểu đồ theo thời gian - Jobs
        const jobsTimeSeriesHeaders = [
            [`CÔNG VIỆC TẠO THEO ${timeUnit === 'WEEK' ? 'TUẦN' : 'THÁNG'}`],
            ['Thời gian', 'Số lượng']
        ];
        const jobsTimeSeriesRows = adminStats.jobsTimeSeries.map(item => [item.label, item.count]);
        const ws5 = XLSX.utils.aoa_to_sheet([...jobsTimeSeriesHeaders, ...jobsTimeSeriesRows]);
        XLSX.utils.book_append_sheet(wb, ws5, 'Công việc theo thời gian');

        // Sheet 6: Biểu đồ theo thời gian - Resumes
        const resumesTimeSeriesHeaders = [
            [`ĐƠN ỨNG TUYỂN THEO ${timeUnit === 'WEEK' ? 'TUẦN' : 'THÁNG'}`],
            ['Thời gian', 'Số lượng']
        ];
        const resumesTimeSeriesRows = adminStats.resumesTimeSeries.map(item => [item.label, item.count]);
        const ws6 = XLSX.utils.aoa_to_sheet([...resumesTimeSeriesHeaders, ...resumesTimeSeriesRows]);
        XLSX.utils.book_append_sheet(wb, ws6, 'Ứng tuyển theo thời gian');

        // Xuất file
        const fileName = `Admin_Statistics_Full_Report_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const formatter = (value: number | string) => {
        return <CountUp end={Number(value)} separator="," />;
    };

    // Colors
    const COLORS = {
        approved: '#52c41a',
        rejected: '#ff4d4f',
        pending: '#faad14',
        primary: '#1890ff',
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Spin size="large" />
            </div>
        );
    }

    // HR Dashboard
    if (isHR && hrStats) {
        const hasNoCompany = hrStats.totalApprovedJobs === 0 && 
                            hrStats.totalRejectedJobs === 0 && 
                            hrStats.totalPendingJobs === 0 && 
                            hrStats.totalResumes === 0 &&
                            hrStats.activeJobsWithResumes.length === 0;

        if (hasNoCompany) {
            return (
                <div style={{ textAlign: 'center', padding: '100px' }}>
                    <ShopOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 20 }} />
                    <h2>No Company Assigned Yet</h2>
                    <p style={{ color: '#888', marginTop: 10 }}>
                        You need to create or be assigned to a company to view statistics.
                    </p>
                    <p style={{ color: '#888' }}>
                        Please contact your administrator or create a company from the Company Management page.
                    </p>
                </div>
            );
        }
        const jobStatusData = [
            { name: 'Approved', value: hrStats.totalApprovedJobs, color: COLORS.approved },
            { name: 'Rejected', value: hrStats.totalRejectedJobs, color: COLORS.rejected },
            { name: 'Pending', value: hrStats.totalPendingJobs, color: COLORS.pending }
        ];

        const resumeStatusData = hrStats.resumesByStatus.map(item => ({
            name: item.status,
            value: item.count,
            color: item.status === 'APPROVED' ? COLORS.approved : 
                   item.status === 'REJECTED' ? COLORS.rejected : COLORS.pending
        }));

        const jobsTimeSeriesData = hrStats.jobsTimeSeries.map(item => ({
            label: item.label,
            count: item.count
        }));

        const resumesTimeSeriesData = hrStats.resumesTimeSeries.map(item => ({
            label: item.label,
            count: item.count
        }));

        return (
            <div>
                {/* Filter Section */}
                <Card bordered={false} style={{ marginBottom: 20 }}>
                    <Space wrap>
                        <span>Thời gian:</span>
                        <RangePicker 
                            value={dateRange}
                            onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
                            format="DD/MM/YYYY"
                            allowClear={false}
                        />
                        <span>Xem theo:</span>
                        <Radio.Group value={timeUnit} onChange={(e) => setTimeUnit(e.target.value)}>
                            <Radio.Button value="WEEK">Tuần</Radio.Button>
                            <Radio.Button value="MONTH">Tháng</Radio.Button>
                        </Radio.Group>
                        <Button 
                            type="primary" 
                            icon={<DownloadOutlined />}
                            onClick={exportHRToExcel}
                            style={{ marginLeft: 8 }}
                        >
                            Xuất báo cáo Excel
                        </Button>
                    </Space>
                </Card>

                {/* Statistics Cards */}
                <Row gutter={[20, 20]}>
                    <Col span={24} md={6}>
                        <Card bordered={false}>
                            <Statistic
                                title="Đã được duyệt"
                                value={hrStats.totalApprovedJobs}
                                formatter={formatter}
                                prefix={<CheckCircleOutlined style={{ color: COLORS.approved }} />}
                                valueStyle={{ color: COLORS.approved }}
                            />
                        </Card>
                    </Col>
                    <Col span={24} md={6}>
                        <Card bordered={false}>
                            <Statistic
                                title="Công việc không được duyệt"
                                value={hrStats.totalRejectedJobs}
                                formatter={formatter}
                                prefix={<CloseCircleOutlined style={{ color: COLORS.rejected }} />}
                                valueStyle={{ color: COLORS.rejected }}
                            />
                        </Card>
                    </Col>
                    <Col span={24} md={6}>
                        <Card bordered={false}>
                            <Statistic
                                title="Công việc đang chờ duyệt"
                                value={hrStats.totalPendingJobs}
                                formatter={formatter}
                                prefix={<ClockCircleOutlined style={{ color: COLORS.pending }} />}
                                valueStyle={{ color: COLORS.pending }}
                            />
                        </Card>
                    </Col>
                    <Col span={24} md={6}>
                        <Card bordered={false}>
                            <Statistic
                                title="Tổng số ứng tuyển"
                                value={hrStats.totalResumes}
                                formatter={formatter}
                                prefix={<FileTextOutlined style={{ color: COLORS.primary }} />}
                                valueStyle={{ color: COLORS.primary }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Charts Row 1: Pie Charts */}
                <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
                    <Col span={24} md={12}>
                        <Card title="Trạng thái công việc" bordered={false}>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={jobStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {jobStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>

                    <Col span={24} md={12}>
                        <Card title="Trạng thái đơn ứng tuyển" bordered={false}>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={resumeStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {resumeStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>
                </Row>

                {/* Charts Row 2: Time Series */}
                 {/* <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
                    <Col span={24} md={12}>
                        <Card title={`Công việc được tạo theo ${timeUnit === 'WEEK' ? 'Tuần' : 'Tháng'}`} bordered={false}>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={jobsTimeSeriesData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="label" angle={-45} textAnchor="end" height={80} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="count" stroke={COLORS.primary} name="Jobs" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>

                    <Col span={24} md={12}>
                        <Card title={`Đơn ứng tuyển theo ${timeUnit === 'WEEK' ? 'Tuần' : 'Tháng'}`} bordered={false}>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={resumesTimeSeriesData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="label" angle={-45} textAnchor="end" height={80} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Area type="monotone" dataKey="count" stroke={COLORS.approved} fill={COLORS.approved} name="Applications" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>
                </Row> 

                {/* Bar Chart: Top Jobs by Applications */}
                {/* <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
                    <Col span={24}>
                        <Card title="Công việc có nhiều ứng tuyển nhất" bordered={false}>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={hrStats.activeJobsWithResumes.slice(0, 10)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="jobName" 
                                        angle={-45} 
                                        textAnchor="end" 
                                        height={150}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="resumeCount" fill={COLORS.approved} name="Số ứng tuyển" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>
                </Row>  */}

                {/* Active Jobs Table */}
                <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
                    <Col span={24}>
                        <Card title="Danh sách công việc ứng tuyển" bordered={false}>
                            <Table
                                dataSource={hrStats.activeJobsWithResumes}
                                rowKey="jobId"
                                pagination={{ pageSize: 10 }}
                                columns={[
                                    {
                                        title: 'Công việc',
                                        dataIndex: 'jobName',
                                        key: 'jobName',
                                        sorter: (a, b) => a.jobName.localeCompare(b.jobName),
                                        width: '40%'
                                    },
                                    {
                                        title: 'Đơn ứng tuyển',
                                        dataIndex: 'resumeCount',
                                        key: 'resumeCount',
                                        sorter: (a, b) => a.resumeCount - b.resumeCount,
                                        defaultSortOrder: 'descend',
                                        render: (count: number) => (
                                            <Tag color="blue">{count} ứng tuyển</Tag>
                                        )
                                    },
                                    {
                                        title: 'Ngày bắt đầu',
                                        dataIndex: 'startDate',
                                        key: 'startDate',
                                        render: (date: string) => dayjs(date).format('DD/MM/YYYY')
                                    },
                                    {
                                        title: 'Ngày kết thúc',
                                        dataIndex: 'endDate',
                                        key: 'endDate',
                                        render: (date: string) => dayjs(date).format('DD/MM/YYYY')
                                    }
                                ]}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }

    // Admin Dashboard
    if (isAdmin && adminStats) {
        const jobStatusData = [
            { name: 'Approved', value: adminStats.totalApprovedJobs, color: COLORS.approved },
            { name: 'Rejected', value: adminStats.totalRejectedJobs, color: COLORS.rejected },
            { name: 'Pending', value: adminStats.totalPendingJobs, color: COLORS.pending }
        ];

        const resumeStatusData = adminStats.resumesByStatus.map(item => ({
            name: item.status,
            value: item.count,
            color: item.status === 'APPROVED' ? COLORS.approved : 
                   item.status === 'REJECTED' ? COLORS.rejected : COLORS.pending
        }));

        const jobsTimeSeriesData = adminStats.jobsTimeSeries.map(item => ({
            label: item.label,
            count: item.count
        }));

        const resumesTimeSeriesData = adminStats.resumesTimeSeries.map(item => ({
            label: item.label,
            count: item.count
        }));

        const companyResumeData = adminStats.companyResumeStatistics.map(company => ({
            name: company.companyName.length > 15 ? company.companyName.substring(0, 15) + '...' : company.companyName,
            total: company.totalResumes,
            approved: company.approvedResumes,
            rejected: company.rejectedResumes,
            pending: company.pendingResumes
        }));

        return (
            <div>
                {/* Filter Section */}
                <Card bordered={false} style={{ marginBottom: 20 }}>
                    <Space wrap>
                        <span>Time Period:</span>
                        <RangePicker 
                            value={dateRange}
                            onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
                            format="DD/MM/YYYY"
                            allowClear={false}
                        />
                        <span>View By:</span>
                        <Radio.Group value={timeUnit} onChange={(e) => setTimeUnit(e.target.value)}>
                            <Radio.Button value="WEEK">Week</Radio.Button>
                            <Radio.Button value="MONTH">Month</Radio.Button>
                        </Radio.Group>
                        <Button 
                            type="primary" 
                            icon={<DownloadOutlined />}
                            onClick={exportAdminToExcel}
                            style={{ marginLeft: 8 }}
                        >
                            Export Full Report
                        </Button>
                        <span>Top Companies:</span>
                        <Select value={topLimit} onChange={setTopLimit} style={{ width: 100 }}>
                            <Option value={5}>Top 5</Option>
                            <Option value={10}>Top 10</Option>
                            <Option value={20}>Top 20</Option>
                            <Option value={50}>Top 50</Option>
                        </Select>
                    </Space>
                </Card>

                {/* Statistics Cards */}
                <Row gutter={[20, 20]}>
                    <Col span={24} md={6}>
                        <Card bordered={false}>
                            <Statistic
                                title="Approved Jobs"
                                value={adminStats.totalApprovedJobs}
                                formatter={formatter}
                                prefix={<CheckCircleOutlined style={{ color: COLORS.approved }} />}
                                valueStyle={{ color: COLORS.approved }}
                            />
                        </Card>
                    </Col>
                    <Col span={24} md={6}>
                        <Card bordered={false}>
                            <Statistic
                                title="Rejected Jobs"
                                value={adminStats.totalRejectedJobs}
                                formatter={formatter}
                                prefix={<CloseCircleOutlined style={{ color: COLORS.rejected }} />}
                                valueStyle={{ color: COLORS.rejected }}
                            />
                        </Card>
                    </Col>
                    <Col span={24} md={6}>
                        <Card bordered={false}>
                            <Statistic
                                title="Total Companies"
                                value={adminStats.totalCompanies}
                                formatter={formatter}
                                prefix={<ShopOutlined style={{ color: COLORS.primary }} />}
                                valueStyle={{ color: COLORS.primary }}
                            />
                        </Card>
                    </Col>
                    <Col span={24} md={6}>
                        <Card bordered={false}>
                            <Statistic
                                title="Top Company Applications"
                                value={adminStats.topCompanyByResumes?.totalResumes || 0}
                                formatter={formatter}
                                prefix={<TrophyOutlined style={{ color: COLORS.pending }} />}
                                valueStyle={{ color: COLORS.pending }}
                            />
                            <div style={{ fontSize: 12, marginTop: 8, color: '#888' }}>
                                {adminStats.topCompanyByResumes?.companyName || 'N/A'}
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* Charts Row 1: Pie Charts */}
                <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
                    <Col span={24} md={12}>
                        <Card title="Trạng thái công việc" bordered={false}>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={jobStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {jobStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>

                    <Col span={24} md={12}>
                        <Card title="Trạng thái đơn ứng tuyển" bordered={false}>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={resumeStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {resumeStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>
                </Row>

                {/* Charts Row 2: Time Series */}
                {/* <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
                    <Col span={24} md={12}>
                        <Card title={`Jobs Created by ${timeUnit === 'WEEK' ? 'Week' : 'Month'}`} bordered={false}>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={jobsTimeSeriesData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="label" angle={-45} textAnchor="end" height={80} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="count" stroke={COLORS.primary} name="Jobs" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>

                    <Col span={24} md={12}>
                        <Card title={`Applications Submitted by ${timeUnit === 'WEEK' ? 'Week' : 'Month'}`} bordered={false}>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={resumesTimeSeriesData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="label" angle={-45} textAnchor="end" height={80} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Area type="monotone" dataKey="count" stroke={COLORS.approved} fill={COLORS.approved} name="Applications" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>
                </Row> */}

                {/* Bar Chart: Top Companies */}
                <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
                    <Col span={24}>
                        <Card title={`Top ${topLimit} Công ty có nhiều ứng tuyển nhất`} bordered={false}>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={companyResumeData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="approved" stackId="a" fill={COLORS.approved} name="Approved" />
                                    <Bar dataKey="pending" stackId="a" fill={COLORS.pending} name="Pending" />
                                    <Bar dataKey="rejected" stackId="a" fill={COLORS.rejected} name="Rejected" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>
                </Row>

                {/* Company Table */}
                <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
                    <Col span={24}>
                        <Card title={`Top ${topLimit} Companies - Application Details`} bordered={false}>
                            <Table
                                dataSource={adminStats.companyResumeStatistics}
                                rowKey="companyId"
                                pagination={false}
                                scroll={{ x: 800 }}
                                columns={[
                                    {
                                        title: 'Rank',
                                        key: 'rank',
                                        width: 70,
                                        render: (_, __, index) => index + 1
                                    },
                                    {
                                        title: 'Company Name',
                                        dataIndex: 'companyName',
                                        key: 'companyName',
                                        fixed: 'left',
                                        width: 250,
                                    },
                                    {
                                        title: 'Total',
                                        dataIndex: 'totalResumes',
                                        key: 'totalResumes',
                                        render: (count: number) => (
                                            <Tag color="blue">{count}</Tag>
                                        )
                                    },
                                    {
                                        title: 'Approved',
                                        dataIndex: 'approvedResumes',
                                        key: 'approvedResumes',
                                        render: (count: number) => (
                                            <Tag color="success">{count}</Tag>
                                        )
                                    },
                                    {
                                        title: 'Pending',
                                        dataIndex: 'pendingResumes',
                                        key: 'pendingResumes',
                                        render: (count: number) => (
                                            <Tag color="warning">{count}</Tag>
                                        )
                                    },
                                    {
                                        title: 'Rejected',
                                        dataIndex: 'rejectedResumes',
                                        key: 'rejectedResumes',
                                        render: (count: number) => (
                                            <Tag color="error">{count}</Tag>
                                        )
                                    }
                                ]}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }

    return (
        <div style={{ textAlign: 'center', padding: '100px' }}>
            <h2>No statistics available</h2>
            <p>Please log in as HR or Admin to view statistics</p>
        </div>
    );
};

export default DashboardPage;