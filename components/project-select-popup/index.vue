<!-- 项目选择弹窗 -->
<template>
    <uni-popup class="popup-dialog" ref="projectPopupRef" type="bottom" background-color="#fff"
        border-radius="20rpx 20rpx 0 0" :is-mask-click="false">
        <view class="multi-select-popup">
            <view class="popup-header">
                <view class="search-box">
                    <input class="uni-input" v-model="searchKeyword" confirm-type="search" placeholder="搜索项目名称"
                        @confirm="handleSearch" @input="handleSearch" />
                    <uni-icons v-if="searchKeyword" type="clear" size="18" color="#999" @click="clearSearch"
                        class="clear-icon" />
                </view>
                <view class="select-info">
                    <!-- 使用label包裹整个全选区域，并绑定change事件 -->
                    <label class="select-all" @click="toggleSelectAll">
                        <checkbox :checked="isFilteredAllSelected" style="transform:scale(0.8)"
                            @click.stop="toggleSelectAll" />
                        <text class="select-all-text">{{ isFilteredAllSelected ? '取消全选' : '全选' }}
                            <!-- 如果是搜索结果，添加提示 -->
                            <text v-if="searchKeyword" style="font-size: 24rpx; color: #666;">
                                (当前搜索结果)
                            </text>
                        </text>
                    </label>
                    <text class="selected-count">已选择 {{ selectedCount }} 个项目</text>
                </view>
            </view>

            <view class="options-list">
                <label class="option-item" v-for="item in filteredProjectList" :key="item.id" @click="toggleItem(item)">
                    <!-- 给checkbox添加change事件，确保点击复选框也能触发 -->
                    <checkbox :value="String(item.id)" :checked="item.checked" style="transform:scale(0.8)"
                        @click.stop="toggleItem(item)" />
                    <view class="option-content">
                        <text class="proj-name">{{ item.projName }}</text>
                    </view>
                </label>

                <!-- 无数据提示 -->
                <view v-if="filteredProjectList.length === 0" class="empty-tips">
                    <text>未找到相关项目</text>
                </view>

                <!-- 加载更多 -->
                <view v-if="filteredProjectList.length > 0" class="load-more">
                    <text>已显示全部项目</text>
                </view>
            </view>

            <view class="popup-footer">
                <button class="cancel-btn" @click="handleCancel">取消</button>
                <button class="confirm-btn" @click="handleConfirm">确定({{ selectedCount }})</button>
            </view>
        </view>
    </uni-popup>
</template>

<script setup>
import UniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup.vue'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const emit = defineEmits(['confirm', 'update:modelValue'])

// 定义props
const props = defineProps({
    // 项目数据
    projectList: {
        type: Array,
        default: () => []
    },
    // 已选中的项目ID数组
    selectedIds: {
        type: Array,
        default: () => []
    },
})
// ref
const projectPopupRef = ref(null)
const projectList = ref([])
const searchKeyword = ref('')

// 过滤后的项目列表
const filteredProjectList = computed(() => {
    if (!searchKeyword.value.trim()) {
        return projectList.value
    }

    const keyword = searchKeyword.value.trim().toLowerCase()
    return projectList.value.filter(item =>
        item.projName.toLowerCase().includes(keyword)
    )
})
// 选中的项目数量-所有项目
const selectedCount = computed(() => {
    return projectList.value.filter(item => item.checked).length
})
// 是否全选-所有项目
const isAllSelected = computed(() => {
    if (projectList.value.length === 0) return false
    return projectList.value.every(item => item.checked)
})
// 是否搜索列表全选
const isFilteredAllSelected = computed(() => {
    if (filteredProjectList.value.length === 0) return false
    return filteredProjectList.value.every(item => item.checked)
})
// 初始化/更新项目列表
const initProjectList = () => {
    const sourceProjects = props.projectList || []
    projectList.value = sourceProjects.map(item => ({
        ...item,
        checked: props.selectedIds.includes(item.id)
    }))
}

// 监听projects变化（数据源变化时重新初始化）
watch(
    () => props.projectList,
    () => {
        initProjectList()
    },
    { deep: true }
)
// 监听selectedIds变化（选中状态变化时更新）
watch(
    () => props.selectedIds,
    (newIds) => {
        projectList.value.forEach(item => {
            item.checked = newIds.includes(item.id)
        })
    },
    { immediate: true }
)

// 处理搜索
const handleSearch = () => {
    // 搜索时重置滚动位置
}
// 清空搜索
const clearSearch = () => {
    searchKeyword.value = ''
}

// 修改3：切换全选 - 使用事件参数来防止重复触发
const toggleSelectAll = (event) => {
    // 防止事件冒泡导致重复触发
    if (event) {
        event.stopPropagation()
    }
    const shouldSelectAll = !isFilteredAllSelected.value
    // 只更新当前可见的搜索结果
    const visibleIds = filteredProjectList.value.map(item => item.id)
    projectList.value.forEach(item => {
        if (visibleIds.includes(item.id)) {
            item.checked = shouldSelectAll
        }
    })
}

// 切换单个项目 - 添加事件处理和更新锁
const toggleItem = (item, event) => {
    // 防止事件冒泡
    if (event) {
        event.stopPropagation()
    }
    // 直接切换状态
    item.checked = !item.checked
}

// 取消选择
const handleCancel = () => {
    // 恢复原始选中状态
    initProjectList()
    closePopup()
}

// 确认选择
const handleConfirm = () => {
    if (selectedCount.value == 0) {
        uni.showToast({
            title: '至少选择一个项目',
            icon: 'none'
        })
        return
    }
    const selectedIds = projectList.value.filter(item => item.checked).map((vi) => vi.id)
    console.log('已选中的项目ID:', selectedIds)
    // 触发事件给父组件
    emit('confirm', selectedIds)
    closePopup()
}

// 打开弹窗
const openPopup = () => {
    initProjectList() // 初始化数据
    searchKeyword.value = '' // 清空搜索
    if (projectPopupRef.value) {
        projectPopupRef.value.open()
    }
}

// 关闭弹窗
const closePopup = () => {
    if (projectPopupRef.value) {
        projectPopupRef.value.close()
    }
    // 重置搜索状态
    searchKeyword.value = ''
}

// 生命周期
onMounted(() => { })

onUnmounted(() => { })

// 暴露方法给父组件
defineExpose({
    openPopup,
    closePopup
})
</script>

<style lang="scss" scoped>
.popup-dialog {
    .multi-select-popup {
        width: 100%;
        height: 70vh;
        display: flex;
        flex-direction: column;
        background-color: #fff;
    }

    .popup-header {
        padding: 24rpx 32rpx 0;
        border-bottom: 2rpx solid #f5f5f5;
        background-color: #fff;
    }

    .search-box {
        position: relative;

        .uni-input {
            height: 72rpx;
            padding: 0 20rpx;
            border: 1rpx solid #e0e0e0;
            border-radius: 32rpx;
            font-size: 28rpx;
            background-color: #f8f8f8;
        }

        .clear-icon {
            position: absolute;
            right: 24rpx;
            top: 50%;
            transform: translateY(-50%);
            padding: 8rpx;
            background-color: #f0f0f0;
            border-radius: 50%;
        }
    }

    .select-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16rpx 0;

        .select-all {
            display: flex;
            align-items: center;

            .select-all-text {
                margin-left: 8rpx;
                font-size: 28rpx;
                color: #333;
            }
        }

        .selected-count {
            font-size: 24rpx;
            color: #666;
        }
    }

    .options-list {
        flex: 1;
        padding: 0 32rpx;
        box-sizing: border-box;
        overflow-y: auto;

        .option-item {
            display: flex;
            align-items: center;
            padding: 12rpx 0;
            border-bottom: 2rpx solid #f5f5f5;

            &:last-child {
                border-bottom: none;
            }

            .option-content {
                flex: 1;
                margin-left: 20rpx;
                display: flex;
                flex-direction: column;
            }

            .proj-name {
                font-size: 30rpx;
                color: #333;
            }
        }

        .empty-tips {
            text-align: center;
            padding: 100rpx 0;
            color: #999;
            font-size: 28rpx;
        }

        .load-more {
            text-align: center;
            padding: 20rpx 0;
            color: #999;
            font-size: 24rpx;
        }
    }

    .popup-footer {
        display: flex;
        padding: 24rpx 32rpx;
        border-top: 2rpx solid #f5f5f5;
        background-color: #fff;

        .cancel-btn {
            flex: 1;
            margin-right: 16rpx;
            height: 80rpx;
            line-height: 80rpx;
            border: 1rpx solid #e0e0e0;
            border-radius: 40rpx;
            background-color: #fff;
            color: #333;
            font-size: 30rpx;
        }

        .confirm-btn {
            flex: 1;
            height: 80rpx;
            line-height: 80rpx;
            border-radius: 40rpx;
            background: linear-gradient(135deg, #409eff 0%, #626aef 100%);
            color: #fff;
            font-size: 30rpx;
        }
    }
}
</style>