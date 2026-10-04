<template>
  <view class="page">
    <!-- 顶部概览栏 -->
    <view class="header-card">
      <view class="header-left">
        <text class="title">错题专练本</text>
        <text class="subtitle">共收录 {{ wrongList.length }} 道待攻克错题</text>
      </view>
      <wd-button
        v-if="wrongList.length > 0"
        size="small"
        plain
        type="error"
        @click="handleClearAll"
      >
        清空错题
      </wd-button>
    </view>

    <!-- 骨架屏与内容列表 -->
    <SkeletonLoader :loading="loading" type="list">
      <!-- 空状态 -->
      <view v-if="wrongList.length === 0" class="empty-box">
        <wd-icon name="check-circle" size="56px" color="#34c759" />
        <text class="empty-title">太棒了，暂无错题！</text>
        <text class="empty-desc">刷题过程中做错的题目会自动收录在此</text>
        <wd-button type="primary" size="medium" custom-class="go-practice-btn" @click="goPractice">
          去刷题打卡
        </wd-button>
      </view>

      <!-- 错题卡片列表 -->
      <view v-else class="wrong-list">
        <view v-for="(q, idx) in wrongList" :key="q.id" class="wrong-card">
          <view class="card-header">
            <view class="q-badge">错题 {{ idx + 1 }}</view>
            <wd-tag size="small" plain>{{ q.tag }}</wd-tag>
            <view class="remove-action" @click="handleRemove(q.id)">
              <wd-icon name="delete" size="16px" color="#999" />
              <text>标为已掌握</text>
            </view>
          </view>

          <text class="stem-text">{{ q.stem }}</text>

          <!-- 选项预览 -->
          <view class="options-box">
            <view
              v-for="(opt, optIdx) in q.options"
              :key="optIdx"
              class="option-row"
              :class="{ 'is-correct': optIdx === q.answer }"
            >
              <text class="opt-label">{{ String.fromCharCode(65 + optIdx) }}.</text>
              <text class="opt-content">{{ opt }}</text>
              <wd-icon
                v-if="optIdx === q.answer"
                name="check"
                size="16px"
                color="#34c759"
              />
            </view>
          </view>

          <!-- 精讲解析 -->
          <view class="explain-box">
            <view class="explain-head">
              <wd-icon name="bulb" size="14px" color="#ff9500" />
              <text>核心解析</text>
            </view>
            <text class="explain-text">{{ q.explain }}</text>
          </view>
        </view>
      </view>
    </SkeletonLoader>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useCheckinStore } from '@/store/checkin'
import { QUESTION_BANK, type Question } from '@/data/questions'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'

const checkinStore = useCheckinStore()
const loading = ref(true)

// 根据 store 中的 wrongIds 映射题目详情
const wrongList = computed<Question[]>(() => {
  const ids = new Set(checkinStore.wrongIds)
  return QUESTION_BANK.filter((q) => ids.has(q.id))
})

onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 300)
})

onShow(() => {
  // 保持最新状态
})

const handleRemove = (id: string) => {
  uni.showModal({
    title: '标为已掌握',
    content: '确认已掌握此题并移出错题本吗？',
    success: (res) => {
      if (res.confirm) {
        checkinStore.removeWrong(id)
        uni.showToast({ title: '已移出错题本', icon: 'success' })
      }
    }
  })
}

const handleClearAll = () => {
  uni.showModal({
    title: '清空错题本',
    content: '确认清空所有错题记录吗？',
    confirmColor: '#f5222d',
    success: (res) => {
      if (res.confirm) {
        checkinStore.clearAllWrong()
        uni.showToast({ title: '已清空', icon: 'success' })
      }
    }
  })
}

const goPractice = () => {
  uni.navigateTo({
    url: '/subpackages/quiz/setup/index'
  })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 24rpx;
  background-color: #f7f8fc;
  box-sizing: border-box;
}

.header-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx 32rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;

  .title {
    font-size: 34rpx;
    font-weight: bold;
    color: #1a1a1a;
    display: block;
  }

  .subtitle {
    font-size: 24rpx;
    color: #8c8c8c;
    margin-top: 6rpx;
    display: block;
  }
}

.empty-box {
  padding: 120rpx 40rpx;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;

  .empty-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    margin-top: 24rpx;
  }

  .empty-desc {
    font-size: 24rpx;
    color: #999;
    margin-top: 10rpx;
    margin-bottom: 40rpx;
  }

  .go-practice-btn {
    min-width: 240rpx;
  }
}

.wrong-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.wrong-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);

  .card-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 20rpx;

    .q-badge {
      background: #fee2e2;
      color: #ef4444;
      font-size: 22rpx;
      padding: 4rpx 12rpx;
      border-radius: 8rpx;
      font-weight: bold;
    }

    .remove-action {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 6rpx;
      font-size: 22rpx;
      color: #999;
    }
  }

  .stem-text {
    font-size: 30rpx;
    font-weight: 500;
    color: #222;
    line-height: 1.5;
    margin-bottom: 24rpx;
    display: block;
  }

  .options-box {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    margin-bottom: 20rpx;

    .option-row {
      display: flex;
      align-items: center;
      padding: 16rpx 20rpx;
      background: #f8f9fa;
      border-radius: 12rpx;
      font-size: 26rpx;
      color: #444;

      &.is-correct {
        background: #e6f7ed;
        color: #166534;
        font-weight: 500;
      }

      .opt-label {
        font-weight: bold;
        margin-right: 12rpx;
      }

      .opt-content {
        flex: 1;
      }
    }
  }

  .explain-box {
    background: #fffbe6;
    border: 1rpx solid #ffe58f;
    border-radius: 12rpx;
    padding: 20rpx;

    .explain-head {
      display: flex;
      align-items: center;
      gap: 8rpx;
      font-size: 24rpx;
      font-weight: bold;
      color: #d46b08;
      margin-bottom: 8rpx;
    }

    .explain-text {
      font-size: 24rpx;
      color: #873800;
      line-height: 1.5;
    }
  }
}
</style>
