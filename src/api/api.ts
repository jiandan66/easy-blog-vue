import {get, post,put,del} from "@/request/method";


/**
 * 登录
 * @param body
 */
export const api_login = (body: any) => post("/user/login", body);
/**
 * 邮箱登录
 * @param body
 */
export const api_email_login = (body: any) => post("/user/emailLogin", body);
/**
 * 发送邮箱验证码
 * @param body
 */
export const api_send_email = (body: any) => post("/user/emailCode", body);
/**
 * 获取图像验证码
 * @param uuid
 */
export const api_getImg_code = (uuid: any) => get(`/user/captcha.jpg?uuid=${uuid}`);
/**
 * 校验图像验证码
 * @param uuid
 * @param code
 *
 */
export const api_check_code = (uuid: any, code: any) => get(`/user/checkCode?uuid=${uuid}&code=${code}`);

/**
 * 菜单列表
 */
export const api_menu_list = () => get("/menu/list");

/**
 * 新增菜单
 */
export const api_menu_add_or_update = (body: any) => post("/menu/saveOrUpdate", body);


/**
 * 删除菜单
 */
export const api_menu_delete = (id: number) => get(`/menu/delete/${id}`);

/**
 * 用户列表
 * @param body
 */
export const api_user_list = (body: any) => post("/modules/user/pageUser",body);
/**
 * 编辑用户
 * @param body
 */
export const api_user_edit = (body: any) => put("/modules/user/updateUserByUserId",body);
/**
 * 新增用户
 * @param body
 */
export const api_user_save = (body: any) => post("/modules/user/insertUser",body);
/**
 * 删除用户
 * @param userId
 */
export const api_user_del = (userId: any) => del (`/modules/user/deleteUserByUserId?userId=${userId}`);

/**
 * 标签列表
 * @param body
 */
export const api_tag_list = (body: any) => post("/modules/tags/pageTag",body);
/**
 * 编辑标签
 * @param body
 */
export const api_tag_edit = (body: any) => put("/modules/tags/updateTag",body);
/**
 * 新增标签
 * @param body
 */
export const api_tag_save = (body: any) => post("/modules/tags/insertTag",body);
/**
 * 标签用户
 * @param tagId
 */
export const api_tag_del = (tagId: any) => del (`/modules/tags/deleteTag?tagId=${tagId}`);



