<script>
export default {
	onLaunch: function () {
		// console.log('App Launch')
		console.log('process.env.NODE_ENV:', process.env.NODE_ENV)
	},
	onShow: function () {
		// console.log('App Show')
	},
	onHide: function () {
		// console.log('App Hide')
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
