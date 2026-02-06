<template>
    <!-- 目标达成统计 -->
    <view class="goal-achieved">
        <view class="goal-contant">
            <!-- 卡片标题 -->
            <view class="goal-header">
                <text class="goal-title">目标达成统计</text>
                <view class="time-filter">
                    <text v-for="(item, index) in timeOptions" :key="index" class="time-item"
                        :class="{ 'active': activeTime === item.value }" @click="handleTimeSelect(item.value)">
                        {{ item.label }}
                    </text>
                </view>
            </view>
            <!-- 统计指标 -->
            <view class="goal-items">
                <view class="goal-item" v-for="(item, index) in goalData" :key="index">
                    <view class="goal-info">
                        <text class="goal-label">{{ item.label }}</text>
                        <text class="goal-value">{{ item.value }}</text>
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
                <svg-ring :label="'溢价率'" :strokeWidth="25" :progress="78.5" color="#36cfc9"
                    backgroundColor="rgba(224, 247, 250, 0.8)"></svg-ring>
            </view>
            <view class="info-right">
                <view class="premium-item">
                    <text class="premium-label">住宅均价</text>
                    <view class="premium-value price-type">
                        <text class="value-number">99999</text>
                        <text class="value-unit">元/m²</text>
                    </view>
                </view>
                <view class="premium-item">
                    <text class="premium-label">整体溢价</text>
                    <view class="premium-value amount-type">
                        <text class="value-number">36.78</text>
                        <text class="value-unit">万/11%</text>
                    </view>
                </view>
                <view class="premium-item">
                    <text class="premium-label">溢价</text>
                    <view class="premium-value amount-type">
                        <text class="value-number">999.78</text>
                        <text class="value-unit">万/109套</text>
                    </view>
                </view>
                <view class="premium-item">
                    <text class="premium-label">破价</text>
                    <view class="premium-value negative-type">
                        <text class="value-number">-9999</text>
                        <text class="value-unit">万/77套</text>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import SvgRing from '@/components/svg-ring/svg-ring.vue'
// 时间筛选选项
const timeOptions = ref([
    { label: '年', value: 'year' },
    { label: '月', value: 'month' },
    { label: '周', value: 'week' },
    { label: '日', value: 'day' }
])

// 当前选中时间
const activeTime = ref('month')
// 目标数据
const goalData = ref([
    { label: '来访(组)', value: '70/110', percent: 64, color: '#79bbf5' },
    { label: '认购(套)', value: '123/456', percent: 27, color: '#f77ca1' },
    { label: '签约(套)', value: '123/789', percent: 16, color: '#64f796' },
    { label: '回款(万)', value: '9999/7894', percent: 127, color: '#ff9a9e' }
])

// 更新时间
const updateTime = ref(dayjs().format('YYYY-MM-DD HH:mm'))

// 时间选择处理
const handleTimeSelect = (value) => {
    activeTime.value = value
    console.log('选择的时间维度:', value)
    // 这里可以根据选择的时间维度更新数据
}

// 监听页面显示/隐藏
onMounted(() => {
    // 可以在这里添加数据更新逻辑
})

onUnmounted(() => {
})
</script>

<style lang="scss" scoped>
.goal-achieved {
    width: 100%;
    background-color: #fff;
    border-radius: 12rpx;
}

.goal-contant {
    width: 100%;
    background: rgba(255, 255, 255, 0.85);
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

    border: 1rpx solid rgba(255, 255, 255, 0.5);
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

        &::after {
            content: '';
            position: absolute;
            bottom: -10rpx;
            left: 4rpx;
            width: 60rpx;
            height: 2rpx;
            background: linear-gradient(90deg, #4facfe, #fa709a);
            border-radius: 2rpx;
        }
    }

    .goal-title {
        font-size: 30rpx;
        font-weight: 700;
        background: linear-gradient(135deg, #4facfe 0%, #fa709a 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: 1rpx;
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
    }

    .time-item {
        padding: 0 10rpx;
        font-size: 22rpx;
        font-weight: 500;
        color: #8a9ba8;
        transition: all 0.2s ease;
        position: relative;
        cursor: pointer;
        white-space: nowrap;
        min-width: 50rpx;
        text-align: center;
        height: 36rpx;
        line-height: 36rpx;
        display: flex;
        align-items: center;
        justify-content: center;

        &.active {
            color: #ffffff;
            background: linear-gradient(135deg,
                    rgba(79, 172, 254, 0.9) 0%,
                    rgba(250, 112, 154, 0.9) 100%);
            font-weight: 600;
            box-shadow:
                0 2rpx 6rpx rgba(79, 172, 254, 0.3),
                inset 0 1rpx 0 rgba(255, 255, 255, 0.3);
            border-radius: 16rpx;
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
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        padding: 6rpx 16rpx;
        border-radius: 20rpx;
        min-width: 80rpx;
        text-align: center;
        box-shadow: 0 4rpx 12rpx rgba(79, 172, 254, 0.3);
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
    background: rgba(255, 255, 255, 0.85);
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
            font-size: 24rpx;
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