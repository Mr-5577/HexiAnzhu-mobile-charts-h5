<template>
	<view class="home-page">
		<!-- 固定导航栏 -->
		<custom-navbar title="数据驾驶舱" :show-back="false" fixed :backgroundColor="navbarBgColor"
			:title-color="navbarTitleColor" :translucent="true" :border-bottom="showNavBorder">
			<template #right>
				<view @click="openSearchPopup">
					<uni-icons type="search" size="20" color="#333" />
				</view>
			</template>
		</custom-navbar>

		<!-- 滚动内容区域 -->
		<scroll-view class="scroll-container" :style="contentTopStyle" scroll-y :refresher-enabled="true"
			:refresher-triggered="refresherTriggered" refresher-default-style="none" refresher-background="#fff"
			@refresherrefresh="onRefresh" @refresherpulling="onPulling" @refresherrestore="onRestore" @scroll="onScroll"
			:show-scrollbar="false" :scroll-top="scrollTopVal" :scroll-with-animation="true">
			<!-- 下拉刷新区域 -->
			<view class="refresher-container" :style="{ height: pullHeight + 'px' }">
				<view class="refresher-content" :class="{ refreshing: refresherTriggered }">
					<view class="loading-animation" v-if="refresherTriggered">
						<view class="spinner">
							<view class="spinner-dot" v-for="i in 5" :key="i"
								:style="{ 'animationDelay': (i - 1) * 0.1 + 's' }">
							</view>
						</view>
					</view>
					<text class="refresh-text">{{ refreshText }}</text>
				</view>
			</view>

			<!-- 主内容 -->
			<view class="content">
				<inventory></inventory>
				<goal-achieved></goal-achieved>
				<achievement-rate></achievement-rate>
				<conversion-metrics></conversion-metrics>
				<performance-trend></performance-trend>
				<financial-statistics></financial-statistics>
				<structural-statistic></structural-statistic>
				<performance-ranking></performance-ranking>
				<view class="bottom-tips" v-if="showBottomTips">
					<text>—— 我是有底线的 ——</text>
				</view>
			</view>
		</scroll-view>

		<!-- 回到顶部按钮 -->
		<view class="scroll-to-top" v-show="showScrollTopBtn" @click="scrollToTop">
			<uni-icons type="arrow-up" size="20" color="#fff" />
		</view>
	</view>

	<!-- 搜索弹窗组件 -->
	<uni-popup ref="searchPopupRef" type="right" background-color="#fff" border-radius="15rpx 0 0 15rpx"
		:is-mask-click="false">
		<view class="search-popup-form">
			<view class="form-container">
				<view class="form-item project-select">
					<view class="item-label">项目</view>
					<view class="item-content" @click="showProjectSelect">
						<text class="item-text" :class="{ 'placeholder': selectedIds.length === 0 }">
							{{ selectedIds.length > 0 ? `${selectedIds.length}个项目` : '选择项目' }}
						</text>
						<uni-icons type="right" size="16" color="#999" />
					</view>
				</view>

				<view class="form-item date-picker">
					<view class="item-label">日期</view>
					<picker mode="date" :value="dateTime" @change="bindTimeChange">
						<view class="item-content">
							<text class="item-text">{{ dateTime }}</text>
						</view>
					</picker>
				</view>

				<view class="form-item query-action">
					<button class="cancel-btn" @click="closeSearchPop">取消</button>
					<button class="query-btn" @click="handleSearch">查询</button>
				</view>
			</view>
		</view>
	</uni-popup>

	<!-- 项目选择弹窗组件 -->
	<project-select-popup ref="projectSelectPopupRef" :selectedIds="selectedIds" @confirm="handleProjectConfirm" />
</template>

<script setup>
import CustomNavbar from '@/components/custom-navbar/custom-navbar.vue'
import ProjectSelectPopup from './project-select-popup.vue'
import Inventory from './components/inventory.vue'
import GoalAchieved from './components/goal-achieved.vue'
import AchievementRate from './components/achievement-rate.vue'
import ConversionMetrics from './components/conversion-metrics.vue'
import PerformanceTrend from './components/performance-trend.vue'
import FinancialStatistics from './components/financial-statistics.vue'
import StructuralStatistic from './components/structural-statistic.vue'
import PerformanceRanking from './components/performance-ranking.vue'
import dayjs from 'dayjs'
import { ref, computed, onMounted } from 'vue'

// 响应式数据
const isReadyToRefresh = ref(false)
const pullHeight = ref(0)
const isPulling = ref(false)
const refresherTriggered = ref(false)
const refreshComplete = ref(false)
const refreshText = ref('下拉刷新')
const scrollTop = ref(0)
const scrollTopVal = ref(0) // 用于控制scroll-view滚动位置
const showScrollTopBtn = ref(false)
const showBottomTips = ref(false)
const navbarBgColor = ref('rgba(255, 255, 255, 0)')
const navbarTitleColor = ref('#ffffff')
const showNavBorder = ref(false)
const searchPopupRef = ref(null)
const projectSelectPopupRef = ref(null)
const selectedIds = ref([]) // 选中的项目ID集合
const dateTime = ref('') // 选中的时间日期

// 计算内容区域顶部padding
const contentTopStyle = computed(() => {
	const info = uni.getSystemInfoSync()
	const statusBarHeight = info.statusBarHeight || 0
	return { paddingTop: (statusBarHeight + 44) + 'px' }
})

// 下拉刷新相关方法
const onRefresh = () => {
	refresherTriggered.value = true
	refreshText.value = '正在刷新...'
	refreshComplete.value = false

	setTimeout(() => {
		refreshComplete.value = true
		refreshText.value = '刷新成功'
		uni.showToast({ title: '刷新成功', icon: 'success', duration: 1500 })

		setTimeout(() => {
			refresherTriggered.value = false
			refreshComplete.value = false
			refreshText.value = '下拉刷新'
		}, 1000)
	}, 1500)
}
// 自定义下拉刷新控件被下拉
const onPulling = (e) => {
	isPulling.value = true
	const height = e.detail.deltaY
	pullHeight.value = Math.min(height, 120)

	if (height > 80) {
		isReadyToRefresh.value = true
		refreshText.value = '释放刷新'
	} else {
		isReadyToRefresh.value = false
		refreshText.value = '下拉刷新'
	}
}
// 自定义下拉刷新被复位
const onRestore = () => {
	if (!refresherTriggered.value) {
		setTimeout(() => {
			pullHeight.value = 0
			isPulling.value = false
			isReadyToRefresh.value = false
			refreshText.value = '下拉刷新'
		}, 300)
	}
}

// 滚动事件处理
const onScroll = (e) => {
	scrollTop.value = e.detail.scrollTop
	// 控制导航栏透明度
	const alpha = Math.min(scrollTop.value / 100, 1)
	navbarTitleColor.value = alpha > 0.5 ? '#333333' : '#ffffff'
	showNavBorder.value = alpha > 0.8
	// 显示/隐藏返回顶部按钮
	showScrollTopBtn.value = scrollTop.value > 50

	// 判断是否到达底部
	const { scrollHeight, scrollViewHeight, scrollTop: scrollTopPos } = e.detail
	if (scrollHeight - scrollViewHeight - scrollTopPos < 50) {
		showBottomTips.value = true
		loadMoreData()
	}
}
const loadMoreData = () => console.log('加载更多数据...')

// 回到顶部
const scrollToTop = () => {
	scrollTopVal.value = scrollTop.value
	// 通过nextTick确保scroll-top值被重置时能触发滚动
	setTimeout(() => {
		scrollTopVal.value = 0
		showScrollTopBtn.value = false
	}, 10)
}

// 搜索相关方法
const openSearchPopup = () => searchPopupRef.value?.open()
const closeSearchPop = () => searchPopupRef.value?.close()
const handleSearch = () => searchPopupRef.value?.close()

// 项目选择相关方法
const showProjectSelect = () => projectSelectPopupRef.value?.openPopup()
const handleProjectConfirm = (projectIds) => {
	selectedIds.value = projectIds
}

// 日期选择
const bindTimeChange = (e) => dateTime.value = e.detail.value

// 生命周期
onMounted(() => dateTime.value = dayjs().format('YYYY-MM-DD'))
</script>

<style lang="scss" scoped>
.home-page {
	width: 100%;
	height: 100vh;
	background: linear-gradient(135deg, #e0f7fa 0%, #ffebee 100%);
}

.scroll-container {
	height: 100vh;
	width: 100%;
	box-sizing: border-box;

	:deep(.uni-scroll-view-refresher) {
		display: none !important;
	}
}

.refresher-container {
	overflow: hidden;
	transition: height 0.3s ease;
	display: flex;
	justify-content: center;
	align-items: flex-end;

	.refresher-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		transition: transform 0.3s ease;

		&.refreshing {
			animation: pulse 1.5s ease-in-out infinite;
		}

		.loading-animation {
			.spinner {
				display: flex;
				align-items: center;
				justify-content: center;
				height: 40rpx;

				.spinner-dot {
					width: 15rpx;
					height: 15rpx;
					border-radius: 50%;
					margin: 0 6rpx;
					animation: dot-bounce 1.4s ease-in-out infinite both;

					&:nth-child(1) {
						background-color: #36cfc9;
					}

					&:nth-child(2) {
						background-color: #f759ab;
					}

					&:nth-child(3) {
						background-color: #999999;
					}

					&:nth-child(4) {
						background-color: #fac858;
					}

					&:nth-child(5) {
						background-color: #5470c6;
					}
				}
			}
		}

		.refresh-text {
			font-size: 24rpx;
			color: #999999;
			margin-top: 10rpx;
			transition: color 0.3s ease;
		}
	}
}

.content {
	min-height: 100vh;
	padding: 30rpx;
	box-sizing: border-box;
	gap: 30rpx;
	display: flex;
	flex-direction: column;
}

.search-popup-form {
	width: 70vw;
	height: 100%;
	background: #fff;
	padding: 48rpx 40rpx;
	box-sizing: border-box;

	.form-container {
		display: flex;
		flex-direction: column;
		gap: 48rpx;

		.form-item {
			.item-label {
				font-size: 30rpx;
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
				transition: all 0.3s ease;
				border: 1rpx solid #e6f0ff;

				&:active {
					background: #f0f0f0;
					transform: scale(0.98);
				}

				.item-text {
					font-size: 28rpx;
					color: #666;
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
				border: 1rpx solid #e6f0ff;
			}

			&.query-action {
				margin-top: 50rpx;
				display: flex;
				justify-content: space-between;
				gap: 24rpx;

				.cancel-btn,
				.query-btn {
					height: 60rpx;
					width: 150rpx;
					display: flex;
					justify-content: center;
					align-items: center;
					font-size: 28rpx;
					border-radius: 12rpx;
					transition: all 0.3s ease;
				}

				.cancel-btn {
					background: #f8f8f8;
					color: #666;
				}

				.query-btn {
					// background: linear-gradient(135deg, #36cfc9 0%, #f759ab 100%);
					background: linear-gradient(135deg, #409eff 0%, #626aef 100%);
					color: #fff;
				}
			}
		}
	}
}

.bottom-tips {
	padding: 40rpx 0;
	text-align: center;
	font-size: 26rpx;
	color: #cccccc;
}

.scroll-to-top {
	position: fixed;
	right: 32rpx;
	bottom: 100rpx;
	width: 70rpx;
	height: 70rpx;
	border-radius: 50%;
	// background: linear-gradient(135deg, #f06292 0%, #ff8a80 100%);
	background: linear-gradient(135deg, #409eff 0%, #626aef 100%);
	backdrop-filter: blur(10rpx);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;
	transition: all 0.3s ease;
}

@keyframes dot-bounce {

	0%,
	80%,
	100% {
		transform: scale(0);
		opacity: 0.6;
	}

	40% {
		transform: scale(1);
		opacity: 1;
	}
}

@keyframes pulse {

	0%,
	100% {
		opacity: 1;
	}

	50% {
		opacity: 0.7;
	}
}

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
</style>