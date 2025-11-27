import styles from 'styles/client.module.scss';
import { Breadcrumb, Row, Col, Card, Button, Input, message, Upload, Divider, Space, Spin, Tooltip, Layout, Affix } from 'antd';
import {
    ArrowLeftOutlined,
    EditOutlined,
    EyeOutlined,
    SaveOutlined,
    CameraOutlined,
    FilePdfOutlined,
    FileExcelOutlined,
    CloudUploadOutlined,
    DownloadOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useState, useRef } from 'react';
// Giả định các hàm api này đã được bạn define trong project
import { callSubmitCv, callUploadSingleFile } from 'config/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import type { UploadProps } from 'antd';

import { fontRoboto } from './fontRoboto';

const { Header, Content } = Layout;

// --- Interfaces ---
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
    // Các trường bổ sung nếu cần
    [key: string]: any;
}

// --- Sub Components (Input, Photo, Template) ---

// 1. Input Component
const FieldInput = ({ value, placeholder, onChange, multiline, rows }: { value?: string; placeholder?: string; onChange: (v: string) => void; multiline?: boolean; rows?: number; label?: string }) => {
    const styleInput = {
        padding: '8px 12px',
        fontSize: 14,
        lineHeight: 1.6,
        backgroundColor: 'rgba(255,255,255,0.6)',
        border: '1px dashed #d9d9d9',
        borderRadius: 6,
        transition: 'all 0.3s',
        width: '100%'
    };

    return (
        <div style={{ marginBottom: 8, position: 'relative' }}>
            {multiline ? (
                <Input.TextArea
                    value={value}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    rows={rows || 3}
                    bordered={false}
                    style={styleInput}
                />
            ) : (
                <Input
                    value={value}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    bordered={false}
                    style={styleInput}
                />
            )}
        </div>
    );
};

// 2. Display Component (Dùng để hiển thị khi in hoặc xem trước)
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
            if (!isImage) { message.error('Chỉ được upload file ảnh!'); return false; }
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) { message.error('Ảnh phải nhỏ hơn 5MB!'); return false; }

            try {
                setUploading(true);
                const b64 = await getBase64(file);
                onUpload(b64);
                message.success('Đổi ảnh thành công!');
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
            width: size, height: size, borderRadius: '50%',
            background: src ? '#fff' : 'rgba(255,255,255,0.2)',
            overflow: 'hidden', position: 'relative',
            border: '4px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
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
                        background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity 0.3s', cursor: 'pointer', color: '#fff', fontWeight: 600
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

// 4. TEMPLATE TIÊU CHUẨN
const TemplateTieuChuan = ({ data, editing, onChange }: { data: CvFormValues; editing: boolean; onChange: (patch: Partial<CvFormValues>) => void }) => {
    return (
        <div style={{
            width: 794, // Kích thước chuẩn A4 (px) cho html2canvas
            minHeight: 1123,
            background: '#ffffff', display: 'flex',
            fontFamily: 'Roboto, Arial, sans-serif', // <--- THÊM DÒNG NÀY
            boxShadow: '0 0 20px rgba(0,0,0,0.1)', overflow: 'hidden'
            
        }}>
            {/* Sidebar Left */}
            <div style={{ width: 280, background: '#2c3e50', color: '#ecf0f1', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
                    <PhotoBlock src={data.photoUrl} editing={editing} onUpload={(b64) => onChange({ photoUrl: b64 })} />
                    <div style={{ width: '100%', marginTop: 24, textAlign: 'center' }}>
                        {editing ? (
                            <FieldInput value={data.fullName} placeholder="NGUYỄN VĂN A" onChange={(v) => onChange({ fullName: v?.toUpperCase() })} />
                        ) : (
                            <h1 style={{ color: '#fff', fontSize: 24, margin: 0, textTransform: 'uppercase', lineHeight: 1.3, textAlign: 'center' }}>{data.fullName || 'NGUYỄN VĂN A'}</h1>
                        )}
                    </div>
                </div>

                {/* Contact Info */}
                <div style={{ fontSize: 13 }}>
                    <Divider style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '12px 0' }} />
                    <div style={{ color: '#3498db', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Liên hệ</div>
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

                {/* Skills */}
                <div style={{ flex: 1 }}>
                    <Divider style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '12px 0' }} />
                    <div style={{ color: '#3498db', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Kỹ năng</div>
                    {editing ? (
                        <FieldInput multiline rows={10} value={data.skills} placeholder="• Kỹ năng 1&#10;• Kỹ năng 2" onChange={(v) => onChange({ skills: v })} />
                    ) : (
                        <FieldText value={data.skills} style={{ color: '#ecf0f1', fontSize: 13 }} />
                    )}
                </div>
            </div>

            {/* Main Content Right */}
            <div style={{ flex: 1, padding: '40px 32px', color: '#2c3e50' }}>
                {/* Objective */}
                <section style={{ marginBottom: 32 }}>
                    <h3 style={{ color: '#2c3e50', textTransform: 'uppercase', borderBottom: '2px solid #3498db', paddingBottom: 8, marginBottom: 16, fontWeight: 700 }}>Mục tiêu nghề nghiệp</h3>
                    {editing ? (
                        <FieldInput multiline rows={4} value={data.objective} placeholder="Mô tả ngắn gọn..." onChange={(v) => onChange({ objective: v })} />
                    ) : (
                        <FieldText value={data.objective} />
                    )}
                </section>

                {/* Experience */}
                <section style={{ marginBottom: 32 }}>
                    <h3 style={{ color: '#2c3e50', textTransform: 'uppercase', borderBottom: '2px solid #3498db', paddingBottom: 8, marginBottom: 16, fontWeight: 700 }}>Kinh nghiệm làm việc</h3>
                    {editing ? (
                        <FieldInput multiline rows={12} value={data.experience} placeholder={"• Tên công ty (2022 - Nay)\n  Vị trí: Developer\n  - Mô tả..."} onChange={(v) => onChange({ experience: v })} />
                    ) : (
                        <FieldText value={data.experience} />
                    )}
                </section>

                {/* Education */}
                <section>
                    <h3 style={{ color: '#2c3e50', textTransform: 'uppercase', borderBottom: '2px solid #3498db', paddingBottom: 8, marginBottom: 16, fontWeight: 700 }}>Học vấn</h3>
                    {editing ? (
                        <FieldInput multiline rows={6} value={data.education} placeholder={"• Đại học Bách Khoa (2018 - 2022)\n  GPA: 3.5"} onChange={(v) => onChange({ education: v })} />
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

    // --- XỬ LÝ LƯU PDF VÀ DATA ---
    const handleSubmit = async () => {
        // 1. Validate
        if (!formValues.fullName?.trim()) {
            message.warning('Vui lòng nhập họ tên!');
            return;
        }
        if (!cvTemplateRef.current) return;

        try {
            setSaving(true);
            message.loading({ content: 'Đang xử lý font tiếng Việt...', key: 'save_process' });

            const wasInEditMode = !isPreview;
            if (wasInEditMode) setIsPreview(true);

            // Chờ render DOM
            await new Promise(resolve => setTimeout(resolve, 500));

            // --- BƯỚC 1: KHỞI TẠO PDF ---
            const doc = new jsPDF({
                orientation: 'p',
                unit: 'px',
                format: [794, 1123] // Kích thước A4 chuẩn
            });

            // --- QUAN TRỌNG: NHÚNG FONT TIẾNG VIỆT ---
            // Thêm file font vào hệ thống ảo của jsPDF
            // 'Roboto-Regular.ttf' là tên file ảo bạn tự đặt
            // fontRoboto là chuỗi base64 (đã bỏ đoạn đầu "data:font/ttf;base64,")
            doc.addFileToVFS("Roboto-Regular.ttf", fontRoboto);
            doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
            doc.setFont("Roboto"); // Set font mặc định cho toàn bộ doc

            // --- BƯỚC 2: RENDER HTML ---
            await new Promise<void>((resolve, reject) => {
                if (!cvTemplateRef.current) return reject("Lỗi template");

                doc.html(cvTemplateRef.current, {
                    callback: function (doc) {
                        resolve();
                    },
                    x: 0,
                    y: 0,
                    width: 794,
                    windowWidth: 794,
                    autoPaging: 'text',
                    html2canvas: {
                        scale: 1,
                        useCORS: true,
                        // Quan trọng: Báo html2canvas dùng font chữ hệ thống để render đúng trước khi đưa vào PDF
                        letterRendering: true,
                    },
                    // Mẹo: Ép font trong quá trình html -> pdf
                    fontFaces: [
                        {
                            family: 'Roboto',
                            style: 'normal',
                            weight: '400',
                            src: [
                                {
                                    url: "data:font/ttf;base64," + fontRoboto,
                                    format: "truetype"
                                }
                            ]
                        }
                    ]
                });
            });

            if (wasInEditMode) setIsPreview(false);

            // --- BƯỚC 3: XUẤT VÀ UPLOAD (Giữ nguyên logic cũ) ---
            const pdfBlob = doc.output('blob');
            const safeName = (formValues.fullName || 'User').replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `CV_${safeName}_${Date.now()}.pdf`;
            const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });

            message.loading({ content: 'Đang upload...', key: 'save_process' });
            const uploadRes = await callUploadSingleFile(pdfFile, 'resume');

            // ... (Phần xử lý lưu API giữ nguyên như cũ) ...
            const uploadedPdfUrl = uploadRes.data?.fileName || uploadRes.data?.url || uploadRes.data;

            const dataToSave = {
                url: uploadedPdfUrl,
                cvTemplate: 'Tiêu chuẩn',
                fullName: formValues.fullName || "",
                email: formValues.email || "",
                phone: formValues.phone || "",
                address: formValues.address || "",
                objective: formValues.objective || "",
                experience: formValues.experience || "",
                education: formValues.education || "",
                skills: formValues.skills || "",
                photoUrl: formValues.photoUrl || "",
            };
            await callSubmitCv(dataToSave);
            message.success({ content: "Thành công!", key: 'save_process' });

        } catch (err: any) {
            console.error(err);
            message.error("Lỗi: " + err.message);
            setSaving(false);
        }
    };

    // --- XUẤT FILE EXCEL ĐỂ LƯU MẪU ---
    const handleDownloadTemplate = () => {
        const templateData = [{
            'Họ và tên': 'Nguyễn Văn A',
            'Email': 'nguyenvana@email.com',
            'Số điện thoại': '0909123456',
            'Địa chỉ': 'Hà Nội',
            'Mục tiêu': 'Mục tiêu...',
            'Kinh nghiệm': 'Kinh nghiệm...',
            'Học vấn': 'Học vấn...',
            'Kỹ năng': 'Kỹ năng...',
        }];
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        // Chỉnh độ rộng cột
        worksheet['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(workbook, worksheet, "CV Template");
        XLSX.writeFile(workbook, "Mau_Nhap_Lieu_CV.xlsx");
    };

    // --- UPLOAD EXCEL ĐỂ ĐIỀN FORM ---
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
                    const sheetName = workbook.SheetNames[0];
                    const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[];

                    if (jsonData?.length > 0) {
                        const row = jsonData[0]; // Lấy dòng đầu tiên
                        // Map dữ liệu từ Excel vào Form
                        setFormValues(prev => ({
                            ...prev,
                            fullName: row['Họ và tên'] || row.fullName || prev.fullName,
                            email: row['Email'] || row.email || prev.email,
                            phone: row['Số điện thoại'] || row.phone || prev.phone,
                            address: row['Địa chỉ'] || row.address || prev.address,
                            objective: row['Mục tiêu'] || row.objective || prev.objective,
                            experience: row['Kinh nghiệm'] || row.experience || prev.experience,
                            education: row['Học vấn'] || row.education || prev.education,
                            skills: row['Kỹ năng'] || row.skills || prev.skills,
                        }));
                        message.success("Đã nhập dữ liệu từ Excel!");
                        setIsEditing(true);
                    }
                };
                reader.readAsBinaryString(file as File);
                if (onSuccess) onSuccess("ok");
            } catch (e) {
                message.error("Lỗi đọc file Excel");
            } finally {
                setUploadingExcel(false);
            }
        }
    };

    // --- RENDER ---
    return (
        <div className={styles["container"]} style={{ minHeight: '100vh', background: isEditing ? '#f0f2f5' : '#fff' }}>
            {!isEditing ? (
                // Màn hình Intro (Giữ nguyên như code cũ của bạn nhưng thêm nút Download Template)
                <div style={{ padding: '40px 20px', maxWidth: 1200, margin: '0 auto' }}>
                    <Breadcrumb items={[{ title: <Link to={'/'}>Trang chủ</Link> }, { title: 'Tạo CV' }]} style={{ marginBottom: 40 }} />
                    <Row gutter={[48, 48]} align="middle">
                        <Col xs={24} md={12}>
                            <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 24 }}>
                                Tạo CV <span style={{ color: '#1677ff' }}>Chuyên Nghiệp</span>
                            </h1>
                            <p style={{ fontSize: 18, color: '#666', marginBottom: 32 }}>
                                Nhập liệu tự động từ Excel, lưu trữ PDF trên Cloud và quản lý hồ sơ dễ dàng.
                            </p>
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                <Button type="primary" size="large" onClick={handleStart} icon={<EditOutlined />} style={{ height: 50, padding: '0 32px' }}>
                                    Tạo CV Ngay
                                </Button>
                                <Space.Compact>
                                    <Upload {...propsUploadExcel}>
                                        <Button size="large" icon={<CloudUploadOutlined />} loading={uploadingExcel} style={{ height: 50 }}>Upload Excel</Button>
                                    </Upload>
                                    <Tooltip title="Tải file mẫu">
                                        <Button size="large" icon={<DownloadOutlined />} onClick={handleDownloadTemplate} style={{ height: 50 }} />
                                    </Tooltip>
                                </Space.Compact>
                            </div>
                            <div style={{ marginTop: 40, display: 'flex', gap: 24, color: '#888' }}>
                                <div><CheckCircleOutlined style={{ color: '#52c41a' }} /> Lưu file PDF</div>
                                <div><CheckCircleOutlined style={{ color: '#52c41a' }} /> Quản lý dữ liệu</div>
                            </div>
                        </Col>
                        <Col xs={24} md={12}>
                            {/* Preview Image Placeholder */}
                            <div style={{ padding: 20, background: '#fff', borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', transform: 'rotate(-2deg)' }}>
                                <div style={{ height: 300, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
                                    Preview Template
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            ) : (
                // Màn hình Editor
                <Layout style={{ minHeight: '100vh' }}>
                    <Affix offsetTop={0}>
                        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: 64, zIndex: 100 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setIsEditing(false)}>Quay lại</Button>
                                <span style={{ fontWeight: 600 }}>Mẫu Tiêu Chuẩn</span>
                            </div>
                            <Space>
                                <Tooltip title="Xem trước giao diện PDF sẽ lưu">
                                    <Button type={isPreview ? "primary" : "default"} icon={isPreview ? <EditOutlined /> : <EyeOutlined />} onClick={() => setIsPreview(!isPreview)}>
                                        {isPreview ? "Sửa CV" : "Xem trước"}
                                    </Button>
                                </Tooltip>
                                <Upload {...propsUploadExcel}>
                                    <Button icon={<FileExcelOutlined />} loading={uploadingExcel}>Nhập Excel</Button>
                                </Upload>
                                <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSubmit}>
                                    Lưu & Nộp CV
                                </Button>
                            </Space>
                        </Header>
                    </Affix>
                    <Content style={{ padding: '40px 0', background: '#525659', display: 'flex', justifyContent: 'center', overflow: 'auto' }}>
                        {/* Component Template */}
                        <div ref={cvTemplateRef} style={{ marginBottom: 40 }}>
                            <TemplateTieuChuan
                                data={formValues}
                                editing={!isPreview} // Nếu đang Preview thì editing = false
                                onChange={(patch) => setFormValues(prev => ({ ...prev, ...patch }))}
                            />
                        </div>
                    </Content>
                </Layout>
            )}
        </div>
    );
}

export default PageListCV;