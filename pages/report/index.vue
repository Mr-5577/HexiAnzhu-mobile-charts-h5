<template>
    <view class="report-page">
        <!-- 固定导航栏 -->
        <custom-navbar title="销售报表" :sub-title="subTitle" :show-left="true" :show-more-menu="true" :show-right="true"
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
                    <view class="tab-item" v-for="(item) in reportTypeList" :key="item.value"
                        :class="{ active: reportType === item.type, disable: tabLoading }"
                        @click="switchTab(item.type)">
                        <image src="/static/loading.gif" mode="aspectFit" class="loading-gif"
                            v-show="tabLoading && reportType === item.type"></image>
                        {{ item.name }}
                    </view>
                </view>
                <!-- 完成率统计 -->
                <completion-rate ref="completionRateRef" :projectIds="projectIds" :dateTime="dateTime"
                    :reportType="reportType" :caliberType="caliberType" :sumData="sumData"
                    v-if="showCompletionRate"></completion-rate>
                <!-- 认购、签约、回款 -->
                <subscription ref="subscriptionRef" :projectIds="projectIds" :dateTime="dateTime"
                    :reportType="reportType" :caliberType="caliberType" :sumData="sumData"></subscription>
                <!-- 来访统计 -->
                <visitor-statistics ref="visitorStatisticsRef" :projectIds="projectIds" :dateTime="dateTime"
                    :reportType="reportType" :caliberType="caliberType" :sumData="sumData"></visitor-statistics>
                <!-- 溢价、退房、挞定 -->
                <cumulative-statistics ref="cumulativeStatisticsRef" :projectIds="projectIds" :dateTime="dateTime"
                    :reportType="reportType" :caliberType="caliberType" :sumData="sumData"></cumulative-statistics>
                <!-- 项目统计 -->
                <premium ref="premiumRef" :projectIds="projectIds" :dateTime="dateTime" :projectData="projectData"
                    v-if="showLineChart"></premium>
                <!-- 城市项目统计 -->
                <project-statistics ref="projectStatisticsRef" :projectIds="projectIds" :dateTime="dateTime"
                    :projectData="projectData" v-if="showBarChart"></project-statistics>
                <!-- 未回款占比 -->
                <unpaid ref="unpaidRef" :projectIds="projectIds" :dateTime="dateTime" :reportType="reportType"
                    :caliberType="caliberType" :sumData="sumData"></unpaid>

                <view class="bottom-tips" v-if="showBottomTips">
                    <text>—— 已加载全部 ——</text>
                </view>
            </view>
        </scroll-view>

        <!-- 回到顶部按钮 -->
        <view class="scroll-to-top" v-show="showScrollTopBtn" @click="scrollToTop">
            <uni-icons type="arrow-up" size="20" color="#fff" />
        </view>

        <!-- 遮罩层组件 -->
        <loading-mask :visible="maskLoading" text="加载中..." />
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
                    <view class="item-label">考核口径</view>
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
import Subscription from '@/pages/report/components/subscription.vue'
import CumulativeStatistics from '@/pages/report/components/cumulative-statistics.vue'
import Premium from '@/pages/report/components/premium.vue'
import Unpaid from '@/pages/report/components/unpaid.vue'
import ProjectStatistics from '@/pages/report/components/project-statistics.vue'
import PullDownRefresh from '@/components/pull-down-refresh/index.vue'
import LoadingMask from '@/components/loading-mask/index.vue'
import dayjs from 'dayjs'
import { ref, computed, onMounted, nextTick } from 'vue'
import { largeScreenApi, saleReportApi } from '@/common/api.js'

// 响应式数据
const maskLoading = ref(false)
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
const projectList = ref([]) // 项目列表
const projectIds = ref([]) // 选中的项目ID集合
const dateTime = ref('') // 选中的时间日期
const projectData = ref([]) // 项目或城市数据
const sumData = ref(null) // 总的统计数据
// 考核口径
const caliberList = ref([
    { value: 'all', name: '全口径', type: 0 },
    { value: 'performance', name: '业绩口径', type: 1 },
])
const caliberIndex = ref(0) // 选中口径索引，默认全口径
const caliberType = ref(0) // 选中口径类型，默认全口径
// 日报、月报、年报
const reportTypeList = ref([
    { value: 'day', name: '日报', type: 3 },
    { value: 'month', name: '月报', type: 1 },
    { value: 'year', name: '年报', type: 0 },
])
const reportType = ref(3) // 选中日报、月报、年报索引，默认日报
// 二级标题
const subTitle = computed(() => {
    const projectIdLength = projectIds.value.length || 0
    const time = dateTime.value
    const caliberText = caliberList.value.find((item) => item.type === caliberType.value).name
    return `${projectIdLength}个项目、${time}、${caliberText}`
})
// 缓存真实查询条件
const cacheParams = ref({
    projectIds: [], // 项目
    dateTime: '', // 日期
    caliberIndex: 0, // 默认全口径
    caliberType: 0, // 默认全口径
    reportType: 3 // 默认日报
})
const showCompletionRate = computed(() => {
    // 月报、年报显示
    return reportType.value === 1 || reportType.value === 0
})
const showLineChart = computed(() => {
    // 日报 多项目显示
    const idLength = projectIds.value.length
    return reportType.value === 3 && idLength > 1
})
const showBarChart = computed(() => {
    // 月报、年报 多项目显示
    const idLength = projectIds.value.length
    return (reportType.value === 1 || reportType.value === 0) && idLength > 1
})
// 子组件ref
const completionRateRef = ref(null);
const subscriptionRef = ref(null);
const cumulativeStatisticsRef = ref(null);
const visitorStatisticsRef = ref(null);
const premiumRef = ref(null);
const unpaidRef = ref(null);
const projectStatisticsRef = ref(null);

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
        // 重置考核口径为全口径
        caliberIndex.value = 0
        caliberType.value = 0
        // 重置报表类型为日报
        reportType.value = 3
        // 更新缓存参数
        cacheParams.value.dateTime = dayjs().format('YYYY-MM-DD')
        cacheParams.value.caliberIndex = 0
        cacheParams.value.caliberType = 0
        cacheParams.value.reportType = 3
        refreshText.value = '刷新成功,正在请求数据...'
        await getProjectData()
        await getReportData()
        await refreshAllComponents();
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
    nextTick(() => {
        scrollTopVal.value = 0
        showScrollTopBtn.value = false
    })
}

// 搜索相关方法
const openSearchPopup = () => searchPopupRef.value?.open()
const closeSearchPop = () => {
    projectIds.value = cacheParams.value.projectIds
    dateTime.value = cacheParams.value.dateTime
    caliberType.value = cacheParams.value.caliberType
    caliberIndex.value = cacheParams.value.caliberIndex
    reportType.value = cacheParams.value.reportType
    searchPopupRef.value?.close()
}
const handleSearch = async () => {
    searchPopupRef.value?.close()
    cacheParams.value.projectIds = projectIds.value
    cacheParams.value.dateTime = dateTime.value
    cacheParams.value.caliberType = caliberType.value
    cacheParams.value.caliberIndex = caliberIndex.value
    cacheParams.value.reportType = reportType.value
    await getReportData()
    await refreshAllComponents()
}

// 项目选择相关方法
const showProjectSelect = () => projectSelectPopupRef.value?.openPopup()
const handleProjectConfirm = (selectedIds) => {
    projectIds.value = selectedIds
}

// 日期选择
const bindTimeChange = (e) => dateTime.value = e.detail.value
// 口径选择
const caliberRadioChange = (evt) => {
    for (let i = 0; i < caliberList.value.length; i++) {
        if (caliberList.value[i].value === evt.detail.value) {
            caliberIndex.value = i;
            caliberType.value = caliberList.value[i].type
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
        cacheParams.value.projectIds = list.map((item => {
            return item.id
        }))
    }
}
// 统一刷新所有子组件
const refreshAllComponents = async () => {
    const components = [
        // completionRateRef.value,
        // subscriptionRef.value,
        // cumulativeStatisticsRef.value,
        visitorStatisticsRef.value,
        // premiumRef.value,
        // unpaidRef.value,
        // projectStatisticsRef.value,
    ];
    // components.forEach((component) => {
    //     if (component && typeof component.refreshData === "function") {
    //         component.refreshData();
    //     }
    // });
    // 并发请求所有子组件，只等待一次
    await nextTick()
    return Promise.all(components.map(component => {
        if (component && typeof component.refreshData === "function") {
            return component.refreshData();
        }
    }));
};

// 添加tab loading状态
const tabLoading = ref(false)
const switchTab = async (type) => {
    if (reportType.value === type || tabLoading.value) return
    reportType.value = type
    cacheParams.value.reportType = type
    tabLoading.value = true
    try {
        await getReportData()
        await nextTick()
        await refreshAllComponents()
    } finally {
        tabLoading.value = false
    }
}
// 获取数据
const getReportData = async () => {
    uni.showLoading({
        title: '加载中...'
    });
    // maskLoading.value = true
    const params = {
        projIds: projectIds.value,
        type: reportType.value, // 0:年  1:月  2:周  3:日
        day: `${dateTime.value} 00:00:00`,
        assessCaliber: caliberType.value
    };
    try {
        const res = await saleReportApi.getAsstTotalForApp(params);
        if (res.code === 200) {
            const data = res.data || null
            switch (reportType.value) {
                // 日报
                case 3:
                    projectData.value = data.dayProjData || []
                    sumData.value = data.daySumData || null
                    break;
                // 月报
                case 1:
                    projectData.value = data.monthCityData || []
                    sumData.value = data.monthSumData || null
                    break;
                // 年报
                case 0:
                    projectData.value = data.yearCityData || []
                    sumData.value = data.yearSumData || null
                    break;
                default:
                    projectData.value = []
                    sumData.value = null
                    break;
            }
        }
    } catch (error) {
        projectData.value = []
        sumData.value = null
    } finally {
        uni.hideLoading()
        maskLoading.value = false
    }
}
// 生命周期
onMounted(async () => {
    dateTime.value = dayjs().format('YYYY-MM-DD')
    cacheParams.value.dateTime = dayjs().format('YYYY-MM-DD')
    // 先加载项目数据再请求子组件数据
    await getProjectData()
    await getReportData()
    await refreshAllComponents();
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
            display: flex;
            align-items: center;
            justify-content: center;
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

            &.disable {
                opacity: 0.8;
                pointer-events: none; // 禁止点击
            }

            .loading-gif {
                width: 36rpx;
                height: 36rpx;
                margin-right: 8rpx;
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