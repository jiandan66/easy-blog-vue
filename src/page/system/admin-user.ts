// 后管用户ts
export interface AdminUserItem {
    id: number | string;
    userName: string;
    email: string | null;
    userType: number;      // 0=管理员, 1=普通用户
    userStatus: number;    // 0=正常, 1=禁用
    createTime: string | null;
    lastLoginTime: string | null;
}
