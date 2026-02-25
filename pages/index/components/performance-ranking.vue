<!-- 业绩排名统计 -->
<template>
    <view class="performance-ranking">
        <view class="performance-header">
            <text class="performance-title">业绩排名统计</text>
            <view class="type-filter">
                <text v-for="(item, index) in CHART_TYPES" :key="index" class="type-item"
                    :class="{ 'active': chartType === item.value }" @click="switchChartType(item.value)">
                    {{ item.label }}
                </text>
            </view>
        </view>

        <!-- 表格容器 -->
        <scroll-view class="table-container" scroll-y>
            <!-- 表头 -->
            <view class="table-row header-row">
                <view v-for="(column, colIndex) in tableColumns" :key="colIndex" class="table-cell header-cell"
                    :style="getColumnStyle(column)">
                    <text class="header-text">{{ column.label }}</text>
                </view>
            </view>

            <!-- 表格数据 -->
            <view v-for="(item, index) in currentTableData" :key="index" class="table-row data-row"
                :class="{ 'striped': index % 2 === 1 }" @click="handleRowClick(item)">
                <view v-for="(column, colIndex) in tableColumns" :key="colIndex" class="table-cell data-cell"
                    :style="getColumnStyle(column)">
                    <template v-if="column.formatter">
                        {{ column.formatter(item) }}
                    </template>
                    <template v-else>
                        {{ item[column.prop] || '-' }}
                    </template>
                </view>
            </view>

            <!-- 空状态 -->
            <view v-if="currentTableData.length === 0" class="empty-state">
                <text class="empty-text">暂无数据</text>
            </view>
        </scroll-view>

        <!-- 遮罩层组件 -->
        <loading-mask :visible="loading" text="加载中..." />
    </view>
</template>

<script setup>
import { ref, computed } from 'vue'
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

const CHART_TYPES = ref([
    { label: '项目月度排名', value: '1' },
    { label: '个人月度排名', value: '2' },
])

// 响应式数据
const loading = ref(false)
// 防止重复请求
const isRequesting = ref(false)
const chartType = ref('1')
const tableCache = ref({
    '1': [],
    '2': []
})

// 表格列配置
const tableColumns = computed(() => {
    return chartType.value === '1'
        ? [
            { prop: 'sort', label: '排名', align: 'center' },
            { prop: 'projName', label: '项目名称', align: 'left' },
            { prop: 'signNum', label: '签约(套)', align: 'center' },
            { prop: 'orderNum', label: '认购(套)', align: 'center' },
            { prop: 'collectMoney', label: '回款(万)', align: 'center' },
            {
                prop: 'totalRate',
                label: '完成率',
                align: 'center',
                formatter: (row) => {
                    const value = row.totalRate
                    return value !== null && value !== undefined
                        ? `${(value * 100).toFixed(1)}%`
                        : '-'
                }
            }
        ]
        : [
            { prop: 'sort', label: '集团排名', align: 'center' },
            { prop: 'sortProj', label: '项目排名', align: 'center' },
            { prop: 'projName', label: '项目名称', align: 'left' },
            { prop: 'salerName', label: '置业顾问', align: 'center' },
            {
                prop: 'orderNum',
                label: '认购(套)',
                align: 'center',
                formatter: (row) => `${row.orderNum}套`
            }
        ]
})

// 当前表格数据
const currentTableData = computed(() => {
    return tableCache.value[chartType.value] || []
})

// 获取列样式
const getColumnStyle = (column) => {
    const style = {}
    style.flex = '1 1 0' // 均等分宽度
    style.minWidth = '0' // 允许收缩

    if (column.align) {
        style.textAlign = column.align
        style.justifyContent = column.align === 'left' ? 'flex-start' :
            column.align === 'right' ? 'flex-end' : 'center'
    }
    return style
}

// 切换图表类型
const switchChartType = (type) => {
    if (chartType.value === type) return
    chartType.value = type
    fetchData()
}

// 刷新数据
const fetchData = async () => {
    // 检查是否已有请求在进行
    if (isRequesting.value) return;

    // const time = dayjs(props.dateTime).subtract(1, "month").format("YYYY-MM-DD"); // 上月
    const time = dayjs(props.dateTime || new Date()).format("YYYY-MM-DD"); // 当月
    const params = {
        projIds: props.projectIds,
        type: 1, // 0:年  1:月  2:周  3:日
        day: `${time} 00:00:00`,
        beginDate: dayjs(time).startOf("month").format("YYYY-MM-DD") + " 00:00:00",
        endDate: dayjs(time).endOf("month").format("YYYY-MM-DD") + " 23:59:59",
    };
    isRequesting.value = true;
    loading.value = true;
    try {
        const apiMethod = chartType.value == '1' ? largeScreenApi.getSaleProjInfo : largeScreenApi.getSaleProjSalerInfo;
        const res = await apiMethod(params);
        if (res.code === 200) {
            tableCache.value[chartType.value] = res.data || [];
        }
    } catch (error) {
        console.error('请求失败：', error);
        tableCache.value[chartType.value] = [];
    } finally {
        isRequesting.value = false;
        loading.value = false;
    }
}

// 暴露方法给父组件
defineExpose({
    refreshData: fetchData
})

// 行点击事件
const handleRowClick = (item) => {
    console.log('点击行数据：', item)
}
</script>

<style lang="scss" scoped>
.performance-ranking {
    width: 100%;
    height: 600rpx;
    background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(250, 240, 250, 0.95) 100%);
    border-radius: 20rpx;
    padding: 20rpx;
    box-sizing: border-box;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    position: relative;

    .performance-header {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20rpx;
        border-bottom: 2rpx solid rgba(224, 247, 250, 0.4);
        flex-shrink: 0;

        .performance-title {
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
                height: 30rpx;
                background: linear-gradient(135deg, #409eff, #626aef);
                border-radius: 3rpx;
            }
        }


        .type-filter {
            display: flex;
            align-items: center;
            background: rgba(224, 247, 250, 0.15);
            border-radius: 20rpx;
            padding: 2rpx;
            border: 1rpx solid rgba(224, 247, 250, 0.3);
            box-shadow:
                0 2rpx 8rpx rgba(224, 247, 250, 0.1),
                inset 0 1rpx 0 rgba(255, 255, 255, 0.3);
            overflow: hidden;
            white-space: nowrap;
            height: 44rpx;
            gap: 15rpx;
        }

        .type-item {
            padding: 0 14rpx;
            font-size: 22rpx;
            font-weight: 500;
            color: #626aef;
            transition: all 0.3s ease;
            white-space: nowrap;
            min-width: 50rpx;
            height: 36rpx;
            line-height: 36rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 16rpx;

            background: rgba(239, 240, 253, 0.5);

            &.active {
                color: #ffffff;
                background: linear-gradient(135deg, #409eff 0%, #626aef 100%);
                font-weight: 600;
                box-shadow: 0 2rpx 6rpx rgba(64, 158, 255, 0.3),
                    inset 0 1rpx 0 rgba(255, 255, 255, 0.3);
                padding: 0 18rpx;
            }
        }

        .more-btn {
            font-size: 22rpx;
            color: #409eff;
            font-weight: 500;
            padding: 6rpx 12rpx;
            border-radius: 16rpx;
            transition: all 0.3s;
            background: rgba(64, 158, 255, 0.1);

            &:active {
                background: rgba(64, 158, 255, 0.2);
                transform: scale(0.95);
            }
        }
    }

    .table-container {
        width: 100%;
        /* 固定表格容器高度，使用 flex: 1 填充剩余空间 */
        flex: 1;
        border-radius: 12rpx;
        overflow-y: scroll;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);

        /* 关键修改：移除横向滚动限制，让列自适应 */
        overflow-x: visible;
    }

    .table-row {
        display: flex;
        border-bottom: 1rpx solid #f0f0f0;
        flex-wrap: nowrap;
        /* 防止内容超出容器 */
        width: 100%;
        box-sizing: border-box;

        &:last-child {
            border-bottom: none;
        }
    }

    .table-cell {
        /* 所有列均等分 */
        flex: 1;
        min-width: 0;
        box-sizing: border-box;
        /* 确保内容不超出 */
        overflow: hidden;
        word-wrap: break-word;
        word-break: break-all;
    }

    .header-row {
        background: linear-gradient(135deg, #f6f8ff, #f0f4ff);
        font-weight: 600;
        position: sticky;
        top: 0;
        z-index: 10;
    }

    .header-cell {
        padding: 16rpx 8rpx;
        font-size: 22rpx;
        color: #333;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        background: linear-gradient(135deg, #f6f8ff, #f0f4ff);
        /* 表头文本可以换行 */
        white-space: normal;
        word-break: break-word;
        line-height: 1.3;

        .header-text {
            width: 100%;
            display: block;
        }
    }

    .data-row {
        background-color: #fff;
        transition: background-color 0.3s;

        &.striped {
            background-color: #f8f9fa;
        }

        &:active {
            background-color: #eef5ff;
        }
    }

    .data-cell {
        padding: 16rpx 8rpx;
        font-size: 22rpx;
        color: #666;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        word-break: break-all;
        line-height: 1.4;
        overflow-wrap: break-word;
        hyphens: auto;

        /* 排名数字样式 */
        &:first-child {
            color: #409eff;
            font-weight: 600;
        }
    }

    /* 项目名称和个人名称列左对齐 */
    .data-cell:nth-child(2),
    .data-cell:nth-child(4) {
        justify-content: flex-start;
        text-align: left;
    }

    .empty-state {
        padding: 80rpx 0;
        text-align: center;

        .empty-text {
            font-size: 26rpx;
            color: #999;
        }
    }
}

/* 卡片进入动画 */
.performance-ranking {
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