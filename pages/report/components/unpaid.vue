<!-- 饼状图 -->
<template>
    <view class="unpaid-statistic">
        <!-- 标题区域 -->
        <view class="chart-header">
            <text class="chart-title">未回款统计</text>
        </view>

        <!-- 图表区域 -->
        <view class="chart-content">
            <div ref="structuralRef" class="chart-area"></div>
        </view>
        <!-- 遮罩层组件 -->
        <loading-mask :visible="loading" text="加载中..." />
    </view>
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import LoadingMask from '@/components/loading-mask/index.vue'
import { formatNumber } from '@/utils/common.js'

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

const chartInstance = shallowRef(null)
const structuralRef = ref(null)

const proportionData = computed(() => {
    if (props.sumData) {
        return [
            { name: '已签约', value: props.sumData.signNum || 0 },
            { name: '未签约', value: props.sumData.notSignNum || 0 },
            { name: '物业借款', value: formatNumber(props.sumData.loanNum) || 0 },
        ]
    } else {
        return [
            { name: '已签约', value: 0 },
            { name: '未签约', value: 0 },
            { name: '物业借款', value: 0 },
        ]

    }
})
// 计算总数
const total = computed(() => {
    return proportionData.value.reduce((sum, item) => sum + item.value, 0)
})

// 生成颜色数组
const generateColors = () => {
    const baseColors = [
        '#5470c6', '#91cc75', '#fac858', '#ee6666',
        '#73c0de', '#3ba272', '#fc8452', '#9a60b4',
        '#ea7ccc', '#4da1ff', '#ff9f7f', '#8378ea'
    ]
    return proportionData.value.map((_, index) => baseColors[index % baseColors.length])
}

// 图表配置
const chartOption = computed(() => ({
    grid: {
        left: '3%',
        right: '3%',
        bottom: '5%',
        top: '5%',
        containLabel: true
    },
    series: [
        {
            name: '未回款统计',
            type: 'pie',
            radius: ['35%', '55%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: true,
            minShowLabelAngle: 1,
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
                minAngle: 0,
                overflow: 'break',
                hideOverlap: false,
                formatter: function (params) {
                    let percent = '0'
                    if (total.value > 0) {
                        percent = ((params.value / total.value) * 100).toFixed(1)
                    }
                    return `{a|${params.name}}\n {b|${params.value}(${percent}%)}`
                },
                rich: {
                    a: {
                        fontSize: 11,
                        color: '#333',
                        fontWeight: 'bold',
                        lineHeight: 12
                    },
                    b: {
                        fontSize: 10,
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
                length: 10,
                length2: 14,
                smooth: true
            },
            data: proportionData.value.map((item, index) => ({
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
}))

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

// 模拟数据加载
const fetchData = async () => {
    if (isRequesting.value) return
    loading.value = true
    isRequesting.value = true
    try {
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 300))
        if (!chartInstance.value) {
            initChart()
        } else {
            nextTick(() => {
                updateChart()
            })
        }
    } catch (error) {
        console.error("加载数据失败:", error)
    } finally {
        loading.value = false
        isRequesting.value = false
    }
}
watch(
    () => props.sumData,
    (newData) => {
        nextTick(() => {
            initChart()
        })
    },
    { deep: true, immediate: true }
)

onMounted(() => {
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    disposeChart()
})

// 暴露方法给父组件
defineExpose({ refreshData: fetchData })
</script>

<style lang="scss" scoped>
.unpaid-statistic {
    width: 100%;
    background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(250, 240, 250, 0.95) 100%);
    border-radius: 14rpx;
    box-sizing: border-box;
    padding: 20rpx 20rpx;
    position: relative;

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

.unpaid-statistic {
    animation: fadeIn 0.5s ease-out;
}
</style>