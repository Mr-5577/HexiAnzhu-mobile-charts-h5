<!-- 退房、挞定、溢价 -->
<template>
    <view class="line-chart">
        <view class="line-chart-header">
            <text class="line-chart-title">退房、挞定、溢价</text>
        </view>
        <div ref="chartDom" class="chart-area"></div>
        <!-- 遮罩层组件 -->
        <loading-mask :visible="loading" text="加载中..." />
    </view>
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted, computed, nextTick } from 'vue'
import * as echarts from 'echarts'
import LoadingMask from '@/components/loading-mask/index.vue'
import dayjs from 'dayjs'
import { largeScreenApi } from '@/common/api.js'

const props = defineProps({
    projectIds: {
        type: Array,
        default: () => []
    },
    dateTime: {
        type: String,
        default: ''
    }
})

// loading状态
const loading = ref(false)
// 防止重复请求
const isRequesting = ref(false)

const chartInstance = shallowRef(null)
const chartDom = ref(null)

// 图表数据
const chartData = ref({
    dates: [],
    subscription: [],
    signing: [],
    payment: []
})

// 计算最大值
const paymentMax = computed(() => {
    const validData = chartData.value.payment.filter(v => v != null)
    if (validData.length === 0) return 10
    const max = Math.max(...validData)
    return Math.ceil(max / 10) * 10
})

const setMax = computed(() => {
    const allData = [...chartData.value.subscription, ...chartData.value.signing].filter(v => v != null)
    return allData.length ? Math.max(...allData, 100) : 100
})

// 图表配置
const chartOption = computed(() => ({
    tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderColor: '#333',
        textStyle: {
            color: '#fff'
        }
    },
    legend: {
        data: ['认购(套)', '签约(套)', '回款(万)'],
        top: '0%',
        textStyle: { color: '#333', fontSize: 11 },
        itemGap: 5,
        itemWidth: 10,
        itemHeight: 10
    },
    grid: {
        left: '3%',
        right: '3%',
        bottom: '3%',
        top: '15%',
        containLabel: true
    },
    xAxis: {
        type: 'category',
        boundaryGap: false,
        data: chartData.value.dates,
        axisLine: {
            show: true,
            lineStyle: {
                color: 'rgba(100, 100, 100, 0.3)',
                width: 1,
                type: 'dotted'
            }
        },
        axisTick: {
            show: true,
            alignWithLabel: true,
            length: 3,
            lineStyle: {
                color: 'rgba(100, 100, 100, 0.3)',
                width: 1
            }
        },
        splitLine: {
            show: true,
            lineStyle: {
                color: 'rgba(200, 200, 200, 0.1)',
                width: 1,
                type: 'dashed'
            }
        },
        axisLabel: {
            color: '#666',
            fontSize: 11,
            margin: 10,
            interval: getLabelInterval(chartData.value.dates.length),
            formatter: (value) => value
        }
    },
    yAxis: [
        {
            type: 'value',
            name: '万元',
            nameLocation: 'end',
            nameGap: 10,
            nameRotate: 0,
            min: 0,
            max: paymentMax.value,
            axisLabel: { color: '#666', fontSize: 11 },
            nameTextStyle: {
                color: '#666',
                fontSize: 11
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(177, 173, 173, 0.3)',
                    width: 1,
                    type: 'dashed'
                }
            }
        },
        {
            type: 'value',
            name: '套',
            nameGap: 10,
            nameRotate: 0,
            position: 'right',
            offset: 0,
            min: 0,
            max: setMax.value,
            axisLabel: { color: '#666', fontSize: 11 },
            nameTextStyle: {
                color: '#666',
                fontSize: 11
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(177, 173, 173, 0.3)',
                    width: 1,
                    type: 'dashed'
                }
            }
        }
    ],
    series: [
        {
            name: '认购(套)',
            type: 'line',
            data: chartData.value.subscription,
            smooth: true,
            lineStyle: { width: 3 },
            itemStyle: { color: '#5470c6' },
            yAxisIndex: 1
        },
        {
            name: '签约(套)',
            type: 'line',
            data: chartData.value.signing,
            smooth: true,
            lineStyle: { width: 3 },
            itemStyle: { color: '#91cc75' },
            yAxisIndex: 1
        },
        {
            name: '回款(万)',
            type: 'line',
            data: chartData.value.payment,
            smooth: true,
            lineStyle: { width: 3 },
            itemStyle: { color: '#fac858' },
            yAxisIndex: 0
        }
    ]
}))

// 横坐标标签间隔计算
function getLabelInterval(dataLength) {
    const screenWidth = window.innerWidth
    if (screenWidth < 375) {
        return Math.ceil(dataLength / 8)
    } else if (screenWidth < 768) {
        return Math.ceil(dataLength / 12)
    } else {
        return Math.ceil(dataLength / 15)
    }
}

// 图表操作
const initChart = () => {
    if (!chartDom.value) return
    disposeChart()
    chartInstance.value = echarts.init(chartDom.value)
    updateChart()
}

const updateChart = () => {
    if (!chartInstance.value) return
    chartInstance.value.setOption(chartOption.value, true)
}

const disposeChart = () => {
    if (chartInstance.value && !chartInstance.value.isDisposed()) {
        chartInstance.value.dispose()
    }
}

const handleResize = () => {
    if (chartInstance.value && !chartInstance.value.isDisposed()) {
        chartInstance.value.resize()
    }
}

const resetData = () => {
    chartData.value = { dates: [], subscription: [], signing: [], payment: [] }
}

// 获取请求参数
const getRequestParams = () => {
    const endTime = dayjs(props.dateTime)
        .subtract(1, "month")
        .endOf("month")
        .format("YYYY-MM-DD")

    const startDate = dayjs(endTime)
        .subtract(1, "year")
        .format("YYYY-MM-DD")

    return {
        projIds: props.projectIds,
        type: 0,
        day: `${props.dateTime} 00:00:00`,
        beginDate: `${startDate} 00:00:00`,
        endDate: `${endTime} 23:59:59`,
    }
}

// 请求数据
const fetchData = async () => {
    if (isRequesting.value) return
    loading.value = true
    isRequesting.value = true
    resetData()

    try {
        const params = getRequestParams()
        const res = await largeScreenApi.getSaleYearInfo(params)
        if (res.code === 200) {
            const dataList = res.data || []
            const result = {
                dates: [],
                subscription: [],
                signing: [],
                payment: []
            }
            dataList.forEach(item => {
                result.dates.push(item.syearMonth)
                result.subscription.push(item.orderNum || 0)
                result.signing.push(item.signNum || 0)
                result.payment.push(item.collectMoney || 0)
            })
            chartData.value = result
        }
        if (chartDom.value) {
            await nextTick()
            initChart()
        }
    } catch (error) {
        console.error("获取数据失败:", error)
    } finally {
        loading.value = false
        isRequesting.value = false
    }
}

// 生命周期
onMounted(() => {
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    disposeChart()
})

// 暴露方法给父组件
defineExpose({
    refreshData: fetchData
})
</script>

<style lang="scss" scoped>
.line-chart {
    width: 100%;
    background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(250, 240, 250, 0.95) 100%);
    border-radius: 12rpx;
    padding: 20rpx 20rpx;
    box-sizing: border-box;
    position: relative;

    .line-chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;
        border-bottom: 1rpx solid rgba(224, 247, 250, 0.4);
        position: relative;
        z-index: 1;

        .line-chart-title {
            font-size: 30rpx;
            font-weight: 700;
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

    .chart-area {
        width: 100%;
        height: 500rpx;
    }
}

/* 卡片进入动画 */
.line-chart {
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