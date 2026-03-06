<template>
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
</template>

<script setup>
defineProps({
    pullHeight: Number,
    refresherTriggered: Boolean,
    refreshText: String
})
</script>

<style lang="scss" scoped>
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
</style>