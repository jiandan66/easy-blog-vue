import service from "@/request/index";
// 地址
let prefix = import.meta.env.VITE_APP_BASE_API;

/**
 * get请求
 * @param url 请求地址
 * @param data 请求参数
 * @param api 特殊的请求代理
 * @returns
 */
export function get(url: string, data: any = {}, api?: string) {
  let baseUrl = prefix;
  let params = [];
  for (const item in data) {
    params.push(`${item}=${data[item]}`);
  }
  if (api) {
    baseUrl = api;
  }
  url =
      baseUrl + url + (Object.keys(data).length ? "?" : "") + params.join("&");
  return service({
    url,
    method: "GET",
    data,
  });
}

/**
 * post请求
 * @param url 请求地址
 * @param data 请求参数
 * @returns
 */
export function post(url: string, data = {}) {
  url = prefix + url;
  return service({
    url,
    method: "POST",
    data,
  });
}

/**
 * put请求
 * @param url 请求地址
 * @param data 请求参数
 * @returns
 */
export function put(url: string, data = {}) {
  url = prefix + url;
  return service({
    url,
    method: "PUT",
    data,
  });
}

/**
 * delete请求
 * @param url 请求地址
 * @param data 请求参数
 * @returns
 */
export function del(url: string, data = {}) {
  url = prefix + url;
  return service({
    url,
    method: "DELETE",
    data,
  });
}
