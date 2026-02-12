<template>
    <!-- 库存统计卡片 -->
    <view class="inventory-container">
        <view class="inventory-item">
            <text class="item-label">库存住宅</text>
            <view class="value-group">
                <text class="item-value">9999
                    <text class="item-value-unit">套</text>
                </text>
                <text class="item-unit">99亿</text>
            </view>
        </view>
        <view class="inventory-item">
            <text class="item-label">月均去化</text>
            <view class="value-group">
                <text class="item-value">1234
                    <text class="item-value-unit">套</text>
                </text>
                <text class="item-unit">1.12亿</text>
            </view>
        </view>
        <view class="inventory-item">
            <text class="item-label">存销比</text>
            <view class="value-group">
                <text class="item-value">7.123</text>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 获取数据
const getData = () => { }

// 暴露方法给父组件
defineExpose({
    getData,
})
// 监听页面显示/隐藏
onMounted(() => {
})

onUnmounted(() => {
})
</script>

<style lang="scss" scoped>
.inventory-container {
    width: 100%;
    height: 200rpx;
    background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(250, 240, 250, 0.95) 100%);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border-radius: 14rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20rpx;
    box-sizing: border-box;
    border: 1rpx solid rgba(255, 255, 255, 0.6);
    position: relative;
    overflow: hidden;

    /* 每个统计项 */
    .inventory-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 10rpx 10rpx;
        position: relative;
        z-index: 1;

        /* 优化分隔线：更细腻 */
        &:not(:last-child)::after {
            content: '';
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            height: 80rpx;
            width: 1rpx;
            background: linear-gradient(to bottom,
                    rgba(224, 247, 250, 0.2),
                    rgba(255, 235, 238, 0.6),
                    rgba(224, 247, 250, 0.2));
        }
    }

    /* 值容器组：保证统一高度 */
    .value-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100rpx;
        /* 保证统一高度 */
    }

    /* 优化标签文字 */
    .item-label {
        font-size: 28rpx;
        color: #5a6c7d;
        /* 更柔和的深灰色 */
        font-weight: 500;
        margin-bottom: 10rpx;
        position: relative;
        letter-spacing: 1rpx;

        /* 添加装饰点 */
        &::before {
            content: '';
            position: absolute;
            left: 50%;
            bottom: -8rpx;
            transform: translateX(-50%);
            width: 16rpx;
            height: 3rpx;
            border-radius: 2rpx;
            background: linear-gradient(90deg,
                    rgba(224, 247, 250, 0.8),
                    rgba(255, 235, 238, 0.8));
        }
    }

    /* 优化主数值 */
    .item-value {
        font-size: 36rpx;
        /* 增大主数值 */
        font-weight: 700;
        line-height: 1.2;
        text-align: center;
        margin-bottom: 4rpx;

        /* 渐变色文字 */
        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .item-value-unit {
        font-size: 26rpx;
        color: #8a9ba8;
    }

    /* 单位文字 */
    .item-unit {
        font-size: 28rpx;
        color: #8a9ba8;
        /* 更浅的辅助色 */
        font-weight: 400;
        text-align: center;
        line-height: 1.4;
    }
}


/* 卡片进入动画 */
.inventory-container {
    animation: cardSlideUp 0.6s cubic-bezier(0.22, 0.61, 0.36, 1);
}

@keyframes cardSlideUp {
    from {
        opacity: 0;
        transform: translateY(40rpx) scale(0.95);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}
</style>