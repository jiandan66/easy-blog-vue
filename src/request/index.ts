import axios from "axios";
import router from "../router";

import {ElMessage} from "element-plus";

declare module 'axios' {
    interface AxiosInstance {
        (config: AxiosRequestConfig): Promise<any>
    }
}
// 创建一个 axios 实例
const service = axios.create({
    baseURL: import.meta.env.VITE_SERVE,
    timeout: 60000, // 请求超时时间毫秒
});

//请求拦截器
service.interceptors.request.use((config) => {
    // config.headers("token", localStorage.getItem("token"));
    config.headers.token = localStorage.getItem("token");
    //返回配置对象
    return config;
});

//响应拦截器
service.interceptors.response.use((response) => {
    const {code, msg, status} = response.data;
    if (code !== 0) {
        ElMessage({
            message: msg,
            type: "error",
        });
    }
    if (code == 401 || code == -1 || code == 1) {
        setTimeout(async () => {
            // 登录失效
            localStorage.clear();
            await router.push("/login");
        }, 2000);
    }
    //简化数据
    return response.data;
}, (error) => {
    console.log("异常", error);
},)


export default service;
