<!-- 自定义顶部导航栏 -->
<template>
    <view class="custom-navbar" :class="{ 'navbar-fixed': fixed }" :style="navbarStyle">
        <!-- 状态栏占位 -->
        <view class="status-bar" :style="statusBarStyle"></view>

        <!-- 导航栏内容 -->
        <view class="navbar-content">
            <!-- 左侧：返回按钮或者其它内容 -->
            <view v-if="showLeft" class="nav-left" :class="{ 'has-content': showLeft }">
                <slot name="left">
                    <template v-if="showBack">
                        <!-- 返回按钮 -->
                        <view class="back-container" @click="handleBack">
                            <uni-icons type="back" size="20" color="#333"></uni-icons>
                            <text v-if="backText" class="back-text">{{ backText }}</text>
                        </view>
                    </template>
                    <template v-if="showMoreMenu">
                        <!-- 更多图标 -->
                        <view class="more-container" @click="toggleMenu">
                            <uni-icons type="bars" size="22" color="#333"></uni-icons>
                        </view>
                    </template>
                </slot>
            </view>

            <!-- 中间：标题 -->
            <view class="nav-center" :class="{
                'left-only': showLeft && !hasRightContent,
                'right-only': !showLeft && hasRightContent,
                'both-sides': showLeft && hasRightContent,
                'center-only': !showLeft && !hasRightContent
            }">
                <text class="nav-title">{{ title }}</text>
                <text class="nav-sub-title" v-if="subTitle">{{ subTitle }}</text>
            </view>

            <!-- 右侧：操作区域 -->
            <view v-if="showRight" class="nav-right" :class="{ 'has-content': hasRightContent }">
                <slot name="right">
                    <!-- 默认右侧内容 -->
                    <view class="home-btn" @click="goHome">
                        <uni-icons type="home-filled" size="20" color="#333"></uni-icons>
                    </view>
                </slot>
            </view>
        </view>
    </view>

    <!-- Teleport 组件允许把模版放在DOM的其他位置上。弹窗菜单（放到body，不被裁剪） -->
    <Teleport to="body">
        <view v-if="showMoreMenu" class="popup-mask" v-show="menuVisible" @click="menuVisible = false">
            <view class="popup-menu" :style="menuStyle" :class="{ 'menu-visible': menuVisible }" @click.stop>
                <view class="menu-arrow"></view>
                <view class="menu-item" v-for="(item, index) in menuItems" :key="index"
                    @click="handleMenuItemClick(item)">
                    <text>{{ item.name }}</text>
                </view>
            </view>
        </view>
    </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, useSlots, onUnmounted } from 'vue'

const props = defineProps({
    title: { type: String, default: '' },
    subTitle: { type: String, default: '' },
    backgroundColor: { type: String, default: 'rgba(255, 255, 255, 0)' },
    showLeft: { type: Boolean, default: true },
    showBack: { type: Boolean, default: false },
    backText: { type: String, default: '返回' },
    showMoreMenu: { type: Boolean, default: false },
    showRight: { type: Boolean, default: false },
    fixed: { type: Boolean, default: true },
    translucent: { type: Boolean, default: false },
    borderBottom: { type: Boolean, default: true },
    titleBold: { type: Boolean, default: true },
    customHeight: { type: Number, default: 88 }
})

const emit = defineEmits(['back', 'home'])
const slots = useSlots()

// ref
const statusBarHeight = ref(0)
const systemInfo = ref({})
const menuVisible = ref(false)
const menuItems = ref([
    { name: '销售驾驶舱', url: '/pages/index/index' },
    { name: '销售报表', url: '/pages/report/index' },
])

// 检查是否有右侧内容（包括默认的home按钮和slot内容）
const hasRightContent = computed(() => {
    // 如果有插槽内容，则显示插槽
    if (!!slots.right) return true
    // 如果没有插槽内容，则检查showRight属性
    return props.showRight
})

const statusBarStyle = computed(() => ({
    height: px2rpx(statusBarHeight.value) + 'rpx'
}))

const navbarStyle = computed(() => {
    const style = {
        backgroundColor: props.backgroundColor,
        height: props.customHeight + 'rpx'
    }

    if (props.translucent) {
        // style.backgroundColor = 'rgba(255, 255, 255, 0.95)'
        style.backdropFilter = 'blur(20rpx)'
        style.webkitBackdropFilter = 'blur(20rpx)'
    }

    if (props.borderBottom) {
        style.borderBottom = '1rpx solid #f0f0f0'
    }

    return style
})

const menuStyle = computed(() => {
    return {
        top: (statusBarHeight.value + 44) + 'px',
        left: '20rpx'
    }
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
        uni.navigateBack({ delta: 1 })
    } else {
        uni.redirectTo({ url: '/pages/index/index' })
    }
    emit('back')
}

const goHome = () => {
    uni.redirectTo({ url: '/pages/index/index' })
    emit('home')
}

const toggleMenu = () => {
    menuVisible.value = !menuVisible.value
}
const handleMenuItemClick = (item) => {
    menuVisible.value = false

    // 获取当前页面路径
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    // 获取当前页面路径，移除开头的 '/' 进行比较
    const currentUrl = '/' + currentPage.route
    // 如果点击的路径与当前路径一致，则不跳转
    if (currentUrl === item.url) return

    // 跳转到目标页面
    uni.navigateTo({ url: item.url })
}

onMounted(() => {
    initSystemInfo()
})
onUnmounted(() => {
    menuVisible.value = false
});
</script>

<style lang="scss" scoped>
.custom-navbar {
    width: 100%;
    box-sizing: border-box;
    // overflow: hidden;

    &.navbar-fixed {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        // z-index: 999;
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
        padding: 0 28rpx;
        box-sizing: border-box;
        position: relative;

        .nav-left {
            flex: 0 0 auto;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            min-width: 120rpx;
            z-index: 1;

            &.has-content {
                flex: 1;
            }

            .back-container {
                display: flex;
                align-items: center;
                padding: 8rpx 0;
                position: relative;

                .back-text {
                    font-size: 28rpx;
                    color: #333333;
                    line-height: 1.2;
                }
            }
        }

        .nav-center {
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            z-index: 0;

            // 默认情况：左右都有内容
            &.both-sides {
                left: 120rpx;
                right: 120rpx;
                justify-content: center;
            }

            // 只有左侧有内容
            &.left-only {
                left: 120rpx;
                right: 0;
                justify-content: center;
                padding-right: 120rpx;
            }

            // 只有右侧有内容
            &.right-only {
                left: 0;
                right: 120rpx;
                justify-content: center;
                padding-left: 120rpx;
            }

            // 只有标题（居中显示）
            &.center-only {
                left: 0;
                right: 0;
                justify-content: center;
            }

            .nav-title {
                font-size: 32rpx;
                font-weight: 600;
                color: #333333;
                line-height: 1.2;
                max-width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                pointer-events: none;
            }

            .nav-sub-title {
                font-size: 22rpx;
                color: #333;
                line-height: 1.2;
                max-width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                pointer-events: none;
            }
        }

        .nav-right {
            flex: 0 0 auto;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            min-width: 120rpx;
            z-index: 1;

            &.has-content {
                flex: 1;
                justify-content: flex-end;
            }

            .home-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 60rpx;
                height: 60rpx;
                border-radius: 50%;

                .icon-home {
                    font-size: 36rpx;
                    color: #333333;
                }
            }
        }
    }
}

// 遮罩层（点击空白关闭菜单）
.popup-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    background: rgba(208, 210, 211, 0.1);
}

// 菜单主体
.popup-menu {
    position: absolute;
    // top: 80rpx;
    // left: 20rpx;
    min-width: 260rpx;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(10rpx);
    -webkit-backdrop-filter: blur(10rpx);
    border-radius: 20rpx;
    box-shadow: 0 6rpx 30rpx rgba(0, 0, 0, 0.08);
    z-index: 1001;
    opacity: 0;
    transform: translateY(-8rpx);
    transition: all 0.25s ease;
    pointer-events: none;
    border: 1rpx solid rgba(255, 255, 255, 0.3);

    // 显示状态
    &.menu-visible {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
    }

    // 小三角箭头
    .menu-arrow {
        position: absolute;
        top: -16rpx;
        left: 36rpx;
        width: 0;
        height: 0;
        border-left: 16rpx solid transparent;
        border-right: 16rpx solid transparent;
        border-bottom: 16rpx solid #fff;
    }

    // 菜单项
    .menu-item {
        padding: 20rpx 30rpx;
        font-size: 28rpx;
        color: #333;
        border-bottom: 1rpx solid #f0f0f0;
        white-space: nowrap;

        &:last-child {
            border-bottom: none;
        }

        &:active {
            background-color: #f7f7f7;
        }
    }
}
</style>