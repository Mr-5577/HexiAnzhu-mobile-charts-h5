<!-- 业务指标 -->
<template>
    <div class="h5-statistics-two-column">
        <!-- 卡片头部 -->
        <div class="two-column-header">
            <div class="header-title">业务指标</div>
        </div>
        <!-- 两列布局 -->
        <div class="two-column-grid">
            <!-- 第一组：3个指标 -->
            <div class="column-group">
                <div v-for="item in firstColumnItems" :key="item.text" class="column-item"
                    :style="{ '--color': getColorByType(item.type) }">
                    <div class="column-text">{{ item.text }}</div>
                    <div class="column-value">{{ item.value }}</div>
                </div>
            </div>

            <!-- 第二组：3个指标 -->
            <div class="column-group">
                <div v-for="item in secondColumnItems" :key="item.text" class="column-item"
                    :style="{ '--color': getColorByType(item.type) }">
                    <div class="column-text">{{ item.text }}</div>
                    <div class="column-value">{{ item.value }}</div>
                </div>
            </div>
        </div>
        <!-- 遮罩层组件 -->
        <loading-mask :visible="loading" text="加载中..." />
    </div>
</template>

<script setup>
import { ref, computed, onUnmounted, onMounted } from 'vue'
import LoadingMask from '@/components/loading-mask/index.vue'
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

// loading状态
const loading = ref(false)
// 防止重复请求
const isRequesting = ref(false)
const dataObj = ref({
    signDays: 0, // 认购转签约周期
    tfNum: 0, // 退房数量
    tfMoney: 0, // 退房金额
    tdNum: 0, // 挞定数量
    tdMoney: 0, // 挞定金额
    noSignNum: 0, // 认购未签数量
    noSignMoney: 0, // 认购未签金额
    collectMoney: 0, // 累计应收金额
    collectNum: 0, // 累计应收套数
    outstdMoney: 0, // 逾期未回款
    outstdNum: 0, // 逾期未回套数
})

// 数据处理函数
const formatTwoDecimal = (num) => {
    const number = Number(num)
    if (isNaN(number)) return "0"
    const str = number.toString()
    const match = str.match(/\.(\d+)$/)
    if (match && match[1].length > 2) {
        return number.toFixed(2)
    }
    return str
}

// 业务指标数据
const statisticsItems = computed(() => [
    {
        text: "认转签周期",
        value: `${dataObj.value.signDays}天`,
        type: "cycle"
    },
    {
        text: "挞定",
        value: `${formatTwoDecimal(dataObj.value.tdMoney)}万(${dataObj.value.tdNum}套)`,
        type: "forfeit"
    },
    {
        text: "退房",
        value: `${formatTwoDecimal(dataObj.value.tfMoney)}万(${dataObj.value.tfNum}套)`,
        type: "refund"
    },
    {
        text: "认购未签约",
        value: `${formatTwoDecimal(dataObj.value.noSignMoney)}万(${dataObj.value.noSignNum}套)`,
        type: "sign"
    },
    {
        text: "累计应收",
        value: `${formatTwoDecimal(dataObj.value.collectMoney)}万(${dataObj.value.collectNum}套)`,
        type: "receivable"
    },
    {
        text: "逾期未回款",
        value: `${formatTwoDecimal(dataObj.value.outstdMoney)}万(${dataObj.value.outstdNum}套)`,
        type: "overdue"
    },
])

// 分组数据
const firstColumnItems = computed(() => statisticsItems.value.slice(0, 3))
const secondColumnItems = computed(() => statisticsItems.value.slice(3, 6))

// 根据类型获取颜色
const getColorByType = (type) => {
    const colors = {
        cycle: '#91cc75',
        sign: '#f06292',
        forfeit: '#5470c6',
        receivable: '#fac858',
        refund: '#73d0f4',
        overdue: '#ff6b6b'
    }
    return colors[type] || '#71808b'
}
const fetchData = async () => {
    // 检查是否已有请求在进行
    if (isRequesting.value) return;
    const { dateTime, projectIds } = props;
    const params = {
        projIds: projectIds,
        type: 1, // 0:年  1:月  2:周  3:日
        day: `${dateTime} 00:00:00`,
        beginDate: dayjs(dateTime).startOf("month").format("YYYY-MM-DD") + " 00:00:00",
        endDate: dayjs(dateTime).endOf("month").format("YYYY-MM-DD") + " 23:59:59",
    };
    loading.value = true;
    isRequesting.value = true;
    try {
        const res = await largeScreenApi.getSaleGeneralInfo(params);
        if (res.code === 200 && res.data) {
            dataObj.value = {
                signDays: 0,
                tfNum: 0,
                tfMoney: 0,
                tdNum: 0,
                tdMoney: 0,
                noSignNum: 0,
                noSignMoney: 0,
                collectMoney: 0,
                collectNum: 0,
                outstdMoney: 0,
                outstdNum: 0,
                ...res.data,
            };
        }
    } finally {
        loading.value = false;
        isRequesting.value = false;
    }
};
onMounted(() => {
})

onUnmounted(() => {
})

// 暴露方法给父组件
defineExpose({
    refreshData: fetchData
})
</script>

<style lang="scss" scoped>
.h5-statistics-two-column {
    width: 100%;
    background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(250, 240, 250, 0.95) 100%);
    border-radius: 12rpx;
    padding: 20rpx 20rpx;
    box-sizing: border-box;
    position: relative;
}

/* 头部标题 */
.two-column-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    border-bottom: 1rpx solid rgba(224, 247, 250, 0.4);
    position: relative;
    z-index: 1;

    .header-title {
        font-size: 30rpx;
        font-weight: 700;
        // background: linear-gradient(135deg, #4facfe 0%, #fa709a 100%);
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
}

/* 两列布局 */
.two-column-grid {
    display: flex;
    gap: 32rpx;
}

/* 列组 */
.column-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 24rpx;
    /* 防止溢出 */
    min-width: 0;
}

/* 列项 */
.column-item {
    flex: 1;
    height: 100rpx;
    background: transparent;
    border-radius: 12rpx;
    padding: 12rpx;
    box-sizing: border-box;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.column-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 8rpx;
    height: 100%;
    background: var(--color);
    opacity: 0.8;
    border-radius: 4rpx 0 0 4rpx;
}

/* 文本样式 */
.column-text {
    font-size: 24rpx;
    color: #71808b;
    font-weight: 500;
    margin-bottom: 12rpx;
    line-height: 1.2;
    /* 为左侧装饰线留出空间 */
    padding-left: 8rpx;
}

.column-value {
    font-size: 28rpx;
    font-weight: 700;
    color: var(--color);
    line-height: 1.2;
    padding-left: 8rpx;
    /* 为左侧装饰线留出空间 */
}

/* 动画效果 */
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(-10px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.column-group:first-child .column-item {
    animation: slideIn 0.4s ease-out forwards;
    opacity: 0;
}

.column-group:first-child .column-item:nth-child(1) {
    animation-delay: 0.1s;
}

.column-group:first-child .column-item:nth-child(2) {
    animation-delay: 0.2s;
}

.column-group:first-child .column-item:nth-child(3) {
    animation-delay: 0.3s;
}

.column-group:last-child .column-item {
    animation: slideIn 0.4s ease-out forwards;
    opacity: 0;
}

.column-group:last-child .column-item:nth-child(1) {
    animation-delay: 0.4s;
}

.column-group:last-child .column-item:nth-child(2) {
    animation-delay: 0.5s;
}

.column-group:last-child .column-item:nth-child(3) {
    animation-delay: 0.6s;
}
</style>