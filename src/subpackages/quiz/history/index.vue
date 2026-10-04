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
    <view v-if="records.length === 0" class="empty-box">
      <wd-icon name="browse" size="48px" color="#c8c9cc" />
      <text class="empty-text">暂无练习记录</text>
    </view>

    <view v-else class="record-list">
      <view v-for="rec in records" :key="rec.id" class="record-item">
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
    </view>

    <!-- 清空按钮 -->
    <view v-if="records.length > 0" class="footer">
      <wd-button plain type="error" block @click="handleClear">清空全部记录</wd-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCheckinStore, type PracticeRecord } from '@/store/checkin'

const checkinStore = useCheckinStore()
const records = computed(() => checkinStore.recentRecords)

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
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  box-sizing: border-box;
}

.summary-card {
  background: linear-gradient(135deg, #4d80f0 0%, #2955c8 100%);
  border-radius: 20rpx;
  padding: 32rpx 0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  color: #fff;

  .sum-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
    flex: 1;

    .sum-num {
      font-size: 42rpx;
      font-weight: bold;

      .unit {
        font-size: 22rpx;
      }
    }

    .sum-label {
      font-size: 22rpx;
      opacity: 0.85;
    }
  }

  .sum-divider {
    width: 2rpx;
    height: 48rpx;
    background: rgba(255, 255, 255, 0.24);
  }
}

.empty-box {
  background: #fff;
  border-radius: 18rpx;
  padding: 100rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;

  .empty-text {
    font-size: 26rpx;
    color: #a0a0a0;
  }
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.record-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;

  .record-head {
    display: flex;
    align-items: center;

    .record-score {
      width: 104rpx;
      height: 60rpx;
      border-radius: 12rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26rpx;
      font-weight: 600;
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
      gap: 6rpx;

      .record-tag {
        font-size: 27rpx;
        color: #333;
        font-weight: 500;
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
    border-top: 1rpx solid #f2f3f5;

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
