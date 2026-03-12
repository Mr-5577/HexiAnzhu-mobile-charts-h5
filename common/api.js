import { post } from "@/utils/request";

// 用户相关接口
export const userApi = {
  // 登录
  login(data) {
    return post("/auth/login", data, {
      showLoading: true,
      loadingText: "登录中...",
    });
  },
  // 获取认证地址回调
  getAuthRedirectUrl: (data) => {
    return post(`/callback/getAuthRedirectUrl`, data);
  },
  // 获取认证地址回调（测试）
  getAuthRedirectUrlTest: (data) => {
    return post(`/callback/getAuthRedirectUrlTest`, data);
  },
  // 退出登录
  logout() {
    return post("/auth/logout");
  },
};
// 大屏相关接口
export const largeScreenApi = {
  // 获取项目列表
  getProjList: () => {
    return post("/emp/getProjList");
  },
  // 获取项目列表(树)
  getProjTree: () => {
    return post("/emp/getProjTree");
  },
  // 获取销售业绩数据
  getSaleInfo: (data) => {
    return post("/sale/getSaleInfo", data);
  },
  // 获取溢价业绩数据
  getPremiumInfo: (data) => {
    return post("/sale/getPremiumInfo", data);
  },
  // 获取销售业绩数据（项目月度）
  getSaleProjInfo: (data) => {
    return post("/sale/getSaleProjInfo", data);
  },
  // 获取销售业绩数据（个人月度）
  getSaleProjSalerInfo: (data) => {
    return post("/sale/getSaleProjSalerInfo", data);
  },
  // 获取销售业绩数据（近一年）
  getSaleYearInfo: (data) => {
    return post("/sale/getSaleYearInfo", data);
  },
  // 获取销售业绩数据（近三十天）
  getCustomerCome30Day: (data) => {
    return post("/sale/getCustomerCome30Day", data);
  },
  // 获取库存数据
  getRoomStockInfo: (data) => {
    return post("/sale/getRoomStockInfo", data);
  },
  // 获取库存结构数据
  getRoomStockGroupInfo: (data) => {
    return post("/sale/getRoomStockGroupInfo", data);
  },
  // 获取销售总览
  getSaleGeneralInfo: (data) => {
    return post("/sale/getSaleGeneralInfo", data);
  },
  // 获取来访数据
  getCustomerComeInfo: (data) => {
    return post("/sale/getCustomerComeInfo", data);
  },
};
// 销售报表
export const saleReportApi = {
  // 获取销售业绩日、月、年报总体数据
  getAsstTotalForApp: (data) => {
    return post("/sale/getAsstTotalForApp", data);
  },
};
