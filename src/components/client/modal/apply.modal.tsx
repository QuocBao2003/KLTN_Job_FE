import { useAppSelector } from "@/redux/hooks";
import { IJob, ICv, IBackendRes, IModelPaginate } from "@/types/backend";
import { ProForm, ProFormText } from "@ant-design/pro-components";
import { Button, Col, ConfigProvider, Divider, Modal, Row, Upload, message, notification, Radio, Empty, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import enUS from 'antd/lib/locale/en_US';
import { UploadOutlined, FileTextOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { callCreateResume, callUploadSingleFile, callFetchCvByUser, callCreateCv, callGetUserById, callUploadExcelCv, callUpdateCv } from "@/config/api";
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

interface IProps {
    isModalOpen: boolean;
    setIsModalOpen: (v: boolean) => void;
    jobDetail: IJob | null;
}

const ApplyModal = (props: IProps) => {
    const { isModalOpen, setIsModalOpen, jobDetail } = props;
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const user = useAppSelector(state => state.account.user);
    const [urlCV, setUrlCV] = useState<string>("");
    const [cvList, setCvList] = useState<ICv[]>([]);
    const [selectedCvId, setSelectedCvId] = useState<string | number | null>(null);
    const [cvSelectionMode, setCvSelectionMode] = useState<'existing' | 'upload' | 'excel'>('existing');
    const [loadingCvList, setLoadingCvList] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadingExcel, setUploadingExcel] = useState<boolean>(false);

    const navigate = useNavigate();

    // Extract file URL from CV skills field (format: [CV_FILE_URL]fileName[/CV_FILE_URL])
    // OR check if CV has template (can be downloaded as PDF)
    const getCvFileUrl = (cv: ICv): string | null => {
        if (cv.url && (cv.url.startsWith('http') || cv.url.startsWith('https'))) {
            return cv.url;
        }
        
        // Check if CV has uploaded file
        if (cv.skills) {
            const match = cv.skills.match(/\[CV_FILE_URL\](.*?)\[\/CV_FILE_URL\]/);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        // Check if CV has template (can be downloaded as PDF)
        const hasTemplate = cv.cvTemplate && 
            (cv.cvTemplate === 'Tiêu chuẩn' || 
             cv.cvTemplate === 'Thanh Lịch' || 
             cv.cvTemplate === 'Hiện Đại' ||
             cv.cvTemplate === 'Hiện đại');
        
        if (hasTemplate) {
            // Return special marker to indicate this CV can be converted to PDF
            return `CV_TEMPLATE_${cv.id}`;
        }
        
        return null;
    };
    
    // Check if CV is from template (not uploaded file)
    const isCvTemplate = (cv: ICv): boolean => {
        const fileUrl = getCvFileUrl(cv);
        return fileUrl ? fileUrl.startsWith('CV_TEMPLATE_') : false;
    };

    // Fetch CV list when modal opens and user is authenticated
    useEffect(() => {
        if (isModalOpen && isAuthenticated) {
            fetchCvList();
        } else if (!isModalOpen) {
            // Reset state when modal closes
            setUrlCV("");
            setSelectedCvId(null);
            setCvSelectionMode('existing');
        }
    }, [isModalOpen, isAuthenticated]);

    const fetchCvList = async () => {
        setLoadingCvList(true);
        try {
            // callFetchCvByUser returns IBackendRes<IModelPaginate<ICv>>
            const res: IBackendRes<IModelPaginate<ICv>> = await callFetchCvByUser();
            console.log('📌 RAW API Response:', res);
            console.log('📌 Response Data:', res?.data);
            
            let cvData: ICv[] = [];
            
            // According to IBackendRes and IModelPaginate structure
            if (res?.data?.result && Array.isArray(res.data.result)) {
                cvData = res.data.result;
                console.log('📌 Structure: IBackendRes<IModelPaginate<ICv>>');
                console.log('📌 Pagination Meta:', res.data.meta);
                console.log('📌 Total CVs:', res.data.meta.total);
            }
            
            console.log('📌 Final CV Data:', cvData);
            console.log('📌 CV Data Length:', cvData.length);
            
            setCvList(cvData);
            
            if (cvData.length > 0) {
                console.log('📌 All CVs:', cvData.map(cv => ({
                    id: cv.id,
                    fullName: cv.fullName,
                    email: cv.email,
                    cvTemplate: cv.cvTemplate,
                    hasFileUrl: !!getCvFileUrl(cv),
                    isTemplate: isCvTemplate(cv),
                    skillsPreview: cv.skills?.substring(0, 100) || 'No skills'
                })));
                
                // Auto-select first CV with file URL if available, otherwise select first CV
                const cvWithFile = cvData.find(cv => getCvFileUrl(cv));
                
                if (cvWithFile) {
                    const isTemplate = isCvTemplate(cvWithFile);
                    console.log('✅ Found CV with file:', {
                        id: cvWithFile.id,
                        fullName: cvWithFile.fullName,
                        cvTemplate: cvWithFile.cvTemplate,
                        isTemplate: isTemplate,
                        fileUrl: getCvFileUrl(cvWithFile)
                    });
                    
                    if (!selectedCvId) {
                        setSelectedCvId(cvWithFile.id);
                        setCvSelectionMode('existing');
                        console.log(`✅ Auto-selected CV ${isTemplate ? 'template' : 'with uploaded file'}, ID:`, cvWithFile.id);
                    }
                } else {
                    console.log('⚠️ No CV with file found. Allowing user to select any CV or upload new one');
                    // Don't auto-select, let user choose
                    // Don't force upload mode - keep existing mode so user can see all CVs
                }
            } else {
                console.log('⚠️ No CVs found in database, switching to upload mode');
                setCvSelectionMode('upload');
            }
        } catch (error: any) {
            console.error('❌ Error fetching CV list:', error);
            console.error('❌ Error response:', error?.response);
            console.error('❌ Error data:', error?.response?.data);
            
            const errorMessage = error?.response?.data?.message || error.message || 'Unknown error';
            message.error('Không thể tải danh sách CV: ' + errorMessage);
            setCvList([]);
            setCvSelectionMode('upload');
        } finally {
            setLoadingCvList(false);
        }
    };

    const handleOkButton = async () => {
        if (!isAuthenticated) {
            setIsModalOpen(false);
            navigate(`/login?callback=${window.location.href}`)
            return;
        }

        let finalUrlCV = "";

        if (cvSelectionMode === 'existing') {
            if (!selectedCvId) {
                message.error("Vui lòng chọn một CV!");
                return;
            }
            const selectedCv = cvList.find(cv => cv.id === selectedCvId);
            console.log('📌 Selected CV:', selectedCv);
            
            if (selectedCv) {
                const fileUrl = getCvFileUrl(selectedCv);

                const isRealUrl = fileUrl && (fileUrl.startsWith('http') || fileUrl.startsWith('https'));

                const isTemplate = isCvTemplate(selectedCv);

                console.log('📌 File URL from selected CV:', fileUrl);
                console.log('📌 Is Template CV:', isTemplate);
                
                if (!fileUrl) {
                    // Show warning and ask user to upload file
                    Modal.confirm({
                        title: '⚠️ CV chưa có file đính kèm',
                        content: (
                            <div>
                                <p>CV "<strong>{selectedCv.fullName}</strong>" chưa có file đính kèm.</p>
                                <p>Bạn có muốn:</p>
                                <ul style={{ marginTop: 8 }}>
                                    <li>Chuyển sang tab "Upload CV mới" để upload file?</li>
                                    <li>Hoặc chọn CV khác có sẵn?</li>
                                </ul>
                            </div>
                        ),
                        okText: 'Chuyển sang Upload',
                        cancelText: 'Chọn CV khác',
                        onOk: () => {
                            setCvSelectionMode('upload');
                            setSelectedCvId(null);
                        },
                        onCancel: () => {
                            // Do nothing, let user select another CV
                        }
                    });
                    return;
                }
                if (isRealUrl) {
                    finalUrlCV = fileUrl;
                    console.log('📌 Using Real Cloud URL:', finalUrlCV);
                } 
                // Nếu không có URL thật mà là Template -> Gửi ID để Backend xử lý (Generate PDF)
                else if (isTemplate) {
                    finalUrlCV = `CV_ID:${selectedCv.id}`;
                    console.log('📌 Using template ID (No URL yet):', finalUrlCV);
                    
                    message.info({
                        content: 'Đang xử lý CV template của bạn...',
                        duration: 2
                    });
                }
                
                // If it's a template CV, we'll use a special format
                // Backend should recognize this and convert to PDF
                if (isTemplate) {
                    // Option 1: Send CV ID for backend to generate PDF
                    finalUrlCV = `CV_ID:${selectedCv.id}`;
                    console.log('📌 Using template CV, sending CV_ID:', finalUrlCV);
                    
                    // Show info message
                    message.info({
                        content: 'Đang xử lý CV template của bạn...',
                        duration: 2
                    });
                } else {
                    // Regular uploaded file
                    finalUrlCV = fileUrl;
                }
            }
        } else if (cvSelectionMode === 'upload') {
            if (!urlCV) {
                message.error("Vui lòng upload CV!");
                return;
            }
            finalUrlCV = urlCV;
        } else if (cvSelectionMode === 'excel') {
            // Excel mode: CV should already be created/updated, find it in cvList
            const excelCv = cvList.find(cv => cv.cvTemplate === 'Tiêu chuẩn' && cv.email === user.email);
            if (!excelCv) {
                message.error("Vui lòng upload file Excel để tạo CV!");
                return;
            }
            // CV from Excel is always a template CV, so use CV_ID format
            finalUrlCV = `CV_ID:${excelCv.id}`;
            console.log('📌 Using Excel CV, sending CV_ID:', finalUrlCV);
            
            // Show info message
            message.info({
                content: 'Đang xử lý CV từ Excel của bạn...',
                duration: 2
            });
        }

        console.log('📌 Final URL CV:', finalUrlCV);

        if (jobDetail && finalUrlCV) {
            try {
                const res = await callCreateResume(finalUrlCV, jobDetail?.id, user.email, user.id);
                console.log('📌 Create Resume Response:', res);
                
                if (res.data) {
                    message.success("Nộp CV thành công!");
                    setIsModalOpen(false);
                    // Reset state
                    setUrlCV("");
                    setSelectedCvId(null);
                    setCvSelectionMode('existing');
                } else {
                    notification.error({
                        message: 'Có lỗi xảy ra',
                        description: res.message
                    });
                }
            } catch (error: any) {
                console.error('❌ Error creating resume:', error);
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: error?.response?.data?.message || "Không thể nộp CV. Vui lòng thử lại!"
                });
            }
        }
    }

    // Parse Excel file and create/update CV
    const parseExcelAndCreateCv = async (file: File) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    
                    if (!jsonData || jsonData.length === 0) {
                        throw new Error('File Excel không có dữ liệu hoặc định dạng không đúng!');
                    }
                    
                    // Get first row as CV data
                    const rowData: any = jsonData[0];
                    
                    // Map Excel columns to CV fields
                    // Expected columns: fullName, email, phone, address, objective, experience, education, skills, photoUrl, toeic, ielts
                    const cvData = {
                        fullName: rowData.fullName || rowData['Họ và tên'] || rowData['Full Name'] || user.name || '',
                        email: rowData.email || rowData['Email'] || user.email || '',
                        phone: rowData.phone || rowData['Số điện thoại'] || rowData['Phone'] || '',
                        address: rowData.address || rowData['Địa chỉ'] || rowData['Address'] || '',
                        objective: rowData.objective || rowData['Mục tiêu'] || rowData['Objective'] || '',
                        experience: rowData.experience || rowData['Kinh nghiệm'] || rowData['Experience'] || '',
                        education: (() => {
                            let educationText = rowData.education || rowData['Học vấn'] || rowData['Education'] || '';
                            // Add TOEIC and IELTS to education if available
                            if (rowData.toeic || rowData['TOEIC']) {
                                educationText += (educationText ? '\n' : '') + `TOEIC: ${rowData.toeic || rowData['TOEIC']}`;
                            }
                            if (rowData.ielts || rowData['IELTS']) {
                                educationText += (educationText ? '\n' : '') + `IELTS: ${rowData.ielts || rowData['IELTS']}`;
                            }
                            return educationText;
                        })(),
                        skills: rowData.skills || rowData['Kỹ năng'] || rowData['Skills'] || '',
                        photoUrl: rowData.photoUrl || rowData['Ảnh'] || rowData['Photo'] || '',
                        cvTemplate: 'Tiêu chuẩn'
                    };
                    
                    console.log('📌 Parsed Excel data:', cvData);
                    
                    // Check if CV already exists (by email)
                    const existingCv = cvList.find(cv => cv.email === cvData.email && cv.cvTemplate === 'Tiêu chuẩn');
                    
                    let createdCv;
                    if (existingCv) {
                        // Update existing CV
                        console.log('📌 Updating existing CV:', existingCv.id);
                        const updateRes = await callUpdateCv(existingCv.id.toString(), cvData);
                        createdCv = updateRes.data;
                        message.success('CV đã được cập nhật từ file Excel!');
                    } else { s
                        // Create new CV
                        console.log('📌 Creating new CV from Excel');
                        const createRes = await callCreateCv(cvData);
                        createdCv = createRes.data;
                        message.success('CV đã được tạo từ file Excel!');
                    }
                    
                    // Refresh CV list
                    await fetchCvList();
                    
                    // Auto-select the created/updated CV
                    if (createdCv?.id) {
                        setSelectedCvId(createdCv.id);
                        setCvSelectionMode('existing');
                    }
                    
                    resolve(createdCv);
                } catch (error: any) {
                    console.error('❌ Error parsing Excel:', error);
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsBinaryString(file);
        });
    };

    const propsUpload: UploadProps = {
        maxCount: 1,
        multiple: false,
        accept: "application/pdf,application/msword, .doc, .docx, .pdf",
        async customRequest({ file, onSuccess, onError }: any) {
            setUploading(true);
            try {
                const res = await callUploadSingleFile(file, "resume");
                console.log('📌 Upload Response:', res);
                
                if (res && res.data) {
                    const fileName = res.data.fileName;
                    setUrlCV(fileName);
                    
                    // Create CV record in database
                    try {
                        // Get user details to fill CV information
                        const userRes = await callGetUserById(user.id);
                        const userData = userRes?.data;
                        
                        // Try to get phone from existing CVs or leave empty
                        const existingCv = cvList.find(cv => cv.email === user.email && cv.phone);
                        
                        const cvData = {
                            fullName: userData?.name || user.name || '',
                            email: user.email || '',
                            phone: existingCv?.phone || '', 
                            address: userData?.address || '',
                            objective: '',
                            experience: '',
                            education: '',
                            skills: `[CV_FILE_URL]${fileName}[/CV_FILE_URL]`,
                            photoUrl: '',
                            cvTemplate: 'Upload CV'
                        };
                        
                        console.log('📌 Creating CV with data:', cvData);
                        const createdCvRes = await callCreateCv(cvData);
                        console.log('📌 Created CV Response:', createdCvRes);
                        
                        // Refresh CV list
                        await fetchCvList();
                        
                        // Auto-select the newly created CV and switch to existing mode
                        if (createdCvRes?.data?.id) {
                            setSelectedCvId(createdCvRes.data.id);
                            setCvSelectionMode('existing');
                        }
                        
                        message.success(`${file.name} đã được upload và lưu vào CV của tôi!`);
                    } catch (cvError) {
                        console.error('❌ Error creating CV record:', cvError);
                        message.warning('File đã được upload nhưng có lỗi khi lưu vào CV của tôi. Bạn vẫn có thể sử dụng CV này để ứng tuyển.');
                    }
                    
                    if (onSuccess) onSuccess('ok');
                } else {
                    setUrlCV("");
                    const error = new Error(res.message || "Upload failed");
                    if (onError) onError({ event: error });
                }
            } catch (error: any) {
                console.error('❌ Upload error:', error);
                setUrlCV("");
                const errorMsg = new Error(error?.response?.data?.message || "Đã có lỗi xảy ra khi upload file.");
                if (onError) onError({ event: errorMsg });
            } finally {
                setUploading(false);
            }
        },
        onChange(info) {
            if (info.file.status === 'done') {
                // Message already shown in customRequest
            } else if (info.file.status === 'error') {
                message.error(info?.file?.error?.event?.message ?? "Đã có lỗi xảy ra khi upload file.")
            }
        },
    };

    const propsUploadExcel: UploadProps = {
        maxCount: 1,
        multiple: false,
        accept: ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel",
        async customRequest({ file, onSuccess, onError }: any) {
            setUploadingExcel(true);
            try {
                await parseExcelAndCreateCv(file);
                if (onSuccess) onSuccess('ok');
            } catch (error: any) {
                console.error('❌ Excel upload error:', error);
                const errorMsg = new Error(error?.message || "Đã có lỗi xảy ra khi xử lý file Excel.");
                if (onError) onError({ event: errorMsg });
                message.error(error?.message || "Đã có lỗi xảy ra khi xử lý file Excel.");
            } finally {
                setUploadingExcel(false);
            }
        },
        onChange(info) {
            if (info.file.status === 'done') {
                // Message already shown in customRequest
            } else if (info.file.status === 'error') {
                message.error(info?.file?.error?.event?.message ?? "Đã có lỗi xảy ra khi xử lý file Excel.")
            }
        },
    };


    return (
        <>
            <Modal title="Ứng Tuyển Job"
                open={isModalOpen}
                onOk={() => handleOkButton()}
                onCancel={() => setIsModalOpen(false)}
                maskClosable={false}
                okText={isAuthenticated ? "Nộp CV" : "Đăng Nhập Nhanh"}
                cancelButtonProps={
                    { style: { display: "none" } }
                }
                destroyOnClose={true}
                width={700}
            >
                <Divider />
                {isAuthenticated ?
                    <div>
                        <ConfigProvider locale={enUS}>
                            <ProForm
                                submitter={{
                                    render: () => <></>
                                }}
                            >
                                <Row gutter={[10, 10]}>
                                    <Col span={24}>
                                        <div>
                                            Bạn đang ứng tuyển công việc <b>{jobDetail?.name} </b>tại  <b>{jobDetail?.company?.name}</b>
                                        </div>
                                    </Col>
                                    <Col span={24}>
                                        <ProFormText
                                            fieldProps={{
                                                type: "email"
                                            }}
                                            label="Email"
                                            name={"email"}
                                            labelAlign="right"
                                            disabled
                                            initialValue={user?.email}
                                        />
                                    </Col>
                                    <Col span={24}>
                                        <Divider />
                                        <div style={{ marginBottom: 16 }}>
                                            <Radio.Group 
                                                value={cvSelectionMode} 
                                                onChange={(e) => {
                                                    setCvSelectionMode(e.target.value);
                                                    if (e.target.value === 'upload' || e.target.value === 'excel') {
                                                        setSelectedCvId(null);
                                                    } else {
                                                        setUrlCV("");
                                                    }
                                                }}
                                                style={{ marginBottom: 16 }}
                                            >
                                                <Radio value="existing">Chọn CV có sẵn ({cvList.filter(cv => getCvFileUrl(cv)).length})</Radio>
                                                <Radio value="upload">Upload CV mới (PDF/DOC)</Radio>
                                                <Radio value="excel">Upload Excel để tạo CV</Radio>
                                            </Radio.Group>
                                        </div>

                                        {cvSelectionMode === 'existing' ? (
                                            <div>
                                                <div style={{ 
                                                    marginBottom: 16, 
                                                    padding: 12,
                                                    background: '#f0f9ff',
                                                    borderRadius: 8,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8
                                                }}>
                                                    <FileTextOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                                                    <span style={{ fontWeight: 600, fontSize: 15, color: '#0c4a6e' }}>
                                                        📁 Tất cả CV của bạn: {cvList.length} CV
                                                    </span>
                                                    <span style={{ 
                                                        marginLeft: 'auto',
                                                        fontSize: 13,
                                                        color: '#52c41a',
                                                        background: '#f6ffed',
                                                        padding: '4px 12px',
                                                        borderRadius: 12,
                                                        fontWeight: 500
                                                    }}>
                                                        ✓ {cvList.filter(cv => getCvFileUrl(cv)).length} có file
                                                    </span>
                                                </div>
                                                
                                                {loadingCvList ? (
                                                    <div style={{ textAlign: 'center', padding: 40 }}>
                                                        <Spin size="large" tip="Đang tải danh sách CV..." />
                                                    </div>
                                                ) : (() => {
                                                    if (cvList.length === 0) {
                                                        return (
                                                            <Empty 
                                                                description={
                                                                    <div>
                                                                        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
                                                                            Bạn chưa có CV nào
                                                                        </div>
                                                                        <div style={{ fontSize: 13, color: '#999' }}>
                                                                            Vui lòng upload CV mới hoặc tạo CV từ template
                                                                        </div>
                                                                    </div>
                                                                } 
                                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                            />
                                                        );
                                                    }
                                                    
                                                    return (
                                                        <div>
                                                            <Radio.Group 
                                                                value={selectedCvId} 
                                                                onChange={(e) => {
                                                                    setSelectedCvId(e.target.value);
                                                                    console.log('📌 User selected CV ID:', e.target.value);
                                                                }}
                                                                style={{ width: '100%' }}
                                                            >
                                                                <div style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 8 }}>
                                                                    {cvList.map((cv, index) => {
                                                                        const fileUrl = getCvFileUrl(cv);
                                                                        const hasFile = !!fileUrl;
                                                                        const isTemplate = isCvTemplate(cv);
                                                                        const fileName = isTemplate 
                                                                            ? `${cv.cvTemplate} Template`
                                                                            : (fileUrl?.split('/').pop() || 'CV file');
                                                                        const isSelected = selectedCvId === cv.id;
                                                                        
                                                                        return (
                                                                            <div 
                                                                                key={cv.id} 
                                                                                style={{ 
                                                                                    marginBottom: 12, 
                                                                                    padding: 16, 
                                                                                    border: isSelected 
                                                                                        ? '2px solid #1890ff' 
                                                                                        : hasFile 
                                                                                            ? '1px solid #d9d9d9'
                                                                                            : '1px dashed #ffa940',
                                                                                    borderRadius: 12,
                                                                                    cursor: 'pointer',
                                                                                    backgroundColor: isSelected 
                                                                                        ? '#e6f7ff' 
                                                                                        : hasFile 
                                                                                            ? '#fff'
                                                                                            : '#fffbe6',
                                                                                    transition: 'all 0.3s',
                                                                                    boxShadow: isSelected ? '0 4px 12px rgba(24, 144, 255, 0.2)' : 'none',
                                                                                    position: 'relative',
                                                                                    opacity: hasFile ? 1 : 0.9
                                                                                }}
                                                                                onClick={() => setSelectedCvId(cv.id)}
                                                                            >
                                                                                {isSelected && (
                                                                                    <div style={{
                                                                                        position: 'absolute',
                                                                                        top: -8,
                                                                                        right: 12,
                                                                                        background: '#52c41a',
                                                                                        color: '#fff',
                                                                                        padding: '4px 12px',
                                                                                        borderRadius: 12,
                                                                                        fontSize: 12,
                                                                                        fontWeight: 600,
                                                                                        zIndex: 1
                                                                                    }}>
                                                                                        ✓ Đã chọn
                                                                                    </div>
                                                                                )}
                                                                                <Radio value={cv.id} style={{ width: '100%' }}>
                                                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingLeft: 8 }}>
                                                                                        <div style={{
                                                                                            width: 56,
                                                                                            height: 56,
                                                                                            borderRadius: 12,
                                                                                            background: hasFile
                                                                                                ? (isSelected 
                                                                                                    ? (isTemplate 
                                                                                                        ? 'linear-gradient(135deg, #9c27b0, #7b1fa2)'  // Purple for template
                                                                                                        : 'linear-gradient(135deg, #1890ff, #0050b3)') 
                                                                                                    : (isTemplate
                                                                                                        ? 'linear-gradient(135deg, #ba68c8, #9c27b0)'
                                                                                                        : 'linear-gradient(135deg, #91d5ff, #40a9ff)'))
                                                                                                : (isSelected
                                                                                                    ? 'linear-gradient(135deg, #faad14, #d48806)'
                                                                                                    : 'linear-gradient(135deg, #ffd666, #faad14)'),
                                                                                            display: 'flex',
                                                                                            alignItems: 'center',
                                                                                            justifyContent: 'center',
                                                                                            flexShrink: 0,
                                                                                            boxShadow: isSelected ? '0 4px 12px rgba(24, 144, 255, 0.3)' : 'none'
                                                                                        }}>
                                                                                            <FileTextOutlined style={{ color: '#fff', fontSize: 28 }} />
                                                                                        </div>
                                                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                                                            <div style={{ 
                                                                                                fontWeight: 600, 
                                                                                                fontSize: 15, 
                                                                                                marginBottom: 6,
                                                                                                color: isSelected ? '#0050b3' : '#262626'
                                                                                            }}>
                                                                                                {cv.fullName || `CV ${index + 1}`}
                                                                                            </div>
                                                                                            <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                                                                                                📧 {cv.email}
                                                                                            </div>
                                                                                            {hasFile ? (
                                                                                                <div style={{ 
                                                                                                    fontSize: 12, 
                                                                                                    background: isTemplate ? '#f9f0ff' : '#f6ffed',
                                                                                                    color: isTemplate ? '#722ed1' : '#389e0d',
                                                                                                    padding: '6px 12px',
                                                                                                    borderRadius: 6,
                                                                                                    display: 'inline-flex',
                                                                                                    alignItems: 'center',
                                                                                                    gap: 6,
                                                                                                    fontWeight: 500
                                                                                                }}>
                                                                                                    <span>{isTemplate ? '📄' : '✓'}</span>
                                                                                                    <span style={{ 
                                                                                                        maxWidth: 200,
                                                                                                        overflow: 'hidden',
                                                                                                        textOverflow: 'ellipsis',
                                                                                                        whiteSpace: 'nowrap'
                                                                                                    }}>
                                                                                                        {fileName}
                                                                                                    </span>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <div style={{ 
                                                                                                    fontSize: 12, 
                                                                                                    background: '#fff7e6',
                                                                                                    color: '#d48806',
                                                                                                    padding: '6px 12px',
                                                                                                    borderRadius: 6,
                                                                                                    display: 'inline-flex',
                                                                                                    alignItems: 'center',
                                                                                                    gap: 6,
                                                                                                    fontWeight: 500,
                                                                                                    border: '1px solid #ffd591'
                                                                                                }}>
                                                                                                    <span>⚠️</span>
                                                                                                    <span>Chưa có file đính kèm</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </Radio>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </Radio.Group>
                                                            
                                                            {selectedCvId && (() => {
                                                                const selectedCv = cvList.find(cv => cv.id === selectedCvId);
                                                                const hasFile = selectedCv ? !!getCvFileUrl(selectedCv) : false;
                                                                
                                                                return (
                                                                    <div style={{
                                                                        marginTop: 16,
                                                                        padding: 12,
                                                                        background: hasFile ? '#f0f9ff' : '#fffbe6',
                                                                        borderRadius: 8,
                                                                        border: hasFile ? '1px solid #91d5ff' : '1px solid #ffd591',
                                                                        fontSize: 13,
                                                                        color: hasFile ? '#0050b3' : '#d48806'
                                                                    }}>
                                                                        {hasFile ? (
                                                                            <>✓ CV đã chọn sẽ được gửi khi bạn nhấn "Nộp CV"</>
                                                                        ) : (
                                                                            <>⚠️ CV này chưa có file. Bạn cần upload file trước khi nộp</>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        ) : cvSelectionMode === 'upload' ? (
                                            <ProForm.Item
                                                label={"Upload file CV"}
                                                rules={[{ required: cvSelectionMode === 'upload', message: 'Vui lòng upload file!' }]}
                                            >
                                                <Upload {...propsUpload} disabled={uploading}>
                                                    <Button 
                                                        icon={<UploadOutlined />} 
                                                        loading={uploading}
                                                        disabled={uploading}
                                                        size="large"
                                                    >
                                                        {uploading ? 'Đang upload...' : 'Tải lên CV của bạn ( Hỗ trợ *.doc, *.docx, *.pdf, < 5MB )'}
                                                    </Button>
                                                </Upload>
                                                {urlCV && (
                                                    <div style={{ 
                                                        marginTop: 12, 
                                                        padding: 12,
                                                        background: '#f6ffed',
                                                        border: '1px solid #b7eb8f',
                                                        borderRadius: 8,
                                                        color: '#52c41a'
                                                    }}>
                                                        ✓ File đã được upload thành công: <strong>{urlCV.split('/').pop()}</strong>
                                                    </div>
                                                )}
                                            </ProForm.Item>
                                        ) : (
                                            <div>
                                                <div style={{ 
                                                    marginBottom: 16, 
                                                    padding: 16,
                                                    background: '#f0f9ff',
                                                    borderRadius: 8,
                                                    border: '1px solid #91d5ff'
                                                }}>
                                                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: '#0050b3' }}>
                                                        📊 Upload file Excel để tạo CV tự động
                                                    </div>
                                                    <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 12 }}>
                                                        Hệ thống sẽ tự động tạo CV từ thông tin trong file Excel của bạn. 
                                                        Nếu CV đã tồn tại, hệ thống sẽ tự động cập nhật thông tin mới.
                                                    </div>
                                                    <div style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>
                                                        <strong>Định dạng Excel:</strong> Các cột: fullName, email, phone, address, objective, experience, education, skills, photoUrl, toeic, ielts
                                                        <br />
                                                        (Hoặc tiếng Việt: Họ và tên, Email, Số điện thoại, Địa chỉ, Mục tiêu, Kinh nghiệm, Học vấn, Kỹ năng, Ảnh, TOEIC, IELTS)
                                                    </div>
                                                </div>
                                                <ProForm.Item
                                                    label={"Upload file Excel"}
                                                    rules={[{ required: cvSelectionMode === 'excel', message: 'Vui lòng upload file Excel!' }]}
                                                >
                                                    <Upload {...propsUploadExcel} disabled={uploadingExcel}>
                                                        <Button 
                                                            icon={<UploadOutlined />} 
                                                            loading={uploadingExcel}
                                                            disabled={uploadingExcel}
                                                            size="large"
                                                            type="primary"
                                                            style={{
                                                                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                                                                border: 'none'
                                                            }}
                                                        >
                                                            {uploadingExcel ? 'Đang xử lý Excel...' : 'Tải lên file Excel ( *.xlsx, *.xls )'}
                                                        </Button>
                                                    </Upload>
                                                    {cvList.find(cv => cv.cvTemplate === 'Tiêu chuẩn' && cv.email === user.email) && (
                                                        <div style={{ 
                                                            marginTop: 12, 
                                                            padding: 12,
                                                            background: '#f6ffed',
                                                            border: '1px solid #b7eb8f',
                                                            borderRadius: 8,
                                                            color: '#52c41a'
                                                        }}>
                                                            ✓ CV đã được tạo/cập nhật từ Excel. Bạn có thể nhấn "Nộp CV" để ứng tuyển.
                                                        </div>
                                                    )}
                                                </ProForm.Item>
                                            </div>
                                        )}
                                    </Col>
                                </Row>

                            </ProForm>
                        </ConfigProvider>
                    </div>
                    :
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        Bạn chưa đăng nhập hệ thống. Vui lòng đăng nhập để có thể "Nộp CV" bạn nhé 😊
                    </div>
                }
                <Divider />
            </Modal>
        </>
    )
}
export default ApplyModal;