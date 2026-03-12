<!-- 来访统计 -->
<template>
    <view class="visitor-statistics">
        <view class="metrics-header">
            <text class="metrics-title">来访统计</text>
        </view>
        <view class="echarts-info">
            <view class="info-left">
                <text class="name">来访人数</text>
                <text class="num">{{ visitNum }}</text>
            </view>
            <div class="info-right" ref="lineChartRef"></div>
        </view>
        <!-- 遮罩层组件 -->
        <loading-mask :visible="loading" text="加载中..." />
    </view>
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted, nextTick, computed } from 'vue'
import LoadingMask from '@/components/loading-mask/index.vue'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
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
const lineChartRef = ref(null)

const chartDayData = ref({
    xData: [],
    yData: []
})

const visitNum = computed(() => {
    if (props.sumData) {
        switch (props.reportType) {
            // 日报
            case 3:
                return props.sumData.dayComeNum || 0
            // 月报
            case 1:
                return props.sumData.totalComeNum || 0
            // 年报
            case 0:
                return props.sumData.totalComeNum || 0
            default:
                break;
        }
    } else {
        return 0
    }
})
// 横坐标标签间隔计算（适配H5移动端）
function getLabelInterval(dataLength) {
    if (!dataLength) return 0;
    const screenWidth = window.innerWidth
    if (screenWidth < 375) {
        // 小屏手机，只显示约 8 个标签
        return Math.ceil(dataLength / 8)
    } else if (screenWidth < 768) {
        // 大屏手机，可显示约 12 个标签
        return Math.ceil(dataLength / 12)
    } else {
        // 平板及以上，可显示约 15 个标签
        return Math.ceil(dataLength / 15)
    }
}
// 初始化图表
const initChart = () => {
    if (!lineChartRef.value) return
    // 先销毁已有实例
    disposeChart()
    // 创建新实例
    chartInstance.value = echarts.init(lineChartRef.value)
    // 图表配置
    const option = {
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
            top: '18%',
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
                rotate: 30, // 旋转30度，避免重叠
                margin: 12, // 增加边距
                // 横坐标标签显示优化 - 30个点自动间隔
                interval: getLabelInterval(30),
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
// 重置
const resetData = () => {
    chartDayData.value = { xData: [], yData: [] }
}
const fetchData = async () => {
    // 检查是否已有请求在进行
    if (isRequesting.value) return;
    loading.value = true;
    isRequesting.value = true;
    const { dateTime, projectIds } = props;
    const endTime = dayjs(dateTime)
        .subtract(1, "day")
        .endOf("day")
        .format("YYYY-MM-DD");
    const startDate = dayjs(endTime)
        .subtract(30, "day")
        .format("YYYY-MM-DD");

    const params = {
        projIds: projectIds,
        type: 0, // 0:年  1:月  2:周  3:日
        day: `${dateTime} 00:00:00`,
        beginDate: `${startDate} 00:00:00`,
        endDate: `${endTime} 23:59:59`,
    };
    try {
        const res = await largeScreenApi.getCustomerCome30Day(params);
        if (res.code === 200) {
            const listData = res.data || []
            const xData = []
            const yData = []
            listData.forEach(item => {
                xData.push(item.comeDate)
                yData.push(item.comeNum || 0)
            })
            chartDayData.value = { xData, yData }
        }
        await nextTick()
        initChart()
    } catch (err) {
        resetData()
        initChart()
    } finally {
        loading.value = false;
        isRequesting.value = false;
    }
};

onMounted(() => {
    window.addEventListener('resize', handleResize)
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
.visitor-statistics {
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
            width: 30%;
            padding: 0 20rpx;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            .name {
                font-size: 28rpx;
                color: #666;
            }

            .num {
                font-size: 36rpx;
                color: #5470c6;
                font-weight: bold;
                line-height: 2;
            }
        }

        .info-right {
            width: 70%;
            height: 300rpx;
            display: flex;
            flex: 1;
        }
    }
}

/* 卡片进入动画 */
.visitor-statistics {
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