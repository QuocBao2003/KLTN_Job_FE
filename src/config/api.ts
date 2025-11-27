<<<<<<< Updated upstream
import { IBackendRes, ICompany, IAccount, IUser, IModelPaginate, IGetAccount, IJob, IResume, IPermission, IRole, ISkill, ISubscribers, ISaveJob, IMessageRoom, IMessageContent, IMessageResponse, ICv } from '@/types/backend';
=======
import { IBackendRes, ICompany, IAccount, IUser, IModelPaginate, IGetAccount, IJob, IResume, IPermission, ICv, IRole, ISkill, ISubscribers, ISaveJob, IMessageRoom, IMessageContent, IMessageResponse, IChatResponse, IJobProfession, IAdminStatistics, IHRStatistics } from '@/types/backend';
>>>>>>> Stashed changes
import axios from 'config/axios-customize';

/**
 * 
Module Auth
 */
export const callRegister = (name: string, email: string, password: string, age: number, gender: string, address: string) => {
    return axios.post<IBackendRes<IUser>>('/api/v1/auth/register', { name, email, password, age, gender, address })
}

export const callLogin = (username: string, password: string) => {
    return axios.post<IBackendRes<IAccount>>('/api/v1/auth/login', { username, password })
}

export const callFetchAccount = () => {
    return axios.get<IBackendRes<IGetAccount>>('/api/v1/auth/account')
}

export const callRefreshToken = () => {
    return axios.get<IBackendRes<IAccount>>('/api/v1/auth/refresh')
}

export const callLogout = () => {
    return axios.post<IBackendRes<string>>('/api/v1/auth/logout')
}

/**
 * Upload single file
 */
export const callUploadSingleFile = (file: any, folderType: string) => {
    const bodyFormData = new FormData();
    bodyFormData.append('file', file);
    bodyFormData.append('folder', folderType);

    return axios<IBackendRes<any>>({
        method: 'post',
        url: '/api/v1/files',
        data: bodyFormData,
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
}




/**
 * 
Module Company
 */
<<<<<<< Updated upstream
export const callCreateCompany = (name: string, address: string, description: string, logo: string) => {
    return axios.post<IBackendRes<ICompany>>('/api/v1/companies', { name, address, description, logo })
=======
export const callCreateCompany = (name: string, address: string, description: string, logo: string, banner: string) => {
    return axios.post<IBackendRes<ICompany>>('/api/v1/companies', { name, address, description, logo, banner })
>>>>>>> Stashed changes
}

export const callUpdateCompany = (id: string, name: string, address: string, description: string, logo: string) => {
    return axios.put<IBackendRes<ICompany>>(`/api/v1/companies`, { id, name, address, description, logo })
}

export const callDeleteCompany = (id: string) => {
    return axios.delete<IBackendRes<ICompany>>(`/api/v1/companies/${id}`);
}

export const callFetchCompany = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<ICompany>>>(`/api/v1/companies?${query}`);
}

export const callFetchCompanyById = (id: string) => {
    return axios.get<IBackendRes<ICompany>>(`/api/v1/companies/${id}`);
}
<<<<<<< Updated upstream

=======
export const callFetchJobByCompanyIdAndStatus = (companyId: string, query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IJob>>>(`/api/v1/jobs/company/${companyId}?${query}`);
}
export const callCountJobByCompanyIdAndStatus = (companyId: string) => {
    return axios.get<IBackendRes<number>>(`/api/v1/jobs/company/${companyId}/count`);
}
>>>>>>> Stashed changes
/**
 * 
Module Skill
 */
export const callCreateSkill = (name: string) => {
    return axios.post<IBackendRes<ISkill>>('/api/v1/skills', { name })
}

export const callUpdateSkill = (id: string, name: string) => {
    return axios.put<IBackendRes<ISkill>>(`/api/v1/skills`, { id, name })
}

export const callDeleteSkill = (id: string) => {
    return axios.delete<IBackendRes<ISkill>>(`/api/v1/skills/${id}`);
}

export const callFetchAllSkill = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<ISkill>>>(`/api/v1/skills?${query}`);
}



/**
 * 
Module User
 */
export const callCreateUser = (user: IUser) => {
    return axios.post<IBackendRes<IUser>>('/api/v1/users', { ...user })
}

export const callUpdateUser = (user: IUser) => {
    return axios.put<IBackendRes<IUser>>(`/api/v1/users`, { ...user })
}

export const callDeleteUser = (id: string) => {
    return axios.delete<IBackendRes<IUser>>(`/api/v1/users/${id}`);
}

export const callFetchUser = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IUser>>>(`/api/v1/users?${query}`);
}
export const callGetUserById = (id: string | number) => {
    return axios.get<IBackendRes<IUser>>(`/api/v1/users/${id}`);
};

export const callChangePassword = (
    id: string,
    data: { oldPassword: string; newPassword: string }
) => {
    return axios.put<IBackendRes<IUser>>(`/api/v1/users/${id}`, data);
};
/**
 * 
Module Job
 */
<<<<<<< Updated upstream
=======
export const updateJobApprove = (id: string) => {
    return axios.put<IBackendRes<void>>(`/api/v1/jobs/${id}/approve`);
}
export const updateJobReject = (id: string) => {
    return axios.put<IBackendRes<void>>(`/api/v1/jobs/${id}/reject`);
}
>>>>>>> Stashed changes
export const callCreateJob = (job: IJob) => {
    return axios.post<IBackendRes<IJob>>('/api/v1/jobs', { ...job })
}

export const callUpdateJob = (job: IJob, id: string) => {
    return axios.put<IBackendRes<IJob>>(`/api/v1/jobs`, { id, ...job })
}

export const callDeleteJob = (id: string) => {
    return axios.delete<IBackendRes<IJob>>(`/api/v1/jobs/${id}`);
}

export const callFetchJob = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IJob>>>(`/api/v1/jobs?${query}`);
}

export const callFetchJobById = (id: string) => {
    return axios.get<IBackendRes<IJob>>(`/api/v1/jobs/${id}`);
}

export const callGetSavedJobByUser = () => {
    return axios.get<IBackendRes<ISaveJob>>(`/api/v1/save-jobs`);
}
export const callSavedJob = (id?: string) => {
    return axios.post<IBackendRes<ISaveJob[]>>(`/api/v1/save-jobs/${id}`);
}
<<<<<<< Updated upstream
=======
export const callJobByJobProfession = (professionId: string) => {
    return axios.get<IBackendRes<IModelPaginate<IJob>>>(`/api/v1/jobs/jobProfession/${professionId}`);
}
>>>>>>> Stashed changes
// tạo room chat
export const createRoomMessage = (jobId: string, otherUserId?: string) => {
    const params: Record<string, any> = { jobId: Number(jobId) };

    if (otherUserId) {
        params.otherUserId = Number(otherUserId);
    }

    return axios.post<IBackendRes<IMessageRoom>>('/api/v1/chat/room', null, { params });
};

export const getMessagesInRoom = (roomId: string) => {
    return axios.get<IBackendRes<IMessageResponse[]>>(`/api/v1/chat/room/${roomId}/messages`);
}
export const getMyRooms = () => {
    return axios.get<IBackendRes<IMessageRoom[]>>(`/api/v1/chat/rooms`);
}
/**

Module Resume
 */
export const callCreateResume = (url: string, jobId: any, email: string, userId: string | number) => {
    return axios.post<IBackendRes<IResume>>('/api/v1/resumes', {
        url: url,
        email: email,
        status: "PENDING",
        user: {
            "id": userId
        },
        job: {
            "id": jobId
        }
    })
}

export const callUpdateResumeStatus = (id: any, status: string) => {
    return axios.put<IBackendRes<IResume>>(`/api/v1/resumes`, { id, status })
}

export const callDeleteResume = (id: string) => {
    return axios.delete<IBackendRes<IResume>>(`/api/v1/resumes/${id}`);
}

export const callFetchResume = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IResume>>>(`/api/v1/resumes?${query}`);
}

export const callFetchResumeById = (id: string) => {
    return axios.get<IBackendRes<IResume>>(`/api/v1/resumes/${id}`);
}

export const callFetchResumeByUser = () => {
    return axios.post<IBackendRes<IModelPaginate<IResume>>>(`/api/v1/resumes/by-user`);
}

/**
 * 
Module Permission
 */
export const callCreatePermission = (permission: IPermission) => {
    return axios.post<IBackendRes<IPermission>>('/api/v1/permissions', { ...permission })
}

export const callUpdatePermission = (permission: IPermission, id: string) => {
    return axios.put<IBackendRes<IPermission>>(`/api/v1/permissions`, { id, ...permission })
}

export const callDeletePermission = (id: string) => {
    return axios.delete<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`);
}

export const callFetchPermission = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IPermission>>>(`/api/v1/permissions?${query}`);
}

export const callFetchPermissionById = (id: string) => {
    return axios.get<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`);
}

/**
 * 
Module Role
 */
export const callCreateRole = (role: IRole) => {
    return axios.post<IBackendRes<IRole>>('/api/v1/roles', { ...role })
}

export const callUpdateRole = (role: IRole, id: string) => {
    return axios.put<IBackendRes<IRole>>(`/api/v1/roles`, { id, ...role })
}

export const callDeleteRole = (id: string) => {
    return axios.delete<IBackendRes<IRole>>(`/api/v1/roles/${id}`);
}

export const callFetchRole = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IRole>>>(`/api/v1/roles?${query}`);
}

export const callFetchRoleById = (id: string) => {
    return axios.get<IBackendRes<IRole>>(`/api/v1/roles/${id}`);
}

/**
 * 
Module Subscribers
 */
export const callCreateSubscriber = (subs: ISubscribers) => {
    return axios.post<IBackendRes<ISubscribers>>('/api/v1/subscribers', { ...subs })
}

export const callGetSubscriberSkills = () => {
    return axios.post<IBackendRes<ISubscribers>>('/api/v1/subscribers/skills')
}

export const callUpdateSubscriber = (subs: ISubscribers) => {
    return axios.put<IBackendRes<ISubscribers>>(`/api/v1/subscribers`, { ...subs })
}

export const callDeleteSubscriber = (id: string) => {
    return axios.delete<IBackendRes<ISubscribers>>(`/api/v1/subscribers/${id}`);
}

export const callFetchSubscriber = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<ISubscribers>>>(`/api/v1/subscribers?${query}`);
}

export const callFetchSubscriberById = (id: string) => {
    return axios.get<IBackendRes<ISubscribers>>(`/api/v1/subscribers/${id}`);
}

export const callAskAI = (prompt: string) => {
    return axios.get<string>(`/api/v1/ask?question=${prompt}`); // Kiểu trả về là string thay vì IBackendRes<string>
};
<<<<<<< Updated upstream

=======
export const callAskAIWithFile = (file: File, message?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (message) {
        formData.append('message', message);
    }

    return axios.post<IChatResponse>(`/api/v1/fileAi`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};
// Notification
export const callFetchAllNotifications = () => {
    return axios.get<IBackendRes<Notification[]>>("/api/v1/notifications/all");
};

// Đếm thông báo CHƯA XEM (viewed) thay vì chưa đọc (read)
export const callCountUnviewedNotifications = () => {
    return axios.get<IBackendRes<{ count: number }>>("/api/v1/notifications/count");
};

// Đánh dấu 1 thông báo là đã đọc
export const callMarkNotificationAsRead = (id: number) => {
    return axios.put<IBackendRes<boolean>>(`/api/v1/notifications/${id}/read`);
};

//  Đánh dấu tất cả là đã XEM 
export const callMarkAllNotificationsAsViewed = () => {
    return axios.put<IBackendRes<boolean>>("/api/v1/notifications/mark-all-viewed");
};
>>>>>>> Stashed changes

// 
export const callGetJobByEmail = () => {
    return axios.get<IBackendRes<string>>(`/api/v1/email`);
}

<<<<<<< Updated upstream
=======

// thong ke
export interface IStatisticsFilter {
    startDate?: string;   // ISO format
    endDate?: string;     // ISO format
    timeUnit?: 'WEEK' | 'MONTH'; // Default 'MONTH'
    topLimit?: number;    // For admin only
}
export const getHRStatistics = (filter?: IStatisticsFilter) => {
    const params: any = {};
    if (filter?.startDate) params.startDate = filter.startDate;
    if (filter?.endDate) params.endDate = filter.endDate;
    if (filter?.timeUnit) params.timeUnit = filter.timeUnit;

    return axios.get<IBackendRes<IHRStatistics>>('/api/v1/statistics/hr', { params });
}

export const getAdminStatistics = (filter?: IStatisticsFilter) => {
    const params: any = {};
    if (filter?.startDate) params.startDate = filter.startDate;
    if (filter?.endDate) params.endDate = filter.endDate;
    if (filter?.timeUnit) params.timeUnit = filter.timeUnit;
    if (filter?.topLimit) params.topLimit = filter.topLimit;

    return axios.get<IBackendRes<IAdminStatistics>>('/api/v1/statistics/admin', { params });
}
>>>>>>> Stashed changes
// Thêm interface cho thống kê
export interface IJobStatistics {
    level?: string;
    location?: string;
    companyName?: string;
    jobCount: number;
    averageSalary: number;
}

/**
 * Module Statistics
 */
export const callGetJobStatisticsByLevel = () => {
    return axios.get<IBackendRes<IJobStatistics[]>>('/api/v1/jobs/statistics/level');
}

export const callGetJobStatisticsByLocation = () => {
    return axios.get<IBackendRes<IJobStatistics[]>>('/api/v1/jobs/statistics/location');
}

export const callGetJobStatisticsByCompany = () => {
    return axios.get<IBackendRes<IJobStatistics[]>>('/api/v1/jobs/statistics/company');
}

export const callGetJobStatisticsOverview = () => {
    return axios.get<IBackendRes<{
        totalJobs: number;
        totalCompanies: number;
        totalCandidates: number;
        averageSalary: number;
    }>>('/api/v1/jobs/statistics/overview');
}


export const callSubmitCv = (data: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    objective: string;
    experience: string;
    education: string;
    skills: string;
    photoUrl: string;
    cvTemplate: string;
    url: string;
}) => {
    return axios.post<IBackendRes<ICv>>('/api/v1/submit-cv', data);
}

export const callCreateCv = (data: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    objective: string;
    experience: string;
    education: string;
    skills: string;
    photoUrl: string;
    cvTemplate: string;
    url: string;
}) => {
    return axios.post<IBackendRes<ICv>>('/api/v1/cvs', data);
}

export const callUpdateCv = (id: number, data: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    objective?: string;
    experience?: string;
    education?: string;
    skills?: string;
    photoUrl?: string;
    cvTemplate?: string;
}) => {
    return axios.put<IBackendRes<ICv>>(`/api/v1/cvs/${id}`, data);
}

export const callFetchCvById = (id: number) => {
    return axios.get<IBackendRes<ICv>>(`/api/v1/cvs/${id}`);
}

export const callDeleteCv = (id: number) => {
    return axios.delete<IBackendRes<ICv>>(`/api/v1/cvs/${id}`);
}

export const callFetchCvByUser = () => {
    return axios.post<IBackendRes<IModelPaginate<ICv>>>(`/api/v1/cvs/by-user`);
}

export const callFetchAllCv = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<ICv>>>(`/api/v1/cvs?${query}`);
}

/**
 * Upload Excel file and create/update CV from Excel data
 */
export const callUploadExcelCv = (file: any) => {
    const bodyFormData = new FormData();
    bodyFormData.append('file', file);

    return axios<IBackendRes<ICv>>({
        method: 'post',
        url: '/api/v1/cvs/upload-excel',
        data: bodyFormData,
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
}

export const callFetchAllJobProfessionSkillJob = (query: string = "") => {
    return axios.get(`/api/v1/job_professions/tree?${query}`);
}