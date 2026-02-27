const config = {
  development: {
    baseUrl: '/api',
    baseUrlActual: 'http://192.168.1.24:8080',
    env: 'development'
  },
  production: {
    baseUrl: '/api',
    baseUrlActual: 'http://sys.ruizhongzx.com/app',
    env: 'production'
  }
}

// 根据环境获取配置
const env = process.env.NODE_ENV === 'development' ? 'development' : 'production'
export default config[env]