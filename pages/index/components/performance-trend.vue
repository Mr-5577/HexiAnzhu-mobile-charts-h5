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
const CHART_TYPES = ref([
    { label: '近一年业绩走势', value: 'year' },
    { label: '近三十天来访趋势', value: 'month' },
])
// loading状态
const loading = ref(false)
// 防止重复请求
const isRequesting = ref(false)

// 响应式数据
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
    // return validData.length ? Math.max(...validData, 100) : 100
    if (validData.length === 0) return 10  // 没有数据时显示合理范围
    // 取最大值并向上取整到10的倍数，留一些空间
    const max = Math.max(...validData)
    return Math.ceil(max / 10) * 10
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
                    rotate: 30, // 旋转30度，避免重叠
                    margin: 12, // 增加边距
                    // 横坐标标签显示优化
                    interval: getLabelInterval(chartData.value.dates.length),
                    formatter: function (value) {
                        return value
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
const resetData = () => {
    chartData.value = { dates: [], subscription: [], signing: [], payment: [] };
    chartDayData.value = { xData: [], yData: [] };
};
// 获取请求参数
const getRequestParams = () => {
    const isYear = chartType.value === "year";
    const endTime = dayjs(props.dateTime)
        .subtract(isYear ? 1 : 1, isYear ? "month" : "day")
        .endOf(isYear ? "month" : "day")
        .format("YYYY-MM-DD");

    const startDate = dayjs(endTime)
        .subtract(isYear ? 1 : 30, isYear ? "year" : "day")
        .format("YYYY-MM-DD");

    return {
        projIds: props.projectIds,
        type: 0, // 0:年  1:月  2:周  3:日
        day: `${props.dateTime} 00:00:00`,
        beginDate: `${startDate} 00:00:00`,
        endDate: `${endTime} 23:59:59`,
    };
};
// 切换类型
const handleChartTypeChange = (type) => {
    if (chartType.value === type) return
    chartType.value = type
    fetchData()
}
// 请求数据
const fetchData = async () => {
    // 检查是否已有请求在进行
    if (isRequesting.value) return;
    loading.value = true;
    isRequesting.value = true;
    resetData();
    try {
        const params = getRequestParams();
        if (chartType.value === "year") {
            const res = await largeScreenApi.getSaleYearInfo(params);
            if (res.code === 200) {
                processYearData(res.data || []);
            }
        } else {
            const res = await largeScreenApi.getCustomerCome30Day(params);
            if (res.code === 200) {
                processDayData(res.data || []);
            }
        }
        if (chartDom.value) {
            await nextTick()
            initChart()
        }
    } catch (error) {
        console.error("获取数据失败:", error);
    } finally {
        loading.value = false;
        isRequesting.value = false;
    }
};

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

// 生命周期
onMounted(() => {
    window.addEventListener('resize', handleResize)
    // nextTick(() => {
    //     fetchData()
    // })
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
.performance-trend {
    width: 100%;
    background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(250, 240, 250, 0.95) 100%);
    border-radius: 12rpx;
    padding: 20rpx 20rpx;
    box-sizing: border-box;
    position: relative;

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