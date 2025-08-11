//用户ts
export interface UserItem {
    userId: string;
    nickname: string;
    password?: string;
    email: string | null;
    profilePhoto: string | null;
    userStatus: string;
    createTime: string;
    updateTime: string;
    isDel?: number;
    createBy?: string | null;
    updateBy?: string | null;
}
