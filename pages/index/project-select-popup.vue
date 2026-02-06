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
                    <view class="select-all" @click="toggleSelectAll">
                        <checkbox :checked="isAllSelected" style="transform:scale(0.8)" />
                        <text class="select-all-text">{{ isAllSelected ? '取消全选' : '全选' }}</text>
                    </view>
                    <text class="selected-count">已选择 {{ selectedCount }} 个项目</text>
                </view>
            </view>

            <view class="options-list">
                <checkbox-group @change="handleCheckboxChange">
                    <label class="option-item" v-for="item in filteredProjectList" :key="item.id">
                        <checkbox :value="String(item.id)" :checked="item.checked" style="transform:scale(0.8)"
                            @click="toggleItem(item)" />
                        <view class="option-content">
                            <text class="proj-name">{{ item.projName }}</text>
                        </view>
                    </label>
                </checkbox-group>

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
// 导入 uni-popup 组件
import UniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup.vue'
import { ref, computed, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['confirm', 'update:modelValue'])
// 弹窗引用
const projectPopupRef = ref(null)
const projectList = ref([
    {
        "isDel": false,
        checked: false,
        "id": 1,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·翡翠半岛",
        "xsProjId": 1,
        "sort": 1
    },
    {
        "isDel": false,
        checked: false,
        "id": 2,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·御园",
        "xsProjId": 2,
        "sort": 2
    },
    {
        "isDel": false,
        checked: false,
        "id": 3,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·御景台",
        "xsProjId": 3,
        "sort": 3
    },
    {
        "isDel": false,
        checked: false,
        "id": 4,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·御澜府",
        "xsProjId": 5,
        "sort": 4
    },
    {
        "isDel": false,
        checked: false,
        "id": 5,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·御珑台",
        "xsProjId": 6,
        "sort": 5
    },
    {
        "isDel": false,
        checked: false,
        "id": 6,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·御荣府",
        "xsProjId": 8,
        "sort": 6
    },
    {
        "isDel": false,
        checked: false,
        "id": 7,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·御南台",
        "xsProjId": 9,
        "sort": 7
    },
    {
        "isDel": false,
        checked: false,
        "id": 8,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·公园学府",
        "xsProjId": 10,
        "sort": 8
    },
    {
        "isDel": false,
        checked: false,
        "id": 9,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "胜利·光耀城",
        "xsProjId": 11,
        "sort": 9
    },
    {
        "isDel": false,
        checked: false,
        "id": 10,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·龙城壹号院",
        "xsProjId": 12,
        "sort": 10
    },
    {
        "isDel": false,
        checked: false,
        "id": 11,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "米易·天空之城",
        "xsProjId": 13,
        "sort": 11
    },
    {
        "isDel": false,
        checked: false,
        "id": 12,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·翡翠观澜",
        "xsProjId": 14,
        "sort": 12
    },
    {
        "isDel": false,
        checked: false,
        "id": 13,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·望江名门",
        "xsProjId": 15,
        "sort": 13
    },
    {
        "isDel": false,
        checked: false,
        "id": 14,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·公园里",
        "xsProjId": 16,
        "sort": 14
    },
    {
        "isDel": false,
        checked: false,
        "id": 15,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·江山墅",
        "xsProjId": 17,
        "sort": 15
    },
    {
        "isDel": false,
        checked: false,
        "id": 16,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·紫宸大院",
        "xsProjId": 18,
        "sort": 16
    },
    {
        "isDel": false,
        checked: false,
        "id": 17,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·翰林学府",
        "xsProjId": 19,
        "sort": 17
    },
    {
        "isDel": false,
        checked: false,
        "id": 18,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·玖熙府",
        "xsProjId": 20,
        "sort": 18
    },
    {
        "isDel": false,
        checked: false,
        "id": 19,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·十里江湾",
        "xsProjId": 21,
        "sort": 19
    },
    {
        "isDel": false,
        checked: false,
        "id": 20,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·江山美墅",
        "xsProjId": 22,
        "sort": 20
    },
    {
        "isDel": false,
        checked: false,
        "id": 21,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·奥特莱斯广场",
        "xsProjId": 23,
        "sort": 21
    },
    {
        "isDel": false,
        checked: false,
        "id": 22,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·御南台(三期)",
        "xsProjId": 24,
        "sort": 22
    },
    {
        "isDel": false,
        checked: false,
        "id": 23,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜云璟",
        "xsProjId": 25,
        "sort": 23
    },
    {
        "isDel": false,
        checked: false,
        "id": 24,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·御南台三期卓樾",
        "xsProjId": 26,
        "sort": 24
    },
    {
        "isDel": false,
        checked: false,
        "id": 25,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜云顶",
        "xsProjId": 27,
        "sort": 25
    },
    {
        "isDel": false,
        checked: false,
        "id": 26,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·御南台三期融园",
        "xsProjId": 28,
        "sort": 26
    },
    {
        "isDel": false,
        checked: false,
        "id": 27,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜域峰",
        "xsProjId": 31,
        "sort": 27
    },
    {
        "isDel": false,
        checked: false,
        "id": 28,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "武胜和喜·域峰",
        "xsProjId": 32,
        "sort": 28
    },
    {
        "isDel": false,
        checked: false,
        "id": 29,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "资中和喜·域峰",
        "xsProjId": 36,
        "sort": 29
    },
    {
        "isDel": false,
        checked: false,
        "id": 30,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "和喜·江山云璟",
        "xsProjId": 37,
        "sort": 30
    },
    {
        "isDel": false,
        checked: false,
        "id": 31,
        "pid": 0,
        "mguId": 1,
        "projType": 0,
        "projName": "成都和喜·域峰",
        "xsProjId": 46,
        "sort": 31
    }
]
)

// 搜索关键词
const searchKeyword = ref('')

// 计算属性
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
// 选中的项目数量
const selectedCount = computed(() => {
    return projectList.value.filter(item => item.checked).length
})
// 是否全选
const isAllSelected = computed(() => {
    if (filteredProjectList.value.length === 0) return false
    return filteredProjectList.value.every(item => item.checked)
})

// 方法
// 处理搜索
const handleSearch = () => {
    // 搜索时重置滚动位置
}

// 清空搜索
const clearSearch = () => {
    searchKeyword.value = ''
}

// 切换全选
const toggleSelectAll = () => {
    const allVisibleSelected = isAllSelected.value
    const allVisibleIds = filteredProjectList.value.map(item => item.id)

    // 更新所有可见项目的选中状态
    projectList.value.forEach(item => {
        if (allVisibleIds.includes(item.id)) {
            item.checked = !allVisibleSelected
        }
    })
}

// 处理单个复选框变化
const handleCheckboxChange = (e) => {
    const selectedIds = e.detail.value
    // 更新所有项目的选中状态
    projectList.value.forEach(item => {
        item.checked = selectedIds.includes(item.id.toString())
    })
}

// 切换单个项目选中状态
const toggleItem = (item) => {
    item.checked = !item.checked
}

// 取消选择
const handleCancel = () => {
    closePopup()
}

// 确认选择
const handleConfirm = () => {
    const selectedProjects = projectList.value.filter(item => item.checked)
    console.log('已选中的项目:', selectedProjects)
    // 触发事件给父组件
    emit('confirm', selectedProjects)

    closePopup()
}

// 打开弹窗
const openPopup = () => {
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
        margin-bottom: 24rpx;

        .uni-input {
            height: 72rpx;
            padding: 0 24rpx;
            border: 2rpx solid #e0e0e0;
            border-radius: 36rpx;
            font-size: 28rpx;
            background-color: #f8f8f8;

            &:focus {
                border-color: #007aff;
                background-color: #fff;
            }
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

                .proj-name {
                    font-size: 30rpx;
                    color: #333;
                }
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
            border: 2rpx solid #e0e0e0;
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
            background-color: #007aff;
            color: #fff;
            font-size: 30rpx;

            &:active {
                opacity: 0.8;
            }
        }
    }
}
</style>