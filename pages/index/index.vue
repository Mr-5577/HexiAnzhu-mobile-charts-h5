<template>
	<!-- 固定导航栏 -->
	<custom-navbar title="首页" :show-back="false" fixed :backgroundColor="navbarBgColor" :title-color="navbarTitleColor"
		:translucent="true" :border-bottom="showNavBorder" @home="handleHomeClick">
		<!-- 右侧自定义内容 -->
		<template #right>
			<view class="right-actions">
				<text class="iconfont icon-search" @click="handleSearch">🔍</text>
			</view>
		</template>
	</custom-navbar>

	<!-- 滚动内容区域 -->
	<scroll-view class="scroll-container" scroll-y :refresher-enabled="true" :refresher-triggered="refresherTriggered"
		refresher-background="#f8f8f8" @refresherrefresh="onRefresh" @scroll="onScroll" :show-scrollbar="false">
		<!-- 下拉刷新区域 -->
		<view class="refresher-container" v-if="refresherTriggered">
			<view class="refresher-content">
				<image v-if="!refreshComplete" src="/static/loading.gif" class="loading-icon"></image>
				<text class="refresh-text">{{ refreshText }}</text>
			</view>
		</view>

		<!-- 主内容 -->
		<view class="content">
			<!-- 顶部占位 -->
			<view class="content-top-placeholder" :style="contentTopStyle"></view>

			<!-- Logo区域 -->
			<view class="banner-section">
				<image class="logo" src="/static/logo.png" mode="aspectFit"></image>
				<text class="welcome-text">欢迎使用</text>
				<text class="app-name">{{ appName }}</text>
			</view>

			<!-- 功能卡片 -->
			<view class="card-section">
				<view class="card-grid">
					<view class="card-item" v-for="item in featureList" :key="item.id" @click="handleCardClick(item)">
						<view class="card-icon">
							<text class="iconfont" :class="item.icon">{{ item.iconText }}</text>
						</view>
						<text class="card-title">{{ item.title }}</text>
						<text class="card-desc">{{ item.desc }}</text>
					</view>
				</view>
			</view>

			<!-- 列表内容 -->
			<view class="list-section">
				<view class="section-header">
					<text class="section-title">最新动态</text>
					<text class="section-more" @click="handleMore">查看更多 ></text>
				</view>
				<view class="news-list">
					<view class="news-item" v-for="(news, index) in newsList" :key="index"
						@click="handleNewsClick(news)">
						<view class="news-left">
							<text class="news-title">{{ news.title }}</text>
							<text class="news-time">{{ news.time }}</text>
						</view>
						<image v-if="news.image" :src="news.image" class="news-image" mode="aspectFill"></image>
					</view>
				</view>
			</view>

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
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'

// 响应式数据
const title = ref('首页')
const refresherTriggered = ref(false)
const refreshComplete = ref(false)
const refreshText = ref('下拉刷新')
const scrollTop = ref(0)
const showScrollTopBtn = ref(false)
const showBottomTips = ref(false)
const navbarBgColor = ref('rgba(255, 255, 255, 0)')
const navbarTitleColor = ref('#ffffff')
const showNavBorder = ref(false)
const appName = ref('我的应用')

// 功能列表数据
const featureList = ref([
	{ id: 1, title: '功能一', desc: '功能描述一', icon: 'icon-feature1', iconText: '⭐' },
	{ id: 2, title: '功能二', desc: '功能描述二', icon: 'icon-feature2', iconText: '🚀' },
	{ id: 3, title: '功能三', desc: '功能描述三', icon: 'icon-feature3', iconText: '💡' },
	{ id: 4, title: '功能四', desc: '功能描述四', icon: 'icon-feature4', iconText: '🔧' }
])

// 新闻列表数据
const newsList = ref([
	{ id: 1, title: '系统更新通知', time: '2024-01-15', image: '' },
	{ id: 2, title: '春节活动即将开启', time: '2024-01-14', image: '/static/news1.jpg' },
	{ id: 3, title: '用户反馈报告', time: '2024-01-13', image: '' },
	{ id: 4, title: '新功能上线公告', time: '2024-01-12', image: '/static/news2.jpg' }
])

// 计算内容区域顶部padding
const contentTopStyle = computed(() => {
	const info = uni.getSystemInfoSync()
	const statusBarHeight = info.statusBarHeight || 0
	const navBarHeight = 44 // 导航栏内容高度
	const totalHeight = statusBarHeight + navBarHeight

	return {
		height: totalHeight + 'px'
	}
})

// 下拉刷新
const onRefresh = () => {
	refresherTriggered.value = true
	refreshText.value = '正在刷新...'
	refreshComplete.value = false

	// 模拟异步请求
	setTimeout(() => {
		refreshComplete.value = true
		refreshText.value = '刷新成功'

		setTimeout(() => {
			refresherTriggered.value = false
			refreshText.value = '下拉刷新'
			refreshComplete.value = false

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

// 点击事件处理
const handleHomeClick = () => {
	console.log('点击首页按钮')
	scrollToTop()
}

const handleSearch = () => {
	uni.navigateTo({
		url: '/pages/search/search'
	})
}

const handleMessage = () => {
	uni.navigateTo({
		url: '/pages/message/message'
	})
}

const handleCardClick = (item) => {
	uni.showToast({
		title: `点击了${item.title}`,
		icon: 'none'
	})
}

const handleNewsClick = (news) => {
	uni.navigateTo({
		url: `/pages/news/detail?id=${news.id}`
	})
}

const handleMore = () => {
	uni.navigateTo({
		url: '/pages/news/list'
	})
}

// 监听页面显示/隐藏
onMounted(() => {
	// 页面加载时的初始化
	console.log('首页加载完成')
})

onUnmounted(() => {
	// 清理工作
})
</script>

<style lang="scss" scoped>
/* 滚动容器 */
.scroll-container {
	height: 100vh;
	width: 100%;
	box-sizing: border-box;
}

/* 下拉刷新样式 */
.refresher-container {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 30rpx 0;

	.refresher-content {
		display: flex;
		flex-direction: column;
		align-items: center;

		.loading-icon {
			width: 60rpx;
			height: 60rpx;
			margin-bottom: 20rpx;
		}

		.refresh-text {
			font-size: 28rpx;
			color: #999999;
		}
	}
}

/* 内容区域 */
.content {
	min-height: 100vh;
	background: linear-gradient(180deg, #007AFF 0%, #F8F8F8 300rpx);

	.content-top-placeholder {
		width: 100%;
	}
}

/* Banner区域 */
.banner-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 60rpx 32rpx 80rpx;
	color: #ffffff;

	.logo {
		width: 180rpx;
		height: 180rpx;
		border-radius: 36rpx;
		margin-bottom: 40rpx;
		box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.1);
	}

	.welcome-text {
		font-size: 32rpx;
		margin-bottom: 16rpx;
		opacity: 0.9;
	}

	.app-name {
		font-size: 48rpx;
		font-weight: bold;
		margin-bottom: 20rpx;
	}
}

/* 卡片区域 */
.card-section {
	background: transparent;
	padding: 0 32rpx 40rpx;
	margin-top: -40rpx;

	.card-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 24rpx;

		.card-item {
			background: #ffffff;
			border-radius: 24rpx;
			padding: 40rpx 32rpx;
			box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.08);
			display: flex;
			flex-direction: column;
			align-items: center;
			transition: all 0.3s ease;

			&:active {
				transform: scale(0.98);
				box-shadow: 0 5rpx 15rpx rgba(0, 0, 0, 0.1);
			}

			.card-icon {
				width: 80rpx;
				height: 80rpx;
				border-radius: 50%;
				background: linear-gradient(135deg, #007AFF, #00C6FF);
				display: flex;
				align-items: center;
				justify-content: center;
				margin-bottom: 24rpx;

				.iconfont {
					font-size: 40rpx;
					color: #ffffff;
				}
			}

			.card-title {
				font-size: 32rpx;
				font-weight: 600;
				color: #333333;
				margin-bottom: 12rpx;
			}

			.card-desc {
				font-size: 26rpx;
				color: #999999;
				text-align: center;
				line-height: 1.4;
			}
		}
	}
}

/* 列表区域 */
.list-section {
	background: #ffffff;
	border-radius: 40rpx 40rpx 0 0;
	padding: 40rpx 32rpx;
	margin-top: 20rpx;

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 32rpx;

		.section-title {
			font-size: 36rpx;
			font-weight: bold;
			color: #333333;
		}

		.section-more {
			font-size: 28rpx;
			color: #007AFF;

			&:active {
				opacity: 0.7;
			}
		}
	}

	.news-list {
		.news-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 32rpx 0;
			border-bottom: 1rpx solid #f0f0f0;

			&:last-child {
				border-bottom: none;
			}

			.news-left {
				flex: 1;
				margin-right: 32rpx;

				.news-title {
					font-size: 32rpx;
					color: #333333;
					margin-bottom: 12rpx;
					display: -webkit-box;
					-webkit-box-orient: vertical;
					-webkit-line-clamp: 2;
					overflow: hidden;
				}

				.news-time {
					font-size: 26rpx;
					color: #999999;
				}
			}

			.news-image {
				width: 160rpx;
				height: 120rpx;
				border-radius: 16rpx;
			}
		}
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

/* 右侧操作区域 */
.right-actions {
	display: flex;
	align-items: center;

	.iconfont {
		font-size: 40rpx;
		margin-left: 20rpx;
		color: inherit;
		position: relative;

		&:active {
			opacity: 0.7;
		}

		.message-badge {
			position: absolute;
			top: -10rpx;
			right: -10rpx;
			background: #ff3b30;
			color: #ffffff;
			font-size: 20rpx;
			min-width: 32rpx;
			height: 32rpx;
			border-radius: 16rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0 8rpx;
			font-weight: bold;
		}
	}
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
	.scroll-container {
		background-color: #000000;
	}

	.content {
		background: linear-gradient(180deg, #007AFF 0%, #1a1a1a 300rpx);
	}

	.card-section .card-item {
		background: #2a2a2a;

		.card-title {
			color: #ffffff;
		}

		.card-desc {
			color: #999999;
		}
	}

	.list-section {
		background: #1a1a1a;

		.section-title {
			color: #ffffff;
		}

		.news-item {
			border-bottom-color: #333333;

			.news-title {
				color: #ffffff;
			}
		}
	}
}
</style>