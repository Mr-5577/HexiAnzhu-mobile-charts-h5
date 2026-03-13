<!-- 退房、挞定、溢价 -->
<template>
    <view class="conversion-metrics">
        <view class="metrics-header">
            <text class="metrics-title">退房、挞定、溢价</text>
        </view>
        <!-- 六宫格数据展示区域 -->
        <view class="data-grid">
            <view class="grid-item" v-for="(item, index) in displayData" :key="index">
                <view class="item-label"> {{ item.label }} </view>
                <view class="item-value">
                    {{ item.value }}
                    <text class="value-unit">{{ item.unit }}</text>
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
import { saleReportApi } from '@/common/api.js'
import { formatPercentage } from '@/utils/common.js'

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
    },
    // 考核口径，默认全口径，0-全部; 1-业绩
    caliberType: {
        type: Number,
        default: 0
    },
    // 报表类型，默认日报，0-年；1-月；2-周；3-日
    reportType: {
        type: Number,
        default: 3
    },
    // 统计数据
    sumData: {
        type: Object,
        default: () => null
    }
})

// loading状态
const loading = ref(false)
// 防止重复请求
const isRequesting = ref(false)

const fetchData = async () => {
    // 检查是否已有请求在进行
    if (isRequesting.value) return;
    loading.value = true;
    isRequesting.value = true;

    const { dateTime, projectIds, reportType, caliberType } = props;
    const params = {
        projIds: projectIds,
        type: reportType, // 0:年  1:月  2:周  3:日
        day: `${dateTime} 00:00:00`,
        assessCaliber: caliberType
    };
    try {
        const res = await saleReportApi.getAsstTotalForApp(params);
    } finally {
        loading.value = false;
        isRequesting.value = false;
    }
};

const displayData = computed(() => {
    let listData = []
    if (props.sumData) {
        // 有数据时
        let targetData = {
            checkOutNum: 0, // 退房
            taDingNum: 0, // 挞定
            premium: 0, // 溢价
            checkOutMoney: 0, // 退房金额
            taDingMoney: 0, // 挞定金额
            premiumRate: 0, // 溢价率
        }
        switch (props.reportType) {
            // 日报
            case 3:
                targetData.checkOutNum = props.sumData.dayCheckoutNum || 0
                targetData.taDingNum = 0
                targetData.premium = props.sumData.dayPemMoney || 0

                targetData.checkOutMoney = 0
                targetData.taDingMoney = 0
                targetData.premiumRate = formatPercentage(props.sumData.dayPemRate || 0)
                break;
            // 月报
            case 1:
                targetData.checkOutNum = props.sumData.totalCheckoutNum || 0
                targetData.taDingNum = 0
                targetData.premium = props.sumData.totalPemMoney || 0

                targetData.checkOutMoney = 0
                targetData.taDingMoney = 0
                targetData.premiumRate = formatPercentage(props.sumData.totalPemRate || 0)
                break;
            // 年报
            case 0:
                targetData.checkOutNum = props.sumData.totalCheckoutNum || 0
                targetData.taDingNum = 0
                targetData.premium = props.sumData.totalPemMoney || 0

                targetData.checkOutMoney = 0
                targetData.taDingMoney = 0
                targetData.premiumRate = formatPercentage(props.sumData.totalPemRate || 0)
                break;
            default:
                break;
        }
        listData = [
            { label: '退房', value: targetData.checkOutNum, unit: '套' },
            { label: '挞定', value: targetData.taDingNum, unit: '套' },
            { label: '溢价', value: targetData.premium, unit: '万' },
            { label: '退房金额', value: targetData.checkOutMoney, unit: '万' },
            { label: '挞定金额', value: targetData.taDingMoney, unit: '万' },
            { label: '溢价率', value: targetData.premiumRate, unit: '%' },
        ]
    } else {
        listData = [
            { label: '退房', value: 0, unit: '套' },
            { label: '挞定', value: 0, unit: '套' },
            { label: '溢价', value: 0, unit: '万' },
            { label: '退房金额', value: 0, unit: '万' },
            { label: '挞定金额', value: 0, unit: '万' },
            { label: '溢价率', value: 0, unit: '%' },
        ]
    }
    return listData
})

onMounted(() => { })

onUnmounted(() => { })

// 暴露方法给父组件
defineExpose({ refreshData: fetchData })
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
        gap: 30rpx 15rpx;

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
                font-size: 28rpx;
                color: #666;
            }

            .item-value {
                font-size: 32rpx;
                font-weight: 600;
                line-height: 1.3;
                background: linear-gradient(135deg, #0c7ef3 0%, #ef4060 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;

                .value-unit {
                    font-size: 24rpx;
                    font-weight: 400;
                    color: #999;
                    -webkit-text-fill-color: #999; // 单位保持灰色
                    background: none;
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