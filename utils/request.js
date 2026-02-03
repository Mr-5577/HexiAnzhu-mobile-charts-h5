/**
 * 基础请求配置
 */
const baseConfig = {
  baseURL:
    process.env.NODE_ENV === "development"
      ? "/api"
      : "https://api.example.com/api",
  timeout: 10000,
  header: {
    "Content-Type": "application/json",
  },
};

/**
 * 显示Toast提示
 * @param {string} title - 提示内容
 * @param {string} icon - 图标类型
 */
const showToast = (title, icon = "none") => {
  uni.hideToast();
  uni.showToast({
    title,
    icon,
    duration: 2000,
  });
};

/**
 * 显示Loading
 * @param {string} title - loading文字
 */
const showLoading = (title = "加载中...") => {
  // 先隐藏之前的loading
  uni.hideLoading();
  uni.showLoading({
    title,
    mask: true,
  });
};

/**
 * 隐藏Loading
 */
const hideLoading = () => {
  uni.hideLoading();
};

/**
 * 核心请求方法
 * @param {Object} options - 请求配置
 * @returns {Promise} - Promise对象
 */
const request = (options = {}) => {
  return new Promise((resolve, reject) => {
    // 合并请求配置
    const requestConfig = {
      url: baseConfig.baseURL + options.url,
      method: options.method || "GET",
      data: options.data || {},
      timeout: options.timeout || baseConfig.timeout,
      dataType: options.dataType || "json",
      header: {
        ...baseConfig.header,
        ...options.header,
      },
      // 成功回调
      success: (res) => {
        // 隐藏loading
        if (options.showLoading) {
          hideLoading();
        }
        // HTTP状态码判断
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          // 处理HTTP错误
          let errorMsg = `请求失败: ${res.statusCode}`;
          if (res.data && res.data.message) {
            errorMsg = res.data.message;
          }
          // 显示错误提示
          if (options.showError !== false) {
            showToast(errorMsg);
          }
          reject(new Error(errorMsg));
        }
      },
      // 失败回调
      fail: (err) => {
        // 隐藏loading
        if (options.showLoading) {
          hideLoading();
        }
        // 显示错误提示
        if (options.showError !== false) {
          showToast("网络连接失败，请检查网络");
        }
        reject(err);
      },
      // 完成回调
      complete: () => {
        // 可以在这里做一些清理工作
      },
    };
    // 添加token
    const token = uni.getStorageSync("token") || "";
    if (token) {
      requestConfig.header.Authorization = `Bearer ${token}`;
    }
    // 显示loading
    if (options.showLoading) {
      showLoading(options.loadingText);
    }
    // 发起请求
    uni.request(requestConfig);
  });
};

/**
 * GET请求
 * @param {string} url - 请求地址
 * @param {Object} params - 请求参数
 * @param {Object} config - 额外配置
 */
export const get = (url, params = {}, config = {}) => {
  return request({
    url,
    method: "GET",
    data: params,
    ...config,
  });
};

/**
 * POST请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求数据
 * @param {Object} config - 额外配置
 */
export const post = (url, data = {}, config = {}) => {
  return request({
    url,
    method: "POST",
    data,
    ...config,
  });
};

/**
 * PUT请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求数据
 * @param {Object} config - 额外配置
 */
export const put = (url, data = {}, config = {}) => {
  return request({
    url,
    method: "PUT",
    data,
    ...config,
  });
};

/**
 * DELETE请求
 * @param {string} url - 请求地址
 * @param {Object} params - 请求参数
 * @param {Object} config - 额外配置
 */
export const del = (url, params = {}, config = {}) => {
  return request({
    url,
    method: "DELETE",
    data: params,
    ...config,
  });
};

// 导出默认请求方法
export default request;
