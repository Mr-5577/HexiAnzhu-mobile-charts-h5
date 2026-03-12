<!-- 城市项目统计 -->
<template>
    <view class="project-statistics">
        <view class="statistics-header">
            <text class="metrics-title">城市项目统计</text>
        </view>
        <view class="echarts-info">
            <div class="info-right" ref="barChartRef"></div>
        </view>
        <!-- 遮罩层组件 -->
        <loading-mask :visible="loading" text="加载中..." />
    </view>
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted, nextTick, watch } from 'vue'
import LoadingMask from '@/components/loading-mask/index.vue'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
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
    projectData: {
        type: Array,
        default: () => []
    }
})

// loading状态
const loading = ref(false)
// 防止重复请求
const isRequesting = ref(false)
// ECharts实例
const chartInstance = shallowRef(null)
const barChartRef = ref(null)

const chartData = ref({
    categories: [], // 城市名称
    values: [] // 综合完成率
})

// 初始化图表
const initChart = () => {
    if (!barChartRef.value) return
    // 先销毁已有实例
    disposeChart()
    // 创建新实例
    chartInstance.value = echarts.init(barChartRef.value)
    // 图表配置
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function (params) {
                return `${params[0].name}<br/>${params[0].seriesName}: ${params[0].value}%`
            }
        },
        grid: {
            left: '3%',
            right: '5%',
            bottom: '5%',
            top: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: chartData.value.categories,
            // 轴线样式
            axisLine: {
                show: true,
                lineStyle: {
                    color: '#eee',
                    width: 1,
                    type: 'dotted'
                }
            },
            // 刻度线样式
            axisTick: {
                show: true,
                alignWithLabel: false,
                length: 3,
                lineStyle: {
                    color: '#eee',
                    width: 1
                }
            },
            axisLabel: {
                fontSize: 9,
                color: '#666',
                rotate: 30, // 旋转30度，避免重叠
                margin: 12, // 增加边距
                interval: 0, // 强制显示所有标签
                // 超出长度截断显示
                formatter: function (value) {
                    if (value.length > 6) {
                        return value.slice(0, 6) + '...'
                    }
                    return value
                }
            },
        },
        yAxis: {
            type: 'value',
            max: 100,
            min: 0,
            splitLine: {
                show: true,
                interval: 10,
                lineStyle: {
                    color: ['rgba(136, 195, 255, 0.3)'],
                    width: 1,
                    type: 'dashed'
                }
            },
            axisLabel: {
                fontSize: 9,
                color: '#999',
                formatter: '{value}%'
            },
            axisLine: {
                show: true,
                lineStyle: {
                    color: '#eee',
                    width: 1,
                    type: 'solid'
                },
                symbol: ['none', 'arrow'],
                symbolSize: [0, 8]
            },
            axisTick: {
                show: true,
                lineStyle: {
                    color: '#eee',
                    width: 1
                }
            },
        },
        series: [
            {
                name: '完成率',
                type: 'bar',
                data: chartData.value.values,
                barWidth: 12,
                itemStyle: {
                    borderRadius: [10, 10, 6, 6], // 更大的圆角，让柱子更加圆润
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: '#88c3ff' },
                            { offset: 0.6, color: '#5fa4ee' },
                            { offset: 1, color: '#409eff' }
                        ]
                    }
                },
                label: {
                    show: true,
                    position: 'top',
                    color: '#88c3ff',
                    fontSize: 10,
                    fontWeight: 'bold',
                    formatter: '{c}%',
                    offset: [0, 4]
                },
                // 添加背景圆角效果
                backgroundStyle: {
                    borderRadius: [10, 10, 6, 6]
                },
                // 添加动画效果
                animation: true,
                animationDuration: 1000,
                animationEasing: 'cubicOut'
            }
        ]
    }

    chartInstance.value.setOption(option, true)
}

// 处理窗口大小变化
const handleResize = () => {
    if (chartInstance.value && !chartInstance.value.isDisposed()) {
        chartInstance.value.resize()
    }
}

// 销毁
const disposeChart = () => {
    if (chartInstance.value && !chartInstance.value.isDisposed()) {
        chartInstance.value.dispose()
        chartInstance.value = null
    }
}

// 重置数据
const resetData = () => {
    chartData.value = {
        categories: [],
        values: []
    }
}

// 更新图表数据
const updateChartData = (data) => {
    if (!chartInstance.value) return
    chartInstance.value.setOption({
        series: [{
            data: data.values
        }]
    })
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
        await nextTick()
        initChart()
    } finally {
        loading.value = false;
        isRequesting.value = false;
    }
};
const processData = (data) => {
    if (data && data.length > 0) {
        // 处理数据
        const rawData = data.reduce((acc, item) => {
            acc.categories.push(item?.projName || '未知城市')
            acc.values.push(formatPercentage(item?.totalRate) || 0)
            return acc
        }, { categories: [], values: [], })

        chartData.value = rawData
    } else {
        resetData()
    }
    nextTick(() => {
        initChart()
    })
}

watch(
    () => props.projectData,
    (newData) => {
        processData(newData)
    },
    { deep: true, immediate: true }
)

onMounted(() => {
    window.addEventListener('resize', handleResize)
    // nextTick(() => {
    //     initChart()
    // })
})

onUnmounted(() => {
    // 销毁图表实例
    if (chartInstance.value) {
        chartInstance.value.dispose()
        chartInstance.value = null
    }
    // 移除事件监听
    window.removeEventListener('resize', handleResize)
})

// 暴露方法给父组件
defineExpose({ refreshData: fetchData })

</script>

<style lang="scss" scoped>
.project-statistics {
    width: 100%;
    background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(250, 240, 250, 0.95) 100%);
    border-radius: 12rpx;
    padding: 20rpx 20rpx;
    box-sizing: border-box;
    position: relative;

    .statistics-header {
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

    .echarts-info {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;

        .info-right {
            width: 100%; // 从60%改为100%，占据全部宽度
            height: 450rpx; // 稍微增加高度以适应更多柱子
            display: flex;
            flex: 1;
        }
    }
}

/* 卡片进入动画 */
.project-statistics {
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