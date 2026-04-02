<template>
    <view class="autoLogin-page">
        <!-- 加载状态 -->
        <view v-if="loading" class="loading-container">
            <text class="loading-text">登录验证</text>
            <text v-if="loadingMessage" class="loading-message">{{ loadingMessage }}</text>
        </view>

        <!-- 错误状态 -->
        <view v-else-if="errorMessage" class="error-container">
            <text class="error-message" @click="isShowError = !isShowError">{{ errorMessage }}</text>
            <!-- <view class="btn-group">
                <button class="retry-btn" @click="handleRetry">重试</button>
            </view> -->

            <view class="error-info" v-show="isShowError">
                <text>urlInfo信息：{{ urlInfo }}</text>
                <text>token信息：{{ tokenInfo }}</text>
                <text>data信息：{{ dataInfo }}</text>
                <text>error信息：{{ errorInfo }}</text>
                <text>callbackUrl信息：{{ callbackUrl }}</text>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { userApi } from '@/common/api.js'
import config from '@/utils/config.js'

// 本地存储键名常量
const STORAGE_KEYS = {
    TOKEN: 'token',
    STATE_TAG: 'stateTag'
}
// 固定的回调地址，http://sysa.hexianzhu.com/pages/login/autoLogin
const CALLBACK_URL = `${config.baseUrlActual}/pages/login/autoLogin`

const DATA_VAL = 'app_auto_login'

// 工具函数：显示消息提示
const showMessage = (message) => {
    // 如果正在加载中，将消息显示在加载区域
    if (loading.value) {
        loadingMessage.value = message
    } else {
        // 不在加载状态时，使用原来的 toast
        uni.showToast({
            title: message,
            icon: 'none',
            duration: 2000,
            mask: true
        })
    }
}

// 本地存储操作
const storage = {
    setToken: (token) => uni.setStorageSync(STORAGE_KEYS.TOKEN, token),
    getToken: () => uni.getStorageSync(STORAGE_KEYS.TOKEN) || '',
    removeToken: () => uni.removeStorageSync(STORAGE_KEYS.TOKEN),

    setStateTag: (state) => uni.setStorageSync(STORAGE_KEYS.STATE_TAG, state),
    getStateTag: () => uni.getStorageSync(STORAGE_KEYS.STATE_TAG) || '',
    removeStateTag: () => uni.removeStorageSync(STORAGE_KEYS.STATE_TAG),

    clearAll: () => {
        uni.removeStorageSync(STORAGE_KEYS.TOKEN)
        uni.removeStorageSync(STORAGE_KEYS.STATE_TAG)
    }
}

const loading = ref(true)
const errorMessage = ref('')
const isShowError = ref(false)
const loadingMessage = ref('')
// 调试信息
const urlInfo = ref('')
const tokenInfo = ref('')
const dataInfo = ref('')
const errorInfo = ref('')
const callbackUrl = ref('')

// 防止重复处理
let isProcessing = false

// H5 获取 URL 参数
const getQueryParams = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const atobJson = atob(urlParams.get('state') || '')
    const atobObj = atobJson ? JSON.parse(atobJson) : null
    return {
        token: urlParams.get('token') || '',
        error: urlParams.get('error') || '',
        data: atobObj && atobObj.data ? atobObj.data : '',
        home: atobObj && atobObj.home ? atobObj.home : '',
    }
}

// 首次访问，重定向到认证页面，参数url路径的home，作为认证成功后跳转去的页面路径
const redirectToAuth = async () => {

    showMessage('正在获取认证信息...')
    try {
        const urlParams = new URLSearchParams(window.location.search)
        const homeUrl = urlParams.get('home') || '/pages/index/index' // 默认跳转到驾驶舱页面, URLSearchParams.get() 会自动解码
        // 获取认证地址
        const params = {
            data: DATA_VAL,
            home: homeUrl,
            autoLoginPage: CALLBACK_URL,
            isQrCode: false, // 是否扫码
        }
        const res = await userApi.getAuthRedirectUrl(params) // 正式接口
        // const res = await userApi.getAuthRedirectUrlTest(params) // 测试接口
        if (res.code === 200 && res.data) {
            console.log('获取到认证地址，开始重定向:', res.data)
            showMessage('正在跳转到认证页面...')
            // 短暂延迟让用户看到提示
            await new Promise(resolve => setTimeout(resolve, 800))
            // H5 跳转
            window.location.href = res.data
            // window.location.href = `http://192.168.1.24:8098/pages/login/autoLogin?token=123&state=eyJkYXRhIjoiYXBwX2F1dG9fbG9naW4iLCJob21lIjoiL3BhZ2VzL3JlcG9ydC9pbmRleD9kYXk9MjAyNi0wMy0zMCIsImF1dG9Mb2dpblBhZ2UiOiJodHRwOi8vMTkyLjE2OC4xLjI0OjgwOTgvcGFnZXMvbG9naW4vYXV0b0xvZ2luIiwiaXNRckNvZGUiOmZhbHNlfQ==`
        } else {
            throw new Error(res.message || '获取认证地址失败')
        }
    } catch (err) {
        showMessage('无法连接到认证服务')
        errorMessage.value = err.message || '无法连接到认证服务，请稍后重试'
    }
}

// 处理 data 登录
const handleTokenLogin = async (token, dataParam) => {
    // 特殊情况：hxaz 直接登录
    if (dataParam === 'hxaz') {
        // 保存token
        storage.setToken(token)
        showMessage('登录成功，正在跳转...')
        await new Promise(resolve => setTimeout(resolve, 800))
        // H5 跳转到首页
        uni.redirectTo({
            url: '/pages/index/index'
        })
        return
    }
    // 验证 data 值
    if (dataParam === DATA_VAL) {
        // 保存token
        storage.setToken(token)
        showMessage('登录成功，正在跳转...')
        await new Promise(resolve => setTimeout(resolve, 800))
        const { home } = getQueryParams()
        // 判断是否在白名单中，不在就跳首页
        const targetPath = home ? home : '/pages/index/index'
        // H5 跳转到目标页面
        uni.redirectTo({
            url: targetPath
        })
    } else {
        showMessage('登录验证失败，请重新登录')
        storage.removeToken()
        throw new Error('state验证失败')
    }
}

// 主处理逻辑
const handleRouteParams = async () => {
    // 防止重复处理
    if (isProcessing) return
    isProcessing = true
    try {
        loading.value = true
        errorMessage.value = ''

        // 获取 URL 参数
        const { token, error, data } = getQueryParams()

        // 保存调试信息
        tokenInfo.value = token
        dataInfo.value = data
        errorInfo.value = error

        // 情况1：有错误参数
        if (error) {
            errorMessage.value = `认证服务错误: ${error}`
            showMessage(`认证错误: ${error}`)
            return
        }

        // 情况2：有 token 和 data，开始验证登录
        if (token && data) {
            await handleTokenLogin(token, data)
            return
        }
        // 情况3：首次访问，没有token也没有state
        console.log('没有token，开始重定向到认证页面')
        await redirectToAuth()

    } catch (err) {
        console.error('登录处理失败:', err)
        errorMessage.value = err instanceof Error ? err.message : '登录处理失败'
        showMessage('登录处理失败')
    } finally {
        loading.value = false
        isProcessing = false
    }
}

// 重试
const handleRetry = () => {
    // 清理状态
    errorMessage.value = ''
    storage.removeToken()
    isProcessing = false
    loading.value = true
    // 重新处理
    handleRouteParams()
}
// 判断当前终端类型 PC、平板、手机
const detectDeviceType = () => {
    const ua = navigator.userAgent;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const touchPoints = navigator.maxTouchPoints || 0;
    const hasTouch = touchPoints > 0 || "ontouchstart" in window;

    // 计算设备像素比和估算物理尺寸
    const pixelRatio = window.devicePixelRatio || 1;
    const physicalDiagonal = Math.sqrt(
        Math.pow(screenWidth / pixelRatio, 2) +
        Math.pow(screenHeight / pixelRatio, 2)
    ) / 160; // 160ppi 为标准，估算英寸

    // 1. 先检测明确标识，明确平板UA
    if (/iPad|Tablet|PlayBook|Silk|Kindle|KFTT|KFOT|SM-T|GT-P|SGP/i.test(ua)) {
        return "tablet";
    }

    // 2. 检测iPadOS伪装Mac，检测到iPad
    if (/Macintosh/i.test(ua) && hasTouch && screenWidth >= 768) {
        return "tablet";
    }

    // 3. Android平板（有Android但没有Mobile标识，且宽度足够大）
    if (/Android/i.test(ua) && !/Mobile/i.test(ua) && screenWidth >= 600) {
        return "tablet";
    }

    // 4. 手机检测（包含各种手机标识）
    if (/Mobi|iPhone|iPod|BlackBerry|Windows Phone|Opera Mini|IEMobile|WPDesktop|Android.*Mobile|Mobile.*Android/i.test(ua)) {
        // // 排除大屏手机（物理尺寸 > 7寸）
        // if (physicalDiagonal > 7 && screenWidth >= 600) {
        //     console.log('大屏手机，按平板处理');
        //     return "tablet";
        // }
        return "mobile";
    }

    // 5. 根据屏幕尺寸和触摸能力综合判断
    if (hasTouch) {
        // 小屏带触摸 - 判定为手机
        if (screenWidth < 600) {
            return "mobile";
        }

        // 中屏带触摸 - 需要进一步判断
        if (screenWidth >= 600 && screenWidth <= 1366) {
            const aspectRatio = screenWidth / screenHeight;
            const isTabletRatio = aspectRatio > 1.2 && aspectRatio < 1.8;

            // 物理尺寸判断，中屏触屏 + 物理尺寸 >= 7寸，判为平板
            if (physicalDiagonal >= 7) {
                return "tablet";
            }

            // 典型平板比例，中屏触屏 + 平板比例，判为平板
            if (isTabletRatio) {
                return "tablet";
            }

            // 检查是否为Windows设备，Windows触屏设备，判为桌面PC
            if (/Windows|Win64|WOW64/i.test(ua)) {
                return "desktop";
            }

            console.log('中屏触屏但不符合平板特征，判为手机');
            return "mobile";
        }
    }

    // 6. 大屏无触摸 - 判为桌面
    if (screenWidth > 1024) {
        return "desktop";
    }

    // 7. 默认返回 - mobile
    return "mobile";
};

// 让平板用户选择
const showDeviceChoiceDialog = () => {
    uni.showModal({
        title: '选择登录方式',
        content: '检测到您使用的是平板设备，请选择登录版本',
        confirmText: '手机版',
        cancelText: '电脑版',
        success: (res) => {
            if (res.confirm) {
                // 选择手机版
                handleRouteParams()
            } else {
                // 选择电脑版
                window.location.href = 'http://sys.hexianzhu.com/autoLogin'
            }
        }
    })
}
// 生命周期
onMounted(() => {
    console.log('H5自动登录页面挂载')
    urlInfo.value = window.location.href
    callbackUrl.value = CALLBACK_URL
    const deviceType = detectDeviceType();
    console.log('设备类型:', deviceType)
    if (deviceType === 'mobile') {
        handleRouteParams()
    } else {
        // 平板和PC端都重定向到PC端地址,如果有pcHome参数则跳转到对应PC端页面
        const urlParams = new URLSearchParams(window.location.search)
        const pcHomeUrl = urlParams.get('pcHome') || '' // PC端跳转页面参数,URLSearchParams.get() 方法会自动进行一次URL解码
        const baseUrl = 'http://sys.hexianzhu.com/autoLogin'; // PC端自动登录地址
        // 构建完整的URL http://sys.hexianzhu.com/autoLogin?home=/performance-analysis/tree-daily-report?day=2026-03-27
        window.location.href = pcHomeUrl ? `${baseUrl}?home=${pcHomeUrl}` : baseUrl;

        // window.location.href = pcHomeUrl ? `http://sys.hexianzhu.com/autoLogin?home=${pcHomeUrl}` : `http://sys.hexianzhu.com/autoLogin`
        // window.location.href = pcHomeUrl ? `http://192.168.1.24:3000/autoLogin?home=${pcHomeUrl}` : 'http://192.168.1.24:3000/autoLogin'
    }
})

onUnmounted(() => {
    console.log('H5自动登录页面卸载')
    isProcessing = false
    loadingMessage.value = ''
})
</script>

<style lang="scss" scoped>
.autoLogin-page {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    box-sizing: border-box;
    padding: 30rpx;

    .loading-container {
        background: rgba(255, 255, 255, .2);
        padding: 60rpx;
        border-radius: 24rpx;
        box-shadow: 0 4rpx 40rpx rgba(0, 0, 0, 0.1);
        text-align: center;
        min-width: 500rpx;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 30rpx;

        .loading-text {
            font-size: 32rpx;
            color: #333;
            font-weight: 500;
        }

        &::after {
            content: '';
            display: block;
            width: 48rpx;
            height: 48rpx;
            border: 4rpx solid #e0e0e0;
            border-top-color: #409eff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        .loading-message {
            font-size: 26rpx;
            color: #409eff;
            margin-top: 20rpx;
            animation: fadeInOut 2s ease-in-out;
        }
    }

    .error-container {
        background: white;
        padding: 60rpx;
        border-radius: 24rpx;
        box-shadow: 0 4rpx 40rpx rgba(0, 0, 0, 0.1);
        text-align: center;
        min-width: 500rpx;
        max-width: 650rpx;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 30rpx;

        .error-message {
            color: #f56c6c;
            font-size: 28rpx;
            word-break: break-word;
            line-height: 1.5;
            max-width: 100%;
        }

        .btn-group {
            width: 100%;
            display: flex;
            justify-content: center;
        }

        .retry-btn {
            padding: 20rpx 80rpx;
            background: linear-gradient(135deg, #409eff 0%, #626aef 100%);
            color: white;
            border: none;
            border-radius: 12rpx;
            font-size: 28rpx;
            font-weight: 500;
            transition: all 0.3s;
            box-shadow: 0 4rpx 12rpx rgba(64, 158, 255, 0.3);

            &:active {
                opacity: 0.8;
                transform: scale(0.98);
                box-shadow: 0 2rpx 6rpx rgba(64, 158, 255, 0.2);
            }
        }

        .error-info {
            display: flex;
            flex-direction: column;
            width: 100%;
            /* 占满父容器 */
            /* 移除或减小内边距 */
            padding: 0 20rpx;
            box-sizing: border-box;
            gap: 10rpx;
            /* 添加间距 */
        }

        .error-info text {
            /* 文本换行处理 */
            word-break: break-all;
            /* 强制 break */
            word-wrap: break-word;
            /* 允许长单词换行 */
            white-space: pre-wrap;
            /* 保留空格和换行 */
            text-align: left;
            /* 左对齐更易读 */
            font-size: 24rpx;
            /* 稍微小一点 */
            line-height: 1.5;
            background-color: #f8f8f8;
            /* 添加背景色便于区分 */
            padding: 10rpx;
            border-radius: 8rpx;
            border-left: 4rpx solid #409eff;
            /* 左侧装饰线 */
        }
    }
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@keyframes fadeInOut {
    0% {
        opacity: 0;
    }

    20% {
        opacity: 1;
    }

    80% {
        opacity: 1;
    }

    100% {
        opacity: 0;
    }
}
</style>