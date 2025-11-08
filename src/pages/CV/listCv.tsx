import styles from 'styles/client.module.scss';
import { Breadcrumb, Row, Col, Card, Tag, Divider, Button, Input, message, Upload, Tooltip, Space } from 'antd';
import { ThunderboltOutlined, CheckCircleOutlined, CloseOutlined, PlusOutlined, UploadOutlined, EditOutlined, EyeOutlined, SaveOutlined, CameraOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { callSubmitCv } from 'config/api';


interface CvData {
    title: string;
    description: string;
}

interface CvCardProps extends CvData {
    onSelect: (cv: CvData) => void;
}

const CvCard = ({ title, description, onSelect }: CvCardProps) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            style={{ position: 'relative', height: '100%' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <Card
                hoverable
                style={{
                    borderRadius: 12,
                    height: '100%',
                    border: '1px solid #e8e8e8',
                    transition: 'all 0.3s ease',
                    transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
                    boxShadow: hovered ? '0 12px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)'
                }}
                cover={
                    <div style={{
                        height: 240,
                        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        {/* Decorative background pattern */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,.35) 1px, transparent 1px), radial-gradient(circle at 80% 80%, rgba(255,255,255,.35) 1px, transparent 1px)',
                            backgroundSize: '50px 50px'
                        }} />

                        {/* Template preview */}
                        {title === 'Tiêu chuẩn' && (
                            <div style={{ width: 280, height: 180, background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)', borderRadius: 8, position: 'relative', boxShadow: '0 8px 16px rgba(30, 136, 229, 0.35)' }}>
                                <div style={{ position: 'absolute', right: -16, top: 20, bottom: 20, width: 180, background: '#fff', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            </div>
                        )}
                        {title === 'Thanh Lịch' && (
                            <div style={{ width: 300, height: 180, background: '#fff', borderRadius: 8, border: '2px solid #e5e7eb', position: 'relative', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                                <div style={{ height: 44, background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)', borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
                            </div>
                        )}
                        {title === 'Hiện đại' && (
                            <div style={{ width: 300, height: 180, background: '#fff', borderRadius: 8, border: '2px solid #e5e7eb', position: 'relative', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                                <div style={{ width: 12, background: 'linear-gradient(180deg, #1e88e5, #1565c0)', position: 'absolute', left: 0, top: 0, bottom: 0, borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }} />
                            </div>
                        )}
                    </div>
                }
            >
                <div style={{ padding: '8px 0' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#1a1a1a' }}>{title}</div>
                    <div style={{ fontSize: 14, color: '#666', marginBottom: 12, minHeight: 40 }}>{description}</div>
                </div>
            </Card>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                <Button
                    type="primary"
                    size="large"
                    style={{
                        background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 600,
                        boxShadow: '0 6px 16px rgba(30, 136, 229, 0.35)',
                        height: 44,
                        padding: '0 24px'
                    }}
                    onClick={() => onSelect({ title, description })}
                >
                    Sử dụng mẫu này
                </Button>
            </div>
        </div>
    );
}

// CV field data model and template renderer
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

interface CvRendererProps {
    template: string;
    data: CvFormValues;
    editing: boolean;
    onChange: (patch: Partial<CvFormValues>) => void;
}

const FieldText = ({ value, placeholder, style }: { value?: string; placeholder?: string; style?: any }) => (
    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#2c3e50', lineHeight: 1.6, ...style }}>
        {value || <span style={{ color: '#95a5a6', fontStyle: 'italic' }}>{placeholder || ''}</span>}
    </div>
);

const FieldInput = ({ value, placeholder, onChange, multiline, rows }: { value?: string; placeholder?: string; onChange: (v: string) => void; multiline?: boolean; rows?: number; }) => (
    multiline ? (
        <Input.TextArea
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            rows={rows || 3}
            style={{
                borderRadius: 6,
                fontSize: 14,
                lineHeight: 1.6
            }}
        />
    ) : (
        <Input
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            style={{
                borderRadius: 6,
                fontSize: 14
            }}
        />
    )
);

// Image upload utilities
const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

const PhotoBlock = ({ src, editing, onUpload, size = 120 }: { src?: string; editing: boolean; onUpload: (b64: string) => void; size?: number; }) => {
    const [uploading, setUploading] = useState(false);

    const uploadProps = {
        showUploadList: false,
        beforeUpload: async (file: File) => {
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
            background: src ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '4px solid #fff'
        }}>
            {src ? (
                <img src={src} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.3 }}>
                    <CameraOutlined />
                </div>
            )}
            {editing && (
                <Upload {...uploadProps} accept="image/*">
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        textAlign: 'center',
                        padding: '6px 0',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 500,
                        transition: 'background 0.3s'
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.85)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                    >
                        {uploading ? 'Đang tải...' : 'Tải ảnh'}
                    </div>
                </Upload>
            )}
        </div>
    );
};

const TemplateTieuChuan = ({ data, editing, onChange }: { data: CvFormValues; editing: boolean; onChange: CvRendererProps['onChange'] }) => {
    return (
        <div style={{
            width: 800,
            minHeight: 1120,
            background: '#ffffff',
            borderRadius: 16,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            border: '1px solid #f0f0f0'
        }}>
            <div style={{ display: 'flex' }}>
                <div style={{
                    width: 300,
                    background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    padding: 32,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20
                }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                        <PhotoBlock src={data.photoUrl} editing={editing} onUpload={(b64) => onChange({ photoUrl: b64 })} size={140} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>Họ và tên</div>
                        <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.3, marginBottom: 4, textAlign: 'center' }}>
                            {editing ? (
                                <FieldInput value={data.fullName} placeholder="Họ và tên" onChange={(v) => onChange({ fullName: v })} />
                            ) : (
                                <FieldText value={data.fullName} placeholder="Họ và tên" style={{ color: '#fff' }} />
                            )}
                        </div>
                    </div>
                    <div style={{ fontSize: 14, display: 'grid', gap: 14 }}>
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 8 }}>
                            <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</div>
                            {editing ? <FieldInput value={data.email} placeholder="email@example.com" onChange={(v) => onChange({ email: v })} /> : <FieldText value={data.email} placeholder="email@example.com" style={{ color: '#fff' }} />}
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 8 }}>
                            <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Số điện thoại</div>
                            {editing ? <FieldInput value={data.phone} placeholder="0123 456 789" onChange={(v) => onChange({ phone: v })} /> : <FieldText value={data.phone} placeholder="0123 456 789" style={{ color: '#fff' }} />}
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 8 }}>
                            <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Địa chỉ</div>
                            {editing ? <FieldInput value={data.address} placeholder="Thành phố Hồ Chí Minh" onChange={(v) => onChange({ address: v })} /> : <FieldText value={data.address} placeholder="Thành phố Hồ Chí Minh" style={{ color: '#fff' }} />}
                        </div>
                    </div>
                    <div style={{ height: 8 }} />
                    <div>
                        <div style={{ fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12, fontSize: 15 }}>Kỹ năng</div>
                        {editing ? (
                            <FieldInput multiline rows={6} value={data.skills} placeholder="• React.js & Node.js&#10;• Giao tiếp tốt&#10;• Làm việc nhóm" onChange={(v) => onChange({ skills: v })} />
                        ) : (
                            <FieldText value={data.skills} placeholder={"• React.js & Node.js\n• Giao tiếp tốt\n• Làm việc nhóm"} style={{ color: '#fff' }} />
                        )}
                    </div>
                </div>
                <div style={{ flex: 1, padding: 40 }}>
                    <div>
                        <div style={{ fontWeight: 800, color: '#1e88e5', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, fontSize: 16 }}>Mục tiêu nghề nghiệp</div>
                        {editing ? <FieldInput multiline rows={4} value={data.objective} placeholder="Trở thành một developer fullstack xuất sắc..." onChange={(v) => onChange({ objective: v })} /> : <FieldText value={data.objective} placeholder="Trở thành một developer fullstack xuất sắc..." />}
                    </div>
                    <Divider style={{ margin: '24px 0', borderColor: '#e8e8e8' }} />
                    <div>
                        <div style={{ fontWeight: 800, color: '#1e88e5', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, fontSize: 16 }}>Kinh nghiệm làm việc</div>
                        {editing ? <FieldInput multiline rows={10} value={data.experience} placeholder={"Frontend Developer - ABC Company (2022-2024)\n• Phát triển giao diện người dùng\n• Tối ưu hiệu suất ứng dụng"} onChange={(v) => onChange({ experience: v })} /> : <FieldText value={data.experience} placeholder="Frontend Developer - ABC Company (2022-2024)" />}
                    </div>
                    <Divider style={{ margin: '24px 0', borderColor: '#e8e8e8' }} />
                    <div>
                        <div style={{ fontWeight: 800, color: '#1e88e5', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, fontSize: 16 }}>Học vấn</div>
                        {editing ? <FieldInput multiline rows={6} value={data.education} placeholder={"Đại học Bách Khoa - Công nghệ thông tin (2018-2022)\n• GPA: 3.5/4.0"} onChange={(v) => onChange({ education: v })} /> : <FieldText value={data.education} placeholder="Đại học Bách Khoa - Công nghệ thông tin" />}
                    </div>
                </div>
            </div>
        </div>
    );
};

const TemplateThanhLich = ({ data, editing, onChange }: { data: CvFormValues; editing: boolean; onChange: CvRendererProps['onChange'] }) => {
    return (
        <div style={{
            width: 800,
            minHeight: 1120,
            background: '#ffffff',
            borderRadius: 16,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            border: '1px solid #f0f0f0'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                color: '#fff',
                padding: '32px 40px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                    <PhotoBlock src={data.photoUrl} editing={editing} onUpload={(b64) => onChange({ photoUrl: b64 })} size={110} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Họ và tên</div>
                        <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>
                            {editing ? <FieldInput value={data.fullName} placeholder="Họ và tên" onChange={(v) => onChange({ fullName: v })} /> : <FieldText value={data.fullName} placeholder="Họ và tên" style={{ color: '#fff' }} />}
                        </div>
                        <div style={{ marginTop: 12, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                            <div style={{ minWidth: 220 }}>
                                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</div>
                                {editing ? <FieldInput value={data.email} placeholder="email@example.com" onChange={(v) => onChange({ email: v })} /> : <FieldText value={data.email} placeholder="email@example.com" style={{ color: '#fff' }} />}
                            </div>
                            <div style={{ minWidth: 180 }}>
                                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Số điện thoại</div>
                                {editing ? <FieldInput value={data.phone} placeholder="0123 456 789" onChange={(v) => onChange({ phone: v })} /> : <FieldText value={data.phone} placeholder="0123 456 789" style={{ color: '#fff' }} />}
                            </div>
                            <div style={{ minWidth: 260, flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Địa chỉ</div>
                                {editing ? <FieldInput value={data.address} placeholder="Thành phố HCM" onChange={(v) => onChange({ address: v })} /> : <FieldText value={data.address} placeholder="Thành phố HCM" style={{ color: '#fff' }} />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ padding: '32px 40px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
                    <div>
                        <div style={{ fontWeight: 800, color: '#1565c0', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, fontSize: 16 }}>Mục tiêu</div>
                        {editing ? <FieldInput multiline rows={8} value={data.objective} placeholder="Mục tiêu nghề nghiệp..." onChange={(v) => onChange({ objective: v })} /> : <FieldText value={data.objective} placeholder="Mục tiêu nghề nghiệp..." />}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, color: '#1565c0', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, fontSize: 16 }}>Kỹ năng</div>
                        {editing ? <FieldInput multiline rows={8} value={data.skills} placeholder="• React & Node.js&#10;• Giao tiếp" onChange={(v) => onChange({ skills: v })} /> : <FieldText value={data.skills} placeholder={"• React & Node.js\n• Giao tiếp"} />}
                    </div>
                </div>
                <Divider style={{ margin: '24px 0' }} />
                <div>
                    <div style={{ fontWeight: 800, color: '#1565c0', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, fontSize: 16 }}>Kinh nghiệm</div>
                    {editing ? <FieldInput multiline rows={12} value={data.experience} placeholder="Kinh nghiệm làm việc..." onChange={(v) => onChange({ experience: v })} /> : <FieldText value={data.experience} placeholder="Kinh nghiệm làm việc..." />}
                </div>
                <Divider style={{ margin: '24px 0' }} />
                <div>
                    <div style={{ fontWeight: 800, color: '#1565c0', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, fontSize: 16 }}>Học vấn</div>
                    {editing ? <FieldInput multiline rows={8} value={data.education} placeholder="Học vấn..." onChange={(v) => onChange({ education: v })} /> : <FieldText value={data.education} placeholder="Học vấn..." />}
                </div>
            </div>
        </div>
    );
};

const TemplateHienDai = ({ data, editing, onChange }: { data: CvFormValues; editing: boolean; onChange: CvRendererProps['onChange'] }) => {
    return (
        <div style={{
            width: 800,
            minHeight: 1120,
            background: '#ffffff',
            borderRadius: 16,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            border: '1px solid #f0f0f0'
        }}>
            <div style={{ display: 'flex' }}>
                <div style={{ width: 16, background: 'linear-gradient(180deg, #1e88e5, #1565c0)' }} />
                <div style={{ flex: 1, padding: 36 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 28 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5, color: '#374151' }}>Họ và tên</div>
                            <div style={{ fontSize: 34, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
                                {editing ? <FieldInput value={data.fullName} placeholder="Họ và tên" onChange={(v) => onChange({ fullName: v })} /> : <FieldText value={data.fullName} placeholder="Họ và tên" />}
                            </div>
                            <div style={{ marginTop: 12, display: 'flex', gap: 20, flexWrap: 'wrap', color: '#374151' }}>
                                <div style={{ minWidth: 220 }}>
                                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Email</div>
                                    {editing ? <FieldInput value={data.email} placeholder="email@example.com" onChange={(v) => onChange({ email: v })} /> : <FieldText value={data.email} placeholder="email@example.com" />}
                                </div>
                                <div style={{ minWidth: 160 }}>
                                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>SĐT</div>
                                    {editing ? <FieldInput value={data.phone} placeholder="0123 456 789" onChange={(v) => onChange({ phone: v })} /> : <FieldText value={data.phone} placeholder="0123 456 789" />}
                                </div>
                                <div style={{ minWidth: 240, flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Địa chỉ</div>
                                    {editing ? <FieldInput value={data.address} placeholder="Thành phố HCM" onChange={(v) => onChange({ address: v })} /> : <FieldText value={data.address} placeholder="Thành phố HCM" />}
                                </div>
                            </div>
                        </div>
                        <div style={{ minWidth: 120 }}>
                            <PhotoBlock src={data.photoUrl} editing={editing} onUpload={(b64) => onChange({ photoUrl: b64 })} size={120} />
                        </div>
                    </div>
                    <Divider style={{ margin: '24px 0' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
                        <div>
                            <div style={{ fontWeight: 800, color: '#1e88e5', letterSpacing: 0.8, marginBottom: 12, textTransform: 'uppercase', fontSize: 16 }}>Mục tiêu</div>
                            {editing ? <FieldInput multiline rows={8} value={data.objective} placeholder="Mục tiêu..." onChange={(v) => onChange({ objective: v })} /> : <FieldText value={data.objective} placeholder="Mục tiêu..." />}
                            <Divider style={{ margin: '24px 0' }} />
                            <div style={{ fontWeight: 800, color: '#1e88e5', letterSpacing: 0.8, marginBottom: 12, textTransform: 'uppercase', fontSize: 16 }}>Kỹ năng</div>
                            {editing ? <FieldInput multiline rows={10} value={data.skills} placeholder="• Kỹ năng 1\n• Kỹ năng 2" onChange={(v) => onChange({ skills: v })} /> : <FieldText value={data.skills} placeholder={'• Kỹ năng 1\n• Kỹ năng 2'} />}
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, color: '#1e88e5', letterSpacing: 0.8, marginBottom: 12, textTransform: 'uppercase', fontSize: 16 }}>Kinh nghiệm</div>
                            {editing ? <FieldInput multiline rows={12} value={data.experience} placeholder="Kinh nghiệm..." onChange={(v) => onChange({ experience: v })} /> : <FieldText value={data.experience} placeholder="Kinh nghiệm..." />}
                            <Divider style={{ margin: '24px 0' }} />
                            <div style={{ fontWeight: 800, color: '#1e88e5', letterSpacing: 0.8, marginBottom: 12, textTransform: 'uppercase', fontSize: 16 }}>Học vấn</div>
                            {editing ? <FieldInput multiline rows={8} value={data.education} placeholder="Học vấn..." onChange={(v) => onChange({ education: v })} /> : <FieldText value={data.education} placeholder="Học vấn..." />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CvTemplateRenderer = ({ template, data, editing, onChange }: CvRendererProps) => {
    if (template === 'Tiêu chuẩn') return <TemplateTieuChuan data={data} editing={editing} onChange={onChange} />;
    if (template === 'Thanh Lịch') return <TemplateThanhLich data={data} editing={editing} onChange={onChange} />;
    if (template === 'Hiện đại') return <TemplateHienDai data={data} editing={editing} onChange={onChange} />;
    return <TemplateTieuChuan data={data} editing={editing} onChange={onChange} />;
};

const PageListCV = () => {
    const [selectedCV, setSelectedCV] = useState<CvData | null>(null);
    const [formValues, setFormValues] = useState<CvFormValues>({});
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    const handleSubmit = async () => {
        if (!selectedCV) return;

        // Validate required fields
        if (!formValues.fullName?.trim()) {
            message.warning('Vui lòng nhập họ tên!');
            return;
        }
        if (!formValues.email?.trim()) {
            message.warning('Vui lòng nhập email!');
            return;
        }

        const data = {
            fullName: formValues.fullName || '',
            email: formValues.email || '',
            phone: formValues.phone || '',
            address: formValues.address || '',
            objective: formValues.objective || '',
            experience: formValues.experience || '',
            education: formValues.education || '',
            skills: formValues.skills || '',
            photoUrl: formValues.photoUrl || '',
            cvTemplate: selectedCV?.title,
        };

        try {
            setSaving(true);

            // Gọi API từ service
            const res = await callSubmitCv(data);

            if (res && res.data) {
                message.success("CV đã được lưu thành công!");
                setIsEditing(false);

                // Optional: Lưu ID CV vừa tạo để có thể update sau
                // setCvId(res.data.id);
            }
        } catch (err: any) {
            console.error('Error saving CV:', err);
            const errorMsg = err?.response?.data?.message || "Đã có lỗi xảy ra khi lưu CV. Vui lòng thử lại!";
            message.error(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const cvTemplates = [
        {
            title: 'Tiêu chuẩn',
            description: 'Thiết kế chuyên nghiệp với thanh bên màu gradient, phù hợp với mọi ngành nghề'
        },
        {
            title: 'Thanh Lịch',
            description: 'Phong cách tối giản và tinh tế, tạo ấn tượng mạnh mẽ với nhà tuyển dụng'
        },
        {
            title: 'Hiện đại',
            description: 'Bố cục cân đối và hiện đại với điểm nhấn màu xanh, dễ đọc và thu hút'
        }
    ];

    return (
        <div className={styles["container"]} style={{ marginTop: 20 }}>
            <Breadcrumb
                items={[
                    { title: <Link to={'/'}>Trang chủ</Link> },
                    { title: 'Tạo CV' }
                ]}
                style={{ marginBottom: 24 }}
            />

            {/* Hero Section */}
            <div style={{
                background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
                borderRadius: 20,
                padding: '48px 40px',
                marginBottom: 48,
                color: '#fff',
                boxShadow: '0 20px 40px rgba(30, 136, 229, 0.35)'
            }}>
                <h1 style={{
                    fontSize: 48,
                    margin: '0 0 16px',
                    lineHeight: 1.2,
                    fontWeight: 800,
                    color: '#fff'
                }}>
                    Mẫu CV xin việc tiếng Việt chuẩn 2025
                </h1>
                <p style={{
                    fontSize: 18,
                    maxWidth: 800,
                    margin: 0,
                    lineHeight: 1.6,
                    opacity: 0.95
                }}>
                    Tuyển chọn các mẫu CV chuyên nghiệp, hiện đại và đa dạng phong cách.
                    Giúp bạn tạo dấu ấn cá nhân và kết nối mạnh mẽ hơn với nhà tuyển dụng.
                </p>
            </div>

            {/* CV Templates Grid */}
            <div style={{ marginBottom: 72 }}>
                <h2 style={{
                    fontSize: 28,
                    fontWeight: 700,
                    marginBottom: 24,
                    color: '#1a1a1a'
                }}>
                    Chọn mẫu CV phù hợp với bạn
                </h2>
                <Row gutter={[24, 24]}>
                    {cvTemplates.map((template) => (
                        <Col xs={24} sm={12} lg={8} key={template.title}>
                            <CvCard
                                title={template.title}
                                description={template.description}
                                onSelect={(cv) => {
                                    setSelectedCV(cv);
                                    setIsEditing(true);
                                    setFormValues({});
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            />
                        </Col>
                    ))}
                </Row>
            </div>

            {/* CV Editor */}
            {selectedCV && (
                <Card
                    title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space>
                                {isEditing ? <EditOutlined style={{ color: '#667eea' }} /> : <EyeOutlined style={{ color: '#667eea' }} />}
                                <span style={{ fontSize: 20, fontWeight: 700 }}>
                                    {isEditing ? `Chỉnh sửa CV - Mẫu "${selectedCV.title}"` : `Xem trước CV - Mẫu "${selectedCV.title}"`}
                                </span>
                            </Space>
                            <Button
                                type="text"
                                icon={<CloseOutlined />}
                                onClick={() => {
                                    setSelectedCV(null);
                                    setFormValues({});
                                    setIsEditing(false);
                                }}
                                style={{ color: '#999' }}
                            />
                        </div>
                    }
                    style={{
                        marginBottom: 48,
                        borderRadius: 16,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                        border: '1px solid #f0f0f0'
                    }}
                    bodyStyle={{ padding: '32px' }}
                >
                    {isEditing && (
                        <div style={{
                            background: 'linear-gradient(135deg, #e0f2fe 0%, #ddd6fe 100%)',
                            padding: 16,
                            borderRadius: 12,
                            marginBottom: 24,
                            border: '1px solid #bfdbfe'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                <ThunderboltOutlined style={{ color: '#667eea', fontSize: 20, marginTop: 2 }} />
                                <div>
                                    <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                                        Hướng dẫn nhanh:
                                    </div>
                                    <div style={{ color: '#475569', fontSize: 14, lineHeight: 1.6 }}>
                                        Click vào từng trường để nhập thông tin. Bạn có thể tải ảnh đại diện bằng cách click vào ảnh.
                                        Sau khi hoàn tất, nhấn "Lưu CV" để lưu lại hoặc "Xem trước" để kiểm tra.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <Row gutter={[24, 24]}>
                        <Col xs={24}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'flex-start',
                                minHeight: 600
                            }}>
                                <div style={{
                                    transform: 'scale(0.95)',
                                    transformOrigin: 'top center'
                                }}>
                                    <CvTemplateRenderer
                                        template={selectedCV.title}
                                        data={formValues}
                                        editing={isEditing}
                                        onChange={(patch) => setFormValues((prev: CvFormValues) => ({ ...prev, ...patch }))}
                                    />
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: 12,
                                marginTop: 32,
                                justifyContent: 'center',
                                flexWrap: 'wrap'
                            }}>
                                <Button
                                    size="large"
                                    onClick={() => {
                                        setSelectedCV(null);
                                        setFormValues({});
                                        setIsEditing(false);
                                    }}
                                    style={{
                                        borderRadius: 8,
                                        height: 44,
                                        padding: '0 24px',
                                        fontWeight: 600
                                    }}
                                >
                                    Hủy bỏ
                                </Button>
                                {isEditing ? (
                                    <>
                                        <Button
                                            size="large"
                                            icon={<EyeOutlined />}
                                            onClick={() => setIsEditing(false)}
                                            style={{
                                                borderRadius: 8,
                                                height: 44,
                                                padding: '0 24px',
                                                fontWeight: 600
                                            }}
                                        >
                                            Xem trước
                                        </Button>
                                        <Button
                                            type="primary"
                                            size="large"
                                            icon={<SaveOutlined />}
                                            loading={saving}
                                            onClick={handleSubmit}
                                            style={{
                                                background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
                                                border: 'none',
                                                borderRadius: 8,
                                                height: 44,
                                                padding: '0 24px',
                                                fontWeight: 600,
                                                boxShadow: '0 4px 12px rgba(30, 136, 229, 0.35)'
                                            }}
                                        >
                                            Lưu CV
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<EditOutlined />}
                                        onClick={() => setIsEditing(true)}
                                        style={{
                                            background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
                                            border: 'none',
                                            borderRadius: 8,
                                            height: 44,
                                            padding: '0 24px',
                                            fontWeight: 600,
                                            boxShadow: '0 4px 12px rgba(30, 136, 229, 0.35)'
                                        }}
                                    >
                                        Chỉnh sửa
                                    </Button>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Card>
            )}

            {/* Information Cards */}
            <div style={{ marginBottom: 48 }}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={12}>
                        <Card
                            style={{
                                borderRadius: 16,
                                height: '100%',
                                border: '1px solid #f0f0f0',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                            }}
                            bodyStyle={{ padding: 28 }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <ThunderboltOutlined style={{ color: '#fff', fontSize: 24 }} />
                                </div>
                                <span style={{ fontWeight: 700, fontSize: 20, color: '#1a1a1a' }}>
                                    Tạo CV chỉ với 3 bước
                                </span>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: 20, color: '#4d4d4d', lineHeight: 1.8 }}>
                                <li style={{ marginBottom: 12 }}>
                                    <strong>Bước 1:</strong> Chọn mẫu CV miễn phí phù hợp với phong cách và ngành nghề của bạn
                                </li>
                                <li style={{ marginBottom: 12 }}>
                                    <strong>Bước 2:</strong> Nhập thông tin cá nhân, kinh nghiệm làm việc, kỹ năng và học vấn vào mẫu đã chọn
                                </li>
                                <li>
                                    <strong>Bước 3:</strong> Xem trước, chỉnh sửa và lưu CV của bạn. Bạn có thể tải về hoặc gửi trực tiếp cho nhà tuyển dụng
                                </li>
                            </ul>
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card
                            style={{
                                borderRadius: 16,
                                height: '100%',
                                border: '1px solid #f0f0f0',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                            }}
                            bodyStyle={{ padding: 28 }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <CheckCircleOutlined style={{ color: '#fff', fontSize: 24 }} />
                                </div>
                                <span style={{ fontWeight: 700, fontSize: 20, color: '#1a1a1a' }}>
                                    Lợi ích khi sử dụng
                                </span>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: 20, color: '#4d4d4d', lineHeight: 1.8 }}>
                                <li style={{ marginBottom: 12 }}>
                                    <strong>Đa dạng mẫu CV:</strong> Nhiều thiết kế đẹp mắt, chuyên nghiệp và miễn phí 100%
                                </li>
                                <li style={{ marginBottom: 12 }}>
                                    <strong>Dễ dàng chỉnh sửa:</strong> Giao diện trực quan, tạo CV nhanh chỉ trong 5 phút
                                </li>
                                <li>
                                    <strong>ATS Friendly:</strong> Các mẫu CV được tối ưu để vượt qua hệ thống lọc CV tự động
                                </li>
                            </ul>
                        </Card>
                    </Col>
                </Row>
            </div>

            <Divider style={{ margin: '48px 0' }} />
        </div>
    );
}

export default PageListCV;