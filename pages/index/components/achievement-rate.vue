<!-- 渠道及转化 -->
<template>
    <view class="achievement-rate-container">
        <!-- 卡片标题 -->
        <view class="achievement-header">
            <text class="achievement-title">渠道及转化</text>
            <view class="time-filter">
                <text v-for="(item, index) in CHART_TIME" :key="index" class="time-item"
                    :class="{ 'active': activeType === item.value }" @click="handleTimeSelect(item.value)">
                    {{ item.label }}
                </text>
            </view>
        </view>
        <!-- 库存统计卡片 -->
        <view class="inventory-container">
            <view class="inventory-item">
                <text class="item-label">库存住宅</text>
                <view class="value-group">
                    <text class="item-value">
                        {{ formatNumber(inventoryData.roomNum) }}
                        <text class="item-value-unit">套</text>
                    </text>
                    <text class="item-unit">{{ formatNumber(inventoryData.roomMoney) }}亿</text>
                </view>
            </view>
            <view class="inventory-item">
                <text class="item-label">月均去化</text>
                <view class="value-group">
                    <text class="item-value">
                        {{ formatNumber(inventoryData.costNum) }}
                        <text class="item-value-unit">套</text>
                    </text>
                    <text class="item-unit">{{ formatNumber(inventoryData.costMoney) }}亿</text>
                </view>
            </view>
            <view class="inventory-item">
                <text class="item-label">存销比</text>
                <view class="value-group">
                    <text class="item-value">{{ formatNumber(inventoryData.stockCostPercent) }}</text>
                </view>
            </view>
        </view>
        <!-- 雷达图 -->
        <view :id="chartId" class="echarts-chart"></view>
        <!-- 遮罩层组件 -->
        <loading-mask :visible="loading" text="加载中..." />
    </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import LoadingMask from '@/components/loading-mask/loading-mask.vue'
import { largeScreenApi } from '@/common/api.js'
import { formatNumber } from '@/utils/common.js'
// 定义 props
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

// 时间筛选选项
const CHART_TIME = ref([
    { label: '年', value: 0 },
    { label: '月', value: 1 },
])
// 当前选中时间类型
const activeType = ref(1)
// 生成唯一图表ID
const chartId = ref(`radar-chart-${Date.now()}`)
let chartInstance = null
// loading状态
const loading = ref(false)
// 防止重复请求
const isRequesting = ref(false)
// 库存数据
const inventoryData = ref({
    roomNum: 0, // 房间库存数量
    roomMoney: 0, // 房间库存金额
    costNum: 0, // 房间月均去化数量
    costMoney: 0, // 房间月均去化金额
    stockCostPercent: 0, // 存销比率
});
// 雷达图指标数据
const indicatorData = ref([
    { name: '综合达成率', max: 100, value: 0 },
    { name: '认购达成率', max: 100, value: 0 },
    { name: '回款达成率', max: 100, value: 0 },
    { name: '签约达成率', max: 100, value: 0 },
    { name: '溢价率', max: 100, value: 0 }
])
// 系列数据
const seriesData = ref([0, 0, 0, 0, 0])

// 图表默认配置
const chartOptions = ref({
    color: ['#4FACFE'],
    backgroundColor: 'transparent',
    tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: 'rgba(79, 172, 254, 0.2)',
        borderWidth: 1,
        textStyle: {
            color: '#39454E',
            fontSize: 12
        },
        extraCssText: 'box-shadow: 0 4rpx 20rpx rgba(79, 172, 254, 0.15); border-radius: 8rpx;',
        formatter: function (params) {
            // const indicators = ['综合达成率', '认购达成率', '回款达成率', '签约达成率', '溢价率']
            const indicators = indicatorData.value.map((item) => item.name)
            const indicator = indicators[params.dataIndex]
            const value = params.value
            return `<span style="color:#333">${indicator}<br/>${value}%</span>`
        }
    },
    grid: {
        top: 20,
        bottom: 20,
        left: 15,
        right: 15,
        containLabel: true
    },
    radar: {
        indicator: indicatorData,
        // indicator: [
        //     { name: '综合达成率', max: 100 },
        //     { name: '认购达成率', max: 100 },
        //     { name: '回款达成率', max: 100 },
        //     { name: '签约达成率', max: 100 },
        //     { name: '溢价率', max: 100 }
        // ],
        shape: 'polygon', // 多边形雷达图，更现代
        splitNumber: 4,
        center: ['50%', '58%'],
        radius: '65%',
        axisTick: {
            show: false
        },
        min: 0,
        // max: 100,
        alignTicks: false, // 刻度是否对齐，默认true
        axisName: {
            color: '#666', // 文字颜色
            fontSize: 12,
            fontWeight: 500,
            padding: [10, 0, 5, 0], // 上、右、下、左内边距
            rich: {
                // 定义富文本样式
                title: {
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#8A9BA8',
                    lineHeight: 16
                },
                value: {
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#4FACFE',
                    lineHeight: 16,
                    padding: [2, 0, 0, 0]
                }
            },
            // 在每个维度名称下方显示对应的百分比
            formatter: (name, item) => {
                // console.log(name, item, seriesData.value)
                // 获取当前维度的数值
                const index = indicatorData.value.findIndex(ind => ind.name === name)
                const value = seriesData.value[index] !== undefined ? seriesData.value[index] : 0
                return `{title|${name}}\n{value|${value}%}`
            }
        },
        axisLine: {
            lineStyle: {
                color: 'rgba(79, 172, 254, 0.15)',
                width: 1
            }
        },
        splitLine: {
            lineStyle: {
                color: ['rgba(79, 172, 254, 0.08)', 'rgba(79, 172, 254, 0.12)', 'rgba(79, 172, 254, 0.18)'],
                width: 0.5
            }
        },
        splitArea: {
            show: true,
            areaStyle: {
                color: ['rgba(79, 172, 254, 0.03)', 'rgba(79, 172, 254, 0.06)', 'rgba(79, 172, 254, 0.09)']
            }
        }
    },
    series: [
        {
            name: '达成率',
            type: 'radar',
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: {
                width: 2,
                color: '#4FACFE'
            },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(79, 172, 254, 0.4)' },
                    { offset: 1, color: 'rgba(79, 172, 254, 0.1)' }
                ])
            },
            itemStyle: {
                color: '#4FACFE',
                borderColor: '#FFFFFF',
                borderWidth: 1.5,
                shadowColor: 'rgba(79, 172, 254, 0.5)',
                shadowBlur: 4
            },
            emphasis: {
                lineStyle: {
                    width: 3,
                    shadowColor: 'rgba(79, 172, 254, 0.8)',
                    shadowBlur: 8
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(79, 172, 254, 0.6)' },
                        { offset: 1, color: 'rgba(79, 172, 254, 0.2)' }
                    ])
                }
            },
            data: [
                {
                    value: seriesData.value,
                    name: '当前数据',
                    label: {
                        show: false, // 是否在雷达图里面显示数值
                        formatter: (params) => {
                            const num = params.value || 0
                            return `${num}%`
                        },
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#FFFFFF',
                        backgroundColor: 'rgba(79, 172, 254, 0.9)',
                        borderColor: '#FFFFFF',
                        borderWidth: 1,
                        borderRadius: 8,
                        padding: [4, 6, 1],
                        shadowColor: 'rgba(79, 172, 254, 0.3)',
                        shadowBlur: 4
                    }
                }
            ]
        }
    ],
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut'
})
// 初始化图表
const initChart = async () => {
    await nextTick()
    setTimeout(() => {
        const chartDom = document.getElementById(chartId.value)
        if (!chartDom) return

        if (chartInstance) {
            chartInstance.dispose()
        }

        chartInstance = echarts.init(chartDom)
        chartInstance.setOption(chartOptions.value)
        window.addEventListener('resize', handleResize)
    }, 50)
}
// 更新图表数据
const updateChartData = () => {
    if (!chartInstance) return
    // 更新 indicator
    chartOptions.value.radar.indicator = indicatorData.value
    // 更新 series 数据
    chartOptions.value.series[0].data[0].value = seriesData.value
    chartInstance.setOption(chartOptions.value)
}
const handleResize = () => {
    chartInstance?.resize()
}
// 获取数据
const fetchData = async () => {
    if (!props.projectIds?.length) return
    // 检查是否已有请求在进行
    if (isRequesting.value) return;
    // 重置数据到初始状态
    resetData()
    loading.value = true
    isRequesting.value = true
    try {
        // 库存数据
        const endTime = dayjs(props.dateTime).subtract(1, 'month').endOf('month').format('YYYY-MM-DD')
        const startTime = dayjs(endTime).subtract(6, 'month').format('YYYY-MM-DD')

        const inventoryParams = {
            projIds: props.projectIds,
            type: 0,
            day: `${props.dateTime} 00:00:00`,
            beginDate: `${startTime} 00:00:00`,
            endDate: `${endTime} 23:59:59`,
        }

        const [inventoryRes, premiumRes, saleRes] = await Promise.all([
            largeScreenApi.getRoomStockInfo(inventoryParams),
            largeScreenApi.getPremiumInfo({
                projIds: props.projectIds,
                type: activeType.value,
                day: `${props.dateTime} 00:00:00`,
            }),
            largeScreenApi.getSaleInfo({
                projIds: props.projectIds,
                type: activeType.value,
                day: `${props.dateTime} 00:00:00`,
            })
        ])

        // 更新库存数据
        if (inventoryRes.code === 200) {
            inventoryData.value = { ...inventoryData.value, ...inventoryRes.data }
        }

        // 更新图表数据
        let totalRate = 0, orderRate = 0, collectRate = 0, signRate = 0, premiumRate = 0

        if (saleRes.code === 200 && saleRes.data) {
            totalRate = formatPercent(saleRes.data.totalRate) || 0
            orderRate = formatPercent(saleRes.data.orderRate) || 0
            collectRate = formatPercent(saleRes.data.collectRate) || 0
            signRate = formatPercent(saleRes.data.signRate) || 0
        }

        if (premiumRes.code === 200 && premiumRes.data) {
            premiumRate = formatPercent(premiumRes.data.premiumRate) || 0
        }

        const allValues = [totalRate, orderRate, collectRate, signRate, premiumRate]
        // 计算统一的最大值：取所有值中超过100的最大值的1.2倍，如果没有超过100的就用100
        const globalMax = Math.max(
            100,
            ...allValues.map(v => v > 100 ? Math.ceil(v * 1.2 / 10) * 10 : 0)
        )
        // 更新指标数据
        indicatorData.value = [
            { name: '综合达成率', max: globalMax, value: totalRate },
            { name: '认购达成率', max: globalMax, value: orderRate },
            { name: '回款达成率', max: globalMax, value: collectRate },
            { name: '签约达成率', max: globalMax, value: signRate },
            { name: '溢价率', max: globalMax, value: premiumRate }
        ]

        // 更新系列数据
        seriesData.value = [totalRate, orderRate, collectRate, signRate, premiumRate]

        // 更新图表
        updateChartData()
    } catch (error) {
        console.error('获取数据失败:', error)
    } finally {
        loading.value = false
        isRequesting.value = false
    }
}
// 格式化百分比函数
const formatPercent = (value) => {
    if (value === undefined || value === null) return "0";
    return (value * 100).toFixed(0);
};
// 重置数据函数
const resetData = () => {
    // 重置库存数据
    inventoryData.value = {
        roomNum: 0,
        roomMoney: 0,
        costNum: 0,
        costMoney: 0,
        stockCostPercent: 0,
    }
    // 重置雷达图指标数据
    indicatorData.value = [
        { name: '综合达成率', max: 100, value: 0 },
        { name: '认购达成率', max: 100, value: 0 },
        { name: '回款达成率', max: 100, value: 0 },
        { name: '签约达成率', max: 100, value: 0 },
        { name: '溢价率', max: 100, value: 0 }
    ]
    // 重置系列数据
    seriesData.value = [0, 0, 0, 0, 0]
}
// 时间选择处理
const handleTimeSelect = async (value) => {
    if (activeType.value === value) return
    activeType.value = value
    // 请求数据
    await fetchData()
}

// 监听项目ID和日期变化
// watch(() => [props.projectIds, props.dateTime], () => {
//     if (props.projectIds?.length) {
//         fetchData()
//     }
// }, { deep: true, immediate: true })

// 组件挂载
onMounted(() => {
    initChart()
})

// 组件卸载
onUnmounted(() => {
    if (chartInstance) {
        window.removeEventListener('resize', handleResize)
        chartInstance.dispose()
        chartInstance = null
    }
    isRequesting.value = false
    loading.value = false
})

// 暴露方法给父组件
defineExpose({
    refreshData: fetchData,
    resize: handleResize
})
</script>

<style lang="scss" scoped>
.achievement-rate-container {
    width: 100%;
    height: 750rpx;
    background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(250, 240, 250, 0.95) 100%);
    border-radius: 20rpx;
    padding: 20rpx;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;

    /* 卡片标题区域 */
    .achievement-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;
        border-bottom: 1rpx solid rgba(224, 247, 250, 0.4);
        position: relative;
        z-index: 1;

        &:hover::after {
            width: 100rpx;
        }

        .achievement-title {
            font-size: 30rpx;
            font-weight: 700;
            // background: linear-gradient(135deg,
            //         #4FACFE 0%,
            //         #FA709A 100%);
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

        /* 时间筛选器样式 */
        .time-filter {
            display: flex;
            align-items: center;
            background: rgba(224, 247, 250, 0.08);
            border-radius: 28rpx;
            padding: 2rpx;
            border: 1rpx solid rgba(224, 247, 250, 0.2);
            backdrop-filter: blur(10rpx);
            box-shadow:
                0 2rpx 18rpx rgba(224, 247, 250, 0.15),
                inset 0 1rpx 0 rgba(255, 255, 255, 0.6);
            height: 44rpx;
            gap: 15rpx;
        }

        .time-item {
            padding: 0 14rpx;
            font-size: 22rpx;
            font-weight: 500;
            color: #626aef;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            white-space: nowrap;
            min-width: 40rpx;
            height: 36rpx;
            line-height: 36rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 15rpx;
            background: rgba(239, 240, 253, 0.5);

            &.active {
                color: #FFFFFF;
                // background: linear-gradient(135deg,
                //         rgba(79, 172, 254, 0.95) 0%,
                //         rgba(250, 112, 154, 0.95) 100%);
                background: linear-gradient(135deg, #409eff 0%, #626aef 100%);
                font-weight: 600;
                box-shadow:
                    0 2rpx 6rpx rgba(79, 172, 254, 0.25),
                    inset 0 1rpx 1px rgba(255, 255, 255, 0.3);
                padding: 0 14rpx;

            }
        }
    }

    .inventory-container {
        width: 100%;
        height: 200rpx;
        background: linear-gradient(135deg,
                rgba(255, 255, 255, 0.95) 0%,
                rgba(250, 240, 250, 0.95) 100%);
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        border-radius: 14rpx;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20rpx;
        box-sizing: border-box;
        border: 1rpx solid rgba(255, 255, 255, 0.6);
        position: relative;
        overflow: hidden;

        /* 每个统计项 */
        .inventory-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 10rpx 10rpx;
            position: relative;
            z-index: 1;

            /* 优化分隔线：更细腻 */
            &:not(:last-child)::after {
                content: '';
                position: absolute;
                right: 0;
                top: 50%;
                transform: translateY(-50%);
                height: 80rpx;
                width: 1rpx;
                background: linear-gradient(to bottom,
                        rgba(224, 247, 250, 0.2),
                        rgba(255, 235, 238, 0.6),
                        rgba(224, 247, 250, 0.2));
            }
        }

        /* 值容器组：保证统一高度 */
        .value-group {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100rpx;
            /* 保证统一高度 */
        }

        /* 优化标签文字 */
        .item-label {
            font-size: 28rpx;
            color: #5a6c7d;
            /* 更柔和的深灰色 */
            font-weight: 500;
            margin-bottom: 10rpx;
            position: relative;
            letter-spacing: 1rpx;

            /* 添加装饰点 */
            &::before {
                content: '';
                position: absolute;
                left: 50%;
                bottom: -8rpx;
                transform: translateX(-50%);
                width: 16rpx;
                height: 3rpx;
                border-radius: 2rpx;
                background: linear-gradient(90deg,
                        rgba(224, 247, 250, 0.8),
                        rgba(255, 235, 238, 0.8));
            }
        }

        /* 优化主数值 */
        .item-value {
            font-size: 36rpx;
            /* 增大主数值 */
            font-weight: 700;
            line-height: 1.2;
            text-align: center;
            margin-bottom: 4rpx;

            /* 渐变色文字 */
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .item-value-unit {
            font-size: 26rpx;
            color: #8a9ba8;
        }

        /* 单位文字 */
        .item-unit {
            font-size: 28rpx;
            color: #8a9ba8;
            /* 更浅的辅助色 */
            font-weight: 400;
            text-align: center;
            line-height: 1.4;
        }
    }

    .echarts-chart {
        width: 100%;
        height: 440rpx;
        position: relative;
        z-index: 1;
    }
}
</style>