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
import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
// Giả định các hàm api này đã được bạn define trong project
import { callSubmitCv, callUploadSingleFile } from 'config/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import type { UploadProps } from 'antd';
import TemplateCV from '../../img/TemplateCV.jpg'


import { fontRoboto } from './fontRoboto';

const { Header, Content } = Layout;

import { useAppSelector } from "@/redux/hooks";

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
    // Định nghĩa màu sắc mới theo ảnh mẫu
    const theme = {
        sidebarBg: '#2A70B8',
        sidebarText: '#ffffff',
        contentBg: '#ffffff',
        contentText: '#333333',
        sectionTitleBg: '#EBF5FF', 
        sectionTitleText: '#333333' 
    };

    // Style chung cho tiêu đề các mục bên phải (Kinh nghiệm, Học vấn...)
    const rightSectionTitleStyle: React.CSSProperties = {
        color: theme.sectionTitleText,
        background: theme.sectionTitleBg,
        padding: '10px 16px', // Tạo khoảng cách trong hộp màu
        textTransform: 'uppercase',
        marginBottom: 20,
        fontWeight: 700,
        borderRadius: 2 // Bo góc nhẹ cho mềm mại
    };

    // Style chung cho tiêu đề các mục bên trái (Liên hệ, Kỹ năng...)
    const leftSectionTitleStyle: React.CSSProperties = {
        color: theme.sidebarText,
        fontWeight: 700,
        textTransform: 'uppercase',
        marginBottom: 12,
        marginTop: 24 // Thêm margin top vì đã bỏ Divider
    };

    return (
        <div style={{
            width: 794, // Kích thước chuẩn A4 (px) cho html2canvas
            minHeight: 1123,
            background: theme.contentBg, display: 'flex',
            fontFamily: 'Roboto, Arial, sans-serif',
            boxShadow: '0 0 20px rgba(0,0,0,0.1)', overflow: 'hidden'
        }}>
            {/* Sidebar Left */}
            <div style={{ width: 280, background: theme.sidebarBg, color: theme.sidebarText, padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 10 }}>
                    {/* Tăng kích thước ảnh lên một chút cho giống mẫu */}
                    <PhotoBlock src={data.photoUrl} editing={editing} onUpload={(b64) => onChange({ photoUrl: b64 })} size={160} />
                    <div style={{ width: '100%', marginTop: 24, textAlign: 'center' }}>
                        {editing ? (
                            <FieldInput value={data.fullName} placeholder="NGUYỄN VĂN A" onChange={(v) => onChange({ fullName: v?.toUpperCase() })} />
                        ) : (
                            <h1 style={{ color: theme.sidebarText, fontSize: 26, margin: '0 0 8px 0', textTransform: 'uppercase', lineHeight: 1.3, textAlign: 'center', fontWeight: 700 }}>
                                {data.fullName || 'NGUYỄN VĂN A'}
                            </h1>
                        )}
                        {/* Thêm vị trí công việc dưới tên nếu muốn giống ảnh mẫu */}
                         {!editing && data.objective && (
                            <div style={{ fontSize: 16, fontWeight: 500, opacity: 0.9 }}>{data.objective.split('\n')[0]}</div>
                        )}
                    </div>
                </div>

                {/* Contact Info */}
                <div style={{ fontSize: 14, lineHeight: 1.8 }}>
                    {/* Đã bỏ Divider */}
                    <div style={leftSectionTitleStyle}>Liên hệ</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {editing ? (
                            <>
                                <FieldInput value={data.email} placeholder="Email" onChange={(v) => onChange({ email: v })} />
                                <FieldInput value={data.phone} placeholder="Số điện thoại" onChange={(v) => onChange({ phone: v })} />
                                <FieldInput value={data.address} placeholder="Địa chỉ/Link" onChange={(v) => onChange({ address: v })} />
                            </>
                        ) : (
                            <>
                                {/* Thêm icon giả lập cho sinh động giống mẫu */}
                                <div style={{ wordBreak: 'break-all' }}>📧 {data.email}</div>
                                <div>📞 {data.phone}</div>
                                <div>🌐 {data.address}</div>
                            </>
                        )}
                    </div>
                </div>

                {/* Skills */}
                <div style={{ flex: 1, fontSize: 14 }}>
                     {/* Đã bỏ Divider */}
                    <div style={leftSectionTitleStyle}>Kỹ năng liên quan</div>
                    {editing ? (
                        <FieldInput multiline rows={10} value={data.skills} placeholder="• Kỹ năng 1&#10;• Kỹ năng 2" onChange={(v) => onChange({ skills: v })} />
                    ) : (
                        <FieldText value={data.skills} style={{ color: theme.sidebarText, fontSize: 14, lineHeight: 1.8 }} />
                    )}
                </div>
            </div>

            {/* Main Content Right */}
            <div style={{ flex: 1, padding: '40px 32px', color: theme.contentText }}>
                {/* Objective - Mục tiêu nghề nghiệp */}
                <section style={{ marginBottom: 32 }}>
                    <h3 style={rightSectionTitleStyle}>Mục tiêu nghề nghiệp</h3>
                    {editing ? (
                        <FieldInput multiline rows={4} value={data.objective} placeholder="Mô tả ngắn gọn..." onChange={(v) => onChange({ objective: v })} />
                    ) : (
                        <div style={{ padding: '0 8px' }}>
                            <FieldText value={data.objective} />
                        </div>
                    )}
                </section>

                {/* Experience - Kinh nghiệm */}
                <section style={{ marginBottom: 32 }}>
                    <h3 style={rightSectionTitleStyle}>Kinh nghiệm làm việc</h3>
                    {editing ? (
                        <FieldInput multiline rows={12} value={data.experience} placeholder={"• Tên công ty (2022 - Nay)\n  Vị trí: Developer\n  - Mô tả..."} onChange={(v) => onChange({ experience: v })} />
                    ) : (
                         <div style={{ padding: '0 8px' }}>
                            <FieldText value={data.experience} />
                        </div>
                    )}
                </section>

                {/* Education - Học vấn */}
                <section>
                    <h3 style={rightSectionTitleStyle}>Học vấn</h3>
                    {editing ? (
                        <FieldInput multiline rows={6} value={data.education} placeholder={"• Đại học Bách Khoa (2018 - 2022)\n  GPA: 3.5"} onChange={(v) => onChange({ education: v })} />
                    ) : (
                         <div style={{ padding: '0 8px' }}>
                            <FieldText value={data.education} />
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

// --- Main Page Component ---

const PageListCV = () => {
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const user = useAppSelector(state => state.account.user); // Lấy thông tin user để điền sẵn (nếu muốn)
    const navigate = useNavigate();

    const [formValues, setFormValues] = useState<CvFormValues>({
        // Có thể điền sẵn thông tin từ User Redux nếu có
        fullName: user?.name || "",
        email: user?.email || "",
    });

    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isPreview, setIsPreview] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [exportingPdf, setExportingPdf] = useState<boolean>(false);
    const [uploadingExcel, setUploadingExcel] = useState<boolean>(false);

    const cvTemplateRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            message.warning("Vui lòng đăng nhập để tạo và lưu CV!");
            // Chuyển hướng về trang login và lưu lại đường dẫn hiện tại để login xong quay lại
            navigate(`/login`);
        }
    }, [isAuthenticated, navigate]);

    if (!isAuthenticated) {
        return (
            <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spin tip="Đang chuyển hướng đến trang đăng nhập..." size="large" />
            </div>
        );
    }

    const handleStart = () => {
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- XỬ LÝ LƯU PDF VÀ DATA ---
    const handleSubmit = async () => {
        // --- 1. Validate: Kiểm tra các trường quan trọng ---
        // Chúng ta kiểm tra cả null, undefined và chuỗi rỗng sau khi trim()
        const isNameEmpty = !formValues.fullName || !formValues.fullName.trim();
        const isEmailEmpty = !formValues.email || !formValues.email.trim();
        const isPhoneEmpty = !formValues.phone || !formValues.phone.trim();
        const isSkillsEmpty = !formValues.skills || !formValues.skills.trim();

        // Bạn có thể thêm các trường khác như experience, education vào đây nếu muốn bắt buộc
        if (isNameEmpty || isEmailEmpty || isPhoneEmpty || isSkillsEmpty) {
            message.error("Bạn chưa nhập thông tin"); // <-- Thông báo lỗi theo yêu cầu
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
            const uploadedPdfUrl = uploadRes.data?.fileName  || uploadRes.data;

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
        beforeUpload: (file) => {
            const isExcel =
                file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.type === 'application/vnd.ms-excel' ||
                file.name.endsWith('.xlsx') ||
                file.name.endsWith('.xls');

            if (!isExcel) {
                message.error(`${file.name} không phải là file Excel!`);
                return Upload.LIST_IGNORE;
            }
            return true;
        },
        customRequest: async ({ file, onSuccess }) => {
            setUploadingExcel(true);
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const data = e.target?.result;
                    try {
                        const workbook = XLSX.read(data, { type: 'binary' });
                        const sheetName = workbook.SheetNames[0];
                        // Lấy dữ liệu dạng JSON (mảng các dòng)
                        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[];

                        if (jsonData?.length > 0) {
                            const firstRow = jsonData[0]; // Dòng đầu dùng để check cột và lấy info cơ bản

                            // --- 1. VALIDATION ---
                            const requiredColumns = ['Họ và tên', 'Email', 'Số điện thoại', 'Kỹ năng'];
                            const uploadedKeys = Object.keys(firstRow);
                            const isValid = requiredColumns.every(col => uploadedKeys.includes(col));

                            if (!isValid) {
                                message.error("File Excel thiếu cột bắt buộc! Vui lòng kiểm tra lại file mẫu.");
                                setUploadingExcel(false);
                                return;
                            }

                            // --- 2. HÀM HELPER ĐỂ GỘP DÒNG ---
                            // Hàm này sẽ lấy dữ liệu của 1 cột từ TẤT CẢ các dòng, lọc bỏ dòng trống, và nối lại bằng xuống dòng
                            const getMergedColumnData = (keys: string[]) => {
                                return jsonData
                                    .map((row) => {
                                        // Tìm giá trị trong các key (ưu tiên tiếng Việt trước, tiếng Anh sau)
                                        for (const key of keys) {
                                            if (row[key]) return row[key];
                                        }
                                        return null;
                                    })
                                    .filter((val) => val) // Loại bỏ các dòng trống/null/undefined
                                    .join('\n'); // Nối các dòng lại, ngăn cách bằng dấu xuống dòng
                            };

                            // --- 3. MAP DỮ LIỆU ---
                            setFormValues(prev => ({
                                ...prev,
                                // A. Thông tin cá nhân (Chỉ lấy dòng đầu tiên)
                                fullName: firstRow['Họ và tên'] || firstRow.fullName || prev.fullName,
                                email: firstRow['Email'] || firstRow.email || prev.email,
                                phone: firstRow['Số điện thoại'] || firstRow.phone || prev.phone,
                                address: firstRow['Địa chỉ'] || firstRow.address || prev.address,
                                photoUrl: firstRow['Ảnh'] || firstRow.photoUrl || prev.photoUrl, // Nếu có link ảnh

                                // B. Thông tin chi tiết (Gộp từ NHIỀU dòng)
                                // Tự động nối các dòng Kinh nghiệm lại với nhau
                                objective: getMergedColumnData(['Mục tiêu', 'Objective']) || prev.objective,
                                experience: getMergedColumnData(['Kinh nghiệm', 'Experience']) || prev.experience,
                                education: getMergedColumnData(['Học vấn', 'Education']) || prev.education,
                                skills: getMergedColumnData(['Kỹ năng', 'Skills']) || prev.skills,
                            }));

                            message.success(`Đã nhập dữ liệu từ ${jsonData.length} dòng Excel!`);
                            setIsEditing(true);
                        } else {
                            message.warning("File Excel không có dữ liệu!");
                        }
                    } catch (readError) {
                        console.error(readError);
                        message.error("Lỗi khi đọc nội dung file Excel.");
                    }
                };
                reader.readAsBinaryString(file as File);
                if (onSuccess) onSuccess("ok");
            } catch (e) {
                message.error("Lỗi upload file");
            } finally {
                setUploadingExcel(false);
            }
        }
    };

    // --- RENDER ---
    return (
        <div className={styles["container"]} style={{ minHeight: '100vh', background: isEditing ? '#f0f2f5' : '#fff' }}>
            {!isEditing ? (
                // Màn hình Intro
                <div style={{ padding: '40px 20px', maxWidth: 1200, margin: '0 auto' }}>
                    <Breadcrumb items={[{ title: <Link to={'/'}>Trang chủ</Link> }, { title: 'Tạo CV' }]} style={{ marginBottom: 40 }} />
                    <Row gutter={[48, 48]} align="middle">
                        <Col xs={24} md={12}>
                            <p style={{ fontSize: 18, color: '#666', marginBottom: 32 }}>
                                Xin chào <strong>{user?.name}</strong>, hãy tạo CV chuyên nghiệp ngay hôm nay.
                            </p>
                            <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 24 }}>
                                Tạo CV <span style={{ color: '#00b14f' }}>Chuyên Nghiệp</span>
                            </h1>
                            <p style={{ fontSize: 18, color: '#666', marginBottom: 32 }}>
                                Nhập liệu tự động từ Excel, lưu trữ PDF trên Cloud và quản lý hồ sơ dễ dàng.
                            </p>
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                <Button type="primary" size="large" onClick={handleStart} icon={<EditOutlined />} style={{ height: 50, padding: '0 32px' ,backgroundColor:"#00b14f",borderColor:"#00b14f"}}>
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
                            {/* Preview Image: Tạo hiệu ứng khung tranh 3D */}
                            <div style={{
                                padding: 10,
                                background: '#fff',
                                borderRadius: 8,
                                boxShadow: '0 20px 40px rgba(0,0,0,0.15)', // Đổ bóng đậm hơn chút cho nổi
                                transform: 'rotate(-3deg)', // Xoay nhẹ tạo phong cách
                                transition: 'transform 0.3s',
                                cursor: 'pointer'
                            }}
                                // Thêm hiệu ứng hover cho sinh động
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(0deg) scale(1.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(-3deg)'}
                            >
                                {/* THAY THẾ DIV CŨ BẰNG THẺ IMG */}
                                <img
                                    src={TemplateCV}
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        borderRadius: 4,
                                        display: 'block',
                                        border: '1px solid #f0f0f0' // Viền nhẹ cho ảnh tách biệt
                                    }}
                                />

                                {/* (Optional) Thêm nhãn "Mẫu hot" nếu thích */}
                                <div style={{
                                    position: 'absolute',
                                    top: 20,
                                    right: -10,
                                    background: '#ff4d4f',
                                    color: '#fff',
                                    padding: '4px 12px',
                                    borderRadius: '4px 0 0 4px',
                                    fontWeight: 'bold',
                                    boxShadow: '-2px 2px 4px rgba(0,0,0,0.2)'
                                }}>
                                    Mẫu Chuẩn
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
                                    Lưu & Tạo CV
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