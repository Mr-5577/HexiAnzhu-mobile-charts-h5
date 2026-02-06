<template>
	<!-- 固定导航栏 -->
	<custom-navbar title="数据驾驶舱" :show-back="false" fixed :backgroundColor="navbarBgColor"
		:title-color="navbarTitleColor" :translucent="true" :border-bottom="showNavBorder">
		<!-- 右侧自定义内容 -->
		<template #right>
			<view @click="openSearchPopup">
				<uni-icons type="search" size="20" color="#333" />
			</view>
		</template>
	</custom-navbar>

	<!-- 滚动内容区域 -->
	<scroll-view class="scroll-container" :style="contentTopStyle" scroll-y :refresher-enabled="true"
		:refresher-triggered="refresherTriggered" refresher-default-style="none" refresher-background="#fff"
		@refresherrefresh="onRefresh" @scroll="onScroll" :show-scrollbar="false">
		<!-- 主内容 -->
		<view class="content">
			<!-- 底部提示 -->
			<view class="bottom-tips" v-if="showBottomTips">
				<text>—— 我是有底线的 ——</text>
			</view>

			<!-- 滚动到顶部按钮 -->
			<view class="scroll-to-top" v-show="showScrollTopBtn" @click="scrollToTop">
				<text class="iconfont icon-top">↑</text>
			</view>
		</view>
	</scroll-view>
	<!-- 搜索弹窗组件 -->
	<uni-popup ref="searchPopupRef" type="right" background-color="#fff" border-radius="15rpx 0 0 15rpx"
		:is-mask-click="false">
		<view class="search-popup-form">
			<view class="form-container">
				<!-- 项目选择 -->
				<view class="form-item project-select">
					<view class="item-lable">项目</view>
					<view class="item-content" @click="showProjectSelect">
						<text class="item-text" :class="{ 'placeholder': selectedProjects.length === 0 }">
							{{ selectedProjects.length > 0 ? `${selectedProjects.length}个项目` : '选择项目' }}
						</text>
						<text class="iconfont icon-arrow">›</text>
					</view>
				</view>
				<!-- 日期选择 -->
				<view class="form-item date-picker">
					<view class="item-lable">日期</view>
					<picker mode="date" :value="dateTime" @change="bindTimeChange">
						<view class="item-content">
							<text class="item-text">{{ dateTime }}</text>
						</view>
					</picker>
				</view>
				<!-- 查询按钮 -->
				<view class="form-item query-action">
					<button class="cancel-btn" @click="closeSearchPop">
						<text>取消</text>
					</button>
					<button class="query-btn">
						<text>查询</text>
					</button>
				</view>
			</view>
		</view>
	</uni-popup>
	<!-- 项目选择弹窗组件 -->
	<project-select-popup ref="projectSelectPopupRef" @confirm="handleProjectConfirm" />
</template>

<script setup>
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'
import ProjectSelectPopup from './project-select-popup.vue'
import dayjs from 'dayjs'
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 响应式数据
const refresherTriggered = ref(false)
const scrollTop = ref(0)
const showScrollTopBtn = ref(false)
const showBottomTips = ref(false)
const navbarBgColor = ref('rgba(255, 255, 255, 0)')
const navbarTitleColor = ref('#ffffff')
const showNavBorder = ref(false)
const searchPopupRef = ref(null)
// 创建模板引用
const projectSelectPopupRef = ref(null)
// 存储选中的项目
const selectedProjects = ref([])
const dateTime = ref('')

// 计算内容区域顶部padding
const contentTopStyle = computed(() => {
	const info = uni.getSystemInfoSync()
	const statusBarHeight = info.statusBarHeight || 0
	const navBarHeight = 44 // 导航栏内容高度
	const totalHeight = statusBarHeight + navBarHeight
	return {
		paddingTop: totalHeight + 'px'
	}
})

// 下拉刷新
const onRefresh = () => {
	refresherTriggered.value = true

	// 模拟异步请求
	setTimeout(() => {
		uni.stopPullDownRefresh && uni.stopPullDownRefresh()
		setTimeout(() => {
			refresherTriggered.value = false

			// 这里可以更新数据
			uni.showToast({
				title: '刷新成功',
				icon: 'success',
				duration: 1500
			})
		}, 1000)
	}, 1500)
}

// 滚动事件处理
const onScroll = (e) => {
	scrollTop.value = e.detail.scrollTop

	// 控制导航栏透明度
	const alpha = Math.min(scrollTop.value / 100, 1)
	navbarBgColor.value = `rgba(255, 255, 255, ${alpha})`
	navbarTitleColor.value = alpha > 0.5 ? '#333333' : '#ffffff'
	showNavBorder.value = alpha > 0.8

	// 显示/隐藏返回顶部按钮
	showScrollTopBtn.value = scrollTop.value > 500

	// 判断是否到达底部
	const scrollHeight = e.detail.scrollHeight
	const scrollViewHeight = e.detail.scrollViewHeight
	const scrollTopPos = e.detail.scrollTop

	if (scrollHeight - scrollViewHeight - scrollTopPos < 50) {
		showBottomTips.value = true
		loadMoreData()
	}
}

// 加载更多数据
const loadMoreData = () => {
	console.log('加载更多数据...')
	// 这里可以加载更多数据
}

// 滚动到顶部
const scrollToTop = () => {
	uni.pageScrollTo({
		scrollTop: 0,
		duration: 300
	})
	showScrollTopBtn.value = false
}
// 打开搜索弹窗
const openSearchPopup = () => {
	console.log('1324354')
	if (searchPopupRef.value) {
		searchPopupRef.value.open()
	}
}

// 打开项目选择弹窗
const showProjectSelect = () => {
	if (projectSelectPopupRef.value) {
		// 调用子组件暴露的 openPopup 方法
		projectSelectPopupRef.value.openPopup()
	}
}

// 处理项目选择确认
const handleProjectConfirm = (projects) => {
	selectedProjects.value = projects
	console.log('父组件收到选中的项目:', projects)
	// 这里可以处理选中的项目数据
	uni.showToast({
		title: `已选择 ${projects.length} 个项目`,
		icon: 'success'
	})
}
// 选择时间
const bindTimeChange = (e) => {
	dateTime.value = e.detail.value
}
const closeSearchPop = () => {
	if (searchPopupRef.value) {
		searchPopupRef.value.close()
	}
}
// 监听页面显示/隐藏
onMounted(() => {
	dateTime.value = dayjs().format('YYYY-MM-DD')
})

onUnmounted(() => {
})
</script>

<style lang="scss" scoped>
/* 滚动容器 */
.scroll-container {
	height: 100vh;
	width: 100%;
	box-sizing: border-box;
}

/* 内容区域 */
.content {
	min-height: 100vh;
}

/* 搜索弹窗样式优化 */
.search-popup-form {
	width: 70vw;
	/* 略微增加宽度 */
	height: 100%;
	background: #fff;
	display: flex;
	flex-direction: column;
	padding: 48rpx 40rpx;
	/* 增加内边距 */
	box-sizing: border-box;

	.form-container {
		display: flex;
		flex-direction: column;
		gap: 48rpx;
		/* 增加表单项间距 */

		.form-item {
			.item-lable {
				font-size: 28rpx;
				color: #666;
				margin-bottom: 16rpx;
				font-weight: 500;
			}

			.item-content {
				display: flex;
				align-items: center;
				justify-content: space-between;
				background: #f8f8f8;
				border-radius: 12rpx;
				padding: 18rpx 26rpx;
				border: 1rpx solid transparent;
				transition: all 0.3s ease;

				&:active {
					background: #f0f0f0;
					transform: scale(0.98);
				}

				.iconfont {
					font-size: 32rpx;

					&.icon-arrow {
						color: #999;
						font-size: 36rpx;
						font-weight: bold;
						transition: transform 0.3s ease;
					}
				}

				.item-text {
					font-size: 30rpx;
					color: #333;
					font-weight: 500;
					flex: 1;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;

					&.placeholder {
						color: #999;
						font-weight: normal;
					}
				}
			}

			&.date-picker .item-content {
				background: #f0f7ff;
				/* 日期选择器特殊背景色 */
				border-color: #e6f0ff;
			}

			&.project-select .item-content:hover .icon-arrow {
				transform: translateX(4rpx);
				/* 悬停时箭头微动 */
			}

			&.query-action {
				margin-top: 64rpx;
				/* 增加与上面元素的间距 */
				display: flex;
				justify-content: space-between;
				gap: 24rpx;
				/* 按钮间增加间距 */

				.cancel-btn,
				.query-btn {
					flex: 1;
					height: 88rpx;
					/* 增加按钮高度 */
					display: flex;
					justify-content: center;
					align-items: center;
					font-size: 34rpx;
					/* 增大字体 */
					border-radius: 12rpx;
					/* 统一圆角 */
					font-weight: 500;
					transition: all 0.3s ease;
					border: none;

					&:active {
						transform: scale(0.96);
					}
				}

				.cancel-btn {
					background: #f8f8f8;
					color: #666;
					border: 1rpx solid #e0e0e0;

					&:active {
						background: #f0f0f0;
					}
				}

				.query-btn {
					background: linear-gradient(135deg, #007aff, #0056cc);
					/* 渐变背景 */
					color: #fff;
					box-shadow: 0 8rpx 24rpx rgba(0, 122, 255, 0.3);

					&:active {
						background: linear-gradient(135deg, #0056cc, #004099);
						box-shadow: 0 4rpx 16rpx rgba(0, 122, 255, 0.2);
					}
				}
			}
		}
	}
}

/* 弹窗打开动画效果 - 可以在uni-popup上添加 */
::v-deep .uni-popup__wrapper--right {
	animation: slideInRight 0.3s ease;
}

@keyframes slideInRight {
	from {
		transform: translateX(100%);
	}

	to {
		transform: translateX(0);
	}
}

/* 底部提示 */
.bottom-tips {
	padding: 40rpx 0;
	text-align: center;
	font-size: 26rpx;
	color: #cccccc;
}

/* 滚动到顶部按钮 */
.scroll-to-top {
	position: fixed;
	right: 32rpx;
	bottom: 150rpx;
	width: 88rpx;
	height: 88rpx;
	border-radius: 50%;
	background: rgba(0, 122, 255, 0.9);
	backdrop-filter: blur(10rpx);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 10rpx 30rpx rgba(0, 122, 255, 0.3);
	z-index: 999;
	transition: all 0.3s ease;

	&:active {
		transform: scale(0.95);
		background: rgba(0, 122, 255, 1);
	}

	.icon-top {
		font-size: 40rpx;
		color: #ffffff;
		font-weight: bold;
	}
}
</style>