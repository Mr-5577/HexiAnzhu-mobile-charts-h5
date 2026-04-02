<template>
	<view class="home-page">
		<!-- 固定导航栏 -->
		<custom-navbar title="销售驾驶舱" :show-left="true" :show-more-menu="true" :show-right="true" fixed
			:translucent="true" :border-bottom="showNavBorder">
			<template #right>
				<view @click="openSearchPopup">
					<uni-icons type="search" size="22" color="#333" />
				</view>
			</template>
		</custom-navbar>

		<!-- 滚动内容区域 -->
		<scroll-view class="scroll-container" :style="contentTopStyle" scroll-y :refresher-enabled="true"
			:refresher-triggered="refresherTriggered" refresher-default-style="none" refresher-background="#fff"
			@refresherrefresh="onRefresh" @refresherpulling="onPulling" @refresherrestore="onRestore" @scroll="onScroll"
			:show-scrollbar="false" :scroll-top="scrollTopVal" :scroll-with-animation="true" :lower-threshold="30"
			@scrolltolower="onScrollToLower" :refresher-threshold="100" @touchend="onTouchEnd">
			<!-- 下拉刷新状态 -->
			<pull-down-refresh :pull-height="pullHeight" :refresher-triggered="refresherTriggered"
				:refresh-text="refreshText" />

			<!-- 主内容 -->
			<view class="main-content">
				<!-- 渠道及转化 -->
				<achievement-rate ref="achievementRateRef" :projectIds="projectIds"
					:dateTime="dateTime"></achievement-rate>
				<!-- 目标达成统计 -->
				<goal-achieved ref="goalAchievedRef" :projectIds="projectIds" :dateTime="dateTime"></goal-achieved>
				<!-- 业绩走势情况 -->
				<performance-trend ref="performanceTrendRef" :projectIds="projectIds"
					:dateTime="dateTime"></performance-trend>
				<!-- 转化指标情况 -->
				<conversion-metrics ref="conversionMetricsRef" :projectIds="projectIds"
					:dateTime="dateTime"></conversion-metrics>
				<!-- 业务指标 -->
				<financial-statistics ref="financialStatisticsRef" :projectIds="projectIds"
					:dateTime="dateTime"></financial-statistics>
				<!-- 资产与应收统计 -->
				<structural-statistic ref="structuralStatisticRef" :projectIds="projectIds"
					:dateTime="dateTime"></structural-statistic>
				<!-- 业绩排名统计 -->
				<performance-ranking ref="performanceRankingRef" :projectIds="projectIds"
					:dateTime="dateTime"></performance-ranking>

				<view class="bottom-tips" v-if="showBottomTips">
					<text>—— 已加载全部 ——</text>
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
						<text class="item-text" :class="{ 'placeholder': projectIds.length === 0 }">
							{{ projectIds.length > 0 ? `${projectIds.length}个项目` : '选择项目' }}
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
	<project-select-popup ref="projectSelectPopupRef" :projectList="projectList" :selectedIds="projectIds"
		@confirm="handleProjectConfirm" />
</template>

<script setup>
import CustomNavbar from '@/components/custom-navbar/index.vue'
import ProjectSelectPopup from '@/components/project-select-popup/index.vue'
import GoalAchieved from '@/pages/index/components/goal-achieved.vue'
import AchievementRate from '@/pages/index/components/achievement-rate.vue'
import ConversionMetrics from '@/pages/index/components/conversion-metrics.vue'
import PerformanceTrend from '@/pages/index/components/performance-trend.vue'
import FinancialStatistics from '@/pages/index/components/financial-statistics.vue'
import StructuralStatistic from '@/pages/index/components/structural-statistic.vue'
import PerformanceRanking from '@/pages/index/components/performance-ranking.vue'
import PullDownRefresh from '@/components/pull-down-refresh/index.vue'
import dayjs from 'dayjs'
import { ref, computed, onMounted } from 'vue'
import { largeScreenApi } from '@/common/api.js'
import { onLoad } from '@dcloudio/uni-app'

// 让组件不自动继承属性
defineOptions({
    inheritAttrs: false
})

// 响应式数据
const pullHeight = ref(0)
const isPulling = ref(false)
const refresherTriggered = ref(false)
const refreshText = ref('下拉刷新')
const scrollTop = ref(0)
const scrollTopVal = ref(0) // 用于控制scroll-view滚动位置
const showScrollTopBtn = ref(false)
const showBottomTips = ref(false)
const showNavBorder = ref(false)
const searchPopupRef = ref(null)
const projectSelectPopupRef = ref(null)
const projectList = ref([])
const projectIds = ref([]) // 选中的项目ID集合
const dateTime = ref('') // 选中的时间日期
// 子组件ref
const achievementRateRef = ref(null);
const goalAchievedRef = ref(null);
const performanceTrendRef = ref(null);
const conversionMetricsRef = ref(null);
const financialStatisticsRef = ref(null);
const structuralStatisticRef = ref(null);
const performanceRankingRef = ref(null);

// 计算内容区域顶部padding
const contentTopStyle = computed(() => {
	const info = uni.getSystemInfoSync()
	const statusBarHeight = info.statusBarHeight || 0
	return { paddingTop: (statusBarHeight + 44) + 'px' }
})

// 下拉刷新相关方法
const onRefresh = async () => {
	refresherTriggered.value = true
	refreshText.value = '正在刷新...'
	try {
		refreshText.value = '刷新成功,正在请求数据...'
		// // 刷新重置查询条件为初始值
		// dateTime.value = dayjs().format('YYYY-MM-DD')
		// await getProjectData()

		setTimeout(() => {
			// 手动触发子组件加载数据
			refreshAllComponents();
		}, 100);
	} catch (error) {
		refreshText.value = '刷新失败'
		uni.showToast({
			title: '刷新失败',
			icon: 'error',
			duration: 1500
		})
	} finally {
		// 无论成功失败，延迟关闭刷新状态
		setTimeout(() => {
			refresherTriggered.value = false
			setTimeout(() => {
				refreshText.value = '下拉刷新'
			}, 300)
		}, 1500)
	}
}
// 自定义下拉刷新控件被下拉
const onPulling = (e) => {
	isPulling.value = true
	const height = e.detail.deltaY
	pullHeight.value = Math.min(height, 100)

	// 根据下拉距离显示不同文字
	refreshText.value = height >= 100 ? '释放刷新' : '下拉刷新'
}
// 自定义下拉刷新被复位
const onRestore = () => {
	if (!refresherTriggered.value) {
		pullHeight.value = 0
		isPulling.value = false
		refreshText.value = '下拉刷新'
	}
}
// 添加触摸结束事件处理
const onTouchEnd = () => {
	// 如果正在下拉但未达到刷新阈值，且不是刷新状态，复位高度
	if (isPulling.value && !refresherTriggered.value && pullHeight.value < 100) {
		pullHeight.value = 0
		isPulling.value = false
		refreshText.value = '下拉刷新'
	}
}
// 滚动事件处理
const onScroll = (e) => {
	scrollTop.value = e.detail.scrollTop
	// 控制导航栏透明度
	// const alpha = Math.min(scrollTop.value / 100, 1)
	// showNavBorder.value = alpha > 0.8
	// 显示/隐藏返回顶部按钮
	showScrollTopBtn.value = scrollTop.value > 50
}
// 距离底部30px触发，配合lower-threshold属性
const onScrollToLower = () => {
	showBottomTips.value = true
	loadMoreData()
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
const handleSearch = () => {
	searchPopupRef.value?.close()
	refreshAllComponents()
}

// 项目选择相关方法
const showProjectSelect = () => projectSelectPopupRef.value?.openPopup()
const handleProjectConfirm = (selectedIds) => {
	projectIds.value = selectedIds
}

// 日期选择
const bindTimeChange = (e) => dateTime.value = e.detail.value
// 获取项目数据
const getProjectData = async () => {
	const result = await largeScreenApi.getProjTree()
	if (result.code === 200) {
		const list = result.data || []
		projectList.value = list
		projectIds.value = list.map((item => {
			return item.id
		}))
	}
}
// 统一刷新所有子组件
const refreshAllComponents = () => {
	const components = [
		achievementRateRef.value,
		goalAchievedRef.value,
		performanceTrendRef.value,
		conversionMetricsRef.value,
		financialStatisticsRef.value,
		structuralStatisticRef.value,
		performanceRankingRef.value,
	];
	components.forEach((component) => {
		if (component && typeof component.refreshData === "function") {
			component.refreshData();
		}
	});
};
onLoad((options) => {
	console.log('接收到的参数:', options)
	// 处理 day 参数
	if (options.day) {
		// 根据 day 参数设置日期  options.day 是字符串类型
		const dayValue = options.day
		// 假设 day 参数格式是 'YYYY-MM-DD'  需要验证日期格式的有效性
		if (dayjs(dayValue).isValid()) {
			dateTime.value = dayValue
		} else {
			dateTime.value = dayjs().format('YYYY-MM-DD')
		}
	}
})
// 生命周期
onMounted(async () => {
	// 只有在 onLoad 没有设置 dateTime 时才使用默认值
	if (!dateTime.value) {
		dateTime.value = dayjs().format('YYYY-MM-DD')
	}
	// 先加载项目数据再请求子组件数据
	await getProjectData()
	setTimeout(() => {
		// 手动触发子组件加载数据
		refreshAllComponents();
	}, 100);
})
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

.main-content {
	min-height: 100vh;
	padding: 30rpx;
	box-sizing: border-box;
	gap: 30rpx;
	display: flex;
	flex-direction: column;
}

// 查询表单样式
.search-popup-form {
	width: 70vw;
	height: 100%;
	background: #fff;
	padding: 48rpx 40rpx;
	box-sizing: border-box;

	.form-container {
		display: flex;
		flex-direction: column;
		gap: 40rpx;

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
				background: #f0f7ff;
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
					background: linear-gradient(135deg, #409eff 0%, #626aef 100%);
					color: #fff;
				}
			}
		}
	}
}

.bottom-tips {
	text-align: center;
	font-size: 26rpx;
	color: #999;
}

.scroll-to-top {
	position: fixed;
	right: 32rpx;
	bottom: 80rpx;
	width: 70rpx;
	height: 70rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #409eff 0%, #626aef 100%);
	backdrop-filter: blur(10rpx);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10;
	transition: all 0.3s ease;
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