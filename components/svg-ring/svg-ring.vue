<template>
    <view class="svg-ring-container">
        <svg class="svg-ring" :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
            <!-- 单个圆环，同时显示进度色和背景色 -->
            <circle :cx="size / 2" :cy="size / 2" :r="radius" fill="none" :stroke="backgroundColor"
                :stroke-width="strokeWidth" stroke-linecap="round" />

            <!-- 进度部分叠加在上面 -->
            <circle class="progress-ring" :cx="size / 2" :cy="size / 2" :r="radius" fill="none" :stroke="color"
                :stroke-width="strokeWidth" stroke-linecap="round"
                :stroke-dasharray="`${progressCircumference} ${circumference}`" transform="rotate(-90, 100, 100)" />
        </svg>
        <view class="ring-content">
            <text class="ring-value">{{ progress }}%</text>
            <text class="ring-label">{{ label }}</text>
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
    // 进度比例值
    progress: {
        type: Number,
        default: 75
    },
    // 文本
    label: {
        type: String,
        default: '完成率'
    },
    size: {
        type: Number,
        default: 200
    },
    // 圆环宽度
    strokeWidth: {
        type: Number,
        default: 12
    },
    // 进度环颜色
    color: {
        type: String,
        default: '#36cfc9'
    },
    // 背景环颜色
    backgroundColor: {
        type: String,
        default: 'rgba(224, 247, 250, 0.2)'
    }
})

const radius = computed(() => props.size / 2 - props.strokeWidth / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
// 计算进度部分对应的周长
const progressCircumference = computed(() => circumference.value * props.progress / 100)
</script>

<style lang="scss" scoped>
.svg-ring-container {
    position: relative;
    width: 300rpx;
    height: 300rpx;
    display: flex;
    justify-content: center;
    align-items: center;
}

.svg-ring {
    width: 100%;
    height: 100%;

    .progress-ring {
        transition: stroke-dashoffset 1s ease-out;
        animation: ringProgress 1.5s ease-out forwards;
    }
}

.ring-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 2;
}

.ring-value {
    font-size: 34rpx;
    font-weight: 700;
    color: #333;
    display: block;
}

.ring-label {
    font-size: 24rpx;
    color: #71808b;
    display: block;
}

@keyframes ringProgress {
    from {
        stroke-dashoffset: var(--initial-offset);
    }

    to {
        stroke-dashoffset: var(--final-offset);
    }
}
</style>