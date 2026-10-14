<template>
  <view class="page">
    <!-- 汇总条 -->
    <view v-if="records.length > 0" class="summary-card">
      <view class="sum-item">
        <text class="sum-num">{{ records.length }}</text>
        <text class="sum-label">练习次数</text>
      </view>
      <view class="sum-divider"></view>
      <view class="sum-item">
        <text class="sum-num">{{ totalQ }}</text>
        <text class="sum-label">累计题数</text>
      </view>
      <view class="sum-divider"></view>
      <view class="sum-item">
        <text class="sum-num">{{ avgAccuracy }}<text class="unit">%</text></text>
        <text class="sum-label">平均正确率</text>
      </view>
    </view>

    <!-- 记录列表 -->
    <view v-if="displayRecords.length === 0 && !loading" class="empty-box">
      <wd-icon name="browse" size="48px" color="#c8c9cc" />
      <text class="empty-text">暂无练习记录</text>
    </view>

    <view v-else class="record-list">
      <view v-for="rec in displayRecords" :key="rec.id" class="record-item">
        <view class="record-head">
          <view class="record-score" :class="scoreClass(rec)">
            {{ rec.correct }}/{{ rec.total }}
          </view>
          <view class="record-info">
            <text class="record-tag">{{ rec.tag }}</text>
            <text class="record-time">{{ formatTime(rec.timestamp) }}</text>
          </view>
          <text class="record-rate" :class="rateClass(rec)">{{ rate(rec) }}%</text>
        </view>
        <view class="record-foot">
          <text class="record-duration">用时 {{ formatDuration(rec.durationSec) }}</text>
        </view>
      </view>

      <!-- 阶段 2 核心：分页加载状态组件 -->
      <wd-loadmore :state="loadMoreState" finished-text="没有更多记录了" />
    </view>

    <!-- 清空按钮 -->
    <view v-if="records.length > 0" class="footer">
      <wd-button plain type="error" block @click="handleClear">清空全部记录</wd-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useCheckinStore, type PracticeRecord } from '@/store/checkin'

const checkinStore = useCheckinStore()
const records = computed(() => checkinStore.recentRecords)

// 阶段 2 核心：分页状态与触底/下拉联动
const page = ref(1)
const pageSize = 5
const displayRecords = ref<PracticeRecord[]>([])
const loading = ref(false)
const hasMore = ref(true)

const loadMoreState = computed<'loading' | 'finished' | 'error'>(() => {
  if (loading.value) return 'loading'
  if (!hasMore.value) return 'finished'
  return 'loading'
})

const loadData = (reset = false) => {
  if (reset) {
    page.value = 1
    hasMore.value = true
    displayRecords.value = []
  }

  if (loading.value || (!hasMore.value && !reset)) return

  loading.value = true

  // 模拟从云数据库集合分页拉取 (skip + limit)
  setTimeout(() => {
    const all = records.value
    const start = (page.value - 1) * pageSize
    const chunk = all.slice(start, start + pageSize)

    if (reset) {
      displayRecords.value = chunk
    } else {
      displayRecords.value.push(...chunk)
    }

    hasMore.value = displayRecords.value.length < all.length
    loading.value = false
    uni.stopPullDownRefresh()
  }, 250)
}

onLoad(() => {
  loadData(true)
})

onPullDownRefresh(() => {
  console.log('🔄 [onPullDownRefresh] 历史记录下拉刷新')
  loadData(true)
})

onReachBottom(() => {
  console.log('📜 [onReachBottom] 触底加载下一页, 当前页:', page.value)
  if (hasMore.value && !loading.value) {
    page.value++
    loadData(false)
  }
})

const totalQ = computed(() => records.value.reduce((s, r) => s + r.total, 0))

const avgAccuracy = computed(() => {
  const t = records.value.reduce((s, r) => s + r.total, 0)
  if (t === 0) return 0
  const c = records.value.reduce((s, r) => s + r.correct, 0)
  return Math.round((c / t) * 100)
})

const rate = (rec: PracticeRecord) => Math.round((rec.correct / rec.total) * 100)

const scoreClass = (rec: PracticeRecord) => {
  const r = rec.correct / rec.total
  if (r >= 0.8) return 'is-good'
  if (r >= 0.5) return 'is-mid'
  return 'is-bad'
}

const rateClass = (rec: PracticeRecord) => {
  const r = rec.correct / rec.total
  if (r >= 0.8) return 'is-good'
  if (r >= 0.5) return 'is-mid'
  return 'is-bad'
}

const formatTime = (ts: number) => {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${m}-${day} ${hh}:${mm}`
}

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}分${s}秒` : `${s}秒`
}

const handleClear = () => {
  uni.showModal({
    title: '确认清空',
    content: '将删除全部练习记录，此操作不可恢复',
    confirmColor: '#f5222d',
    success: (res) => {
      if (res.confirm) {
        checkinStore.clearAll()
        uni.showToast({ title: '已清空', icon: 'success' })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 28rpx 26rpx 60rpx;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.summary-card {
  box-sizing: border-box;
  background: linear-gradient(135deg, #3d73ee 0%, #204ecf 100%);
  border-radius: 26rpx;
  padding: 38rpx 0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  color: #fff;
  margin-bottom: 34rpx;
  box-shadow: 0 16rpx 40rpx rgba(32, 78, 207, 0.32), 0 4rpx 12rpx rgba(32, 78, 207, 0.15);

  .sum-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;

    .sum-num {
      font-size: 46rpx;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 8rpx;

      .unit {
        font-size: 24rpx;
        font-weight: 600;
      }
    }

    .sum-label {
      font-size: 24rpx;
      opacity: 0.88;
    }
  }

  .sum-divider {
    width: 2rpx;
    height: 52rpx;
    background: rgba(255, 255, 255, 0.28);
  }
}

.empty-box {
  background: #fff;
  border-radius: 24rpx;
  padding: 110rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid rgba(228, 233, 242, 0.85);
  box-shadow: 0 10rpx 28rpx rgba(22, 45, 90, 0.05);

  .empty-text {
    margin-top: 20rpx;
    font-size: 26rpx;
    color: #9aa1af;
  }
}

.record-list {
  display: flex;
  flex-direction: column;
}

.record-item {
  box-sizing: border-box;
  background: #fff;
  border-radius: 22rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  border: 1px solid rgba(228, 233, 242, 0.85);
  box-shadow: 0 8rpx 24rpx rgba(22, 45, 90, 0.06);

  &:last-child {
    margin-bottom: 0;
  }

  .record-head {
    display: flex;
    align-items: center;

    .record-score {
      width: 108rpx;
      height: 64rpx;
      border-radius: 14rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28rpx;
      font-weight: 700;
      background: #f2f3f5;
      color: #666;

      &.is-good {
        background: #eaf9ef;
        color: #34c759;
      }
      &.is-mid {
        background: #fff7e6;
        color: #ff9500;
      }
      &.is-bad {
        background: #fef0ef;
        color: #f5222d;
      }
    }

    .record-info {
      flex: 1;
      margin-left: 24rpx;
      display: flex;
      flex-direction: column;

      .record-tag {
        font-size: 28rpx;
        color: #1a1a1a;
        font-weight: 600;
        margin-bottom: 6rpx;
      }

      .record-time {
        font-size: 22rpx;
        color: #a0a0a0;
      }
    }

    .record-rate {
      font-size: 32rpx;
      font-weight: 600;

      &.is-good {
        color: #34c759;
      }
      &.is-mid {
        color: #ff9500;
      }
      &.is-bad {
        color: #f5222d;
      }
    }
  }

  .record-foot {
    margin-top: 16rpx;
    padding-top: 16rpx;
    border-top: 1px solid #f2f3f5;

    .record-duration {
      font-size: 22rpx;
      color: #8c8c8c;
    }
  }
}

.footer {
  margin-top: auto;
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
