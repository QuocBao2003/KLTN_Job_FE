import styles from 'styles/client.module.scss';
import { Breadcrumb, Row, Col, Card, Button, Input, message, Upload, Divider, Space, Spin, Tooltip, Layout, Affix } from 'antd';
import { 
    ThunderboltOutlined, 
    CheckCircleOutlined, 
    CloseOutlined, 
    UploadOutlined, 
    EditOutlined, 
    EyeOutlined, 
    SaveOutlined, 
    CameraOutlined, 
    FilePdfOutlined, 
    FileExcelOutlined,
    CloudUploadOutlined,
    DownloadOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useState, useRef } from 'react';
import { callSubmitCv } from 'config/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import type { UploadProps } from 'antd';

const { Header, Content } = Layout;

// --- Interfaces ---
interface CvData {
    title: string;
    description: string;
}

interface CvFormValues {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    objective?: string;
    experience?: string;
    education?: string;
    skills?: string;
    photoUrl?: string;
}

// --- Sub Components ---

// 1. Input Component: Tự động đổi style khi focus
const FieldInput = ({ value, placeholder, onChange, multiline, rows, label }: { value?: string; placeholder?: string; onChange: (v: string) => void; multiline?: boolean; rows?: number; label?: string }) => {
    return (
        <div style={{ marginBottom: 8, position: 'relative' }}>
            {multiline ? (
                <Input.TextArea
                    value={value}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    rows={rows || 3}
                    bordered={false}
                    style={{
                        padding: '8px 12px',
                        fontSize: 14,
                        lineHeight: 1.6,
                        backgroundColor: 'rgba(255,255,255,0.6)',
                        border: '1px dashed #d9d9d9',
                        borderRadius: 6,
                        transition: 'all 0.3s',
                    }}
                    onFocus={(e) => {
                        e.target.style.backgroundColor = '#fff';
                        e.target.style.borderColor = '#4096ff';
                        e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.1)';
                    }}
                    onBlur={(e) => {
                        e.target.style.backgroundColor = 'rgba(255,255,255,0.6)';
                        e.target.style.borderColor = '#d9d9d9';
                        e.target.style.boxShadow = 'none';
                    }}
                />
            ) : (
                <Input
                    value={value}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    bordered={false}
                    style={{
                        padding: '4px 12px',
                        fontSize: 14,
                        fontWeight: 'inherit',
                        color: 'inherit',
                        backgroundColor: 'rgba(255,255,255,0.6)',
                        border: '1px dashed #d9d9d9',
                        borderRadius: 6,
                        transition: 'all 0.3s',
                    }}
                     onFocus={(e) => {
                        e.target.style.backgroundColor = '#fff';
                        e.target.style.borderColor = '#4096ff';
                    }}
                    onBlur={(e) => {
                        e.target.style.backgroundColor = 'rgba(255,255,255,0.6)';
                        e.target.style.borderColor = '#d9d9d9';
                    }}
                />
            )}
        </div>
    );
};

// 2. Display Component: Hiển thị text khi xem trước
const FieldText = ({ value, placeholder, style }: { value?: string; placeholder?: string; style?: any }) => (
    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6, minHeight: 24, ...style }}>
        {value || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>{placeholder}</span>}
    </div>
);

// 3. Photo Upload Component
const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

const PhotoBlock = ({ src, editing, onUpload, size = 140 }: { src?: string; editing: boolean; onUpload: (b64: string) => void; size?: number; }) => {
    const [uploading, setUploading] = useState(false);

    const uploadProps: UploadProps = {
        showUploadList: false,
        beforeUpload: async (file) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('Chỉ có thể tải lên file ảnh!');
                return false;
            }
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                message.error('Ảnh phải nhỏ hơn 5MB!');
                return false;
            }
            try {
                setUploading(true);
                const b64 = await getBase64(file);
                onUpload(b64);
                message.success('Tải ảnh lên thành công!');
            } catch (error) {
                message.error('Lỗi khi tải ảnh!');
            } finally {
                setUploading(false);
            }
            return false;
        },
    };

    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: src ? '#fff' : 'rgba(255,255,255,0.2)',
            overflow: 'hidden',
            position: 'relative',
            border: '4px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {src ? (
                <img src={src} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <CameraOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.8)' }} />
            )}
            
            {editing && (
                <Upload {...uploadProps} accept="image/*" style={{ width: '100%', height: '100%' }}>
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.3s',
                        cursor: 'pointer',
                        color: '#fff',
                        fontWeight: 600
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                    >
                        {uploading ? <Spin size="small" /> : 'Đổi ảnh'}
                    </div>
                </Upload>
            )}
        </div>
    );
};

// 4. TEMPLATE TIÊU CHUẨN (Updated Design)
const TemplateTieuChuan = ({ data, editing, onChange }: { data: CvFormValues; editing: boolean; onChange: (patch: Partial<CvFormValues>) => void }) => {
    return (
        <div style={{
            width: 794, // A4 width in pixels at 96 DPI
            minHeight: 1123, // A4 height
            background: '#ffffff',
            display: 'flex',
            boxShadow: '0 0 20px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Sidebar Left */}
            <div style={{
                width: 280,
                background: '#2c3e50', // Dark elegant blue-grey
                color: '#ecf0f1',
                padding: '40px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 24
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
                    <PhotoBlock src={data.photoUrl} editing={editing} onUpload={(b64) => onChange({ photoUrl: b64 })} />
                    
                    <div style={{ width: '100%', marginTop: 24, textAlign: 'center' }}>
                         {editing ? (
                            <FieldInput 
                                value={data.fullName} 
                                placeholder="NGUYỄN VĂN A" 
                                onChange={(v) => onChange({ fullName: v?.toUpperCase() })} 
                            />
                         ) : (
                            <h1 style={{ color: '#fff', fontSize: 24, margin: 0, textTransform: 'uppercase', lineHeight: 1.3, textAlign: 'center' }}>
                                {data.fullName || 'NGUYỄN VĂN A'}
                            </h1>
                         )}
                    </div>
                </div>

                {/* Contact Info */}
                <div style={{ fontSize: 13 }}>
                    <Divider style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '12px 0' }} />
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ color: '#3498db', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Liên hệ</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                             {editing ? (
                                <>
                                    <FieldInput value={data.email} placeholder="Email" onChange={(v) => onChange({ email: v })} />
                                    <FieldInput value={data.phone} placeholder="Số điện thoại" onChange={(v) => onChange({ phone: v })} />
                                    <FieldInput value={data.address} placeholder="Địa chỉ" onChange={(v) => onChange({ address: v })} />
                                </>
                             ) : (
                                <>
                                    <div style={{ wordBreak: 'break-all' }}>{data.email}</div>
                                    <div>{data.phone}</div>
                                    <div>{data.address}</div>
                                </>
                             )}
                        </div>
                    </div>
                </div>

                {/* Skills */}
                <div style={{ flex: 1 }}>
                    <Divider style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '12px 0' }} />
                     <div style={{ color: '#3498db', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>Kỹ năng</div>
                     {editing ? (
                        <FieldInput 
                            multiline 
                            rows={10} 
                            value={data.skills} 
                            placeholder="• Kỹ năng 1&#10;• Kỹ năng 2" 
                            onChange={(v) => onChange({ skills: v })} 
                        />
                     ) : (
                        <FieldText value={data.skills} style={{ color: '#ecf0f1', fontSize: 13 }} />
                     )}
                </div>
            </div>

            {/* Main Content Right */}
            <div style={{ flex: 1, padding: '40px 32px', color: '#2c3e50' }}>
                
                {/* Objective */}
                <section style={{ marginBottom: 32 }}>
                    <h3 style={{ color: '#2c3e50', textTransform: 'uppercase', borderBottom: '2px solid #3498db', paddingBottom: 8, marginBottom: 16, fontWeight: 700, letterSpacing: 1 }}>
                        Mục tiêu nghề nghiệp
                    </h3>
                    {editing ? (
                        <FieldInput multiline rows={4} value={data.objective} placeholder="Mô tả ngắn gọn mục tiêu nghề nghiệp của bạn..." onChange={(v) => onChange({ objective: v })} />
                    ) : (
                        <FieldText value={data.objective} />
                    )}
                </section>

                {/* Experience */}
                <section style={{ marginBottom: 32 }}>
                    <h3 style={{ color: '#2c3e50', textTransform: 'uppercase', borderBottom: '2px solid #3498db', paddingBottom: 8, marginBottom: 16, fontWeight: 700, letterSpacing: 1 }}>
                        Kinh nghiệm làm việc
                    </h3>
                    {editing ? (
                        <FieldInput multiline rows={12} value={data.experience} placeholder={"• Tên công ty (2022 - Nay)\n  Vị trí: Developer\n  - Mô tả công việc..."} onChange={(v) => onChange({ experience: v })} />
                    ) : (
                        <FieldText value={data.experience} />
                    )}
                </section>

                {/* Education */}
                <section>
                    <h3 style={{ color: '#2c3e50', textTransform: 'uppercase', borderBottom: '2px solid #3498db', paddingBottom: 8, marginBottom: 16, fontWeight: 700, letterSpacing: 1 }}>
                        Học vấn
                    </h3>
                    {editing ? (
                        <FieldInput multiline rows={6} value={data.education} placeholder={"• Đại học Bách Khoa (2018 - 2022)\n  Chuyên ngành: CNTT\n  GPA: 3.5"} onChange={(v) => onChange({ education: v })} />
                    ) : (
                        <FieldText value={data.education} />
                    )}
                </section>
            </div>
        </div>
    );
};


// --- Main Page Component ---

const PageListCV = () => {
    const [formValues, setFormValues] = useState<CvFormValues>({});
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isPreview, setIsPreview] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [exportingPdf, setExportingPdf] = useState<boolean>(false);
    const [uploadingExcel, setUploadingExcel] = useState<boolean>(false);
    
    const cvTemplateRef = useRef<HTMLDivElement>(null);

    const handleStart = () => {
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        if (!formValues.fullName?.trim()) {
            message.warning('Vui lòng nhập họ tên!');
            return;
        }
        const data = {
            ...formValues,
            cvTemplate: 'Tiêu chuẩn',
        };
        try {
            setSaving(true);
            const res = await callSubmitCv(data);
            if (res && res.data) {
                message.success("CV đã được lưu thành công!");
            }
        } catch (err: any) {
            message.error("Có lỗi xảy ra khi lưu CV.");
        } finally {
            setSaving(false);
        }
    };

    const handleExportPDF = async () => {
        if (!cvTemplateRef.current) return;
        try {
            setExportingPdf(true);
            const canvas = await html2canvas(cvTemplateRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`CV_${formValues.fullName || 'New'}.pdf`);
            message.success('Xuất PDF thành công!');
        } catch (error) {
            message.error('Lỗi xuất PDF.');
        } finally {
            setExportingPdf(false);
        }
    };

    const handleExportExcel = () => {
         const worksheet = XLSX.utils.json_to_sheet([{...formValues}]);
         const workbook = XLSX.utils.book_new();
         XLSX.utils.book_append_sheet(workbook, worksheet, "CV Data");
         XLSX.writeFile(workbook, `CV_Data_${formValues.fullName || 'New'}.xlsx`);
    };

    // --- MỚI: Hàm download Excel Template ---
    const handleDownloadTemplate = () => {
        const templateData = [
            {
                'Họ và tên': 'Nguyễn Văn A',
                'Email': 'nguyenvana@email.com',
                'Số điện thoại': '0909123456',
                'Địa chỉ': 'TP. Hồ Chí Minh',
                'Mục tiêu': 'Mục tiêu nghề nghiệp của bạn...',
                'Kinh nghiệm': 'Mô tả kinh nghiệm làm việc...',
                'Học vấn': 'Mô tả quá trình học vấn...',
                'Kỹ năng': 'Kỹ năng chuyên môn...',
            }
        ];
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        
        // Thiết lập độ rộng cột cho dễ nhìn
        worksheet['!cols'] = [
            { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, 
            { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, "CV Template");
        XLSX.writeFile(workbook, "Mau_Nhap_Lieu_CV.xlsx");
        message.success("Đã tải xuống file mẫu Excel!");
    };

    const propsUploadExcel: UploadProps = {
        maxCount: 1,
        accept: ".xlsx,.xls",
        showUploadList: false,
        customRequest: async ({ file, onSuccess }) => {
            setUploadingExcel(true);
            try {
                 const reader = new FileReader();
                 reader.onload = (e) => {
                     const data = e.target?.result;
                     const workbook = XLSX.read(data, { type: 'binary' });
                     const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])[0] as any;
                     if(jsonData) {
                         setFormValues({
                             fullName: jsonData['Họ và tên'] || jsonData.fullName,
                             email: jsonData['Email'] || jsonData.email,
                             phone: jsonData['Số điện thoại'] || jsonData.phone,
                             address: jsonData['Địa chỉ'] || jsonData.address,
                             objective: jsonData['Mục tiêu'] || jsonData.objective,
                             experience: jsonData['Kinh nghiệm'] || jsonData.experience,
                             education: jsonData['Học vấn'] || jsonData.education,
                             skills: jsonData['Kỹ năng'] || jsonData.skills,
                         });
                         message.success("Đã nhập dữ liệu từ Excel!");
                         setIsEditing(true); // Tự động chuyển sang chế độ sửa nếu đang ở màn hình Intro
                     }
                 };
                 reader.readAsBinaryString(file as File);
                 if (onSuccess) onSuccess("ok");
            } catch(e) { message.error("Lỗi đọc file Excel"); }
            finally { setUploadingExcel(false); }
        }
    };

    return (
        <div className={styles["container"]} style={{ minHeight: '100vh', background: isEditing ? '#f0f2f5' : '#fff' }}>
            
            {/* Intro Screen (When not editing) */}
            {!isEditing && (
                <div style={{ padding: '40px 20px', maxWidth: 1200, margin: '0 auto' }}>
                    <Breadcrumb items={[{ title: <Link to={'/'}>Trang chủ</Link> }, { title: 'Tạo CV' }]} style={{ marginBottom: 40 }} />
                    
                    <Row gutter={[48, 48]} align="middle">
                        <Col xs={24} md={12}>
                            <h1 style={{ fontSize: 48, fontWeight: 800, color: '#1a1a1a', marginBottom: 24, lineHeight: 1.2 }}>
                                Tạo CV chuyên nghiệp <br/>
                                <span style={{ background: 'linear-gradient(to right, #3498db, #2c3e50)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>chỉ trong 5 phút</span>
                            </h1>
                            <p style={{ fontSize: 18, color: '#666', marginBottom: 32, lineHeight: 1.6 }}>
                                Mẫu CV "Tiêu chuẩn" được tối ưu hóa để làm nổi bật kỹ năng của bạn. 
                                Hỗ trợ nhập liệu tự động từ Excel và xuất PDF chất lượng cao.
                            </p>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                <Button type="primary" size="large" onClick={handleStart} icon={<EditOutlined />} style={{ height: 50, padding: '0 32px', fontSize: 16, borderRadius: 8 }}>
                                    Tạo CV Ngay
                                </Button>
                                
                                {/* Group Button Excel */}
                                <Space.Compact block style={{ width: 'auto' }}>
                                    <Upload {...propsUploadExcel}>
                                        <Button size="large" icon={<CloudUploadOutlined />} loading={uploadingExcel} style={{ height: 50, borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }}>
                                            Upload Excel
                                        </Button>
                                    </Upload>
                                    <Tooltip title="Tải file mẫu để điền thông tin">
                                        <Button 
                                            size="large" 
                                            icon={<DownloadOutlined />} 
                                            onClick={handleDownloadTemplate}
                                            style={{ height: 50, borderTopRightRadius: 8, borderBottomRightRadius: 8, background: '#f6ffed', borderColor: '#b7eb8f', color: '#389e0d' }}
                                        >
                                            Mẫu
                                        </Button>
                                    </Tooltip>
                                </Space.Compact>
                            </div>

                            <div style={{ marginTop: 40, display: 'flex', gap: 24, color: '#888' }}>
                                <div><CheckCircleOutlined style={{ color: '#52c41a' }} /> Miễn phí 100%</div>
                                <div><CheckCircleOutlined style={{ color: '#52c41a' }} /> Chuẩn ATS</div>
                                <div><CheckCircleOutlined style={{ color: '#52c41a' }} /> Bảo mật dữ liệu</div>
                            </div>
                        </Col>
                        <Col xs={24} md={12}>
                            <div style={{ 
                                position: 'relative', 
                                padding: 20, 
                                background: '#fff', 
                                borderRadius: 16, 
                                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                                transform: 'rotate(-2deg)'
                            }}>
                                <div style={{ width: '100%', height: 400, background: '#f5f5f5', borderRadius: 8, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    {/* Preview Placeholder */}
                                    <div style={{ width: '80%', height: '90%', background: '#fff', border: '1px solid #eee', display: 'flex', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                        <div style={{ width: '30%', background: '#2c3e50' }}></div>
                                        <div style={{ width: '70%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            )}

            {/* Editor Screen */}
            {isEditing && (
                <Layout style={{ minHeight: '100vh' }}>
                    <Affix offsetTop={0}>
                        <Header style={{ 
                            background: '#fff', 
                            padding: '0 24px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            height: 64,
                            zIndex: 100
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setIsEditing(false)}>
                                    Quay lại
                                </Button>
                                <div style={{ height: 24, width: 1, background: '#e8e8e8' }} />
                                <span style={{ fontWeight: 600, fontSize: 16 }}>Mẫu Tiêu Chuẩn</span>
                            </div>

                            <Space>
                                <Tooltip title="Chuyển chế độ Xem/Sửa">
                                    <Button 
                                        type={isPreview ? "primary" : "default"} 
                                        icon={isPreview ? <EditOutlined /> : <EyeOutlined />} 
                                        onClick={() => setIsPreview(!isPreview)}
                                    >
                                        {isPreview ? "Sửa CV" : "Xem trước"}
                                    </Button>
                                </Tooltip>
                                
                                <Divider type="vertical" />

                                {/* MỚI: Thêm nút download template vào toolbar */}
                                <Tooltip title="Tải Excel Template Mẫu">
                                    <Button icon={<FileExcelOutlined />} onClick={handleDownloadTemplate} style={{ color: '#389e0d', borderColor: '#b7eb8f', background: '#f6ffed' }}>
                                        Mẫu
                                    </Button>
                                </Tooltip>

                                <Tooltip title="Nhập dữ liệu nhanh từ Excel">
                                    <Upload {...propsUploadExcel}>
                                        <Button icon={<CloudUploadOutlined />} loading={uploadingExcel}>Nhập Excel</Button>
                                    </Upload>
                                </Tooltip>

                                <Button 
                                    icon={<FilePdfOutlined />} 
                                    loading={exportingPdf} 
                                    onClick={handleExportPDF}
                                    style={{ borderColor: '#ff4d4f', color: '#ff4d4f' }}
                                >
                                    Xuất PDF
                                </Button>
                                
                                <Button 
                                    type="primary" 
                                    icon={<SaveOutlined />} 
                                    loading={saving} 
                                    onClick={handleSubmit}
                                >
                                    Lưu CV
                                </Button>
                            </Space>
                        </Header>
                    </Affix>

                    <Content style={{ padding: '40px 0', background: '#525659', display: 'flex', justifyContent: 'center', overflow: 'auto' }}>
                        <div style={{ 
                            position: 'relative',
                            transformOrigin: 'top center',
                            marginBottom: 40
                        }}>
                            {/* Import component TemplateTieuChuan ở đây */}
                            <div ref={cvTemplateRef}>
                                <TemplateTieuChuan 
                                    data={formValues} 
                                    editing={!isPreview} 
                                    onChange={(patch) => setFormValues(prev => ({ ...prev, ...patch }))} 
                                />
                            </div>
                        </div>
                    </Content>
                </Layout>
            )}
        </div>
    );
}

// Lưu ý: Bạn cần đảm bảo các sub-component (TemplateTieuChuan, FieldInput...) 
// đã được define ở trên hoặc import vào file này.

export default PageListCV;