<!-- 渠道及转化 -->
<template>
    <view class="achievement-rate-container">
        <view class="achievement-header">
            <text class="achievement-title">渠道及转化</text>
            <view class="time-filter">
                <text v-for="(item, index) in CHART_TIME" :key="index" class="time-item"
                    :class="{ 'active': activeTime === item.value }" @click="handleTimeSelect(item.value)">
                    {{ item.label }}
                </text>
            </view>
        </view>
        <view :id="chartId" class="echarts-chart"></view>
    </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'

// 定义 props
const props = defineProps({
    data: {
        type: Array,
        default: () => [85, 78, 92, 65, 88]
    },
    title: {
        type: String,
        default: ''
    },
    loading: {
        type: Boolean,
        default: false
    }
})

// 时间筛选选项
const CHART_TIME = ref([
    { label: '年', value: 'year' },
    { label: '月', value: 'month' },
])
// 当前选中时间
const activeTime = ref('month')

// 生成唯一图表ID
const chartId = ref(`radar-chart-${Date.now()}`)
let chartInstance = null
const isLoading = ref(false)

// 当前显示的雷达图数据（用于在轴标签中显示）
const currentRadarData = ref([...props.data])

// 图表默认配置 - 更简洁现代的样式
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
            const indicators = ['综合达成率', '认购达成率', '回款达成率', '签约达成率', '溢价率']
            const indicator = indicators[params.dataIndex]
            const value = params.value
            return `<span style="color:#333">${indicator}${123}<br/>${value}%</span>`
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
        indicator: [
            { name: '综合达成率', max: 100 },
            { name: '认购达成率', max: 100 },
            { name: '回款达成率', max: 100 },
            { name: '签约达成率', max: 100 },
            { name: '溢价率', max: 100 }
        ],
        shape: 'polygon', // 多边形雷达图，更现代
        splitNumber: 4,
        center: ['50%', '55%'],
        radius: '65%',
        axisTick: {
            show: false
        },
        min: 0,
        max: 100,
        axisName: {
            color: '#666', // 文字颜色
            fontSize: 12,
            fontWeight: 500,
            padding: [3, 0],
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
            formatter: (name, index) => {
                // 获取当前维度的数值
                // const value = currentRadarData.value[index] || 0;
                // return `{title|${name}}\n{value|${value}%}`;
                return name;
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
                    value: props.data,
                    name: '当前数据',
                    label: {
                        show: true,
                        formatter: (params) => {
                            return params.value + '%'
                        },
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#FFFFFF',
                        backgroundColor: 'rgba(79, 172, 254, 0.9)',
                        borderColor: '#FFFFFF',
                        borderWidth: 1,
                        borderRadius: 8,
                        padding: [2, 6],
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

// 更新轴标签显示的数据
const updateAxisLabels = (newData) => {
    currentRadarData.value = [...newData]

    if (chartInstance) {
        // 更新雷达图配置，触发轴标签重新渲染
        chartInstance.setOption({
            radar: {
                axisName: {
                    formatter: (name, index) => {
                        const value = currentRadarData.value[index] || 0;
                        return `{title|${name}}\n{value|${value}%}`;
                    }
                }
            }
        })
    }
}

// 初始化图表
const initChart = async () => {
    await nextTick()

    const chartDom = document.getElementById(chartId.value)
    if (!chartDom) {
        console.error('图表容器未找到')
        setTimeout(initChart, 100)
        return
    }

    // 清除可能存在的旧实例
    if (chartInstance) {
        chartInstance.dispose()
    }

    chartInstance = echarts.init(chartDom)

    // 添加 loading 效果
    if (isLoading.value) {
        chartInstance.showLoading({
            text: '数据加载中...',
            color: '#4FACFE',
            textColor: '#8A9BA8',
            maskColor: 'rgba(255, 255, 255, 0.9)',
            zlevel: 0
        })
    }

    // 初始化当前数据
    updateAxisLabels(props.data)

    // 设置配置项
    chartInstance.setOption(chartOptions.value)

    // 如果不需要loading，立即隐藏
    if (!isLoading.value) {
        chartInstance.hideLoading()
    }

    window.addEventListener('resize', handleResize)
}

// 处理窗口大小变化
const handleResize = () => {
    if (chartInstance) {
        chartInstance.resize()
    }
}

// 更新图表数据
const updateChartData = (newData) => {
    if (!chartInstance) return

    // 更新系列数据
    const option = {
        series: [{
            data: [{
                value: newData,
                label: {
                    formatter: (params) => params.value + '%'
                }
            }]
        }]
    }

    // 添加数据更新动画
    chartInstance.setOption(option, {
        notMerge: false,
        lazyUpdate: true
    })

    // 更新轴标签显示的数据
    updateAxisLabels(newData)
}

// 显示加载状态
const showLoading = () => {
    isLoading.value = true
    if (chartInstance) {
        chartInstance.showLoading()
    }
}

// 隐藏加载状态
const hideLoading = () => {
    isLoading.value = false
    if (chartInstance) {
        chartInstance.hideLoading()
    }
}

// 监听数据变化
watch(() => props.data, (newVal) => {
    updateChartData(newVal)
}, { deep: true })

// 监听loading状态变化
watch(() => props.loading, (newVal) => {
    if (newVal) {
        showLoading()
    } else {
        hideLoading()
    }
})

// 时间选择处理
const handleTimeSelect = async (value) => {
    if (activeTime.value === value) return

    activeTime.value = value
    showLoading()

    // 模拟数据切换
    setTimeout(() => {
        let newData
        switch (value) {
            case 'year':
                newData = [92, 85, 88, 79, 90]
                break
            case 'month':
                newData = [85, 78, 92, 65, 88]
                break
            default:
                newData = props.data
        }

        updateChartData(newData)
        hideLoading()
    }, 500)
}

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
})

// 暴露方法给父组件
defineExpose({
    updateChartData,
    showLoading,
    hideLoading,
    resize: handleResize
})
</script>

<style lang="scss" scoped>
.achievement-rate-container {
    width: 100%;
    height: 550rpx;
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

    .echarts-chart {
        width: 100%;
        height: 420rpx;
        position: relative;
        z-index: 1;
    }
}
</style>