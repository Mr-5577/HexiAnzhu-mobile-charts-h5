<!-- 累计统计 -->
<template>
    <view class="conversion-metrics">
        <view class="metrics-header">
            <text class="metrics-title">累计统计</text>
        </view>
        <!-- 六宫格数据展示区域 -->
        <view class="data-grid">
            <view class="grid-item" v-for="(item, index) in dataList" :key="index">
                <view class="item-label"> {{ item.label }} </view>
                <view class="item-value">
                    {{ item.value }}
                    <text v-if="item.unit" class="value-unit">{{ item.unit }}</text>
                </view>
                <view v-if="item.trend" class="item-trend" :class="getTrendClass(item.trend)">
                    <uni-icons :type="item.trend > 0 ? 'arrow-up' : 'arrow-down'" :size="12"
                        :color="item.trend > 0 ? '#f56c6c' : '#67c23a'" />
                    <text>{{ Math.abs(item.trend) }}%</text>
                </view>
            </view>
        </view>
        <!-- 遮罩层组件 -->
        <loading-mask :visible="loading" text="加载中..." />
    </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
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

const dataList = ref([
    { label: '总来访', value: 1234, unit: '人', trend: 12.5 },
    { label: '新访客', value: 567, unit: '人', trend: -5.2 },
    { label: '老访客', value: 667, unit: '人', trend: 8.3 },
    { label: '预约数', value: 89, unit: '个', trend: 20.1 },
    { label: '到访率', value: 85.5, unit: '%', trend: 3.2 },
    { label: '转化率', value: 42.8, unit: '%', trend: -2.1 }
])
const getTrendClass = (trend) => {
    return trend > 0 ? 'trend-up' : 'trend-down'
}
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
        // const res = await largeScreenApi.getCustomerComeInfo(params);
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
                background: linear-gradient(135deg, #409eff, #626aef);
                border-radius: 3rpx;
            }
        }
    }

    // 数据网格
    .data-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 30rpx 20rpx;

        .grid-item {
            text-align: center;
            padding: 10rpx 0;
            border-radius: 12rpx;
            transition: all 0.3s ease;

            &:active {
                background: #f5f7fa;
                transform: scale(0.98);
            }

            .item-label {
                font-size: 26rpx;
                color: #666;
                margin-bottom: 12rpx;
            }

            .item-value {
                font-size: 40rpx;
                font-weight: 600;
                color: #333;
                line-height: 1.2;

                .value-unit {
                    font-size: 24rpx;
                    font-weight: 400;
                    color: #999;
                    margin-left: 4rpx;
                }
            }

            .item-trend {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-top: 8rpx;
                font-size: 20rpx;

                &.trend-up {
                    color: #f56c6c;
                }

                &.trend-down {
                    color: #67c23a;
                }

                .uni-icons {
                    margin-right: 2rpx;
                }
            }
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