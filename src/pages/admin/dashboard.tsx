import { Card, Col, Row, Statistic, Table, DatePicker, Space, Tag, Spin, Select, Radio, Button, Tabs } from "antd";
import { 
    
    
    TrophyOutlined,
    ShopOutlined,
    DownloadOutlined,
    ShoppingOutlined,
    DollarOutlined
} from '@ant-design/icons';
import { IoIosCloseCircle } from "react-icons/io";
import CountUp from 'react-countup';
import { 
    BarChart, Bar, PieChart, Pie, LineChart, Line, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useEffect, useState, type ReactElement } from "react";
import { getHRStatistics, getAdminStatistics, IStatisticsFilter, getRevenueStatistics } from "@/config/api";
import { IHRStatistics, IAdminStatistics, IPackageRevenueStatistics } from "@/types/backend";
import { useAppSelector } from "@/redux/hooks";
import dayjs, { Dayjs } from 'dayjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FaCheckCircle, FaClock, FaFileAlt } from "react-icons/fa";
import TabPane from "antd/es/tabs/TabPane";

const { RangePicker } = DatePicker;
const { Option } = Select;

type TimeUnit = 'WEEK' | 'MONTH';

const DashboardPage = (): ReactElement => {
    const user = useAppSelector(state => state.account.user);
  
    const isHR = user?.role?.name === 'HR';
    const isAdmin = user?.role?.name === 'SUPER_ADMIN';

    const [hrStats, setHrStats] = useState<IHRStatistics | null>(null);
    const [adminStats, setAdminStats] = useState<IAdminStatistics | null>(null);
    const [revenueStats, setRevenueStats] = useState<IPackageRevenueStatistics | null>(null);

    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>([
        dayjs().subtract(12, 'months'),
        dayjs()
    ]);
    const [timeUnit, setTimeUnit] = useState<TimeUnit>('MONTH');
    const [topLimit, setTopLimit] = useState<number>(10);
     const [activeTab, setActiveTab] = useState<string>('overview');
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
                const [adminRes, revenueRes] = await Promise.all([
                    getAdminStatistics(filter),
                    getRevenueStatistics(filter)
                ]);
                
                if (adminRes && (adminRes as any).data) {
                    setAdminStats((adminRes as any).data);
                } else if (adminRes) {
                    setAdminStats(adminRes as any);
                }

                if (revenueRes && (revenueRes as any).data) {
                   
                    setRevenueStats((revenueRes as any).data);
                } else if (revenueRes) {
                    setRevenueStats(revenueRes as any);
                }
            }
        } catch (error) {
            console.error("Error fetching statistics:", error);
        } finally {
            setLoading(false);
        }
    };
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
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
    
        try {
            const dateRangeLabel = dateRange
                ? `${dateRange[0].format('DD/MM/YYYY')} - ${dateRange[1].format('DD/MM/YYYY')}`
                : 'N/A';
    
            /* SHEET 1 - TỔNG QUAN */
            const sheet1Data = [
                ["BÁO CÁO THỐNG KÊ - HR"],
                [],
                ["Thời gian", dateRangeLabel],
                ["Tên công ty", (user as any)?.company?.name || "N/A"],
                [],
                ["TỔNG QUAN"],
                ["Tổng công việc được duyệt", hrStats.totalApprovedJobs],
                ["Tổng công việc không được duyệt", hrStats.totalRejectedJobs],
                ["Tổng công việc đang chờ duyệt", hrStats.totalPendingJobs],
                ["Tổng số ứng tuyển", hrStats.totalResumes],
            ];
    
            const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
            ws1["!cols"] = [{ wch: 35 }, { wch: 30 }];
    
            /* SHEET 2 - DANH SÁCH CÔNG VIỆC */
            const activeJobs = Array.isArray(hrStats.activeJobsWithResumes)
                ? hrStats.activeJobsWithResumes
                : [];
            
            const sheet2Data: any[][] = [
                ["DANH SÁCH CÔNG VIỆC ỨNG TUYỂN", "", "", ""],
                ["", "", "", ""],
                ["Tên công việc", "Số đơn", "Ngày bắt đầu", "Ngày kết thúc"],
            ];
            
            activeJobs.forEach(job => {
                sheet2Data.push([
                    job.jobName || "",
                    job.resumeCount || 0,
                    job.startDate ? dayjs(job.startDate).format("DD/MM/YYYY") : "",
                    job.endDate ? dayjs(job.endDate).format("DD/MM/YYYY") : "",
                ]);
            });
            
            const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
            ws2["!cols"] = [{ wch: 40 }, { wch: 12 }, { wch: 15 }, { wch: 15 }];
    
            /* ✅ TẠO WORKBOOK THỦ CÔNG */
            const wb = {
                SheetNames: ["Tổng quan", "Danh sách công việc"],
                Sheets: {
                    "Tổng quan": ws1,
                    "Danh sách công việc": ws2
                }
            };
    
           

    
            /* ✅ EXPORT BẰNG WRITE + BLOB */
            const fileName = `HR_Statistics_${(user as any)?.company?.name || "Unknown"}_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
            
            // Tạo buffer
            const wbout = XLSX.write(wb, { 
                bookType: 'xlsx', 
                type: 'array'
            });
            
            // Tạo Blob và download
            const blob = new Blob([wbout], { 
                type: 'application/octet-stream'
            });
            
            // FileSaver style download
            const link = document.createElement('a');
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', fileName);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
            
          
            alert(`Đã xuất file thành công!\n\nFile: ${fileName}\n\nVui lòng kiểm tra 2 sheets: "Tổng quan" và "Danh sách công việc"`);
    
        } catch (error) {
            console.error("❌ Export Error:", error);
            alert("Có lỗi khi xuất Excel: " + (error as Error).message);
        }
    };
    // Export Excel for Admin
    const exportRevenueToExcel = () => {
        if (!revenueStats) return;
    
        const wb = XLSX.utils.book_new();
    
        // Sheet 1: Tổng quan doanh thu
        const overviewData = [
            ['BÁO CÁO DOANH THU GÓI DỊCH VỤ'],
            [],
            ['Thời gian:', `${dateRange?.[0].format('DD/MM/YYYY')} - ${dateRange?.[1].format('DD/MM/YYYY')}`],
            [],
            ['TỔNG QUAN'],
            ['Tổng doanh thu:', formatCurrency(revenueStats.totalRevenue)],
            ['Tổng số gói đã bán:', revenueStats.totalPackagesSold],
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
        ws1['!cols'] = [
            { wch: 25 },  // Cột A - Labels
            { wch: 30 }   // Cột B - Values
        ];
        XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan');
    
        // Sheet 2: Chi tiết theo loại gói
        const packageHeaders = [
            ['CHI TIẾT THEO LOẠI GÓI'],
            [],
            ['Tên gói', 'Giá gói', 'Số lượng bán', 'Doanh thu', '% Tổng doanh thu']
        ];
        const packageRows = revenueStats.packageTypeStatistics.map(pkg => [
            pkg.packageName,
            formatCurrency(pkg.price),
            pkg.quantitySold,
            formatCurrency(pkg.totalRevenue),
            `${pkg.percentageOfTotal}%`
        ]);
        const ws2 = XLSX.utils.aoa_to_sheet([...packageHeaders, ...packageRows]);
        ws2['!cols'] = [
            { wch: 30 },  // Tên gói
            { wch: 18 },  // Giá gói
            { wch: 18 },  // Số lượng bán
            { wch: 18 },  // Doanh thu
            { wch: 20 }   // % Tổng doanh thu
        ];
        XLSX.utils.book_append_sheet(wb, ws2, 'Chi tiết theo gói');
    
        // Sheet 3: Doanh thu theo thời gian
        const timeSeriesHeaders = [
            [`DOANH THU THEO ${timeUnit === 'WEEK' ? 'TUẦN' : 'THÁNG'}`],
            [],
            ['Thời gian', 'Doanh thu', 'Số gói bán']
        ];
        const timeSeriesRows = revenueStats.revenueTimeSeries.map(item => [
            item.label,
            formatCurrency(item.revenue),
            item.packagesSold
        ]);
        const ws3 = XLSX.utils.aoa_to_sheet([...timeSeriesHeaders, ...timeSeriesRows]);
        ws3['!cols'] = [
            { wch: 20 },  // Thời gian
            { wch: 20 },  // Doanh thu
            { wch: 15 }   // Số gói bán
        ];
        XLSX.utils.book_append_sheet(wb, ws3, 'Doanh thu theo thời gian');
    
        const fileName = `Revenue_Report_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };
    
    // Export Excel for Admin (combined)
    const exportAdminFullToExcel = () => {
        if (!adminStats || !revenueStats) return;
    
        const wb = XLSX.utils.book_new();
    
        // Sheet 1: Tổng quan hệ thống
        const overviewData = [
            ['BÁO CÁO THỐNG KÊ TOÀN HỆ THỐNG'],
            [],
            ['Thời gian:', `${dateRange?.[0].format('DD/MM/YYYY')} - ${dateRange?.[1].format('DD/MM/YYYY')}`],
            [],
            ['CÔNG VIỆC & CÔNG TY'],
            ['Tổng công việc được duyệt:', adminStats.totalApprovedJobs],
            ['Tổng công việc không được duyệt:', adminStats.totalRejectedJobs],
            ['Tổng công việc đang chờ duyệt:', adminStats.totalPendingJobs],
            ['Tổng số công ty:', adminStats.totalCompanies],
            [],
            ['DOANH THU GÓI DỊCH VỤ'],
            ['Tổng doanh thu:', formatCurrency(revenueStats.totalRevenue)],
            ['Tổng số gói đã bán:', revenueStats.totalPackagesSold],
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
        ws1['!cols'] = [
            { wch: 35 },  // Cột A - Labels
            { wch: 25 }   // Cột B - Values
        ];
        XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan');
    
        // Sheet 2: Chi tiết doanh thu theo gói
        const packageHeaders = [
            ['CHI TIẾT DOANH THU THEO GÓI'],
            [],
            ['Tên gói', 'Loại gói', 'Giá', 'Số lượng bán', 'Doanh thu', '% Tổng']
        ];
        const packageRows = revenueStats.packageTypeStatistics.map((pkg) => [
            pkg.packageName,
            pkg.packageType,
            formatCurrency(pkg.price),
            pkg.quantitySold,
            formatCurrency(pkg.totalRevenue),
            `${pkg.percentageOfTotal}%`
        ]);
        const ws2 = XLSX.utils.aoa_to_sheet([...packageHeaders, ...packageRows]);
        ws2['!cols'] = [
            { wch: 25 },  // Tên gói
            { wch: 15 },  // Loại gói
            { wch: 18 },  // Giá
            { wch: 18 },  // Số lượng bán
            { wch: 18 },  // Doanh thu
            { wch: 15 }   // % Tổng
        ];
        XLSX.utils.book_append_sheet(wb, ws2, 'Doanh thu theo gói');
    
        // Sheet 3: Top công ty
        const companyHeaders = [
            [`TOP ${topLimit} CÔNG TY`],
            [],
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
        const ws3 = XLSX.utils.aoa_to_sheet([...companyHeaders, ...companyRows]);
        ws3['!cols'] = [
            { wch: 12 },  // Thứ hạng
            { wch: 35 },  // Tên công ty
            { wch: 18 },  // Tổng ứng tuyển
            { wch: 15 },  // Đã duyệt
            { wch: 15 },  // Chờ duyệt
            { wch: 12 }   // Từ chối
        ];
        XLSX.utils.book_append_sheet(wb, ws3, 'Top công ty');
    
        // Sheet 4: Doanh thu theo thời gian
        const revenueTimeHeaders = [
            [`DOANH THU THEO ${timeUnit === 'WEEK' ? 'TUẦN' : 'THÁNG'}`],
            [],
            ['Thời gian', 'Doanh thu', 'Số gói bán']
        ];
        const revenueTimeRows = revenueStats.revenueTimeSeries.map(item => [
            item.label,
            formatCurrency(item.revenue),
            item.packagesSold
        ]);
        const ws4 = XLSX.utils.aoa_to_sheet([...revenueTimeHeaders, ...revenueTimeRows]);
        ws4['!cols'] = [
            { wch: 20 },  // Thời gian
            { wch: 20 },  // Doanh thu
            { wch: 15 }   // Số gói bán
        ];
        XLSX.utils.book_append_sheet(wb, ws4, 'Doanh thu theo thời gian');
    
        const fileName = `Full_Report_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };
    const formatter = (value: number | string) => {
        return <CountUp end={Number(value)} separator="," />;
    };
    const currencyFormatter = (value: number | string) => {
        return <CountUp end={Number(value)} separator="," suffix=" VND" />;
    };
    // Colors
    const COLORS = {
        approved: '#52c41a',
        rejected: '#ff4d4f',
        pending: '#faad14',
        primary: '#1890ff',
        revenue: '#ff6b35',
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

        // Gộp dữ liệu thời gian cho công việc và đơn ứng tuyển vào 1 dataset
        const combinedTimeSeriesData = (() => {
            const map = new Map<string, { label: string; jobs: number; resumes: number }>();
            jobsTimeSeriesData.forEach(({ label, count }) => {
                map.set(label, { label, jobs: count, resumes: map.get(label)?.resumes ?? 0 });
            });
            resumesTimeSeriesData.forEach(({ label, count }) => {
                const existing = map.get(label) || { label, jobs: 0, resumes: 0 };
                existing.resumes = count;
                map.set(label, existing);
            });
            return Array.from(map.values());
        })();

        // ApexCharts cấu hình cho biểu đồ cột kết hợp Jobs/Applications
        const columnSeries = [
            { name: 'Jobs', data: combinedTimeSeriesData.map(item => item.jobs) },
            { name: 'Applications', data: combinedTimeSeriesData.map(item => item.resumes) }
        ];

        const columnOptions: ApexOptions = {
            chart: { type: 'bar', stacked: false, toolbar: { show: false } },
            plotOptions: {
                bar: {
                    borderRadius: 6,
                    columnWidth: '45%'
                }
            },
            dataLabels: { enabled: false },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
            },
            grid: { strokeDashArray: 4 },
            colors: [COLORS.primary, COLORS.approved],
            xaxis: {
                categories: combinedTimeSeriesData.map(item => item.label),
                labels: { rotate: -45 }
            },
            yaxis: {
                labels: {
                    formatter: (val) => `${Math.round(val)}`
                }
            },
            legend: { position: 'top' },
            tooltip: {
                shared: true,
                intersect: false
            }
        };

        // ApexCharts cho top job theo lượt ứng tuyển
        const topJobs = hrStats.activeJobsWithResumes.slice(0, 10);
        const topJobsSeries = [
            { name: 'Số ứng tuyển', data: topJobs.map(item => item.resumeCount) }
        ];
        const topJobsOptions: ApexOptions = {
            chart: { type: 'bar', stacked: false, toolbar: { show: false } },
            plotOptions: {
                bar: {
                    borderRadius: 6,
                    columnWidth: '45%'
                }
            },
            dataLabels: { enabled: false },
            grid: { strokeDashArray: 4 },
            colors: [COLORS.approved],
            xaxis: {
                categories: topJobs.map(item => item.jobName),
                labels: { rotate: -45, trim: true }
            },
            yaxis: {
                labels: {
                    formatter: (val: number) => `${Math.round(val)}`
                }
            },
            legend: { show: false },
            tooltip: { shared: true, intersect: false }
        };

        return (
            <div>
                {/* Filter Section */}
                <Card bordered={false} style={{ marginBottom: 20 }}>
                    <Space wrap>
                        <span>Thời gian:</span>
                        <RangePicker 
                            value={dateRange as any}
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
                            style={{ marginLeft: 8,backgroundImage: ' linear-gradient(135deg,rgb(62, 172, 99),rgb(39, 204, 174))' }}
                        >
                            Xuất báo cáo Excel
                        </Button>
                    </Space>
                </Card>

                {/* Statistics Cards */}
                <Row gutter={[20, 20]}>
                    <Col span={24} md={6}>
                        <Card bordered={false} style={{  borderTop: "4px solid",
            borderImage: "linear-gradient(to left, rgb(28, 231, 231), rgb(87, 51, 131)) 1",}}>
                            <Statistic
                                title="Đã được duyệt"
                                value={hrStats.totalApprovedJobs}
                                formatter={formatter}
                                prefix={<FaCheckCircle style={{ color: COLORS.approved,fontSize: "25px" }} />}
                                valueStyle={{ color: COLORS.approved }}
                                
                            />
                        </Card>
                    </Col>
                    <Col span={24} md={6}>
                    <Card bordered={false} style={{  borderTop: "4px solid",
                            borderImage: "linear-gradient(to left, rgb(28, 231, 231), rgb(87, 51, 131)) 1",
                           
                            }}>
                            <Statistic
                                title="Công việc không được duyệt"
                                value={hrStats.totalRejectedJobs}
                                formatter={formatter}
                                prefix={<IoIosCloseCircle style={{ color: COLORS.rejected,fontSize: "29px" }} />}
                                valueStyle={{ color: COLORS.rejected }}
                            />
                        </Card>
                    </Col>
                    <Col span={24} md={6}>
                        <Card bordered={false} style={{  borderTop: "4px solid",
                            borderImage: "linear-gradient(to left, rgb(28, 231, 231), rgb(87, 51, 131)) 1",
                           
                            }}>
                            <Statistic
                                title="Công việc đang chờ duyệt"
                                value={hrStats.totalPendingJobs}
                                formatter={formatter}
                                prefix={<FaClock style={{ color: COLORS.pending , fontSize: "25px"}} />}
                                valueStyle={{ color: COLORS.pending }}
                            />
                        </Card>
                    </Col>
                    <Col span={24} md={6}>
                        <Card bordered={false} style={{  borderTop: "4px solid",
                            borderImage: "linear-gradient(to left, rgb(28, 231, 231), rgb(87, 51, 131)) 1",
                           
                            }}>
                            <Statistic
                                title="Tổng số ứng tuyển"
                                value={hrStats.totalResumes}
                                formatter={formatter}
                                prefix={<FaFileAlt style={{ color: COLORS.primary,fontSize: "25px" }} />}
                                valueStyle={{ color: COLORS.primary }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Charts Row 1: Pie + Column */}
                <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
                    <Col span={24} md={12}>
                        <Card title={`Công việc & đơn ứng tuyển theo ${timeUnit === 'WEEK' ? 'Tuần' : 'Tháng'}`} bordered={false}>
                            <ReactApexChart
                                options={columnOptions}
                                series={columnSeries}
                                type="bar"
                                height={340}
                            />
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
                                        label={({ name, percent }) => `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`}
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

                {/* Bar Chart: Top Jobs by Applications (ApexCharts) */}
                <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
                    <Col span={24}>
                        <Card title="Công việc có nhiều ứng tuyển nhất" bordered={false}>
                            <ReactApexChart
                                options={topJobsOptions}
                                series={topJobsSeries}
                                type="bar"
                                height={400}
                            />
                        </Card>
                    </Col>
                </Row>  

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
    if (isAdmin && adminStats && revenueStats) {
        const jobStatusData = [
            { name: 'Approved', value: adminStats.totalApprovedJobs, color: COLORS.approved },
            { name: 'Rejected', value: adminStats.totalRejectedJobs, color: COLORS.rejected },
            { name: 'Pending', value: adminStats.totalPendingJobs, color: COLORS.pending }
        ];

        const resumeStatusData = adminStats.resumesByStatus.map(item => ({
            name: item.status,
            value: item.count,
            color: item.status === 'APPROVED' ? COLORS.approved : item.status === 'REJECTED' ? COLORS.rejected : COLORS.pending
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

        const topCompanySeries = [
            { name: 'Approved', data: companyResumeData.map(item => item.approved) },
            { name: 'Pending', data: companyResumeData.map(item => item.pending) },
            { name: 'Rejected', data: companyResumeData.map(item => item.rejected) },
        ];

        const topCompanyOptions: ApexOptions = {
            chart: { type: 'bar', stacked: true, toolbar: { show: false } },
            plotOptions: { bar: { borderRadius: 6, columnWidth: '45%' } },
            dataLabels: { enabled: false },
            grid: { strokeDashArray: 4 },
            colors: [COLORS.approved, COLORS.pending, COLORS.rejected],
            xaxis: { categories: companyResumeData.map(item => item.name), labels: { rotate: -45, trim: true } },
            yaxis: { labels: { formatter: (val: number) => `${Math.round(val)}` } },
            legend: { position: 'top' },
            tooltip: { shared: true, intersect: false }
        };

        return (
            <div>
                <Card bordered={false} style={{ marginBottom: 20 }}>
                    <Space wrap>
                        <span>Thời gian:</span>
                        <RangePicker
                            value={dateRange as any}
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
                            onClick={exportAdminFullToExcel}
                            style={{
                                marginLeft: 8,
                                backgroundImage: 'linear-gradient(135deg, rgb(62, 172, 99), rgb(39, 204, 174))'
                            }}
                        >
                            Xuất báo cáo đầy đủ
                        </Button>

                        {activeTab === 'overview' && (
                            <>
                                <span>Top công ty:</span>
                                <Select value={topLimit} onChange={setTopLimit} style={{ width: 100 }}>
                                    <Option value={5}>Top 5</Option>
                                    <Option value={10}>Top 10</Option>
                                    <Option value={20}>Top 20</Option>
                                    <Option value={50}>Top 50</Option>
                                </Select>
                            </>
                        )}
                    </Space>
                    <div style={{ marginTop: 10 }}>
                        <Radio.Group value={activeTab} onChange={(e) => setActiveTab(e.target.value)}>
                            <Radio.Button value="overview">Tổng quan</Radio.Button>
                            <Radio.Button value="revenue">Doanh thu</Radio.Button>
                        </Radio.Group>
                    </div>
                </Card>

                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                    <TabPane tab="Tổng quan hệ thống" key="overview">
                        <Row gutter={[20, 20]}>
                            <Col span={24} md={6}>
                                <Card bordered={false} style={{ borderTop: "4px solid", borderImage: "linear-gradient(to left, rgb(28, 231, 231), rgb(87, 51, 131)) 1" }}>
                                    <Statistic
                                        title="Công việc đã duyệt"
                                        value={adminStats.totalApprovedJobs}
                                        formatter={formatter}
                                        prefix={<FaCheckCircle style={{ color: COLORS.approved, fontSize: "25px" }} />}
                                        valueStyle={{ color: COLORS.approved }}
                                    />
                                </Card>
                            </Col>
                            <Col span={24} md={6}>
                                <Card bordered={false} style={{ borderTop: "4px solid", borderImage: "linear-gradient(to left, rgb(28, 231, 231), rgb(87, 51, 131)) 1" }}>
                                    <Statistic
                                        title="Công việc không được duyệt"
                                        value={adminStats.totalRejectedJobs}
                                        formatter={formatter}
                                        prefix={<IoIosCloseCircle style={{ color: COLORS.rejected, fontSize: "29px" }} />}
                                        valueStyle={{ color: COLORS.rejected }}
                                    />
                                </Card>
                            </Col>
                            <Col span={24} md={6}>
                                <Card bordered={false} style={{ borderTop: "4px solid", borderImage: "linear-gradient(to left, rgb(28, 231, 231), rgb(87, 51, 131)) 1" }}>
                                    <Statistic
                                        title="Tổng số công ty"
                                        value={adminStats.totalCompanies}
                                        formatter={formatter}
                                        prefix={<ShopOutlined style={{ color: COLORS.primary, fontSize: "25px" }} />}
                                        valueStyle={{ color: COLORS.primary }}
                                    />
                                </Card>
                            </Col>
                            <Col span={24} md={6}>
                                <Card bordered={false} style={{ borderTop: "4px solid", borderImage: "linear-gradient(to left, rgb(28, 231, 231), rgb(87, 51, 131)) 1" }}>
                                    <Statistic
                                        title="Công ty hàng đầu"
                                        value={adminStats.topCompanyByResumes?.totalResumes || 0}
                                        formatter={formatter}
                                        prefix={<TrophyOutlined style={{ color: COLORS.pending, fontSize: "25px" }} />}
                                        valueStyle={{ color: COLORS.pending }}
                                    />
                                    <div style={{ fontSize: 12, marginTop: 8, color: '#888' }}>
                                        {adminStats.topCompanyByResumes?.companyName || 'N/A'}
                                    </div>
                                </Card>
                            </Col>
                        </Row>

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
                                                label={({ name, percent }) => `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                dataKey="value"
                                            >
                                                {jobStatusData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
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
                                                outerRadius={80}
                                                labelLine={false}
                                                label={({ name, percent }) => `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`}
                                                dataKey="value"
                                            >
                                                {resumeStatusData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Card>
                            </Col>
                        </Row>

                        <Row style={{ marginTop: 20 }}>
                            <Col span={24}>
                                <Card title={`Top ${topLimit} Công ty có nhiều ứng tuyển nhất`} bordered={false}>
                                    <ReactApexChart options={topCompanyOptions} series={topCompanySeries} type="bar" height={400} />
                                </Card>
                            </Col>
                        </Row>

                        <Row style={{ marginTop: 20 }}>
                            <Col span={24}>
                                <Card title={`Top ${topLimit} Companies - Application Details`} bordered={false}>
                                    <Table
                                        dataSource={adminStats.companyResumeStatistics}
                                        rowKey="companyId"
                                        pagination={false}
                                        scroll={{ x: 800 }}
                                        columns={[
                                            { title: 'Rank', width: 70, render: (_, __, i) => i + 1 },
                                            { title: 'Company Name', dataIndex: 'companyName', width: 250 },
                                            { title: 'Total', dataIndex: 'totalResumes', render: (v) => <Tag color="blue">{v}</Tag> },
                                            { title: 'Approved', dataIndex: 'approvedResumes', render: (v) => <Tag color="success">{v}</Tag> },
                                            { title: 'Pending', dataIndex: 'pendingResumes', render: (v) => <Tag color="warning">{v}</Tag> },
                                            { title: 'Rejected', dataIndex: 'rejectedResumes', render: (v) => <Tag color="error">{v}</Tag> }
                                        ]}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </TabPane>

                    <TabPane tab="Thống kê doanh thu" key="revenue">
                        <Row gutter={[20, 20]}>
                            <Col span={24} md={12}>
                                <Card bordered={false} style={{ borderTop: "4px solid", borderImage: "linear-gradient(to left, rgb(255, 159, 64), rgb(255, 205, 86)) 1" }}>
                                    <Statistic
                                        title="Tổng doanh thu"
                                        value={revenueStats.totalRevenue}
                                        formatter={currencyFormatter}
                                        prefix={<DollarOutlined style={{ color: COLORS.revenue, fontSize: "30px" }} />}
                                        valueStyle={{ color: COLORS.revenue, fontSize: "28px" }}
                                    />
                                </Card>
                            </Col>

                            <Col span={24} md={12}>
                                <Card bordered={false} style={{ borderTop: "4px solid", borderImage: "linear-gradient(to left, rgb(75, 192, 192), rgb(54, 162, 235)) 1" }}>
                                    <Statistic
                                        title="Tổng số gói đã bán"
                                        value={revenueStats.totalPackagesSold}
                                        formatter={formatter}
                                        prefix={<ShoppingOutlined style={{ color: COLORS.primary, fontSize: "30px" }} />}
                                        valueStyle={{ color: COLORS.primary, fontSize: "28px" }}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
                            <Col span={24} md={12}>
                                <Card title="Doanh thu theo loại gói" bordered={false}>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <PieChart>
                                            <Pie
                                                data={revenueStats.packageTypeStatistics.map(pkg => ({ name: pkg.packageName, value: pkg.totalRevenue }))}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                labelLine={false}
                                                label={({ name, percent }) => `${(name || '').substring(0, 15)}...: ${((percent || 0) * 100).toFixed(1)}%`}
                                                dataKey="value"
                                            >
                                                {revenueStats.packageTypeStatistics.map((_, index) => {
                                                    const colors = ['#722ed1', '#1890ff', '#52c41a'];
                                                    return <Cell key={index} fill={colors[index % colors.length]} />;
                                                })}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Card>
                            </Col>

                            <Col span={24} md={12}>
                                <Card title={`Doanh thu theo ${timeUnit === 'WEEK' ? 'tuần' : 'tháng'}`} bordered={false}>
                                    <ReactApexChart
                                        options={{
                                            chart: { type: 'bar', height: 350, toolbar: { show: false } },
                                            plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 6 } },
                                            dataLabels: { enabled: false },
                                            stroke: { show: true, width: 2, colors: ['transparent'] },
                                            xaxis: {
                                                categories: revenueStats.revenueTimeSeries.map(item => item.label),
                                                labels: { rotate: -45, rotateAlways: true, style: { fontSize: '12px' } }
                                            },
                                            yaxis: {
                                                labels: { formatter: (val: number) => `${(val / 1000000).toFixed(1)}M` },
                                                title: { text: 'Doanh thu (VND)' }
                                            },
                                            fill: { opacity: 1, colors: [COLORS.revenue] },
                                            tooltip: { y: { formatter: (val: number) => formatCurrency(val) } },
                                            legend: { show: false },
                                            grid: { strokeDashArray: 4 }
                                        }}
                                        series={[{ name: 'Doanh thu', data: revenueStats.revenueTimeSeries.map(item => item.revenue) }]}
                                        type="bar"
                                        height={350}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Row style={{ marginTop: 20 }}>
                            <Col span={24}>
                                <Card
                                    title="Chi tiết doanh thu theo gói"
                                    bordered={false}
                                    extra={<Button icon={<DownloadOutlined />} onClick={exportRevenueToExcel}>Xuất Excel</Button>}
                                >
                                    <Table
                                        dataSource={revenueStats.packageTypeStatistics}
                                        rowKey="packageType"
                                        pagination={false}
                                        columns={[
                                            { title: 'Tên gói', dataIndex: 'packageName', render: (t) => <strong>{t}</strong> },
                                            {
                                                title: 'Giá gói',
                                                dataIndex: 'price',
                                                render: (p) => <span style={{ color: COLORS.primary }}>{formatCurrency(p)}</span>
                                            },
                                            {
                                                title: 'Số lượng bán',
                                                dataIndex: 'quantitySold',
                                                sorter: (a, b) => a.quantitySold - b.quantitySold,
                                                render: (c) => <Tag color="blue">{c} gói</Tag>
                                            },
                                            {
                                                title: 'Doanh thu',
                                                dataIndex: 'totalRevenue',
                                                sorter: (a, b) => a.totalRevenue - b.totalRevenue,
                                                render: (r) => <span style={{ color: COLORS.revenue, fontWeight: 'bold' }}>{formatCurrency(r)}</span>
                                            },
                                            {
                                                title: '% Tổng doanh thu',
                                                dataIndex: 'percentageOfTotal',
                                                sorter: (a, b) => a.percentageOfTotal - b.percentageOfTotal,
                                                render: (p) => <Tag color="green">{p.toFixed(2)}%</Tag>
                                            }
                                        ]}
                                        summary={(pageData) => {
                                            const totalRevenue = pageData.reduce((s, r) => s + r.totalRevenue, 0);
                                            const totalQuantity = pageData.reduce((s, r) => s + r.quantitySold, 0);

                                            return (
                                                <Table.Summary.Row style={{ background: "#fafafa", fontWeight: "bold" }}>
                                                    <Table.Summary.Cell index={0}>TỔNG CỘNG</Table.Summary.Cell>
                                                    <Table.Summary.Cell index={1}>-</Table.Summary.Cell>
                                                    <Table.Summary.Cell index={2}>
                                                        <Tag color="blue">{totalQuantity} gói</Tag>
                                                    </Table.Summary.Cell>
                                                    <Table.Summary.Cell index={3}>
                                                        <span style={{ color: COLORS.revenue, fontSize: 16 }}>
                                                            {formatCurrency(totalRevenue)}
                                                        </span>
                                                    </Table.Summary.Cell>
                                                    <Table.Summary.Cell index={4}>
                                                        <Tag color="green">100%</Tag>
                                                    </Table.Summary.Cell>
                                                </Table.Summary.Row>
                                            );
                                        }}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </TabPane>
                </Tabs>
            </div>
        );
    }

    return (
        <div style={{ textAlign: 'center', padding: '100px' }}>
                <h2>Không có dữ liệu thống kê</h2>
                <p>Vui lòng đăng nhập với quyền HR hoặc Admin để xem thống kê</p>
        </div>
    );
    };


export default DashboardPage;