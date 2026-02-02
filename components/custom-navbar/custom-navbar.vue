<!-- 自定义顶部导航栏 -->
<template>
    <view class="custom-navbar" :class="{ 'navbar-fixed': fixed }" :style="navbarStyle">
        <!-- 状态栏占位 -->
        <view class="status-bar" :style="statusBarStyle"></view>

        <!-- 导航栏内容 -->
        <view class="navbar-content">
            <!-- 左侧：返回按钮 -->
            <view v-if="showBack" class="nav-left" @click="handleBack">
                <view class="back-container">
                    <text class="back-icon iconfont icon-back">‹</text>
                    <text v-if="backText" class="back-text">{{ backText }}</text>
                </view>
            </view>

            <!-- 中间：标题 -->
            <view class="nav-center">
                <text class="nav-title" :style="titleStyle">{{ title }}</text>
            </view>

            <!-- 右侧：操作区域 -->
            <view class="nav-right">
                <slot name="right">
                    <!-- 默认右侧内容 -->
                    <view v-if="showHome" class="home-btn" @click="goHome">
                        <text class="iconfont icon-home">🏠</text>
                    </view>
                </slot>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
    title: { type: String, default: '' },
    backgroundColor: { type: String, default: '#ffffff' },
    titleColor: { type: String, default: '#333333' },
    showBack: { type: Boolean, default: true },
    backText: { type: String, default: '' },
    showHome: { type: Boolean, default: false },
    fixed: { type: Boolean, default: true },
    translucent: { type: Boolean, default: false },
    borderBottom: { type: Boolean, default: true },
    titleBold: { type: Boolean, default: true },
    customHeight: { type: Number, default: 88 }
})

const emit = defineEmits(['back', 'home'])

const statusBarHeight = ref(0)
const systemInfo = ref({})

const statusBarStyle = computed(() => ({
    height: px2rpx(statusBarHeight.value) + 'rpx'
}))

const navbarStyle = computed(() => {
    const style = {
        backgroundColor: props.backgroundColor,
        height: props.customHeight + 'rpx'
    }

    if (props.translucent) {
        style.backgroundColor = 'rgba(255, 255, 255, 0.95)'
        style.backdropFilter = 'blur(20rpx)'
        style.webkitBackdropFilter = 'blur(20rpx)'
    }

    if (props.borderBottom) {
        style.borderBottom = '1rpx solid #f0f0f0'
    }

    return style
})

const titleStyle = computed(() => ({
    color: props.titleColor,
    fontSize: '34rpx',
    fontWeight: props.titleBold ? '600' : 'normal'
}))

onMounted(() => {
    initSystemInfo()
})

const initSystemInfo = () => {
    const info = uni.getSystemInfoSync()
    systemInfo.value = info
    statusBarHeight.value = info.statusBarHeight || 0
}

const px2rpx = (px) => {
    const screenWidth = systemInfo.value.screenWidth || 375
    return Math.round((750 / screenWidth) * px)
}

const handleBack = () => {
    const pages = getCurrentPages()
    if (pages.length > 1) {
        uni.navigateBack({
            delta: 1,
            animationType: 'pop-out',
            animationDuration: 300
        })
    } else {
        uni.switchTab({
            url: '/pages/index/index'
        })
    }
    emit('back')
}

const goHome = () => {
    uni.switchTab({
        url: '/pages/index/index'
    })
    emit('home')
}
</script>

<style lang="scss" scoped>
.custom-navbar {
    width: 100%;
    background-color: #ffffff;
    box-sizing: border-box;
    overflow: hidden;

    &.navbar-fixed {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9999;
    }

    .status-bar {
        width: 100%;
        background-color: inherit;
    }

    .navbar-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 88rpx;
        padding: 0 32rpx;
        box-sizing: border-box;

        .nav-left {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            min-width: 120rpx;

            .back-container {
                display: flex;
                align-items: center;
                padding: 8rpx 0;

                .back-icon {
                    font-size: 40rpx;
                    line-height: 1;
                    color: #333333;
                    margin-right: 8rpx;
                }

                .back-text {
                    font-size: 28rpx;
                    color: #333333;
                    line-height: 1.2;
                }
            }
        }

        .nav-center {
            flex: 2;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            overflow: hidden;

            .nav-title {
                font-size: 34rpx;
                font-weight: 600;
                color: #333333;
                line-height: 1.2;
                max-width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }

        .nav-right {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            min-width: 120rpx;

            .home-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 60rpx;
                height: 60rpx;
                border-radius: 50%;
                background-color: rgba(0, 0, 0, 0.05);

                .icon-home {
                    font-size: 36rpx;
                    color: #333333;
                }
            }
        }
    }
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
    .custom-navbar {
        background-color: #1a1a1a;
        border-bottom-color: #333333;

        .navbar-content {
            .nav-left {
                .back-container {

                    .back-icon,
                    .back-text {
                        color: #ffffff;
                    }
                }
            }

            .nav-center {
                .nav-title {
                    color: #ffffff;
                }
            }

            .nav-right {
                .home-btn {
                    background-color: rgba(255, 255, 255, 0.1);

                    .icon-home {
                        color: #ffffff;
                    }
                }
            }
        }
    }
}

/* 平板适配 */
@media (min-width: 768px) {
    .custom-navbar {
        .navbar-content {
            padding: 0 48rpx;
            height: 96rpx;

            .nav-center {
                .nav-title {
                    font-size: 36rpx;
                }
            }
        }
    }
}

/* 安全区域适配（iPhone X+） */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
    .custom-navbar.navbar-fixed {
        padding-top: env(safe-area-inset-top);
    }
}
</style>