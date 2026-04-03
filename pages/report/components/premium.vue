<!-- 项目统计 -->
<template>
    <view class="premium">
        <view class="premium-header">
            <view style="display: flex;align-items: center;">
                <text class="premium-title">
                    项目统计
                </text>
                <!-- <text v-if="scaleFactor !== 1" class="scale-tip">回款已缩放 {{ scaleText }}</text> -->
            </view>
            <label class="checkbox-select" @click="toggleSelect">
                <checkbox :checked="isSelected" style="transform:scale(0.7)" @click.stop="toggleSelect" />
                <text class="checkbox-text" :class="{ 'checkbox-text-selected': isSelected }">隐藏无数据项目</text>
            </label>
        </view>
        <div ref="chartDom" class="chart-area" :style="{ height: chartHeight }"></div>
        <!-- 遮罩层组件 -->
        <loading-mask :visible="loading" text="加载中..." />
    </view>
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import LoadingMask from '@/components/loading-mask/index.vue'
import dayjs from 'dayjs'
import { formatNumber } from '@/utils/common.js'
const props = defineProps({
    projectIds: { type: Array, default: () => [] },
    dateTime: { type: String, default: '' },
    caliberType: { type: Number, default: 0 },
    reportType: { type: Number, default: 3 },
    projectData: { type: Array, default: () => [] }
})

// loading状态
const loading = ref(false)
const isRequesting = ref(false)
const chartInstance = shallowRef(null)
const chartDom = ref(null)
const scaleFactor = ref(1) // 缩放因子
const scaleText = ref('')
const isSelected = ref(true) // 是否隐藏无数据项目
// 切换选中
const toggleSelect = (event) => {
    // 防止事件冒泡导致重复触发
    if (event) {
        event.stopPropagation()
    }
    isSelected.value = !isSelected.value
}
// 图表数据
const chartData = ref({
    // categories: ['项目一', '项目二', '项目三', '项目四', '项目五', '项目六', '项目一', '项目二', '项目三', '项目四', '项目五', '项目六'],
    // values: [3, 4, 6, 5, 7, 4, 3, 4, 6, 5, 7, 4],    // 认购
    // values2: [65, 78, 52, 45, 88, 67, 65, 78, 52, 45, 88, 67],   // 签约
    // values3: [-850, 62, 380, -76, 430, -290, 85, 62, 38, 76, 43, 29],    // 回款
    categories: [], // 项目名称
    values: [],    // 认购
    values2: [],   // 签约
    values3: [],    // 回款
    rawValues3: [] // 原始回款数据
})

/**
 * 数据标准化处理函数
 * @description 当回款金额远大于认购/签约套数时，对回款数据进行等比缩放，使所有数据能在同一图表中合理显示
 * @param {Object} data - 原始数据对象
 * @param {Array} data.categories - 项目名称列表
 * @param {Array} data.values - 认购数据（套数）
 * @param {Array} data.values2 - 签约数据（套数）
 * @param {Array} data.values3 - 回款数据（金额/万元）
 * @returns {Object} 处理后的数据对象（包含缩放后的values3和原始rawValues3）
 */
const normalizeData = (data) => {
    if (!data || !data.values3) return data

    // 计算各系列的最大绝对值（使用Math.abs处理负数，加1防止除0）
    const maxAbs1 = Math.max(...data.values.map(Math.abs), 1)   // 认购最大值
    const maxAbs2 = Math.max(...data.values2.map(Math.abs), 1)  // 签约最大值
    const maxAbs3 = Math.max(...data.values3.map(Math.abs), 1)  // 回款最大值

    // 获取除回款外的最大值（套数指标）
    const maxOther = Math.max(maxAbs1, maxAbs2)

    // 判断是否需要缩放：回款超过套数指标的40倍时进行缩放
    const needScale = maxAbs3 > maxOther * 40
    if (needScale) {
        // 计算缩放因子：让回款最大值略高于套数最大值（3倍），便于观察
        const targetMax = maxOther * 3     // 目标峰值
        const factor = targetMax / maxAbs3   // 缩放因子（小于1）

        // 保存缩放信息用于界面提示
        scaleFactor.value = factor
        scaleText.value = `(1:${(1 / factor).toFixed(0)})`  // 显示比例，如1:100

        // 返回处理后的数据：values3缩放显示，rawValues3保存原始值用于tooltip
        return {
            ...data,                                      // 保留原始categories、values、values2
            values3: data.values3.map(v => formatNumber(v * factor)),  // 缩放后的显示值
            rawValues3: [...data.values3]                 // 原始值备份（用于提示框）
        }
    }

    scaleFactor.value = 1
    scaleText.value = ''
    return {
        ...data,
        rawValues3: [...data.values3]
    }
}

// 获取数值范围
const getValueRange = () => {
    const allValues = [
        ...chartData.value.values,
        ...chartData.value.values2,
        ...chartData.value.values3
    ]
    const min = Math.min(...allValues, 0)
    const max = Math.max(...allValues, 0)
    const padding = (max - min) * 0.1
    return {
        min: Math.floor(min - padding),
        max: Math.ceil(max + padding)
    }
}

// 图表配置
const chartOption = computed(() => {
    const range = getValueRange()
    return {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: function (params) {
                let res = params[0].name + '\n'
                params.forEach(param => {
                    const seriesName = param.seriesName
                    const dataIndex = param.dataIndex
                    let value = param.value

                    if (seriesName === '回款') {
                        // 显示原始值
                        value = chartData.value.rawValues3[dataIndex]
                        res += `${param.marker} ${seriesName}: ${value} 万元\n`
                    } else {
                        res += `${param.marker} ${seriesName}: ${value} 套\n`
                    }
                })
                return res
            }
        },
        legend: {
            show: true,
            top: 'top',
            right: '5%',
            left: 'center',
            itemWidth: 15,
            itemHeight: 8,
            itemGap: 15,
            textStyle: { fontSize: 10, color: '#333' },
            data: ['认购', '签约', '回款']
        },
        grid: {
            left: '5%',
            right: '8%',
            bottom: '4%',
            top: 26,
            containLabel: false
        },
        xAxis: {
            type: 'value',
            min: range.min,
            max: range.max,
            axisLine: { show: true, lineStyle: { color: '#eee' } },
            axisTick: { show: true, lineStyle: { color: '#eee' } },
            axisLabel: { fontSize: 9, color: '#666' },
            splitLine: { show: true, lineStyle: { color: 'rgba(136, 195, 255, 0.2)', type: 'dashed' } }
        },
        yAxis: {
            type: 'category',
            data: chartData.value.categories,
            axisLine: { show: true, lineStyle: { color: '#eee' } },
            axisTick: { show: false },
            axisLabel: { fontSize: 10, color: '#666', fontWeight: 500, margin: 8 },
            splitLine: { show: false }
        },
        series: [
            {
                name: '认购',
                type: 'bar',
                data: chartData.value.values,
                barWidth: 6,
                // 添加数据标签
                label: {
                    show: true,           // 显示标签
                    position: 'right',     // 标签位置在柱子右侧
                    distance: 4,           // 距离柱子的距离
                    fontSize: 6,
                    color: '#666',
                    fontWeight: 'normal',
                    formatter: function (params) {
                        return params.value + '套'
                    }
                },
                // 确保标签显示完整
                labelLayout: {
                    hideOverlap: false     // 不隐藏重叠标签
                },
                itemStyle: {
                    borderRadius: [4, 4, 2, 2],
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: '#88c3ff' },   // 浅蓝色/天蓝
                            { offset: 0.6, color: '#5fa4ee' }, // 中蓝色
                            { offset: 1, color: '#409eff' }    // 深蓝色/经典蓝
                        ]
                    }
                }
            },
            {
                name: '签约',
                type: 'bar',
                data: chartData.value.values2,
                barWidth: 6,
                // 添加数据标签
                label: {
                    show: true,           // 显示标签
                    position: 'right',     // 标签位置在柱子右侧
                    distance: 4,           // 距离柱子的距离
                    fontSize: 6,
                    color: '#666',
                    fontWeight: 'normal',
                    formatter: function (params) {
                        return params.value + '套'
                    }
                },
                // 确保标签显示完整
                labelLayout: {
                    hideOverlap: false     // 不隐藏重叠标签
                },
                itemStyle: {
                    borderRadius: [4, 4, 2, 2],
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: '#ffd166' },   // 浅橙色/杏色
                            { offset: 0.6, color: '#ffc107' }, // 亮橙色/琥珀色
                            { offset: 1, color: '#ff8c00' }    // 深橙色
                        ]
                    }
                }
            },
            {
                name: '回款',
                type: 'bar',
                data: chartData.value.values3,
                barWidth: 6,
                // 添加数据标签
                label: {
                    show: true,
                    position: 'right',
                    distance: 4,
                    fontSize: 6,
                    color: '#666',
                    fontWeight: 'normal',
                    formatter: function (params) {
                        // return params.value + '万'
                        // 从rawValues3中获取真实值
                        const actualValue = chartData.value.rawValues3[params.dataIndex]
                        return actualValue + '万'
                    }
                },
                // 确保标签显示完整
                labelLayout: {
                    hideOverlap: false     // 不隐藏重叠标签
                },
                itemStyle: {
                    borderRadius: [4, 4, 2, 2],
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: '#8CD47E' },  // 浅薄荷
                            { offset: 0.6, color: '#5FB85C' }, // 薄荷绿
                            { offset: 1, color: '#3E9A3E' }    // 深薄荷
                        ]
                    }
                }
            }
        ]
    }
})

// 图表操作
const initChart = () => {
    if (!chartDom.value) return
    disposeChart()
    chartInstance.value = echarts.init(chartDom.value)
    updateChart()
}

const updateChart = () => {
    if (!chartInstance.value) return
    chartInstance.value.setOption(chartOption.value, false)
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
    chartData.value = {
        categories: [],
        values: [],
        values2: [],
        values3: [],
        rawValues3: []
    }
}

// 获取请求参数
const getRequestParams = () => {
    const endTime = dayjs(props.dateTime)
        .subtract(1, "month")
        .endOf("month")
        .format("YYYY-MM-DD")

    const startDate = dayjs(endTime)
        .subtract(1, "year")
        .format("YYYY-MM-DD")

    return {
        projIds: props.projectIds,
        type: 0,
        day: `${props.dateTime} 00:00:00`,
        beginDate: `${startDate} 00:00:00`,
        endDate: `${endTime} 23:59:59`,
    }
}

// 请求数据
const fetchData = async () => {
    if (isRequesting.value) return
    loading.value = true
    isRequesting.value = true
    resetData()

    try {
        const params = getRequestParams()
        if (chartDom.value) {
            await nextTick()
            initChart()
        }
    } catch (error) {
        console.error("获取数据失败:", error)
    } finally {
        loading.value = false
        isRequesting.value = false
    }
}

// 缓存原始数据
const cachedRawData = ref(null)
// 处理数据
const processData = (data) => {
    if (data && data.length > 0) {
        // 处理数据并缓存原始数据
        cachedRawData.value = data.reduce((acc, item) => {
            acc.categories.push(item?.projName || '未知项目')
            acc.values.push(formatNumber(item?.dayOrderNum) || 0) // 认购
            acc.values2.push(formatNumber(item?.daySignNum) || 0) // 签约
            acc.values3.push(formatNumber(item?.dayRecMoney) || 0) // 回款
            return acc
        }, { categories: [], values: [], values2: [], values3: [] })

        // chartData.value = normalizeData(rawData)
        filterAndUpdate()
    } else {
        resetData()
        nextTick(() => {
            initChart()
        })
    }
}

// 添加这两个变量
const chartHeight = ref('1200rpx')
const ITEM_HEIGHT = 56 // 每个项目高度(rpx)
// 应用过滤并更新图表
const filterAndUpdate = () => {
    if (!cachedRawData.value) return

    // 根据过滤条件获取数据
    let dataToUse = cachedRawData.value
    if (isSelected.value) {
        dataToUse = filterZeroData(cachedRawData.value)
    }

    // 计算新高度
    const newHeight = 100 + (dataToUse.categories.length * ITEM_HEIGHT)
    chartHeight.value = Math.min(newHeight, 1500) + 'rpx'

    // 更新 chartData
    chartData.value = normalizeData(dataToUse)

    // // 如果图表已存在，只更新数据，不重新初始化
    // if (chartInstance.value && !chartInstance.value.isDisposed()) {
    //     // 只更新变化的部分
    //     chartInstance.value.setOption(chartOption.value, false)
    //     // 让图表重新适应容器
    //     chartInstance.value.resize()
    // } else {
    //     // 图表不存在才初始化
    //     initChart()
    // }
    
    // 确保图表在数据更新后重新渲染,动态高度
    nextTick(() => {
        initChart()
    })
}
// 过滤掉所有数据都为零的项目
const filterZeroData = (data) => {
    const filtered = {
        categories: [],
        values: [],
        values2: [],
        values3: []
    }
    for (let i = 0; i < data.categories.length; i++) {
        // 检查认购、签约、回款是否都为零（或空值）
        const isAllZero = (data.values[i] === 0 || data.values[i] === null) &&
            (data.values2[i] === 0 || data.values2[i] === null) &&
            (data.values3[i] === 0 || data.values3[i] === null)

        // 如果不是全零，则保留该条数据
        if (!isAllZero) {
            filtered.categories.push(data.categories[i])
            filtered.values.push(data.values[i])
            filtered.values2.push(data.values2[i])
            filtered.values3.push(data.values3[i])
        }
    }
    return filtered
}
// 监听 isSelected
watch(isSelected, () => {
    if (cachedRawData.value) {
        filterAndUpdate()
    }
})
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
    window.removeEventListener('resize', handleResize)
    disposeChart()
})

defineExpose({ refreshData: fetchData })
</script>

<style lang="scss" scoped>
.premium {
    width: 100%;
    background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(250, 240, 250, 0.95) 100%);
    border-radius: 12rpx;
    padding: 20rpx 20rpx;
    box-sizing: border-box;
    position: relative;

    .premium-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;
        border-bottom: 1rpx solid rgba(224, 247, 250, 0.4);
        position: relative;
        z-index: 1;

        .premium-title {
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

        .checkbox-select {
            display: flex;
            align-items: center;

            :deep(.uni-checkbox-input) {
                margin: 0 !important;
            }

            .checkbox-text {
                font-size: 26rpx;
                color: #999999;
            }

            .checkbox-text-selected {
                color: #007aff;
            }
        }

        .scale-tip {
            font-size: 20rpx;
            color: #ff8c00;
            background: rgba(255, 140, 0, 0.1);
            padding: 4rpx 12rpx;
            border-radius: 20rpx;
        }
    }

    .chart-area {
        width: 100%;
        // height: 1200rpx;
    }
}

.premium {
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