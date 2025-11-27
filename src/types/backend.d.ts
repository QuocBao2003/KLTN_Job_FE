export interface IBackendRes<T> {
    error?: string | string[];
    message: string;
    statusCode: number | string;
    data?: T;
}

export interface IModelPaginate<T> {
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    },
    result: T[]
}

export interface IAccount {
    access_token: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: {
            id: string;
            name: string;
            permissions: {
                id: string;
                name: string;
                apiPath: string;
                method: string;
                module: string;
            }[]
        }
    }
}

<<<<<<< Updated upstream
=======
export interface Notification {
    id: number;
    title: string;
    description: string;
    type: NotificationType;
    isRead: boolean;
    isViewed: boolean;
    relatedEntityId: number;
    navigationUrl: string;
    createdAt: string;
    readAt?: string;
}

export type NotificationType =
    | 'JOB_APPROVED'
    | 'JOB_REJECTED'
    | 'JOB_PENDING_APPROVAL'
    | 'RESUME_APPROVED'
    | 'RESUME_REJECTED'
    | 'RESUME_PENDING';

>>>>>>> Stashed changes
export interface IGetAccount extends Omit<IAccount, "access_token"> { }

export interface ICompany {
    id?: string;
    name?: string;
    address?: string;
    logo: string;
    description?: string;
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface ISaveJob {
    id?: string;
    name?: string;
    companyName?: string;
    location: string;
<<<<<<< Updated upstream
    saveTime : Date;
=======
    logo?: string;
    saveTime: Date;
>>>>>>> Stashed changes
}

// --- UPDATED INTERFACES FOR SEARCH LOGIC ---

export interface ISkill {
    id?: number; // Đổi thành number để đồng bộ với Job & Profession
    name?: string;
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface IJobProfession {
    id?: number;
    name: string;
    jobs?: IJob[]; // <--- QUAN TRỌNG: Thêm jobs để hiển thị dạng cây (Tree)
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export type SalaryTypeEnum = "SPECIFIC" | "NEGOTIABLE";

export interface IJob {
    id?: number;
    name: string;
    skills: ISkill[]; // Đã có skills, giữ nguyên
    company?: {
        id: string;
        name: string;
        logo?: string;
    }
    jobProfession?: IJobProfession;
    location: string;
    minSalary?: number;
    maxSalary?: number;
    salaryType: SalaryTypeEnum;
    quantity: number;
    level: string;
    description: string;
    interest: string;
    request: string;
    worklocation: string;
    worktime: string;
    startDate: Date;
    endDate: Date;
    status: "PENDING" | "APPROVED" | "REJECTED";

    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

// ------------------------------------------

export interface IMessageRoom {
    id: string; // UUID
    candidateId: number;
    employerId: number;
    jobId: number;
<<<<<<< Updated upstream
=======
    jobName?: string;
    companyName?: string;

    // ✅ Thông tin người chat đối diện
    otherUserId?: number;
    otherUserName?: string;
    otherUserEmail?: string;
    otherUserAvatar?: string | null;

    // ✅ Thông tin tin nhắn cuối
    lastMessage?: string;
    lastMessageTime?: string;
    lastSenderId?: number;

    // ✅ Số tin nhắn chưa đọc
    unreadCount?: number;

    // Legacy fields
    candidateId?: number;
    employerId?: number;
    candidateUnreadCount?: number;
    employerUnreadCount?: number;
    createdDate?: string;

    candidate?: IUser;
    employer?: IUser;
    job?: IJob;
>>>>>>> Stashed changes
}
export interface IMessageContent {
    id: string;
    content: string;
    dateSent: string;
    messageType: 'TEXT';
    sender: IUser;
    messageRoom: IMessageRoom;
}
export interface IMessageResponse {
    id: string;
    content: string;
    dateSent: string;
    senderId: number;
    senderUsername: string;
    senderAvatarUrl: string | null;
}

export interface IUser {
    id?: string;
    name: string;
    email: string;
    password?: string;
    age: number;
    gender: string;
    address: string;
    role?: {
        id: string;
        name: string;
    }

    company?: {
        id: string;
        name: string;
    }
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}
<<<<<<< Updated upstream

export interface IJob {
    id?: string;
    name: string;
    skills: ISkill[];
    company?: {
        id: string;
        name: string;
        logo?: string;
    }
    location: string;
    salary: number;
    quantity: number;
    level: string;
    description: string;
    startDate: Date;
    endDate: Date;
    active: boolean;

    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}
=======
>>>>>>> Stashed changes

export interface IResume {
    id?: string;
    email: string;
    userId: string;
    url: string;
    status: string;
    companyId: string | {
        id: string;
        name: string;
<<<<<<< Updated upstream
        logo: string;
=======
>>>>>>> Stashed changes
    };
    jobId: string | {
        id: string;
        name: string;
    };
    history?: {
        status: string;
        updatedAt: Date;
        updatedBy: { id: string; email: string }
    }[]
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface IPermission {
    id?: string;
    name?: string;
    apiPath?: string;
    method?: string;
    module?: string;

    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;

}

export interface IRole {
    id?: string;
    name: string;
    description: string;
    active: boolean;
    permissions: IPermission[] | string[];

    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface ISubscribers {
    id?: string;
    name?: string;
    email?: string;
    skills: string[];
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

<<<<<<< Updated upstream
=======
export interface IChatResponse {
    type: string;
    message: string;
    jobs?: IJobSuggestion[];
}
export interface IJobSuggestion {
    id: number;
    name: string;
    companyName: string;
    location: string;
    logo: string;
}

export interface ITimeSeriesStatistic {
    label: string; // "Week 1-2025" hoặc "01/2025"
    count: number;
    periodStart: string;
    periodEnd: string;
}

export interface IResumeStatusStatistic {
    status: string;
    count: number;
}

export interface IJobResumeStatistic {
    jobId: number;
    jobName: string;
    resumeCount: number;
    startDate: string;
    endDate: string;
}

export interface IHRStatistics {
    totalApprovedJobs: number;
    totalRejectedJobs: number;
    totalPendingJobs: number;
    totalResumes: number;
    activeJobsWithResumes: IJobResumeStatistic[];
    resumesByStatus: IResumeStatusStatistic[];
    jobsTimeSeries: ITimeSeriesStatistic[];
    resumesTimeSeries: ITimeSeriesStatistic[];
    statisticsTime: string;
    filterStartDate: string;
    filterEndDate: string;
    timeUnit: string; // "WEEK" or "MONTH"
}

export interface ICompanyTopResume {
    companyId: number;
    companyName: string;
    companyLogo: string;
    totalResumes: number;
}

export interface ICompanyResumeStatistic {
    companyId: number;
    companyName: string;
    totalResumes: number;
    approvedResumes: number;
    rejectedResumes: number;
    pendingResumes: number;
}

export interface IAdminStatistics {
    totalApprovedJobs: number;
    totalRejectedJobs: number;
    totalPendingJobs: number;
    totalCompanies: number;
    topCompanyByResumes: ICompanyTopResume | null;
    resumesByStatus: IResumeStatusStatistic[];
    jobsTimeSeries: ITimeSeriesStatistic[];
    resumesTimeSeries: ITimeSeriesStatistic[];
    companyResumeStatistics: ICompanyResumeStatistic[];
    statisticsTime: string;
    filterStartDate: string;
    filterEndDate: string;
    timeUnit: string; // "WEEK" or "MONTH"
}
>>>>>>> Stashed changes
export interface ICv {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    objective: string;
    experience: string;
    education: string;
    skills: string;
    photoUrl?: string;
    cvTemplate?: string;
    createdAt?: string;
    updatedAt?: string;
    url?: string;
}