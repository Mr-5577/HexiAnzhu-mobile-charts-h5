<!-- 这个自动登录版本是通过本地缓存stateTag值，来比较回调值 -->
<template>
    <view class="autoLogin-page">
        <!-- 加载状态 -->
        <view v-if="loading" class="loading-container">
            <text class="loading-text">正在验证身份...</text>
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
                <text>state信息：{{ stateInfo }}</text>
                <text>error信息：{{ errorInfo }}</text>
                <text>locationState信息：{{ locationState }}</text>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { userApi } from '@/common/api.js'
import { v4 as uuidv4 } from 'uuid'
import config from '@/utils/config.js'

// 本地存储键名常量
const STORAGE_KEYS = {
    TOKEN: 'token',
    STATE_TAG: 'stateTag'
}

// 工具函数：显示消息提示
const showMessage = (message) => {
    uni.showToast({
        title: message,
        icon: 'none',
        duration: 2000,
        mask: true
    })
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

// 调试信息
const urlInfo = ref('')
const tokenInfo = ref('')
const stateInfo = ref('')
const errorInfo = ref('')
const locationState = ref('')

// 防止重复处理
let isProcessing = false

const currentState = computed(() => {
    return storage.getStateTag()
});

// H5 获取 URL 参数
const getQueryParams = () => {
    const urlParams = new URLSearchParams(window.location.search)
    return {
        token: urlParams.get('token') || '',
        state: urlParams.get('state') || '',
        error: urlParams.get('error') || ''
    }
}

// 重定向到认证页面
const redirectToAuth = async () => {
    try {
        // 生成 state 并存储
        // const validState = uuidv4()

        // 把地址编码后作为state参数进行传递   http://sysa.hexianzhu.com/pages/login/autoLogin
        const currentUrl = `${config.baseUrlActual}/pages/login/autoLogin`
        console.log('currentUrl', currentUrl)
        const validState = encodeURIComponent(currentUrl); // encodeURIComponent 编码    decodeURIComponent 解码

        // storage.setStateTag(validState) // 缓存编码的地址
        storage.setStateTag(currentUrl) // 缓存未编码的地址

        console.log('生成新的stateTag:', validState)

        showMessage('正在获取认证信息...')

        // 获取认证地址
        const res = await userApi.getAuthRedirectUrl({ state: validState })
        if (res.code === 200 && res.data) {
            console.log('获取到认证地址，开始重定向:', res.data)
            showMessage('正在跳转到认证页面...')

            // 短暂延迟让用户看到提示
            await new Promise(resolve => setTimeout(resolve, 800))

            // H5 跳转
            window.location.href = res.data
        } else {
            throw new Error(res.message || '获取认证地址失败')
        }
    } catch (err) {
        showMessage('无法连接到认证服务')
        errorMessage.value = err.message || '无法连接到认证服务，请稍后重试'
    }
}

// 处理 token 登录
const handleTokenLogin = async (token, stateParam) => {

    // 特殊情况：hxaz 直接登录
    if (stateParam === 'hxaz') {
        // 保存token
        storage.setToken(token)
        // 清除state标记
        storage.removeStateTag()
        showMessage('登录成功，正在跳转...')
        await new Promise(resolve => setTimeout(resolve, 800))

        // H5 跳转到首页
        uni.redirectTo({
            url: '/pages/index/index'
        })
        return
    }

    // 验证 state
    const decodeState = decodeURIComponent(stateParam)
    if (stateParam === storage.getStateTag() || decodeState === storage.getStateTag()) {
        // 存储 token
        storage.setToken(token)
        // 清除state标记
        storage.removeStateTag()
        console.log('token验证成功')

        showMessage('登录成功，正在跳转...')
        await new Promise(resolve => setTimeout(resolve, 800))

        // H5 跳转到首页
        uni.redirectTo({
            url: '/pages/index/index'
        })
    } else {
        console.error('state验证失败:', {
            received: stateParam,
            expected: storage.getStateTag()
        })
        showMessage('登录验证失败，请重新登录')
        storage.removeToken()
        storage.removeStateTag()
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
        const { token, state, error } = getQueryParams()

        // 保存调试信息
        tokenInfo.value = token
        stateInfo.value = state
        errorInfo.value = error

        // 情况1：有错误参数
        if (error) {
            errorMessage.value = `认证服务错误: ${error}`
            showMessage(`认证错误: ${error}`, 'error')
            return
        }

        // 情况2：有 token 和 state，进行登录
        if (token && state) {
            console.log('有token和state，开始验证登录')
            await handleTokenLogin(token, state)
            return
        }

        // 情况3：没token但有state
        if (!token && storage.getStateTag()) {
            // 清除state标记
            storage.removeStateTag()
        }
        // 情况4：首次访问，没有token也没有state
        if (!token && !storage.getStateTag()) {
            console.log('首次访问，开始重定向到认证页面')
            await redirectToAuth()
            return
        }


        // 其他情况
        errorMessage.value = '无效的登录参数'
        showMessage('无效的登录参数', 'error')

    } catch (err) {
        console.error('登录处理失败:', err)
        errorMessage.value = err instanceof Error ? err.message : '登录处理失败'
        showMessage('登录处理失败', 'error')
    } finally {
        loading.value = false
        isProcessing = false
    }
}

// 重试
const handleRetry = () => {
    console.log('用户点击重试')

    // 清理状态
    errorMessage.value = ''
    storage.removeStateTag()
    isProcessing = false
    loading.value = true

    // 重新处理
    handleRouteParams()
}

// 生命周期
onMounted(() => {
    console.log('H5自动登录页面挂载')
    urlInfo.value = window.location.href
    locationState.value = storage.getStateTag()
    handleRouteParams()
})

onUnmounted(() => {
    console.log('H5自动登录页面卸载')
    isProcessing = false
    // 清除state标记
    storage.removeStateTag()
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
</style>