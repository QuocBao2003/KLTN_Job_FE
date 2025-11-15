import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, Plus, Edit2, Trash2, Eye, Download, Calendar, Mail, Phone, MapPin, Target, X, Camera, FileSpreadsheet } from 'lucide-react';
import { callFetchCvByUser, callFetchCvById, callDeleteCv, callUpdateCv } from 'config/api';
import { ICv } from '@/types/backend';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

// Component hiển thị text
const FieldText = React.memo(({ value, placeholder, style }: { value?: string; placeholder?: string; style?: any }) => (
  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#2c3e50', lineHeight: 1.6, ...style }}>
    {value || <span style={{ color: '#95a5a6', fontStyle: 'italic' }}>{placeholder || ''}</span>}
  </div>
));
FieldText.displayName = 'FieldText';

// Component input - FIXED
const FieldInput = React.memo(({
  value,
  placeholder,
  onChange,
  multiline,
  rows
}: {
  value?: string;
  placeholder?: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
}) => {
  const baseStyle = {
    fontSize: 14,
    lineHeight: 1.6,
    background: 'transparent',
    color: 'inherit',
  };

  if (multiline) {
    return (
      <textarea
        value={value || ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={rows || 3}
        className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
        style={baseStyle}
      />
    );
  }

  return (
    <input
      type="text"
      value={value || ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      style={baseStyle}
    />
  );
});
FieldInput.displayName = 'FieldInput';

// Component render CV
const CvTemplateRenderer = React.memo(({
  cv,
  editing,
  onChange,
}: {
  cv: ICv;
  editing: boolean;
  onChange: (field: string, value: string) => void;
}) => {
  const template = cv.cvTemplate || 'Tiêu chuẩn';

  // Template Tiêu Chuẩn
  if (template === 'Tiêu chuẩn') {
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
              <div style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                background: cv.photoUrl ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '4px solid #fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {cv.photoUrl ? (
                  <img src={cv.photoUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Camera size={48} color="#fff" />
                )}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>Họ và tên</div>
              <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.3, marginBottom: 4, textAlign: 'center' }}>
                {editing ? (
                  <FieldInput value={cv.fullName} placeholder="Họ và tên" onChange={(v) => onChange('fullName', v)} />
                ) : (
                  <FieldText value={cv.fullName} placeholder="Họ và tên" style={{ color: '#fff' }} />
                )}
              </div>
            </div>
            <div style={{ fontSize: 14, display: 'grid', gap: 14 }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</div>
                {editing ? (
                  <FieldInput value={cv.email} placeholder="email@example.com" onChange={(v) => onChange('email', v)} />
                ) : (
                  <FieldText value={cv.email} placeholder="email@example.com" style={{ color: '#fff' }} />
                )}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Số điện thoại</div>
                {editing ? (
                  <FieldInput value={cv.phone} placeholder="0123 456 789" onChange={(v) => onChange('phone', v)} />
                ) : (
                  <FieldText value={cv.phone} placeholder="0123 456 789" style={{ color: '#fff' }} />
                )}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Địa chỉ</div>
                {editing ? (
                  <FieldInput value={cv.address} placeholder="Thành phố Hồ Chí Minh" onChange={(v) => onChange('address', v)} />
                ) : (
                  <FieldText value={cv.address} placeholder="Thành phố Hồ Chí Minh" style={{ color: '#fff' }} />
                )}
              </div>
            </div>
            <div style={{ height: 8 }} />
            <div>
              <div style={{ fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12, fontSize: 15 }}>Kỹ năng</div>
              {editing ? (
                <FieldInput multiline rows={6} value={cv.skills} placeholder="• React.js & Node.js&#10;• Giao tiếp tốt&#10;• Làm việc nhóm" onChange={(v) => onChange('skills', v)} />
              ) : (
                <FieldText value={cv.skills} placeholder={"• React.js & Node.js\n• Giao tiếp tốt\n• Làm việc nhóm"} style={{ color: '#fff' }} />
              )}
            </div>
          </div>
          <div style={{ flex: 1, padding: 40 }}>
            <div>
              <div style={{ fontWeight: 800, color: '#1e88e5', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, fontSize: 16 }}>Mục tiêu nghề nghiệp</div>
              {editing ? (
                <FieldInput multiline rows={4} value={cv.objective} placeholder="Trở thành một developer fullstack xuất sắc..." onChange={(v) => onChange('objective', v)} />
              ) : (
                <FieldText value={cv.objective} placeholder="Trở thành một developer fullstack xuất sắc..." />
              )}
            </div>
            <div style={{ margin: '24px 0', borderBottom: '1px solid #e8e8e8' }} />
            <div>
              <div style={{ fontWeight: 800, color: '#1e88e5', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, fontSize: 16 }}>Kinh nghiệm làm việc</div>
              {editing ? (
                <FieldInput multiline rows={10} value={cv.experience} placeholder={"Frontend Developer - ABC Company (2022-2024)\n• Phát triển giao diện người dùng\n• Tối ưu hiệu suất ứng dụng"} onChange={(v) => onChange('experience', v)} />
              ) : (
                <FieldText value={cv.experience} placeholder="Frontend Developer - ABC Company (2022-2024)" />
              )}
            </div>
            <div style={{ margin: '24px 0', borderBottom: '1px solid #e8e8e8' }} />
            <div>
              <div style={{ fontWeight: 800, color: '#1e88e5', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, fontSize: 16 }}>Học vấn</div>
              {editing ? (
                <FieldInput multiline rows={6} value={cv.education} placeholder={"Đại học Bách Khoa - Công nghệ thông tin (2018-2022)\n• GPA: 3.5/4.0"} onChange={(v) => onChange('education', v)} />
              ) : (
                <FieldText value={cv.education} placeholder="Đại học Bách Khoa - Công nghệ thông tin" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Template Thanh Lịch
  if (template === 'Thanh Lịch') {
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
            <div style={{
              width: 110,
              height: 110,
              borderRadius: '50%',
              background: cv.photoUrl ? 'transparent' : 'rgba(255,255,255,0.2)',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '4px solid #fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {cv.photoUrl ? (
                <img src={cv.photoUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Camera size={40} color="#fff" />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Họ và tên</div>
              <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>
                {editing ? (
                  <FieldInput value={cv.fullName} placeholder="Họ và tên" onChange={(v) => onChange('fullName', v)} />
                ) : (
                  <FieldText value={cv.fullName} placeholder="Họ và tên" style={{ color: '#fff' }} />
                )}
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 220 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</div>
                  {editing ? (
                    <FieldInput value={cv.email} placeholder="email@example.com" onChange={(v) => onChange('email', v)} />
                  ) : (
                    <FieldText value={cv.email} placeholder="email@example.com" style={{ color: '#fff' }} />
                  )}
                </div>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Số điện thoại</div>
                  {editing ? (
                    <FieldInput value={cv.phone} placeholder="0123 456 789" onChange={(v) => onChange('phone', v)} />
                  ) : (
                    <FieldText value={cv.phone} placeholder="0123 456 789" style={{ color: '#fff' }} />
                  )}
                </div>
                <div style={{ minWidth: 260, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Địa chỉ</div>
                  {editing ? (
                    <FieldInput value={cv.address} placeholder="Thành phố HCM" onChange={(v) => onChange('address', v)} />
                  ) : (
                    <FieldText value={cv.address} placeholder="Thành phố HCM" style={{ color: '#fff' }} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '32px 40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
            <div>
              <div style={{ fontWeight: 800, color: '#1565c0', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, fontSize: 16 }}>Mục tiêu</div>
              {editing ? (
                <FieldInput multiline rows={8} value={cv.objective} placeholder="Mục tiêu nghề nghiệp..." onChange={(v) => onChange('objective', v)} />
              ) : (
                <FieldText value={cv.objective} placeholder="Mục tiêu nghề nghiệp..." />
              )}
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#1565c0', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, fontSize: 16 }}>Kỹ năng</div>
              {editing ? (
                <FieldInput multiline rows={8} value={cv.skills} placeholder="• React & Node.js&#10;• Giao tiếp" onChange={(v) => onChange('skills', v)} />
              ) : (
                <FieldText value={cv.skills} placeholder={"• React & Node.js\n• Giao tiếp"} />
              )}
            </div>
          </div>
          <div style={{ margin: '24px 0', borderBottom: '1px solid #e8e8e8' }} />
          <div>
            <div style={{ fontWeight: 800, color: '#1565c0', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, fontSize: 16 }}>Kinh nghiệm</div>
            {editing ? (
              <FieldInput multiline rows={12} value={cv.experience} placeholder="Kinh nghiệm làm việc..." onChange={(v) => onChange('experience', v)} />
            ) : (
              <FieldText value={cv.experience} placeholder="Kinh nghiệm làm việc..." />
            )}
          </div>
          <div style={{ margin: '24px 0', borderBottom: '1px solid #e8e8e8' }} />
          <div>
            <div style={{ fontWeight: 800, color: '#1565c0', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, fontSize: 16 }}>Học vấn</div>
            {editing ? (
              <FieldInput multiline rows={8} value={cv.education} placeholder="Học vấn..." onChange={(v) => onChange('education', v)} />
            ) : (
              <FieldText value={cv.education} placeholder="Học vấn..." />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (template === 'Upload CV' || (cv.skills && cv.skills.includes('[CV_FILE_URL]'))) {
    // Extract file URL from skills field
    const fileUrlMatch = cv.skills?.match(/\[CV_FILE_URL\](.*?)\[\/CV_FILE_URL\]/);
    const fileUrl = fileUrlMatch ? fileUrlMatch[1] : '';
    const fileName = fileUrl ? fileUrl.split('/').pop() : 'CV file';
    const fileExtension = fileName?.split('.').pop()?.toUpperCase() || 'PDF';
    
    // Construct full URL for image preview
    const imageUrl = fileUrl ? `${import.meta.env.VITE_BACKEND_URL}/images/resume/${fileUrl}` : '';
    
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
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '32px 40px',
          color: '#fff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid #fff'
            }}>
              <FileText size={40} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
                {cv.fullName || 'CV đã upload'}
              </div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>
                {cv.email || 'Không có email'} {cv.phone && `• ${cv.phone}`}
              </div>
            </div>
          </div>
        </div>

        {/* File Info Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          padding: '20px 40px',
          borderBottom: '2px solid #0ea5e9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              background: '#0ea5e9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 14,
              color: '#fff'
            }}>
              {fileExtension}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0c4a6e', marginBottom: 4 }}>
                CV File đã được upload
              </div>
              <div style={{ fontSize: 13, color: '#0369a1' }}>
                {fileName}
              </div>
            </div>
            <div style={{
              padding: '8px 16px',
              background: '#52c41a',
              color: '#fff',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600
            }}>
              ✓ Có file
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div style={{ padding: 40 }}>
          {fileExtension === 'PDF' ? (
            <div style={{
              background: '#f9fafb',
              borderRadius: 12,
              padding: 40,
              textAlign: 'center',
              border: '2px dashed #d1d5db'
            }}>
              <div style={{
                width: 120,
                height: 120,
                margin: '0 auto 24px',
                borderRadius: 16,
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)'
              }}>
                <FileText size={60} color="#fff" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                File PDF CV
              </div>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
                CV của bạn đang được lưu dưới dạng file PDF. <br/>
                Bạn có thể tải xuống để xem chi tiết.
              </div>
              {imageUrl && (
                <a 
                  href={imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '12px 32px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    borderRadius: 8,
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}
                >
                  Xem file PDF
                </a>
              )}
            </div>
          ) : (
            // For image files (if uploaded as image)
            imageUrl && (
              <div style={{
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <img 
                  src={imageUrl} 
                  alt="CV Preview" 
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block'
                  }}
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div style="padding: 60px; text-align: center; background: #f9fafb;">
                          <div style="font-size: 18px; font-weight: 600; color: #ef4444; margin-bottom: 8px;">
                            ⚠️ Không thể hiển thị preview
                          </div>
                          <div style="font-size: 14px; color: #6b7280;">
                            Vui lòng tải file xuống để xem
                          </div>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
            )
          )}

          {/* Additional Info */}
          <div style={{
            marginTop: 32,
            padding: 24,
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderRadius: 12,
            border: '2px solid #fbbf24'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18
              }}>
                ℹ️
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#92400e' }}>
                Lưu ý về CV đã upload
              </div>
            </div>
            <div style={{ fontSize: 14, color: '#78350f', lineHeight: 1.6, paddingLeft: 44 }}>
              • CV này không thể chỉnh sửa trực tiếp trên hệ thống<br/>
              • Để cập nhật, vui lòng upload file CV mới<br/>
              • Bạn có thể sử dụng CV này để ứng tuyển công việc
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Template Hiện Đại (default)
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
                {editing ? (
                  <FieldInput value={cv.fullName} placeholder="Họ và tên" onChange={(v) => onChange('fullName', v)} />
                ) : (
                  <FieldText value={cv.fullName} placeholder="Họ và tên" />
                )}
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 20, flexWrap: 'wrap', color: '#374151' }}>
                <div style={{ minWidth: 220 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Email</div>
                  {editing ? (
                    <FieldInput value={cv.email} placeholder="email@example.com" onChange={(v) => onChange('email', v)} />
                  ) : (
                    <FieldText value={cv.email} placeholder="email@example.com" />
                  )}
                </div>
                <div style={{ minWidth: 160 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>SĐT</div>
                  {editing ? (
                    <FieldInput value={cv.phone} placeholder="0123 456 789" onChange={(v) => onChange('phone', v)} />
                  ) : (
                    <FieldText value={cv.phone} placeholder="0123 456 789" />
                  )}
                </div>
                <div style={{ minWidth: 240, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Địa chỉ</div>
                  {editing ? (
                    <FieldInput value={cv.address} placeholder="Thành phố HCM" onChange={(v) => onChange('address', v)} />
                  ) : (
                    <FieldText value={cv.address} placeholder="Thành phố HCM" />
                  )}
                </div>
              </div>
            </div>
            <div style={{ minWidth: 120 }}>
              <div style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: cv.photoUrl ? 'transparent' : 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '4px solid #fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {cv.photoUrl ? (
                  <img src={cv.photoUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Camera size={40} color="#fff" />
                )}
              </div>
            </div>
          </div>
          <div style={{ margin: '24px 0', borderBottom: '1px solid #e8e8e8' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
            <div>
              <div style={{ fontWeight: 800, color: '#1e88e5', letterSpacing: 0.8, marginBottom: 12, textTransform: 'uppercase', fontSize: 16 }}>Mục tiêu</div>
              {editing ? (
                <FieldInput multiline rows={8} value={cv.objective} placeholder="Mục tiêu..." onChange={(v) => onChange('objective', v)} />
              ) : (
                <FieldText value={cv.objective} placeholder="Mục tiêu..." />
              )}
              <div style={{ margin: '24px 0', borderBottom: '1px solid #e8e8e8' }} />
              <div style={{ fontWeight: 800, color: '#1e88e5', letterSpacing: 0.8, marginBottom: 12, textTransform: 'uppercase', fontSize: 16 }}>Kỹ năng</div>
              {editing ? (
                <FieldInput multiline rows={10} value={cv.skills} placeholder="• Kỹ năng 1\n• Kỹ năng 2" onChange={(v) => onChange('skills', v)} />
              ) : (
                <FieldText value={cv.skills} placeholder={'• Kỹ năng 1\n• Kỹ năng 2'} />
              )}
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#1e88e5', letterSpacing: 0.8, marginBottom: 12, textTransform: 'uppercase', fontSize: 16 }}>Kinh nghiệm</div>
              {editing ? (
                <FieldInput multiline rows={12} value={cv.experience} placeholder="Kinh nghiệm..." onChange={(v) => onChange('experience', v)} />
              ) : (
                <FieldText value={cv.experience} placeholder="Kinh nghiệm..." />
              )}
              <div style={{ margin: '24px 0', borderBottom: '1px solid #e8e8e8' }} />
              <div style={{ fontWeight: 800, color: '#1e88e5', letterSpacing: 0.8, marginBottom: 12, textTransform: 'uppercase', fontSize: 16 }}>Học vấn</div>
              {editing ? (
                <FieldInput multiline rows={8} value={cv.education} placeholder="Học vấn..." onChange={(v) => onChange('education', v)} />
              ) : (
                <FieldText value={cv.education} placeholder="Học vấn..." />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
CvTemplateRenderer.displayName = 'CvTemplateRenderer';

const CvManagement: React.FC = () => {
  const [cvList, setCvList] = useState<ICv[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCv, setSelectedCv] = useState<ICv | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [editingCv, setEditingCv] = useState<ICv | null>(null);

  const cvPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCvList();
  }, []);

  const fetchCvList = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await callFetchCvByUser();
      const cvData = response?.data?.result || [];
      setCvList(cvData);
    } catch (error) {
      console.error('Error fetching CVs:', error);
      setError('Không thể tải danh sách CV. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCv = async (cv: ICv) => {
    try {
      setLoading(true);
      const response = await callFetchCvById(cv.id.toString());
      const cvDetail = response?.data || cv;
      setSelectedCv(cvDetail);
      setIsViewModalOpen(true);
      setIsEditMode(false);
    } catch (error) {
      console.error('Error fetching CV detail:', error);
      setSelectedCv(cv);
      setIsViewModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (updatedCv: ICv) => {
    setCvList((prevList) => {
      const index = prevList.findIndex(cv => cv.id === updatedCv.id);
      if (index !== -1) {
        const newList = [...prevList];
        newList[index] = updatedCv;
        return newList;
      }
      return [updatedCv, ...prevList];
    });

    if (selectedCv?.id === updatedCv.id) {
      setSelectedCv(updatedCv);
    }
  };

  const handleEditCv = async (cv: ICv) => {
    setLoading(true);
    try {
      const response = await callFetchCvById(cv.id.toString());
      const cvDetail = response?.data || cv;
      setSelectedCv(cvDetail);
      setIsViewModalOpen(true);
      setIsEditMode(true);
    } catch (error) {
      console.error(error);
      setSelectedCv(cv);
      setIsViewModalOpen(true);
      setIsEditMode(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCv = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa CV này?')) {
      try {
        setLoading(true);
        await callDeleteCv(id.toString());
        setCvList(cvList.filter((cv: ICv) => cv.id !== id));
        alert('Xóa CV thành công!');
      } catch (error) {
        console.error('Error deleting CV:', error);
        alert('Có lỗi xảy ra khi xóa CV!');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCv) return;

    try {
      setLoading(true);
      await callUpdateCv(editingCv.id.toString(), editingCv);
      handleUpdate(editingCv);
      setSelectedCv(editingCv);

      alert("Cập nhật CV thành công!");
      setIsEditMode(false);

    } catch (error) {
      console.error(error);
      alert("Cập nhật thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCV = async () => {
    if (!cvPreviewRef.current || !selectedCv) return;

    try {
      setIsDownloading(true);
      const fileName = `CV_${selectedCv.fullName.replace(/\s+/g, '_')}.pdf`;

      const canvas = await html2canvas(cvPreviewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(fileName);

      alert('Tải xuống CV thành công!');
    } catch (error) {
      console.error('Lỗi khi tải xuống CV:', error);
      alert('Có lỗi xảy ra khi tải xuống CV. Vui lòng thử lại!');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportExcel = () => {
    if (!selectedCv) return;

    try {
      setIsExportingExcel(true);
      
      // Prepare data for Excel
      const cvData = isEditMode && editingCv ? editingCv : selectedCv;
      
      // Extract TOEIC and IELTS from skills if present
      const skillsText = cvData.skills || '';
      let toeic = '';
      let ielts = '';
      
      const toeicMatch = skillsText.match(/TOEIC:\s*([^\n]+)/i);
      const ieltsMatch = skillsText.match(/IELTS:\s*([^\n]+)/i);
      
      let cleanSkills = skillsText;
      if (toeicMatch) {
        toeic = toeicMatch[1].trim();
        cleanSkills = cleanSkills.replace(/TOEIC:\s*[^\n]+/i, '').trim();
      }
      if (ieltsMatch) {
        ielts = ieltsMatch[1].trim();
        cleanSkills = cleanSkills.replace(/IELTS:\s*[^\n]+/i, '').trim();
      }

      // Split multiline fields into separate rows
      const splitIntoLines = (text: string): string[] => {
        if (!text) return [''];
        return text.split('\n').filter(line => line.trim() !== '');
      };

      const skillsLines = splitIntoLines(cleanSkills);
      const experienceLines = splitIntoLines(cvData.experience || '');
      const educationLines = splitIntoLines(cvData.education || '');
      const objectiveLines = splitIntoLines(cvData.objective || '');
      
      // Find max number of lines to create that many rows
      const maxLines = Math.max(
        skillsLines.length,
        experienceLines.length,
        educationLines.length,
        objectiveLines.length,
        1
      );

      // Create worksheet data with multiple rows
      const worksheetData: any[] = [];
      for (let i = 0; i < maxLines; i++) {
        worksheetData.push({
          'Họ và tên': i === 0 ? (cvData.fullName || '') : '',
          'Email': i === 0 ? (cvData.email || '') : '',
          'Số điện thoại': i === 0 ? (cvData.phone || '') : '',
          'Địa chỉ': i === 0 ? (cvData.address || '') : '',
          'Mục tiêu': objectiveLines[i] || '',
          'Kinh nghiệm': experienceLines[i] || '',
          'Học vấn': educationLines[i] || '',
          'Kỹ năng': skillsLines[i] || '',
          'Ảnh': i === 0 ? (cvData.photoUrl || '') : '',
          'TOEIC': i === 0 ? toeic : '',
          'IELTS': i === 0 ? ielts : ''
        });
      }

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      
      // Set column widths
      const columnWidths = [
        { wch: 15 }, // Họ và tên
        { wch: 25 }, // Email
        { wch: 15 }, // Số điện thoại
        { wch: 30 }, // Địa chỉ
        { wch: 40 }, // Mục tiêu
        { wch: 50 }, // Kinh nghiệm
        { wch: 40 }, // Học vấn
        { wch: 40 }, // Kỹ năng
        { wch: 30 }, // Ảnh
        { wch: 10 }, // TOEIC
        { wch: 10 }  // IELTS
      ];
      worksheet['!cols'] = columnWidths;

      // Set row heights for all data rows
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      if (!worksheet['!rows']) worksheet['!rows'] = [];
      
      // Set row height for header row
      worksheet['!rows'][0] = { hpt: 30 };
      
      // Set row height for all data rows
      for (let R = 1; R <= range.e.r; R++) {
        worksheet['!rows'][R] = { hpt: 25 };
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, 'CV Data');
      
      // Generate Excel file
      const fileName = `CV_${cvData.fullName?.replace(/\s+/g, '_') || 'CV'}_${new Date().getTime()}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      alert('Xuất Excel thành công!');
    } catch (error: any) {
      console.error('Error exporting Excel:', error);
      alert('Có lỗi xảy ra khi xuất Excel!');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN');
    } catch (error) {
      return dateString;
    }
  };

  const filteredCvs = cvList.filter(cv =>
    cv.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cv.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (isEditMode && selectedCv) {
      setEditingCv({ ...selectedCv });
    } else if (!isEditMode) {
      setEditingCv(null);
    }
  }, [isEditMode, selectedCv]);

  const handleChange = useCallback((field: string, value: string) => {
    setEditingCv(prev => {
      if (!prev) return prev;
      // Chỉ update nếu giá trị thực sự thay đổi để tránh re-render không cần thiết
      if (prev[field as keyof ICv] === value) return prev;
      return { ...prev, [field]: value };
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-blue-100 transform hover:scale-[1.01] transition-all duration-300">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg transform hover:rotate-6 transition-transform duration-300">
                <FileText className="text-white" size={36} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Quản lý CV của tôi
                </h1>
                <p className="text-gray-600 mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Quản lý và tạo CV chuyên nghiệp
                </p>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/listCv'}
              className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl flex items-center gap-3 transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
            >
              <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-semibold">Tạo CV mới</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center border border-blue-100">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
            <p className="mt-6 text-gray-600 text-lg">Đang tải danh sách CV...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center border border-blue-100">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Có lỗi xảy ra</h3>
            <p className="text-gray-500 mb-8 text-lg">{error}</p>
            <button
              onClick={fetchCvList}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all"
            >
              Thử lại
            </button>
          </div>
        ) : filteredCvs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center border border-blue-100">
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText size={64} className="text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Chưa có CV nào</h3>
            <p className="text-gray-500 mb-8 text-lg">Hãy tạo CV đầu tiên của bạn để bắt đầu hành trình nghề nghiệp</p>
            <button
              onClick={() => window.location.href = '/listCv'}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl inline-flex items-center gap-3 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all"
            >
              <Plus size={22} />
              <span className="font-semibold">Tạo CV ngay</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCvs.map((cv, index) => (
              <div
                key={cv.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-blue-100 group transform hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-4 ring-white/30 group-hover:ring-white/50 transition-all">
                        <FileText size={28} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-xl truncate">{cv.fullName}</h3>
                        <p className="text-blue-100 text-sm flex items-center gap-1 mt-1">
                          <Mail size={14} />
                          <span className="truncate">{cv.email}</span>
                        </p>
                      </div>
                    </div>
                    {cv.cvTemplate && (
                      <div className="mt-3 inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                        Template: {cv.cvTemplate}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm group/item hover:bg-blue-50 p-2 rounded-lg transition-colors">
                      <Phone size={16} className="text-blue-600 flex-shrink-0" />
                      <span className="text-gray-700">{cv.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm group/item hover:bg-blue-50 p-2 rounded-lg transition-colors">
                      <MapPin size={16} className="text-blue-600 flex-shrink-0" />
                      <span className="text-gray-700">{cv.address}</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm group/item hover:bg-blue-50 p-2 rounded-lg transition-colors">
                      <Target size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 line-clamp-2">{cv.objective}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <button
                      onClick={() => handleViewCv(cv)}
                      className="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-600 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all transform hover:scale-105 shadow-sm hover:shadow"
                    >
                      <Eye size={18} />
                      <span className="text-xs font-semibold">Xem</span>
                    </button>
                    <button
                      onClick={() => handleEditCv(cv)}
                      className="bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-600 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all transform hover:scale-105 shadow-sm hover:shadow"
                    >
                      <Edit2 size={18} />
                      <span className="text-xs font-semibold">Sửa</span>
                    </button>
                    <button
                      onClick={() => handleDeleteCv(cv.id)}
                      className="bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-600 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all transform hover:scale-105 shadow-sm hover:shadow"
                    >
                      <Trash2 size={18} />
                      <span className="text-xs font-semibold">Xóa</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>Tạo: {formatDate(cv.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>Cập nhật: {formatDate(cv.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isViewModalOpen && selectedCv && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300"
            onClick={() => {
              setIsViewModalOpen(false);
              setIsEditMode(false);
            }}
          >
            <div
              className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 md:p-8 flex justify-between items-center z-10 shadow-lg">
                <div>
                  <h2 className="text-3xl font-bold mb-1">
                    {isEditMode ? 'Chỉnh sửa CV' : 'Chi tiết CV'}
                  </h2>
                  <p className="text-blue-100">
                    {isEditMode ? 'Cập nhật thông tin CV của bạn' : 'Xem trước CV theo template'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setIsEditMode(false);
                  }}
                  className="text-white hover:bg-white/20 p-3 rounded-xl transition-all hover:rotate-90 transform duration-300"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start'
                }}>
                  <div
                    ref={cvPreviewRef}
                    style={{
                      transform: 'scale(0.85)',
                      transformOrigin: 'top center'
                    }}
                  >
                    <CvTemplateRenderer
                      cv={isEditMode && editingCv ? editingCv : selectedCv}
                      editing={isEditMode}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={`grid gap-4 pt-6 ${isEditMode ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-4'}`}>
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      setIsEditMode(false);
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-xl flex items-center justify-center gap-3 transition-all font-semibold"
                  >
                    Đóng
                  </button>

                  {isEditMode ? (
                    <>
                      <button
                        onClick={() => {
                          setIsEditMode(false);
                        }
                        }
                        className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
                      >
                        <Eye size={22} />
                        <span className="font-semibold">Xem trước</span>
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={loading}
                        className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download size={22} className="group-hover:animate-bounce" />
                        <span className="font-semibold">{loading ? 'Đang lưu...' : 'Lưu CV'}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditMode(true)}
                        className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
                      >
                        <Edit2 size={22} className="group-hover:rotate-12 transition-transform" />
                        <span className="font-semibold">Chỉnh sửa</span>
                      </button>
                      <button
                        onClick={handleDownloadCV}
                        disabled={isDownloading}
                        className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download size={22} className="group-hover:animate-bounce" />
                        <span className="font-semibold">{isDownloading ? 'Đang tải...' : 'Tải PDF'}</span>
                      </button>
                      <button
                        onClick={handleExportExcel}
                        disabled={isExportingExcel}
                        className="group bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FileSpreadsheet size={22} className="group-hover:animate-pulse" />
                        <span className="font-semibold">{isExportingExcel ? 'Đang xuất...' : 'Tải Excel'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CvManagement;