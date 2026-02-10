<!-- 业绩走势情况 -->
<template>
    <view class="performance-trend">
        <view class="performance-header">
            <text class="performance-title">业绩走势情况</text>
            <view class="type-filter">
                <text v-for="(item, index) in CHART_TYPES" :key="index" class="type-item"
                    :class="{ 'active': chartType === item.value }" @click="handleChartTypeChange(item.value)">
                    {{ item.label }}
                </text>
            </view>
        </view>
        <div ref="chartDom" class="chart-area"></div>
    </view>
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted, computed, nextTick } from 'vue'
import * as echarts from 'echarts'

const CHART_TYPES = ref([
    { label: '近一年业绩走势', value: 'year' },
    { label: '近三十天来访趋势', value: 'month' },
])
// 静态数据 - 近一年业绩数据
const staticYearData = [
    { syearMonth: '2023-01', orderNum: 156, signNum: 145, collectMoney: 2450 },
    { syearMonth: '2023-02', orderNum: 108, signNum: 167, collectMoney: 2890 },
    { syearMonth: '2023-03', orderNum: 234, signNum: 210, collectMoney: 3560 },
    { syearMonth: '2023-04', orderNum: 178, signNum: 245, collectMoney: 4120 },
    { syearMonth: '2023-05', orderNum: 162, signNum: 287, collectMoney: 4780 },
    { syearMonth: '2023-06', orderNum: 289, signNum: 265, collectMoney: 4320 },
    { syearMonth: '2023-07', orderNum: 345, signNum: 312, collectMoney: 5210 },
    { syearMonth: '2023-08', orderNum: 398, signNum: 356, collectMoney: 5980 },
    { syearMonth: '2023-09', orderNum: 356, signNum: 321, collectMoney: 5340 },
    { syearMonth: '2023-10', orderNum: 421, signNum: 389, collectMoney: 6340 },
    { syearMonth: '2023-11', orderNum: 467, signNum: 432, collectMoney: 7010 },
    { syearMonth: '2023-12', orderNum: 512, signNum: 478, collectMoney: 7680 }
]

// 静态数据 - 近30天来访数据
const staticDayData = [
    { comeDate: '2024-01-01', comeNum: 45 },
    { comeDate: '2024-01-02', comeNum: 52 },
    { comeDate: '2024-01-03', comeNum: 48 },
    { comeDate: '2024-01-04', comeNum: 56 },
    { comeDate: '2024-01-05', comeNum: 61 },
    { comeDate: '2024-01-06', comeNum: 73 },
    { comeDate: '2024-01-07', comeNum: 82 },
    { comeDate: '2024-01-08', comeNum: 58 },
    { comeDate: '2024-01-09', comeNum: 49 },
    { comeDate: '2024-01-10', comeNum: 55 },
    { comeDate: '2024-01-11', comeNum: 63 },
    { comeDate: '2024-01-12', comeNum: 68 },
    { comeDate: '2024-01-13', comeNum: 79 },
    { comeDate: '2024-01-14', comeNum: 85 },
    { comeDate: '2024-01-15', comeNum: 57 },
    { comeDate: '2024-01-16', comeNum: 51 },
    { comeDate: '2024-01-17', comeNum: 59 },
    { comeDate: '2024-01-18', comeNum: 64 },
    { comeDate: '2024-01-19', comeNum: 71 },
    { comeDate: '2024-01-20', comeNum: 83 },
    { comeDate: '2024-01-21', comeNum: 90 },
    { comeDate: '2024-01-22', comeNum: 61 },
    { comeDate: '2024-01-23', comeNum: 54 },
    { comeDate: '2024-01-24', comeNum: 62 },
    { comeDate: '2024-01-25', comeNum: 67 },
    { comeDate: '2024-01-26', comeNum: 74 },
    { comeDate: '2024-01-27', comeNum: 86 },
    { comeDate: '2024-01-28', comeNum: 92 },
    { comeDate: '2024-01-29', comeNum: 65 },
    { comeDate: '2024-01-30', comeNum: 58 }
]

// 响应式数据
const loading = ref(false)
const chartType = ref('year')
const chartInstance = shallowRef(null)
const chartDom = ref(null)

// 图表数据
const chartData = ref({
    dates: [],
    subscription: [],
    signing: [],
    payment: []
})

const chartDayData = ref({
    xData: [],
    yData: []
})

// 计算最大值
const paymentMax = computed(() => {
    const validData = chartData.value.payment.filter(v => v != null)
    return validData.length ? Math.max(...validData, 100) : 100
})

const setMax = computed(() => {
    const allData = [...chartData.value.subscription, ...chartData.value.signing].filter(v => v != null)
    return allData.length ? Math.max(...allData, 100) : 100
})

const numMax = computed(() => {
    const allData = [...chartDayData.value.yData].filter(v => v != null)
    return allData.length ? Math.max(...allData) : 30
})

// 图表配置
const chartOption = computed(() => {
    if (chartType.value === 'year') {
        return {
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
                // 轴线样式
                axisLine: {
                    show: true, // 是否显示轴线
                    lineStyle: {
                        color: 'rgba(100, 100, 100, 0.3)', // 轴线颜色
                        width: 1, // 轴线宽度
                        type: 'dotted' // solid-实线 dashed-虚线 dotted-点线
                    }
                },
                // 刻度线样式
                axisTick: {
                    show: true, // 是否显示刻度线
                    alignWithLabel: true, // 刻度线与标签对齐
                    length: 3, // 刻度线长度
                    lineStyle: {
                        color: 'rgba(100, 100, 100, 0.3)', // 刻度线颜色
                        width: 1
                    }
                },
                // 网格线（与y轴交叉的线）
                splitLine: {
                    show: true, // 是否显示网格线
                    lineStyle: {
                        color: 'rgba(200, 200, 200, 0.1)', // 网格线颜色
                        width: 1,
                        type: 'dashed' // 虚线
                    }
                },
                axisLabel: {
                    color: '#666',
                    fontSize: 11,
                    margin: 10,
                    // 横坐标标签显示优化
                    interval: getLabelInterval(chartData.value.dates.length),
                    formatter: function (value) {
                        const [year, month] = value.split('-')
                        // 只显示月份
                        return `${year}${month}`
                    }
                }
            },
            yAxis: [
                {
                    type: 'value',
                    name: '万元',
                    nameLocation: 'end', // 控制名称位置：'start'、'middle'、'end'
                    nameGap: 10, // 名称与轴线的距离
                    nameRotate: 0, // 名称旋转角度
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
                    offset: 0, // 轴的位置偏移
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
        }
    }

    // 近30天配置
    return {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderColor: '#333',
            textStyle: {
                color: '#fff'
            }
        },
        legend: {
            data: ['人数'],
            top: '0%',
            textStyle: { color: '#333', fontSize: 12 },
            itemGap: 5,
            itemWidth: 15,
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
            data: chartDayData.value.xData,
            // 轴线样式
            axisLine: {
                show: true, // 是否显示轴线
                lineStyle: {
                    color: 'rgba(100, 100, 100, 0.3)', // 轴线颜色
                    width: 1, // 轴线宽度
                    type: 'dotted' // solid-实线 dashed-虚线 dotted-点线
                }
            },
            // 刻度线样式
            axisTick: {
                show: true, // 是否显示刻度线
                alignWithLabel: true, // 刻度线与标签对齐
                length: 3, // 刻度线长度
                lineStyle: {
                    color: 'rgba(100, 100, 100, 0.3)', // 刻度线颜色
                    width: 1
                }
            },
            // 网格线（与y轴交叉的线）
            splitLine: {
                show: true, // 是否显示网格线
                lineStyle: {
                    color: 'rgba(200, 200, 200, 0.1)', // 网格线颜色
                    width: 1,
                    type: 'dashed' // 虚线
                }
            },
            axisLabel: {
                color: '#666',
                fontSize: 11,
                margin: 10,
                // 横坐标标签显示优化 - 30个点自动间隔
                interval: getLabelInterval(chartDayData.value.xData.length),
                formatter: function (value) {
                    // 显示日期（去掉年份）
                    const date = new Date(value)
                    return (date.getMonth() + 1) + '-' + date.getDate()
                }
            }
        },
        yAxis: [
            {
                type: 'value',
                name: '人',
                min: 0,
                max: numMax.value,
                axisLabel: { color: '#666', fontSize: 12 },
                nameTextStyle: {
                    color: '#666',
                    fontSize: 12
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
                name: '人数',
                type: 'line',
                data: chartDayData.value.yData,
                smooth: true,
                lineStyle: { width: 3 },
                itemStyle: { color: '#5470c6' }
            }
        ]
    }
})

// 横坐标标签间隔计算（适配H5移动端）
function getLabelInterval(dataLength) {
    const screenWidth = window.innerWidth

    if (screenWidth < 375) { // 小屏手机
        return Math.ceil(dataLength / 8)
    } else if (screenWidth < 768) { // 大屏手机
        return Math.ceil(dataLength / 12)
    } else { // 平板及以上
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

// 数据处理
const handleChartTypeChange = (type) => {
    if (chartType.value === type) return

    // 模拟加载状态
    loading.value = true
    chartType.value = type

    // 延迟更新，模拟数据加载
    setTimeout(() => {
        if (type === 'year') {
            processYearData(staticYearData)
        } else {
            processDayData(staticDayData)
        }
        initChart()
        loading.value = false
    }, 300)
}

const processYearData = (dataList) => {
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

const processDayData = (listData) => {
    const xData = []
    const yData = []

    listData.forEach(item => {
        xData.push(item.comeDate)
        yData.push(item.comeNum || 0)
    })

    chartDayData.value = { xData, yData }
}

// 初始化数据
const initData = () => {
    processYearData(staticYearData)
}

// 生命周期
onMounted(() => {
    // 监听窗口变化
    window.addEventListener('resize', handleResize)

    // 初始化
    nextTick(() => {
        initData()
        initChart()
    })
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    disposeChart()
})
</script>

<style lang="scss" scoped>
.performance-trend {
    width: 100%;
    background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(250, 240, 250, 0.95) 100%);
    border-radius: 12rpx;
    padding: 20rpx 20rpx;
    box-sizing: border-box;

    .performance-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;
        border-bottom: 1rpx solid rgba(224, 247, 250, 0.4);
        position: relative;
        z-index: 1;

        .performance-title {
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

        .type-filter {
            display: flex;
            align-items: center;
            background: rgba(224, 247, 250, 0.12);
            border-radius: 20rpx;
            padding: 2rpx;
            border: 1rpx solid rgba(224, 247, 250, 0.25);
            box-shadow:
                0 2rpx 8rpx rgba(224, 247, 250, 0.15),
                inset 0 1rpx 0 rgba(255, 255, 255, 0.5);
            overflow: hidden;
            white-space: nowrap;
            height: 44rpx;
            gap: 15rpx;
        }

        .type-item {
            padding: 0 10rpx;
            font-size: 22rpx;
            font-weight: 500;
            color: #626aef;
            transition: all 0.2s ease;
            position: relative;
            white-space: nowrap;
            min-width: 50rpx;
            height: 36rpx;
            line-height: 36rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 15rpx;
            background: rgba(239, 240, 253, 0.5);
            &.active {
                color: #ffffff;
                // background: linear-gradient(135deg,
                //         rgba(79, 172, 254, 0.9) 0%,
                //         rgba(250, 112, 154, 0.9) 100%);
                background: linear-gradient(135deg, #409eff 0%, #626aef 100%);
                font-weight: 600;
                box-shadow: 0 2rpx 6rpx rgba(79, 172, 254, 0.3),
                inset 0 1rpx 0 rgba(255, 255, 255, 0.3);
                padding: 0rpx 14rpx;
            }
        }
    }

    .chart-area {
        width: 100%;
        height: 500rpx;
        padding: 0 10rpx;
    }
}

/* 卡片进入动画 */
.performance-trend {
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