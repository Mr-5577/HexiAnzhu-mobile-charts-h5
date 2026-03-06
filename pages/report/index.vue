<template>
    <view class="report-page">
        <!-- 固定导航栏 -->
        <custom-navbar title="报表" :sub-title="'这是一个二级标题'" :show-left="true" :show-more-menu="true" :show-right="true"
            fixed :translucent="true" :border-bottom="showNavBorder">
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
            @scrolltolower="onScrollToLower">
            <!-- 下拉刷新状态 -->
            <pull-down-refresh :pull-height="pullHeight" :refresher-triggered="refresherTriggered"
                :refresh-text="refreshText" />

            <!-- 主内容 -->
            <view class="main-content">
                <!-- 日报、月报、年报 tab -->
                <view class="sticky-tab">
                    <view class="tab-item" v-for="(item, index) in statisticalTypeList" :key="item.value"
                        :class="{ active: statisticalIndex === index }" @click="switchTab(index)">{{ item.name }}</view>
                </view>
                <!-- 完成率统计 -->
                <completion-rate ref="completionRateRef" :projectIds="projectIds"
                    :dateTime="dateTime"></completion-rate>
                <!-- 累计统计 -->
                <cumulative-statistics ref="cumulativeStatisticsRef" :projectIds="projectIds"
                    :dateTime="dateTime"></cumulative-statistics>
                <!-- 来访统计 -->
                <visitor-statistics ref="visitorStatisticsRef" :projectIds="projectIds"
                    :dateTime="dateTime"></visitor-statistics>
                <!-- 退房、挞定、溢价 -->
                <line-chart ref="lineChartRef" :projectIds="projectIds" :dateTime="dateTime"></line-chart>
                <!-- 未回款占比 -->
                <pie-chart ref="pieChartRef" :projectIds="projectIds" :dateTime="dateTime"></pie-chart>
                <!-- 二级完成率 -->
                <bar-chart ref="barChartRef" :projectIds="projectIds" :dateTime="dateTime"></bar-chart>

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
                <view class="form-item dimension-radio">
                    <view class="item-label">维度</view>
                    <radio-group class="group-radio" @change="dimensionRadioChange">
                        <label v-for="(item, index) in dimensionList" :key="item.value">
                            <radio style="transform:scale(0.7)" :value="item.value"
                                :checked="dimensionIndex === index" />
                            <text class="radio-text">{{ item.name }}</text>
                        </label>
                    </radio-group>
                </view>
                <view class="form-item dimension-radio">
                    <view class="item-label">口径</view>
                    <radio-group class="group-radio" @change="caliberRadioChange">
                        <label v-for="(item, index) in caliberList" :key="item.value">
                            <radio style="transform:scale(0.7)" :value="item.value" :checked="caliberIndex === index" />
                            <text class="radio-text">{{ item.name }}</text>
                        </label>
                    </radio-group>
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
import CompletionRate from '@/pages/report/components/completion-rate.vue'
import VisitorStatistics from '@/pages/report/components/visitor-statistics.vue'
import CumulativeStatistics from '@/pages/report/components/cumulative-statistics.vue'
import LineChart from '@/pages/report/components/line-chart.vue'
import PieChart from '@/pages/report/components/pie-chart.vue'
import BarChart from '@/pages/report/components/bar-chart.vue'
import PullDownRefresh from '@/components/pull-down-refresh/index.vue'
import dayjs from 'dayjs'
import { ref, computed, onMounted } from 'vue'
import { largeScreenApi } from '@/common/api.js'

// 响应式数据
const isReadyToRefresh = ref(false)
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
// 维度类型
const dimensionList = ref([
    { value: 'day', name: '日' },
    { value: 'month', name: '月' },
    { value: 'year', name: '年' },
])
const dimensionIndex = ref(0) // 选中维度索引
const caliberList = ref([
    { value: '1', name: '全口径' },
    { value: '2', name: '考核口径' },
])
const caliberIndex = ref(0) // 选中口径索引
// 日报、月报、年报
const statisticalTypeList = ref([
    { value: 'day', name: '日报' },
    { value: 'month', name: '月报' },
    { value: 'year', name: '年报' },
])
const statisticalIndex = ref(0) // 选中日报、月报、年报索引

// 子组件ref
const completionRateRef = ref(null);
const cumulativeStatisticsRef = ref(null);
const visitorStatisticsRef = ref(null);
const lineChartRef = ref(null);
const pieChartRef = ref(null);
const barChartRef = ref(null);

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
        // 刷新重置查询条件为初始值
        dateTime.value = dayjs().format('YYYY-MM-DD')
        await getProjectData()
        refreshText.value = '刷新成功,正在请求数据...'
        setTimeout(() => {
            // 手动触发子组件加载数据
            refreshAllComponents();
        }, 100);
    } catch (error) {
        refreshText.value = '刷新失败'
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
    showNavBorder.value = alpha > 0.8

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
const dimensionRadioChange = (evt) => {
    // console.log(evt)
    for (let i = 0; i < dimensionList.value.length; i++) {
        if (dimensionList.value[i].value === evt.detail.value) {
            dimensionIndex.value = i;
            break;
        }
    }
    // console.log(dimensionIndex.value)
}
const caliberRadioChange = (evt) => {
    for (let i = 0; i < caliberList.value.length; i++) {
        if (caliberList.value[i].value === evt.detail.value) {
            caliberIndex.value = i;
            break;
        }
    }
}
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
        completionRateRef.value,
        cumulativeStatisticsRef.value,
        visitorStatisticsRef.value,
        lineChartRef.value,
        pieChartRef.value,
        barChartRef.value,
    ];
    components.forEach((component) => {
        if (component && typeof component.refreshData === "function") {
            component.refreshData();
        }
    });
};

const switchTab = (index) => {
    if (statisticalIndex.value === index) return
    statisticalIndex.value = index
}
// 生命周期
onMounted(async () => {
    dateTime.value = dayjs().format('YYYY-MM-DD')
    // 先加载项目数据再请求子组件数据
    await getProjectData()
    setTimeout(() => {
        // 手动触发子组件加载数据
        refreshAllComponents();
    }, 100);
})
</script>

<style lang="scss" scoped>
.report-page {
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
    padding: 0rpx 30rpx 30rpx;
    box-sizing: border-box;
    gap: 30rpx;
    display: flex;
    flex-direction: column;

    // tab 样式
    .sticky-tab {
        position: sticky;
        top: 0;
        z-index: 9;
        display: flex;
        padding: 0 20rpx;
        background-color: #f0f7fa;
        border-radius: 10rpx;

        .tab-item {
            flex: 1;
            text-align: center;
            padding: 16rpx 0;
            font-size: 28rpx;
            font-weight: 500;
            color: rgba(51, 51, 51, 0.6);
            position: relative;

            &::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 35%;
                width: 30%;
                height: 4rpx;
                background: linear-gradient(90deg, #409eff, #626aef);
                border-radius: 2rpx 2rpx 0 0;
                opacity: 0;
                transform: scaleX(0.3);
                transition: all 0.2s ease;
            }

            &.active {
                color: #409eff;
                font-weight: 600;

                &::after {
                    opacity: 1;
                    transform: scaleX(1);
                }
            }
        }
    }
}

// 搜索表单样式
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

            &.dimension-radio .group-radio {
                display: flex;
                align-items: center;
                flex-wrap: nowrap;
                gap: 50rpx;

                .radio-text {
                    font-size: 28rpx;
                    color: #666;
                }
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