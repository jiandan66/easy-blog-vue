import {get, post} from "@/request/method";


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
 * @param email
 */
export const api_send_email = (email: any) => get(`/user/emailCode?email=${email}`);
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



