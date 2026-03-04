<!-- 目标达成统计 -->
<template>
    <view class="goal-achieved">
        <view class="goal-contant">
            <!-- 卡片标题 -->
            <view class="goal-header">
                <text class="goal-title">目标达成统计</text>
                <view class="time-filter">
                    <text v-for="(item, index) in timeOptions" :key="index" class="time-item"
                        :class="{ 'active': activeValue === item.value }" @click="handleTimeSelect(item.value)">
                        {{ item.label }}
                    </text>
                </view>
            </view>
            <!-- 统计指标 -->
            <view class="goal-items">
                <view class="goal-item" v-for="(item, index) in computedGoalData" :key="index">
                    <view class="goal-info">
                        <text class="goal-label">{{ item.label }}</text>
                        <text class="goal-value">{{ item.complete }}/{{ item.goal }}</text>
                        <!-- <text class="goal-percent">{{ item.percent }}%</text> -->
                    </view>
                    <view class="progress-wrapper">
                        <progress :percent="item.percent" :active="true" :activeColor="item.color"
                            backgroundColor="rgba(220, 220, 220, 0.3)" :stroke-width="12" class="custom-progress" />
                    </view>
                </view>
            </view>
            <!-- 底部说明 -->
            <!-- <view class="goal-footer">
                <text class="footer-text">数据更新时间：{{ updateTime }}</text>
            </view> -->
        </view>
        <!-- 溢价信息 -->
        <view class="premium-info">
            <view class="info-left">
                <svg-ring :label="'溢价率'" :strokeWidth="25" :isFixed="true"
                    :fixedProgress="formatPercent(formatNumber(premiumData.premiumRate))" color="#36cfc9"
                    backgroundColor="rgba(224, 247, 250, 0.8)"></svg-ring>
            </view>
            <view class="info-right">
                <view class="premium-item">
                    <text class="premium-label">住宅均价</text>
                    <view class="premium-value price-type">
                        <text class="value-number">{{ formatNumber(premiumData.zzSalePrice) }}</text>
                        <text class="value-unit">元/m²</text>
                    </view>
                </view>
                <view class="premium-item">
                    <text class="premium-label">整体溢价</text>
                    <view class="premium-value amount-type">
                        <text class="value-number">{{ formatNumber(premiumData.premiumMoney) }}</text>
                        <text class="value-unit">万/{{ formatPercent(formatNumber(premiumData.premiumRate)) }}%</text>
                    </view>
                </view>
                <view class="premium-item">
                    <text class="premium-label">溢价</text>
                    <view class="premium-value amount-type">
                        <text class="value-number">{{ formatNumber(premiumData.yjMoney) }}</text>
                        <text class="value-unit">万/{{ formatNumber(premiumData.yjNum) }}套</text>
                    </view>
                </view>
                <view class="premium-item">
                    <text class="premium-label">破价</text>
                    <view class="premium-value negative-type">
                        <text class="value-number">{{ formatNumber(premiumData.pjMoney) }}</text>
                        <text class="value-unit">万/{{ formatNumber(premiumData.pjNum) }}套</text>
                    </view>
                </view>
            </view>
        </view>
        <!-- 遮罩层组件 -->
        <loading-mask :visible="loading" text="加载中..." :size="26" />
    </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import SvgRing from '@/components/svg-ring/index.vue'
import LoadingMask from '@/components/loading-mask/index.vue'
import { largeScreenApi } from '@/common/api.js'
import { formatNumber } from '@/utils/common.js'
const props = defineProps({
    // 选择的项目ID
    projectIds: {
        type: Array,
        default: () => []
    },
    // 选择的时间日期
    dateTime: {
        type: String,
        default: ''
    }
})
// 时间筛选选项
const timeOptions = ref([
    { value: 0, label: "年", type: "month" },
    { value: 1, label: "月", type: "date" },
    { value: 2, label: "周", type: "week" },
    { value: 3, label: "日", type: "day" },
])
// 当前选中时间
const activeValue = ref(1)
// loading状态 - 控制遮罩层显示
const loading = ref(false)
// 防止重复请求
const isRequesting = ref(false)
const saleData = ref({
    orderNum: 0, // 订单数量
    signNum: 0, // 签约数量
    collectMoney: 0, // 付款金额
    orderTask: 0, // 认购目标套数
    signTask: 0, //  签约目标套数
    collectTask: 0, // 回款目标金额

    orderRate: 0, // 认购达成率
    signRate: 0, // 签约达成率
    collectRate: 0, // 回款达成率
    totalRate: 0, // 综合达成率
});
const premiumData = ref({
    allNum: 0, // 总记录数

    premiumMoney: 0, // 总溢价金额
    premiumRate: 0, // 总溢价率

    yjNum: 0, // 溢价记录数
    yjMoney: 0, // 溢价总金额

    pjNum: 0, // 破价记录数
    pjMoney: 0, // 破价总金额

    allSalePrice: 0, // 整体均价
    zzSalePrice: 0, // 住宅均价
    floorMoney: 0, // 底价金额
    saleMoney: 0, // 住宅销售金额
    saleArea: 0, // 住宅销售面积
});
// 目标数据
const computedGoalData = computed(() => {
    return [
        {
            label: '来访(组)',
            complete: `${formatNumber(saleData.value.comeNum || 0)}`,
            goal: `${formatNumber(saleData.value.comeTask || 0)}`,
            percent: parseFloat(saleData.value.comeRate || 0) * 100,
            color: '#79bbf5'
        },
        {
            label: '认购(套)',
            complete: `${formatNumber(saleData.value.orderNum || 0)}`,
            goal: `${formatNumber(saleData.value.orderTask || 0)}`,
            percent: parseFloat(saleData.value.orderRate || 0) * 100,
            color: '#f77ca1'
        },
        {
            label: '签约(套)',
            complete: `${formatNumber(saleData.value.signNum || 0)}`,
            goal: `${formatNumber(saleData.value.signTask || 0)}`,
            percent: parseFloat(saleData.value.signRate || 0) * 100,
            color: '#91cc75'
        },
        {
            label: '回款(万)',
            complete: `${formatNumber(saleData.value.collectMoney || 0)}`,
            goal: `${formatNumber(saleData.value.collectTask || 0)}`,
            percent: parseFloat(saleData.value.collectRate || 0) * 100,
            color: '#ff9a9e'
        }
    ]
})

// 更新时间
const updateTime = ref(dayjs().format('YYYY-MM-DD HH:mm'))
// 格式化百分比函数
const formatPercent = (value) => {
    if (value === undefined || value === null) return "0";
    return (value * 100).toFixed(0);
};
// 时间选择处理
const handleTimeSelect = (value) => {
    if (activeValue.value === value) return
    activeValue.value = value
    fetchData()
}
const fetchData = async () => {
    // 检查是否已有请求在进行
    if (isRequesting.value) return;
    loading.value = true
    isRequesting.value = true
    const params = {
        projIds: props.projectIds,
        type: activeValue.value,
        day: `${props.dateTime} 00:00:00`,
    };
    try {
        const [premiumRes, saleRes] = await Promise.all([
            largeScreenApi.getPremiumInfo(params),
            largeScreenApi.getSaleInfo(params)
        ])
        if (premiumRes.code === 200 && premiumRes.data) {
            premiumData.value = premiumRes.data;
        }
        if (saleRes.code === 200 && saleRes.data) {
            saleData.value = saleRes.data
        }
    } catch (error) {
        console.log('数据异常', error)
    } finally {
        loading.value = false
        isRequesting.value = false
    }
}
onMounted(() => {
    // fetchData()
})

onUnmounted(() => {
})

// 暴露方法给父组件
defineExpose({
    refreshData: fetchData
})

</script>

<style lang="scss" scoped>
.goal-achieved {
    width: 100%;
    // background-color: #fff;
    background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(250, 240, 250, 0.95) 100%);
    border-radius: 12rpx;
    position: relative;
}

.goal-contant {
    width: 100%;
    // background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 20rpx;
    box-sizing: border-box;
    border-radius: 12rpx;
    // margin-bottom: 20rpx;
    /* 玻璃拟态效果 */
    box-shadow:
        0 10rpx 40rpx rgba(224, 247, 250, 0.25),
        0 5rpx 15rpx rgba(255, 235, 238, 0.15),
        inset 0 1rpx 0 rgba(255, 255, 255, 0.9),
        inset 0 -1rpx 0 rgba(200, 220, 240, 0.1);

    position: relative;
    overflow: hidden;

    /* 卡片标题区域 */
    .goal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;
        border-bottom: 1rpx solid rgba(224, 247, 250, 0.4);
        position: relative;
        z-index: 1;
    }

    .goal-title {
        font-size: 30rpx;
        font-weight: 700;
        // background: linear-gradient(135deg, #4facfe 0%, #fa709a 100%);
        background: linear-gradient(135deg, #409eff 0%, #626aef 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: 1rpx;
        position: relative;
        padding-left: 16rpx;

        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 55%;
            transform: translateY(-50%);
            width: 6rpx;
            height: 28rpx;
            // background: linear-gradient(135deg, #4FACFE, #FA709A);
            background: linear-gradient(135deg, #409eff, #626aef);
            border-radius: 3rpx;
        }
    }

    /* 时间筛选器样式  */
    .time-filter {
        display: flex;
        align-items: center;
        background: rgba(224, 247, 250, 0.12);
        border-radius: 20rpx;
        padding: 2rpx;
        border: 1rpx solid rgba(224, 247, 250, 0.25);
        box-shadow:
            0 2rpx 8rpx rgba(224, 247, 250, 0.15),
            inset 0 1rpx 0 rgba(255, 255, 255, 0.5);
        overflow: hidden;
        white-space: nowrap;
        height: 44rpx;
        gap: 15rpx;
    }

    .time-item {
        padding: 0 14rpx;
        font-size: 22rpx;
        font-weight: 500;
        color: #626aef;
        transition: all 0.2s ease;
        position: relative;
        white-space: nowrap;
        min-width: 40rpx;
        height: 36rpx;
        line-height: 36rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 15rpx;
        background: rgba(239, 240, 253, 0.5);

        &.active {
            color: #ffffff;
            // background: linear-gradient(135deg,
            //         rgba(79, 172, 254, 0.9) 0%,
            //         rgba(250, 112, 154, 0.9) 100%);
            background: linear-gradient(135deg, #409eff 0%, #626aef 100%);
            font-weight: 600;
            box-shadow:
                0 2rpx 6rpx rgba(79, 172, 254, 0.3),
                inset 0 1rpx 0 rgba(255, 255, 255, 0.3);
            padding: 0 14rpx;
        }
    }

    /* 统计指标区域 */
    .goal-items {
        position: relative;
        z-index: 1;
    }

    .goal-item {
        margin-bottom: 20rpx;

        &:last-child {
            margin-bottom: 0;
        }
    }

    .goal-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8rpx;
    }

    .goal-label {
        font-size: 28rpx;
        color: #5a6c7d;
        font-weight: 500;
        flex: 1;
    }

    .goal-value {
        font-size: 27rpx;
        font-weight: 600;
        color: #6d6c6c;
        margin-right: 20rpx;
        min-width: 140rpx;
        text-align: right;
    }

    .goal-percent {
        font-size: 24rpx;
        font-weight: 600;
        color: #fff;
        background: linear-gradient(135deg, #4facfe 0%, #00c3fe 100%);
        padding: 2rpx 16rpx 4rpx;
        border-radius: 20rpx;
        text-align: center;
    }

    /* 进度条区域 */
    .progress-wrapper {
        position: relative;
        height: 24rpx;
        background: rgba(224, 247, 250, 0.2);
        border-radius: 12rpx;
        overflow: hidden;
        border: 1rpx solid rgba(224, 247, 250, 0.3);
        box-shadow: inset 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
    }

    .custom-progress {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1;

        /* 进度条圆角样式 */
        &::-webkit-progress-bar {
            background-color: transparent !important;
            border-radius: 12rpx !important;
        }

        &::-webkit-progress-value {
            border-radius: 12rpx !important;
        }

        :deep(.uni-progress-inner-bar) {
            border-radius: 12rpx !important;
        }
    }

    /* 底部说明区域 */
    .goal-footer {
        margin-top: 20rpx;
        border-top: 1rpx solid rgba(224, 247, 250, 0.3);
        text-align: right;
        position: relative;
        z-index: 1;
    }

    .footer-text {
        font-size: 22rpx;
        color: #8a9ba8;
        opacity: 0.8;
    }

}

/* 溢价信息区域 */
.premium-info {
    width: 100%;
    padding: 20rpx;
    box-sizing: border-box;
    // background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 12rpx;

    /* 玻璃拟态效果 */
    box-shadow:
        0 10rpx 40rpx rgba(224, 247, 250, 0.25),
        0 5rpx 15rpx rgba(255, 235, 238, 0.15),
        inset 0 1rpx 0 rgba(255, 255, 255, 0.9),
        inset 0 -1rpx 0 rgba(200, 220, 240, 0.1);

    border: 1rpx solid rgba(255, 255, 255, 0.5);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: nowrap;

    .info-left {
        width: 45%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .info-right {
        width: 55%;
        padding-left: 30rpx;
        box-sizing: border-box;
    }

    .premium-item {
        margin-bottom: 14rpx;

        &:last-child {
            margin-bottom: 0;
        }
    }

    .premium-label {
        font-size: 26rpx;
        color: #5a6c7d;
        font-weight: 500;
        display: block;
        line-height: 1.4;
    }

    .premium-value {
        display: flex;
        align-items: baseline;
        flex-wrap: wrap;
        transition: all 0.3s ease;
        border-radius: 8rpx;
        margin-left: 10rpx;
    }

    /* 不同类型数值的区分样式 */
    .price-type {

        /* 价格类型 - 橙色系 */
        .value-number {
            font-size: 32rpx;
            font-weight: 700;
            color: #fa8c16;
            /* 橙色 */
            background: linear-gradient(135deg, #ffc069 0%, #fa8c16 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 2rpx 4rpx rgba(250, 140, 22, 0.1);
            padding-right: 8rpx;
        }

        .value-unit {
            font-size: 26rpx;
            color: #ffa940;
        }
    }

    .amount-type {

        /* 金额类型 - 蓝色系 */
        .value-number {
            font-size: 32rpx;
            font-weight: 700;
            color: #1890ff;
            /* 蓝色 */
            background: linear-gradient(135deg, #69c0ff 0%, #1890ff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 2rpx 4rpx rgba(24, 144, 255, 0.1);
            padding-right: 8rpx;
        }

        .value-unit {
            font-size: 24rpx;
            color: #69c0ff;
        }
    }

    .percentage-type {

        /* 百分比类型 - 绿色系 */
        .value-number {
            font-size: 32rpx;
            font-weight: 700;
            color: #52c41a;
            /* 绿色 */
            background: linear-gradient(135deg, #95de64 0%, #52c41a 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 2rpx 4rpx rgba(82, 196, 26, 0.1);
            padding-right: 8rpx;
        }

        .value-unit {
            font-size: 24rpx;
            color: #95de64;
        }
    }

    .negative-type {

        /* 负值/破价类型 - 红色系 */
        .value-number {
            font-size: 32rpx;
            font-weight: 700;
            color: #ff4d4f;
            /* 红色 */
            background: linear-gradient(135deg, #ff7875 0%, #ff4d4f 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 2rpx 4rpx rgba(255, 77, 79, 0.1);
            padding-right: 8rpx;
        }

        .value-unit {
            font-size: 24rpx;
            color: #ff7875;
        }
    }
}

/* 卡片进入动画 */
.goal-achieved {
    animation: cardSlideIn 0.6s cubic-bezier(0.22, 0.61, 0.36, 1);
}

@keyframes cardSlideIn {
    from {
        opacity: 0;
        transform: translateY(30rpx) scale(0.98);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}
</style>