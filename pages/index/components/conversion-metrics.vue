<!-- 转化指标情况 -->
<template>
    <view class="conversion-metrics">
        <view class="metrics-header">
            <text class="metrics-title">目标达成统计</text>
        </view>
        <view class="echarts-info">
            <view class="info-left">
                <svg-ring :label="'当月转化率'" :size="200" :strokeWidth="25" :progress="78.5" color="#f38caf"
                    backgroundColor="rgba(240, 98, 146, 0.1)"></svg-ring>
            </view>
            <view class="info-right">
                <svg-ring :label="'总体转化率'" :strokeWidth="25" :progress="30" color="#f3a38b"
                    backgroundColor="rgba(255, 138, 101, 0.1)"></svg-ring>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import SvgRing from '@/components/svg-ring/svg-ring.vue'

// 监听页面显示/隐藏
onMounted(() => {
})

onUnmounted(() => {
})
</script>

<style lang="scss" scoped>
.conversion-metrics {
    width: 100%;
    background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(250, 240, 250, 0.95) 100%);
    border-radius: 12rpx;
    padding: 20rpx 20rpx;
    box-sizing: border-box;

    .metrics-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;
        border-bottom: 1rpx solid rgba(224, 247, 250, 0.4);
        position: relative;
        z-index: 1;

        .metrics-title {
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
    }

    .echarts-info {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;

        .info-left,
        .info-right {
            width: 50%;
            padding: 30rpx 30rpx;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }
}

/* 卡片进入动画 */
.conversion-metrics {
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