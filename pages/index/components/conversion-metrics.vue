<!-- 转化指标情况 -->
<template>
    <view class="conversion-metrics">
        <view class="metrics-header">
            <text class="metrics-title">转化指标情况</text>
        </view>
        <view class="echarts-info">
            <view class="info-left">
                <svg-ring :label="'当月转化率'" :strokeWidth="25" :progress="conversionRates.monthlyRate" color="#f38caf"
                    backgroundColor="rgba(240, 98, 146, 0.1)"></svg-ring>
            </view>
            <view class="info-right">
                <svg-ring :label="'总体转化率'" :strokeWidth="25" :progress="conversionRates.overallRate" color="#f3a38b"
                    backgroundColor="rgba(255, 138, 101, 0.1)"></svg-ring>
            </view>
        </view>
        <!-- 遮罩层组件 -->
        <loading-mask :visible="loading" text="加载中..." />
    </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import SvgRing from '@/components/svg-ring/index.vue'
import LoadingMask from '@/components/loading-mask/index.vue'
import dayjs from 'dayjs'
import { largeScreenApi } from '@/common/api.js'

const props = defineProps({
    // 选择的项目ID
    projectIds: {
        type: Array,
        default: () => []
    },
    // 选择的时间日期
    dateTime: {
        type: String,
        default: ''
    }
})

// loading状态
const loading = ref(false)
// 防止重复请求
const isRequesting = ref(false)

const conversionData = ref({
    dylfComeNum: 0, // 总数量
    dyrgNum: 0, // 当月转化数量
    dylfrgNum: 0, // 总体转化数量
});

// 计算转化率的通用函数
const calculateRate = (numerator) => {
    const total = conversionData.value.dylfComeNum;
    if (total === 0) return 0;
    const rate = (numerator / total) * 100;
    // 处理NaN和Infinity
    if (isNaN(rate) || !isFinite(rate)) {
        return 0;
    }
    // 保留两位小数，四舍五入
    return Math.round(rate * 100) / 100;
};

const conversionRates = computed(() => {
    const monthly = conversionData.value.dylfrgNum;
    const overall = conversionData.value.dyrgNum;
    // 计算当月转化率
    const monthlyRate = calculateRate(monthly);
    // 计算总体转化率
    const overallRate = calculateRate(overall);
    return {
        monthlyRate,
        overallRate,
    };
});

const fetchData = async () => {
    // 检查是否已有请求在进行
    if (isRequesting.value) return;
    loading.value = true;
    isRequesting.value = true;

    const { dateTime, projectIds } = props;
    const params = {
        projIds: projectIds,
        type: 1, // 0:年  1:月  2:周  3:日
        day: `${dateTime} 00:00:00`,
        beginDate: dayjs(dateTime).startOf("month").format("YYYY-MM-DD") + " 00:00:00",
        endDate: dayjs(dateTime).endOf("month").format("YYYY-MM-DD") + " 23:59:59",
    };
    try {
        const res = await largeScreenApi.getCustomerComeInfo(params);
        if (res.code === 200 && res.data) {
            conversionData.value.dylfComeNum = res.data.dylfComeNum || 0;
            conversionData.value.dyrgNum = res.data.dyrgNum || 0;
            conversionData.value.dylfrgNum = res.data.dylfrgNum || 0;
        }
    } finally {
        loading.value = false;
        isRequesting.value = false;
    }
};

// 监听页面显示/隐藏
onMounted(() => {
})

onUnmounted(() => {
})

// 暴露方法给父组件
defineExpose({
    refreshData: fetchData
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
    position: relative;

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