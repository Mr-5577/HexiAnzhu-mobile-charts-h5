<!-- 完成率统计 -->
<template>
    <view class="completion-rate">
        <view class="metrics-header">
            <text class="metrics-title">完成率统计</text>
        </view>
        <view class="echarts-info">
            <view class="info-left">
                <svg-ring :label="'综合完成率'" :size="140" :strokeWidth="15" :progress="completionRate" color="#86a0f1"
                    backgroundColor="rgba(136, 195, 255, 0.1)"></svg-ring>
            </view>
            <div class="info-right" ref="barChartRef"></div>
        </view>
        <!-- 遮罩层组件 -->
        <loading-mask :visible="loading" text="加载中..." />
    </view>
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted, nextTick, watch } from 'vue'
import SvgRing from '@/components/svg-ring/index.vue'
import LoadingMask from '@/components/loading-mask/index.vue'
import * as echarts from 'echarts'
import { saleReportApi } from '@/common/api.js'
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
// ECharts实例
const chartInstance = shallowRef(null)
const barChartRef = ref(null)

const completionRate = ref(0)
const chartData = ref({
    categories: ['成交率', '签约率', '回款率'],
    values: [0, 0, 0]
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
            left: '5%',
            right: '5%',
            bottom: '3%',
            top: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: chartData.value.categories,
            // 轴线样式
            axisLine: {
                show: true, // 是否显示轴线
                lineStyle: {
                    color: '#eee', // 轴线颜色
                    width: 1, // 轴线宽度
                    type: 'dotted' // solid-实线 dashed-虚线 dotted-点线
                }
            },
            // 刻度线样式
            axisTick: {
                show: true, // 是否显示刻度线
                alignWithLabel: false, // 刻度线与标签对齐
                length: 3, // 刻度线长度
                lineStyle: {
                    color: '#eee', // 刻度线颜色
                    width: 1
                }
            },
            axisLabel: {
                fontSize: 10,
                color: '#666',
                fontWeight: 500
            },
        },
        yAxis: {
            type: 'value',
            // max: 100,
            min: 0,
            splitLine: {
                show: true,
                interval: 10, // 每10个单位显示一条
                lineStyle: {
                    color: ['rgba(136, 195, 255, 0.3)'],
                    width: 1,
                    type: 'dashed'
                }
            },
            axisLabel: {
                fontSize: 10,
                color: '#999',
                formatter: '{value}%' // 添加%单位
            },
            // 轴线配置
            axisLine: {
                show: true,
                lineStyle: {
                    color: '#eee',
                    width: 1,
                    type: 'solid'
                },
                // 轴线两端的箭头
                symbol: ['none', 'arrow'],
                symbolSize: [0, 8]
            },
            // 刻度线配置
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
                name: '转化率',
                type: 'bar',
                data: chartData.value.values,
                barWidth: 15,
                itemStyle: {
                    borderRadius: [16, 16, 0, 0], // 圆角柱状图
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: '#86a0f1' },
                            { offset: 1, color: '#5470c6' }
                        ]
                    }
                },
                label: {
                    show: true,
                    position: 'top',
                    color: '#86a0f1',
                    fontSize: 10,
                    fontWeight: 'bold',
                    formatter: '{c}%'
                }
            }
        ]
    }

    chartInstance.value.setOption({
        ...option,
        series: [{
            ...option.series[0],
            data: chartData.value.values // 使用最新数据
        }]
    }, true)
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

// 更新图表数据
const updateChartData = () => {
    if (!chartInstance.value) return
    chartInstance.value.setOption(
        {
            series: [{
                data: chartData.value.values
            }]
        },
        {
            notMerge: false // 不合并，保留其他配置
        }
    )
}

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
        if (res.code === 200) {
            await nextTick()
            // 如果图表还没初始化，重新初始化
            if (!chartInstance.value) {
                initChart();
            } else {
                updateChartData();
            }
            setTimeout(() => {
                handleResize()
            }, 100)
        }
    } finally {
        loading.value = false;
        isRequesting.value = false;
    }
};

watch(
    () => props.sumData,
    (newData) => {
        console.log('completion-rate', newData)
        completionRate.value = formatNumber(newData.totalRate)
        const data = [
            formatNumber(newData.orderRate),
            formatNumber(newData.signRate),
            formatNumber(newData.collectRate),
        ]
        chartData.value.values = data
        nextTick(() => {
            initChart()
        })
    },
    { deep: true, immediate: true }
)

onMounted(() => {
    window.addEventListener('resize', handleResize)
    nextTick(() => {
        initChart()
    })
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
.completion-rate {
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

        .info-left {
            width: 40%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .info-right {
            width: 60%;
            height: 400rpx;
        }
    }
}

/* 卡片进入动画 */
.completion-rate {
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