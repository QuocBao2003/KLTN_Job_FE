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
export interface IJobStatistics {
    level?: string;
    location?: string;
    companyName?: string;
    jobCount: number;
    averageSalary: number;
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
export interface IGetAccount extends Omit<IAccount, "access_token"> { }

export interface ICompany {
    id?: string;
    name?: string;
    address?: string;
    logo: string;
    banner: string;
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
    logo?: string;
    saveTime: Date;
}

export interface ISkill {
    id?: number;
    name?: string;
    jobProfession?: IJobProfession;
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface IMessageRoom {
    id: string; // UUID
    jobId: number;
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

    // Legacy fields (có thể giữ để tương thích)
    candidateId?: number;
    employerId?: number;
    candidateUnreadCount?: number;
    employerUnreadCount?: number;
    createdDate?: string;


    candidate?: IUser;
    employer?: IUser;
    job?: IJob;
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
export interface IJobProfession {
    id?: string;
    name?: string;
    jobs?: IJob[];
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}
export type SalaryTypeEnum = "SPECIFIC" | "NEGOTIABLE";
export interface IJob {
    id?: string;
    name: string;
    skills: ISkill[];
    company?: {
        id: string;
        name: string;
        logo?: string;
    }
    logo?: string;
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

    packageType?: 'PRIORITY_DISPLAY' | 'PRIORITY_BOLD_TITLE' | 'FEATURED_JOB';
    isFeatured?: boolean;
    hasBoldTitle?: boolean;
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface IResume {
    id?: string;
    email: string;
    userId: string;
    url: string;
    status: string;
    logo: string;
    companyId: string | {
        id: string;
        name: string;

    };
    companyName?: string;
    jobId: string | {
        id: string;
        name: string;
    };
    job?: {
        id?: string;
        name?: string;
    } | null;
    jobName?: string;
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
export interface IServicePackage {
    id: number;
    name: string;
    description: string;
    price: number;
    packageType: 'PRIORITY_DISPLAY' | 'PRIORITY_BOLD_TITLE' | 'FEATURED_JOB';
    jobLimit: number;
    durationDays: number;
    active: boolean;
}

export interface IUserPackage {
    id: number;
    servicePackage: IServicePackage;
    startDate: string;
    endDate: string;
    usedJobCount: number;
    remainingJobCount: number;
    status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
    expired: boolean;
    daysRemaining: number;
}

export interface IPackageOrder {
    id: number;
    orderCode: string;
    servicePackage: IServicePackage;
    amount: number;
    orderType: 'NEW_PURCHASE' | 'RENEWAL';
    paymentMethod: 'MOMO';
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
    transactionId?: string;
    createdAt: string;
}

export interface IMoMoPayment {
    payUrl: string;
    orderCode: string;
    requestId: string;
    message: string;
}
