import axios from "axios";

// 创建 axios 实例
const request = axios.create({
  baseURL: process.env.VUE_APP_API_URL || "/api", // 基础URL
  timeout: 10000, // 10秒超时
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器 - 添加 token
request.interceptors.request.use(
  (config) => {
    // 获取 token
    const token = uni.getStorageSync("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 响应拦截器 - 统一处理错误
request.interceptors.response.use(
  (response) => {
    // 直接返回数据
    return response.data;
  },
  (error) => {
    // 统一错误处理
    let message = "请求失败";

    if (error.response) {
      // 服务器返回错误
      switch (error.response.status) {
        case 401:
          message = "未登录或登录过期";
          // 跳转到登录页
          uni.navigateTo({ url: "/pages/login/login" });
          break;
        case 403:
          message = "没有权限";
          break;
        case 404:
          message = "请求地址不存在";
          break;
        case 500:
          message = "服务器内部错误";
          break;
        default:
          message = error.response.data?.message || "请求失败";
      }
    } else if (error.request) {
      // 请求发出但没有响应
      message = "网络连接失败";
    } else {
      // 其他错误
      message = error.message;
    }

    // 显示错误提示
    uni.showToast({
      title: message,
      icon: "none",
      mask: true,
    });
    return Promise.reject(error);
  },
);

// 封装 GET 请求
export const get = (url, params = {}, config = {}) => {
  return request.get(url, { params, ...config });
};

// 封装 POST 请求
export const post = (url, data = {}, config = {}) => {
  return request.post(url, data, config);
};

// 默认导出 request 实例
export default request;
