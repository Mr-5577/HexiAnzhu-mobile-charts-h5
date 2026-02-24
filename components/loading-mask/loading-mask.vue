<template>
    <view v-if="visible" class="loading-mask" :class="{ 'fullscreen': fullscreen }">
        <view class="loading-content">
            <uni-icons type="spinner-cycle" :size="size" :color="color" />
            <text class="loading-text" :style="{ color: textColor }">{{ text }}</text>
        </view>
    </view>
</template>

<script setup>
const props = defineProps({
    // 是否显示遮罩
    visible: {
        type: Boolean,
        default: false
    },
    // 加载提示文字
    text: {
        type: String,
        default: '加载中...'
    },
    // 图标颜色
    color: {
        type: String,
        default: '#409eff'
    },
    // 文字颜色
    textColor: {
        type: String,
        default: '#409eff'
    },
    // 图标大小
    size: {
        type: [Number, String],
        default: 24
    },
    // 是否全屏遮罩
    fullscreen: {
        type: Boolean,
        default: false
    }
})

// 控制显示方法
const emit = defineEmits(['update:visible'])

// 手动控制显示/隐藏
const setVisible = (value) => {
    emit('update:visible', value)
}

defineExpose({
    setVisible
})
</script>

<style lang="scss" scoped>
.loading-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    border-radius: inherit;

    /* 全屏模式 */
    &.fullscreen {
        position: fixed;
        border-radius: 0;
    }

    .loading-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 30rpx 40rpx;
        border-radius: 16rpx;

        .loading-text {
            font-size: 24rpx;
            font-weight: 500;
            margin-top: 16rpx;
        }
    }
}
</style>