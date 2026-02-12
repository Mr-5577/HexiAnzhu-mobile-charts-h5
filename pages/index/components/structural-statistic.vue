<!-- 资产与应收统计 -->
<template>
    <view class="structural-statistic">
        <!-- 标题区域 -->
        <view class="chart-header">
            <text class="chart-title">资产与应收统计</text>
        </view>

        <!-- 图表控制区域 -->
        <view class="chart-controls">
            <!-- 主类型切换 -->
            <view class="main-type-controls">
                <text v-for="item in SWITCH_TYPE_LIST" :key="item.value" class="chart-btn"
                    :class="{ active: chartType === item.value }" @click="handleChartTypeChange(item.value)">
                    {{ item.label }}
                </text>
            </view>

            <!-- 子类型切换 -->
            <view class="sub-type-controls">
                <!-- 库存结构子类型 -->
                <view v-show="chartType === '1'" class="sub-type-group">
                    <text v-for="subType in INVENTORY_SUB_TYPES" :key="subType.value" class="sub-type-btn"
                        :class="{ active: inventoryType === subType.value }"
                        @click="handleInventoryTypeChange(subType.value)">
                        {{ subType.label }}
                    </text>
                </view>

                <!-- 渠道占比子类型 -->
                <view v-show="chartType === '3'" class="sub-type-group">
                    <text v-for="subType in CHANNEL_SUB_TYPES" :key="subType.value" class="sub-type-btn"
                        :class="{ active: channelType === subType.value }"
                        @click="handleChannelTypeChange(subType.value)">
                        {{ subType.label }}
                    </text>
                </view>
            </view>
        </view>

        <!-- 图表区域 -->
        <view class="chart-content">
            <div ref="structuralRef" class="chart-area"></div>
        </view>
    </view>
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted, computed, nextTick } from 'vue'
import * as echarts from 'echarts'

// 常量定义
const SWITCH_TYPE_LIST = [
    { value: '1', label: '库存结构' },
    { value: '2', label: '应收账龄' },
    { value: '3', label: '渠道占比' }
]

const INVENTORY_SUB_TYPES = [
    { value: 'time', label: '时间' },
    { value: 'area', label: '面积' },
    { value: 'allPrice', label: '总价' },
    { value: 'format', label: '业态' }
]

const CHANNEL_SUB_TYPES = [
    { value: 'visit', label: '来访' },
    { value: 'deal', label: '成交' }
]

// 静态数据 - 库存结构（按时间维度）
const staticInventoryTimeData = [
    { name: '6个月内', value: 45 },
    { name: '6-12个月', value: 28 },
    { name: '1-2年', value: 18 },
    { name: '2年以上', value: 9 }
]

// 静态数据 - 库存结构（按面积维度）
const staticInventoryAreaData = [
    { name: '90㎡以下', value: 32 },
    { name: '90-120㎡', value: 45 },
    { name: '120-140㎡', value: 15 },
    { name: '140㎡以上', value: 8 }
]

// 静态数据 - 库存结构（按总价维度）
const staticInventoryPriceData = [
    { name: '150万以下', value: 25 },
    { name: '150-300万', value: 40 },
    { name: '300-500万', value: 20 },
    { name: '500万以上', value: 15 }
]

// 静态数据 - 库存结构（按业态维度）
const staticInventoryFormatData = [
    { name: '住宅', value: 65 },
    { name: '商业', value: 20 },
    { name: '办公', value: 10 },
    { name: '车位', value: 5 }
]

// 静态数据 - 应收账龄
const staticReceivableData = [
    { name: '3个月内', value: 50 },
    { name: '3-6个月', value: 25 },
    { name: '6-12个月', value: 15 },
    { name: '1年以上', value: 10 }
]

// 静态数据 - 渠道占比（来访）
const staticChannelVisitData = [
    { name: '线上渠道', value: 35 },
    { name: '中介推荐', value: 25 },
    { name: '老带新', value: 20 },
    { name: '自然到访', value: 15 },
    { name: '其他', value: 5 }
]

// 静态数据 - 渠道占比（成交）
const staticChannelDealData = [
    { name: '全民营销', value: 36 },
    { name: '内渠', value: 3 },
    { name: '外渠分销', value: 37 },
    { name: '工程抵款', value: 10 },
    { name: '老带新', value: 3 },
    { name: '自拓邀约', value: 12 },
    { name: '自然到访', value: 5 },
]

// 响应式数据
const loading = ref(false)
const chartType = ref('1')
const inventoryType = ref('time')
const channelType = ref('visit')
const chartInstance = shallowRef(null)
const structuralRef = ref(null)

// 当前图表数据计算
const currentChartData = computed(() => {
    switch (chartType.value) {
        case '1': // 库存结构
            switch (inventoryType.value) {
                case 'time':
                    return staticInventoryTimeData
                case 'area':
                    return staticInventoryAreaData
                case 'allPrice':
                    return staticInventoryPriceData
                case 'format':
                    return staticInventoryFormatData
                default:
                    return staticInventoryTimeData
            }
        case '2': // 应收账龄
            return staticReceivableData
        case '3': // 渠道占比
            switch (channelType.value) {
                case 'visit':
                    return staticChannelVisitData
                case 'deal':
                    return staticChannelDealData
                default:
                    return staticChannelVisitData
            }
        default:
            return staticInventoryTimeData
    }
})

// 图表名称
const chartName = computed(() => {
    if (chartType.value === '1') {
        const subType = INVENTORY_SUB_TYPES.find(item => item.value === inventoryType.value)
        return `库存结构 - ${subType?.label || '统计'}`
    } else if (chartType.value === '2') {
        return '应收账龄统计'
    } else if (chartType.value === '3') {
        const subType = CHANNEL_SUB_TYPES.find(item => item.value === channelType.value)
        return `渠道占比 - ${subType?.label || '统计'}`
    }
    return '数据统计'
})

// 图表配置
const chartOption = computed(() => {
    const chartData = currentChartData.value

    // 计算总数
    const total = chartData.reduce((sum, item) => sum + item.value, 0)

    // 生成颜色数组
    const generateColors = () => {
        const baseColors = [
            '#5470c6', '#91cc75', '#fac858', '#ee6666',
            '#73c0de', '#3ba272', '#fc8452', '#9a60b4',
            '#ea7ccc', '#4da1ff', '#ff9f7f', '#8378ea'
        ]
        return chartData.map((_, index) => baseColors[index % baseColors.length])
    }

    return {
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderColor: '#333',
            textStyle: {
                color: '#fff',
                fontSize: 12
            },
            formatter: '{a}<br/>{b}: {c} ({d}%)'
        },
        // legend: {
        //     type: 'scroll',
        //     orient: 'horizontal',
        //     bottom: '0%',
        //     left: 'center',
        //     textStyle: {
        //         color: '#666',
        //         fontSize: 11
        //     },
        //     itemWidth: 10,
        //     itemHeight: 10,
        //     itemGap: 5,
        //     // 图例百分比
        //     formatter: function (name) {
        //         const item = chartData.find(d => d.name === name)
        //         if (item) {
        //             const percent = ((item.value / total) * 100).toFixed(1)
        //             return `${name} ${item.value}(${percent}%)`
        //         }
        //         return name
        //     }
        // },
        grid: {
            left: '3%',
            right: '3%',
            bottom: '5%',
            top: '5%',
            containLabel: true
        },
        series: [
            {
                name: chartName.value,
                type: 'pie',
                radius: ['35%', '55%'],
                center: ['50%', '50%'],
                avoidLabelOverlap: true, // 让echarts处理重叠
                // 添加最小角度，确保小数据能显示
                minAngle: 1, // 最小1度
                minShowLabelAngle: 1, // 最小显示角度为1度
                itemStyle: {
                    borderRadius: 6,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: true,
                    position: 'outside',
                    alignTo: 'labelLine',
                    bleedMargin: 5,
                    color: '#333',
                    fontSize: 11,
                    fontWeight: 'normal',
                    // 添加minAngle: 0  确保小数据也显示
                    minAngle: 0,
                    overflow: 'break', // 确保不省略任何标签
                    // 确保不隐藏任何标签
                    hideOverlap: false,
                    // 确保小角度也能显示
                    minAngle: 0.1,
                    // 换行显示文字和数值比例
                    formatter: function (params) {
                        const percent = ((params.value / total) * 100).toFixed(1)
                        return `{a|${params.name}}\n{b|${params.value}(${percent}%)}`
                    },
                    rich: {
                        a: {
                            fontSize: 11,
                            color: '#333',
                            fontWeight: 'bold',
                            lineHeight: 18
                        },
                        b: {
                            fontSize: 11,
                            color: '#666',
                            lineHeight: 11
                        }
                    },
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 12,
                        fontWeight: 'bold'
                    },
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                },
                labelLine: {
                    show: true,
                    length: 8,
                    length2: 12,
                    smooth: true
                },
                data: chartData.map((item, index) => ({
                    ...item,
                    itemStyle: {
                        color: generateColors()[index]
                    }
                })),
                animationType: 'scale',
                animationEasing: 'elasticOut',
                animationDelay: () => Math.random() * 200
            }
        ]
    }
})

// 图表操作
const initChart = () => {
    if (!structuralRef.value) return

    disposeChart()
    chartInstance.value = echarts.init(structuralRef.value)
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

// 切换图表类型
const handleChartTypeChange = (type) => {
    if (chartType.value === type) return

    loading.value = true
    chartType.value = type

    // 延迟更新，模拟数据加载
    setTimeout(() => {
        initChart()
        loading.value = false
    }, 300)
}

// 切换库存类型
const handleInventoryTypeChange = (type) => {
    if (inventoryType.value === type) return

    loading.value = true
    inventoryType.value = type

    setTimeout(() => {
        updateChart()
        loading.value = false
    }, 200)
}

// 切换渠道类型
const handleChannelTypeChange = (type) => {
    if (channelType.value === type) return

    loading.value = true
    channelType.value = type

    setTimeout(() => {
        updateChart()
        loading.value = false
    }, 200)
}

// 生命周期
onMounted(() => {
    window.addEventListener('resize', handleResize)

    nextTick(() => {
        initChart()
    })
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    disposeChart()
})
</script>

<style lang="scss" scoped>
.structural-statistic {
    width: 100%;
    background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(250, 240, 250, 0.95) 100%);
    border-radius: 14rpx;
    box-sizing: border-box;
    padding: 20rpx 20rpx;
    box-sizing: border-box;

    .chart-header {
        margin-bottom: 24rpx;
        position: relative;

        .chart-title {
            font-size: 30rpx;
            font-weight: 700;
            background: linear-gradient(135deg, #409eff 0%, #626aef 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: 1rpx;
            position: relative;
            padding-left: 20rpx;

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

    .chart-controls {
        margin-bottom: 16rpx;

        .main-type-controls {
            display: flex;
            justify-content: flex-start;
            margin-bottom: 16rpx;
            flex-wrap: wrap;
            gap: 12rpx;

            .chart-btn {
                padding: 2rpx 14rpx 4rpx;
                font-size: 24rpx;
                color: #666;
                background: rgba(239, 240, 253, 0.5);
                border-radius: 24rpx;
                transition: all 0.3s ease;
                border: 1rpx solid transparent;

                &.active {
                    color: #409eff;
                    background: rgb(239, 240, 253);
                    border-color: #409eff;
                    transform: translateY(-2rpx);
                    box-shadow: 0 4rpx 12rpx rgba(64, 158, 255, 0.15);
                }

                &:active {
                    transform: scale(0.98);
                }
            }
        }

        .sub-type-controls {
            display: flex;
            justify-content: flex-start;
            height: 40rpx;

            .sub-type-group {
                display: flex;
                flex-wrap: wrap;
                gap: 12rpx;

                .sub-type-btn {
                    padding: 0rpx 12rpx;
                    font-size: 22rpx;
                    color: #626aef;
                    background: rgba(239, 240, 253, 0.5);
                    border-radius: 30rpx;
                    transition: all 0.3s ease;
                    border: 1rpx solid transparent;

                    &.active {
                        color: #fff;
                        background: linear-gradient(135deg, #409eff 0%, #626aef 100%);
                    }

                    &:active {
                        transform: scale(0.9);
                    }
                }
            }
        }
    }

    .chart-content {
        width: 100%;
        height: 550rpx;

        .chart-area {
            width: 100%;
            height: 100%;
        }
    }
}

/* 加载动画 */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10rpx);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.structural-statistic {
    animation: fadeIn 0.5s ease-out;
}

/* 加载状态 */
.loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
}
</style>