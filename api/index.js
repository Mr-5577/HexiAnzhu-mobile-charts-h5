import { get, post } from '@/utils/request'

// 用户相关接口
export const userApi = {
  // 登录
  login(data) {
    return post('/auth/login', data, {
      showLoading: true,
      loadingText: '登录中...'
    })
  },
  
  // 获取用户信息
  getUserInfo() {
    return get('/user/info', {}, {
      showLoading: false
    })
  },
  
  // 退出登录
  logout() {
    return post('/auth/logout')
  }
}

// 导出所有API
export default {
  user: userApi,
}