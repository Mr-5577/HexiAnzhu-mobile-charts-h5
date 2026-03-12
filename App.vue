<script>
import config from '@/utils/config.js'
// 白名单：不需要登录token就能访问的页面
const WHITE_LIST = ['pages/login/autoLogin']
export default {
	onLaunch: function () {
		// console.log('App Launch')
		console.log('process.env.NODE_ENV:', process.env.NODE_ENV)
		console.log('config:', config)
	},
	onShow: function () {
		// console.log('App Show')
		// 每次显示页面都检查登录状态
		this.checkTokenBeforeEnter()
	},
	onHide: function () {
		// console.log('App Hide')
	},
	methods: {
		checkTokenBeforeEnter() {
			try {
				const pages = getCurrentPages()
				if (pages.length === 0) return

				const currentPage = pages[pages.length - 1]
				const route = currentPage.route
				console.log('当前路由:', route)

				// 检查是否在白名单中,白名单页面不检查token
				if (WHITE_LIST.includes(route)) return

				// 检查token
				const token = uni.getStorageSync('token')
				if (!token) {
					// 如果当前已经是登录页，不重复跳转
					if (route === 'pages/login/autoLogin') return
					// 清除 token 缓存
					uni.removeStorageSync("token")
					// 跳转到自动登录页
					uni.reLaunch({
						url: "/pages/login/autoLogin"
					})
				}
			} catch (error) {
				console.error('检查登录状态出错:', error)
			}
		}
	}
}
</script>

<style>
/* 1. 盒子模型统一 */
* {
	box-sizing: border-box;
	-webkit-tap-highlight-color: transparent;
}

/* 2. 字体缩放固定 */
body {
	-webkit-text-size-adjust: 100%;
	text-size-adjust: 100%;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

/* 3. 安全区工具类 */
.safe-pb {
	padding-bottom: constant(safe-area-inset-bottom);
	padding-bottom: env(safe-area-inset-bottom);
}

.safe-pt {
	padding-top: constant(safe-area-inset-top);
	padding-top: env(safe-area-inset-top);
}

.safe-pl {
	padding-left: constant(safe-area-inset-left);
	padding-left: env(safe-area-inset-left);
}

.safe-pr {
	padding-right: constant(safe-area-inset-right);
	padding-right: env(safe-area-inset-right);
}

/* 4. 1px 边框问题处理（如果需要） */
.border-bottom-1px {
	position: relative;
}

.border-bottom-1px::after {
	content: '';
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: #e5e5e5;
	transform: scaleY(0.5);
	transform-origin: 0 0;
}
</style>
