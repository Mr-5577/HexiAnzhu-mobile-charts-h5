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
        <!-- 遮罩层组件 -->
        <loading-mask :visible="loading" text="加载中..." />
    </view>
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted, computed, nextTick } from 'vue'
import * as echarts from 'echarts'
import LoadingMask from '@/components/loading-mask/loading-mask.vue'
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

// 响应式数据
const loading = ref(false)
// 防止重复请求
const isRequesting = ref(false)
const chartType = ref('1')
const inventoryType = ref('time')
const channelType = ref('visit')
const chartInstance = shallowRef(null)
const structuralRef = ref(null)
const apiRawData = ref([[], [], [], [], [], [], []])

// 当前图表数据计算
const currentChartData = computed(() => {
    let listData = []
    switch (chartType.value) {
        case '1': // 库存结构
            switch (inventoryType.value) {
                case 'time':
                    listData = apiRawData.value[0]
                    break
                case 'area':
                    listData = apiRawData.value[1]
                    break
                case 'allPrice':
                    listData = apiRawData.value[2]
                    break
                case 'format':
                    listData = apiRawData.value[3]
                    break
                default:
                    break
            }
            break
        case '2': // 应收账龄
            listData = apiRawData.value[4]
            break
        case '3': // 渠道占比
            switch (channelType.value) {
                case 'visit':
                    listData = apiRawData.value[5]
                    break
                case 'deal':
                    listData = apiRawData.value[6]
                    break
                default:
                    break
            }
            break
        default:
            break
    }
    // 转换为饼图数据格式
    return listData
        .filter((item) => item && item.groupName)
        .map((item) => ({
            value: item.roomCount || 0,
            name: item.groupName || "未知数据",
        }));
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
                    // 换行显示文字和数值比例
                    formatter: function (params) {
                        const percent = ((params.value / total) * 100).toFixed(1)
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
                    length: 10,  // 引导线第一段长度
                    length2: 14,  // 引导线第二段长度
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
    chartType.value = type
    updateChart()
}

// 切换库存类型
const handleInventoryTypeChange = (type) => {
    if (inventoryType.value === type) return
    inventoryType.value = type
    updateChart()
}

// 切换渠道类型
const handleChannelTypeChange = (type) => {
    if (channelType.value === type) return
    channelType.value = type
    updateChart()
}
// 获取数据
const fetchData = async () => {
    if (isRequesting.value) return;

    const { dateTime, projectIds } = props;
    if (!dateTime || projectIds.length === 0) {
        // 如果没有必要参数，清空数据
        apiRawData.value = [[], [], [], [], [], [], []];
        nextTick(() => {
            updateChart();
        });
        return;
    }
    const params = {
        projIds: projectIds,
        type: 1, // 0:年  1:月  2:周  3:日
        day: `${dateTime} 00:00:00`,
        beginDate: dayjs(dateTime).startOf("month").format("YYYY-MM-DD") + " 00:00:00",
        endDate: dayjs(dateTime).endOf("month").format("YYYY-MM-DD") + " 23:59:59",
    };
    try {
        loading.value = true;
        isRequesting.value = true;

        const res = await largeScreenApi.getRoomStockGroupInfo(params);
        if (res.code === 200) {
            // 存储API原始数据 - 确保是7个数组
            const data = Array.isArray(res.data) ? res.data : [];
            apiRawData.value = [
                data[0] || [], // 库存结构-时间
                data[1] || [], // 库存结构-面积
                data[2] || [], // 库存结构-总价
                data[3] || [], // 库存结构-业态
                data[4] || [], // 应收账龄
                data[5] || [], // 渠道占比-来访
                data[6] || [], // 渠道占比-成交
            ];

            // 确保图表已初始化
            if (!chartInstance.value) {
                initChart();
            } else {
                nextTick(() => {
                    updateChart();
                });
            }
        }
    } catch (error) {
        console.error("获取数据失败:", error);
        apiRawData.value = [[], [], [], [], [], [], []];
        nextTick(() => {
            updateChart();
        });
    } finally {
        loading.value = false;
        isRequesting.value = false;
    }
};

// 生命周期
onMounted(() => {
    window.addEventListener('resize', handleResize)
    // nextTick(() => {
    //     initChart()
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
.structural-statistic {
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