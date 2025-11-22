import React, { useState, useEffect, useRef } from 'react';
import { Layout, Row, Col, Card, Button, Modal, Input, Spin, message, Typography, Empty, Space, Tooltip, Tag, Upload } from 'antd';
import { 
    FileTextOutlined, 
    PlusOutlined, 
    EditOutlined, 
    DeleteOutlined, 
    EyeOutlined, 
    DownloadOutlined, 
    MailOutlined, 
    PhoneOutlined, 
    EnvironmentOutlined, 
    SaveOutlined, 
    CameraOutlined,
    FileExcelOutlined,
    FilePdfOutlined,
    CloudUploadOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import { callFetchCvByUser, callFetchCvById, callDeleteCv, callUpdateCv } from 'config/api';
import { ICv } from '@/types/backend';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

// --- REUSABLE COMPONENTS (Đồng bộ với PageListCV) ---

const FieldInput = ({ value, placeholder, onChange, multiline, rows }: { value?: string; placeholder?: string; onChange: (v: string) => void; multiline?: boolean; rows?: number; }) => {
    return (
        <div style={{ marginBottom: 8 }}>
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
                    }}
                    onBlur={(e) => {
                        e.target.style.backgroundColor = 'rgba(255,255,255,0.6)';
                        e.target.style.borderColor = '#d9d9d9';
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
                        backgroundColor: 'rgba(255,255,255,0.6)',
                        border: '1px dashed #d9d9d9',
                        borderRadius: 6,
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

const FieldText = ({ value, placeholder, style }: { value?: string; placeholder?: string; style?: any }) => (
    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6, minHeight: 24, ...style }}>
        {value || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>{placeholder}</span>}
    </div>
);

// Photo Upload Component
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
                <Upload 
                    showUploadList={false}
                    accept="image/*"
                    beforeUpload={async (file) => {
                        if (!file.type.startsWith('image/')) return message.error('Chỉ chấp nhận file ảnh!');
                        setUploading(true);
                        try {
                            const b64 = await getBase64(file);
                            onUpload(b64);
                        } finally { setUploading(false); }
                        return false;
                    }}
                >
                    <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity 0.3s', cursor: 'pointer', color: '#fff'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
                        {uploading ? <Spin size="small" /> : 'Đổi ảnh'}
                    </div>
                </Upload>
            )}
        </div>
    );
};

// --- TEMPLATE RENDERER ---

const CvTemplateRenderer = React.memo(({ cv, editing, onChange }: { cv: ICv; editing: boolean; onChange: (field: string, value: string) => void; }) => {
    const isUploadTemplate = cv.cvTemplate === 'Upload CV' || (cv.skills && cv.skills.includes('[CV_FILE_URL]'));

    // 1. Render Uploaded CV (Special Case)
    if (isUploadTemplate) {
        const fileUrlMatch = cv.skills?.match(/\[CV_FILE_URL\](.*?)\[\/CV_FILE_URL\]/);
        const fileUrl = fileUrlMatch ? fileUrlMatch[1] : '';
        const imageUrl = fileUrl ? `${import.meta.env.VITE_BACKEND_URL}/images/resume/${fileUrl}` : '';
        
        return (
             <div style={{ width: 794, minHeight: 1123, background: '#fff', boxShadow: '0 0 20px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: 40, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
                    <Title level={2} style={{ color: '#fff', margin: 0 }}>{cv.fullName || 'CV Uploaded'}</Title>
                    <Space split="•">
                        <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{cv.email}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{cv.phone}</Text>
                    </Space>
                </div>
                <div style={{ flex: 1, padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9' }}>
                    <Card style={{ width: '100%', textAlign: 'center', border: '2px dashed #d9d9d9' }}>
                        <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                        <Title level={4}>File CV Đã Được Tải Lên</Title>
                        <Paragraph type="secondary">Hệ thống đang lưu trữ file gốc của bạn. Bạn không thể chỉnh sửa nội dung trực tiếp ở đây.</Paragraph>
                        {imageUrl && (
                            <Button type="primary" href={imageUrl} target="_blank" icon={<DownloadOutlined />}>
                                Tải xuống file gốc
                            </Button>
                        )}
                    </Card>
                </div>
             </div>
        );
    }

    // 2. Render Standard Template (Default)
    // Mapping ICv to the structure expected by the standard template logic
    return (
        <div style={{ width: 794, minHeight: 1123, background: '#ffffff', display: 'flex', boxShadow: '0 0 20px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            {/* Sidebar */}
            <div style={{ width: 280, background: '#2c3e50', color: '#ecf0f1', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <PhotoBlock src={cv.photoUrl} editing={editing} onUpload={(b64) => onChange('photoUrl', b64)} />
                    <div style={{ width: '100%', marginTop: 24, textAlign: 'center' }}>
                        {editing ? (
                            <FieldInput value={cv.fullName} placeholder="HỌ TÊN" onChange={(v) => onChange('fullName', v?.toUpperCase())} />
                        ) : (
                            <Title level={3} style={{ color: '#fff', margin: 0, textTransform: 'uppercase', textAlign: 'center' }}>{cv.fullName}</Title>
                        )}
                    </div>
                </div>

                <div style={{ fontSize: 13 }}>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', margin: '12px 0' }} />
                    <div style={{ color: '#3498db', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Liên hệ</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {editing ? (
                            <>
                                <FieldInput value={cv.email} placeholder="Email" onChange={(v) => onChange('email', v)} />
                                <FieldInput value={cv.phone} placeholder="SĐT" onChange={(v) => onChange('phone', v)} />
                                <FieldInput value={cv.address} placeholder="Địa chỉ" onChange={(v) => onChange('address', v)} />
                            </>
                        ) : (
                            <>
                                <Space><MailOutlined /> {cv.email}</Space>
                                <Space><PhoneOutlined /> {cv.phone}</Space>
                                <Space><EnvironmentOutlined /> {cv.address}</Space>
                            </>
                        )}
                    </div>
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', margin: '12px 0' }} />
                    <div style={{ color: '#3498db', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Kỹ năng</div>
                    {editing ? (
                        <FieldInput multiline rows={10} value={cv.skills} placeholder="• Skill 1..." onChange={(v) => onChange('skills', v)} />
                    ) : (
                        <FieldText value={cv.skills} style={{ color: '#ecf0f1' }} />
                    )}
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: '40px 32px', color: '#2c3e50' }}>
                <section style={{ marginBottom: 32 }}>
                    <h3 style={{ color: '#2c3e50', textTransform: 'uppercase', borderBottom: '2px solid #3498db', paddingBottom: 8, fontWeight: 700 }}>Mục tiêu nghề nghiệp</h3>
                    {editing ? (
                        <FieldInput multiline rows={4} value={cv.objective} placeholder="Mục tiêu..." onChange={(v) => onChange('objective', v)} />
                    ) : (
                        <FieldText value={cv.objective} />
                    )}
                </section>
                <section style={{ marginBottom: 32 }}>
                    <h3 style={{ color: '#2c3e50', textTransform: 'uppercase', borderBottom: '2px solid #3498db', paddingBottom: 8, fontWeight: 700 }}>Kinh nghiệm làm việc</h3>
                    {editing ? (
                        <FieldInput multiline rows={12} value={cv.experience} placeholder="Kinh nghiệm..." onChange={(v) => onChange('experience', v)} />
                    ) : (
                        <FieldText value={cv.experience} />
                    )}
                </section>
                <section>
                    <h3 style={{ color: '#2c3e50', textTransform: 'uppercase', borderBottom: '2px solid #3498db', paddingBottom: 8, fontWeight: 700 }}>Học vấn</h3>
                    {editing ? (
                        <FieldInput multiline rows={6} value={cv.education} placeholder="Học vấn..." onChange={(v) => onChange('education', v)} />
                    ) : (
                        <FieldText value={cv.education} />
                    )}
                </section>
            </div>
        </div>
    );
});


// --- MAIN COMPONENT ---

const CvManagement: React.FC = () => {
    const [cvList, setCvList] = useState<ICv[]>([]);
    const [selectedCv, setSelectedCv] = useState<ICv | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [processing, setProcessing] = useState<boolean>(false);
    
    // Ref for PDF generation
    const cvTemplateRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCvList();
    }, []);

    const fetchCvList = async () => {
        setLoading(true);
        try {
            const res = await callFetchCvByUser();
            if (res && res.data) setCvList(res.data.result || []);
        } catch (error) {
            message.error('Không thể tải danh sách CV');
        } finally {
            setLoading(false);
        }
    };

    const handleViewCv = (cv: ICv) => {
        setSelectedCv(cv);
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    const handleEditCv = async (cv: ICv) => {
        setLoading(true);
        try {
            const res = await callFetchCvById(cv.id); // Fetch detail to get latest data
            setSelectedCv(res?.data || cv);
            setIsEditMode(true);
            setIsModalOpen(true);
        } catch (e) {
            message.error("Lỗi tải chi tiết CV");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCv = async (id: number) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc chắn muốn xóa CV này không?',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await callDeleteCv(id);
                    message.success('Đã xóa CV');
                    fetchCvList();
                } catch (e) {
                    message.error('Xóa thất bại');
                }
            }
        });
    };

    const handleSave = async () => {
        if (!selectedCv) return;
        setProcessing(true);
        try {
            await callUpdateCv(selectedCv.id, selectedCv);
            message.success('Cập nhật CV thành công');
            fetchCvList();
            setIsEditMode(false); // Switch to view mode
        } catch (e) {
            message.error('Cập nhật thất bại');
        } finally {
            setProcessing(false);
        }
    };

    const handleFieldChange = (field: string, value: string) => {
        setSelectedCv(prev => prev ? ({ ...prev, [field]: value }) : null);
    };

    const handleDownloadPDF = async () => {
        if (!cvTemplateRef.current || !selectedCv) return;
        setProcessing(true);
        try {
            const canvas = await html2canvas(cvTemplateRef.current, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            pdf.addImage(imgData, 'PNG', 0, 0, 210, 297); // A4 dimensions
            pdf.save(`CV_${selectedCv.fullName}.pdf`);
            message.success('Tải xuống thành công');
        } catch (e) {
            message.error('Lỗi khi xuất PDF');
        } finally {
            setProcessing(false);
        }
    };

    const handleExportExcel = () => {
        if (!selectedCv) return;
        setProcessing(true);
        try {
            // Simple export logic matching PageListCV
            const ws = XLSX.utils.json_to_sheet([{
                "Họ tên": selectedCv.fullName,
                "Email": selectedCv.email,
                "SĐT": selectedCv.phone,
                "Địa chỉ": selectedCv.address,
                "Mục tiêu": selectedCv.objective,
                "Kinh nghiệm": selectedCv.experience,
                "Học vấn": selectedCv.education,
                "Kỹ năng": selectedCv.skills
            }]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "CV");
            XLSX.writeFile(wb, `CV_${selectedCv.fullName}.xlsx`);
            message.success('Xuất Excel thành công');
        } catch (e) {
            message.error('Lỗi xuất Excel');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
            {/* Header Area */}
            <div style={{ maxWidth: 1200, margin: '0 auto', marginBottom: 24 }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={2} style={{ margin: 0, color: '#1a1a1a' }}>
                            Quản lý CV
                        </Title>
                        <Text type="secondary">Danh sách các hồ sơ bạn đã tạo trên hệ thống</Text>
                    </Col>
                    <Col>
                        <Button 
                            type="primary" 
                            size="large" 
                            icon={<PlusOutlined />} 
                            onClick={() => navigate('/listCv')}
                            style={{ borderRadius: 8, background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border: 'none' }}
                        >
                            Tạo CV Mới
                        </Button>
                    </Col>
                </Row>
            </div>

            {/* CV List Grid */}
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>
                ) : cvList.length === 0 ? (
                    <Empty description="Bạn chưa có CV nào" style={{ marginTop: 50 }}>
                        <Button type="primary" onClick={() => navigate('/listCv')}>Tạo ngay</Button>
                    </Empty>
                ) : (
                    <Row gutter={[24, 24]}>
                        {cvList.map((cv) => (
                            <Col xs={24} sm={12} lg={8} key={cv.id}>
                                <Card
                                    hoverable
                                    style={{ borderRadius: 12, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}
                                    bodyStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}
                                >
                                    <div style={{ padding: 24, background: 'linear-gradient(135deg, #f5f7fa 0%, #e6e9f0 100%)', borderBottom: '1px solid #f0f0f0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ 
                                                width: 48, height: 48, borderRadius: '50%', 
                                                background: '#1890ff', color: '#fff', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 20, fontWeight: 'bold'
                                            }}>
                                                {cv.fullName?.charAt(0) || 'C'}
                                            </div>
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <div style={{ fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {cv.fullName}
                                                </div>
                                                <div style={{ fontSize: 12, color: '#666' }}>
                                                    {cv.cvTemplate || 'Tiêu chuẩn'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ padding: 24, flex: 1 }}>
                                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                                            <Text type="secondary" style={{ fontSize: 13 }}><MailOutlined /> {cv.email || 'Chưa có email'}</Text>
                                            <Text type="secondary" style={{ fontSize: 13 }}><PhoneOutlined /> {cv.phone || 'Chưa có SĐT'}</Text>
                                        </Space>
                                        <div style={{ marginTop: 16 }}>
                                            <Tag color={cv.skills?.includes('[CV_FILE_URL]') ? 'purple' : 'blue'}>
                                                {cv.skills?.includes('[CV_FILE_URL]') ? 'Đã Upload' : 'Tạo Online'}
                                            </Tag>
                                        </div>
                                    </div>

                                    <div style={{ borderTop: '1px solid #f0f0f0', display: 'flex' }}>
                                        <Tooltip title="Xem chi tiết">
                                            <Button type="text" block style={{ height: 48 }} icon={<EyeOutlined />} onClick={() => handleViewCv(cv)} />
                                        </Tooltip>
                                        <div style={{ width: 1, background: '#f0f0f0' }} />
                                        <Tooltip title="Chỉnh sửa">
                                            <Button type="text" block style={{ height: 48, color: '#1890ff' }} icon={<EditOutlined />} onClick={() => handleEditCv(cv)} />
                                        </Tooltip>
                                        <div style={{ width: 1, background: '#f0f0f0' }} />
                                        <Tooltip title="Xóa">
                                            <Button type="text" block style={{ height: 48, color: '#ff4d4f' }} icon={<DeleteOutlined />} onClick={() => handleDeleteCv(cv.id)} />
                                        </Tooltip>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            {/* Detail/Edit Modal */}
            <Modal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                width={1000}
                footer={null}
                centered
                destroyOnClose
                style={{ top: 20 }}
                bodyStyle={{ padding: 0, overflow: 'hidden', borderRadius: 8 }}
            >
                {selectedCv && (
                    <Layout style={{ background: '#fff', height: '90vh' }}>
                        {/* Toolbar */}
                        <div style={{ 
                            padding: '12px 24px', 
                            borderBottom: '1px solid #e8e8e8', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            background: '#fff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            zIndex: 10
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <FileTextOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                                <span style={{ fontWeight: 600, fontSize: 16 }}>
                                    {isEditMode ? 'Chỉnh sửa CV' : 'Xem trước CV'}
                                </span>
                            </div>
                            <Space>
                                {isEditMode ? (
                                    <>
                                        <Button icon={<EyeOutlined />} onClick={() => setIsEditMode(false)}>Xem trước</Button>
                                        <Button 
                                            type="primary" 
                                            icon={<SaveOutlined />} 
                                            loading={processing} 
                                            onClick={handleSave}
                                        >
                                            Lưu thay đổi
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Tooltip title="Chỉnh sửa nội dung">
                                            <Button icon={<EditOutlined />} onClick={() => setIsEditMode(true)}>Sửa</Button>
                                        </Tooltip>
                                        <Tooltip title="Xuất file Excel">
                                            <Button icon={<FileExcelOutlined />} onClick={handleExportExcel} loading={processing} />
                                        </Tooltip>
                                        <Button 
                                            type="primary" 
                                            danger
                                            icon={<FilePdfOutlined />} 
                                            onClick={handleDownloadPDF} 
                                            loading={processing}
                                        >
                                            Tải PDF
                                        </Button>
                                    </>
                                )}
                            </Space>
                        </div>

                        {/* CV Content Area */}
                        <div style={{ flex: 1, overflow: 'auto', background: '#525659', padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
                            <div 
                                ref={cvTemplateRef}
                                style={{ 
                                    transformOrigin: 'top center',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                }}
                            >
                                <CvTemplateRenderer 
                                    cv={selectedCv} 
                                    editing={isEditMode} 
                                    onChange={handleFieldChange} 
                                />
                            </div>
                        </div>
                    </Layout>
                )}
            </Modal>
        </div>
    );
};

export default CvManagement;