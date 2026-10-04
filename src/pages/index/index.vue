<template>
  <view class="container">
    <!-- 顶部渐变卡片：打卡状态 -->
    <view class="hero-card">
      <view class="hero-top">
        <view class="hero-left">
          <text class="hero-greeting">{{ greeting }}</text>
          <text class="hero-date">{{ dateText }}</text>
        </view>
        <view class="hero-badge">
          <wd-icon
            :name="checkinStore.checkedInToday ? 'check-circle-filled' : 'clock'"
            size="18px"
            :color="checkinStore.checkedInToday ? '#34c759' : '#ffb020'"
          />
          <text>{{ checkinStore.checkedInToday ? '今日已打卡' : '今日待打卡' }}</text>
        </view>
      </view>

      <view class="hero-stats">
        <view class="stat-item">
          <text class="stat-num">{{ checkinStore.streakDays }}</text>
          <text class="stat-label">连续天数</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-num">{{ checkinStore.totalAnswered }}</text>
          <text class="stat-label">累计答题</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-num">{{ checkinStore.accuracy }}<text class="stat-unit">%</text></text>
          <text class="stat-label">正确率</text>
        </view>
      </view>
    </view>

    <!-- 主行动区 -->
    <view class="section">
      <view class="section-head">
        <text class="section-title">开始今天的练习</text>
        <text class="section-more" @click="goHistory">历史记录 ›</text>
      </view>

      <view class="quick-grid">
        <view class="quick-item quick-primary" @click="startQuick(5)">
          <wd-icon name="star-filled" size="28px" color="#ffffff" />
          <text class="quick-title">快速练 5 题</text>
          <text class="quick-sub">3 分钟热身</text>
        </view>
        <view class="quick-item" @click="startQuick(10)">
          <wd-icon name="chart" size="28px" color="#4d80f0" />
          <text class="quick-title">标准练 10 题</text>
          <text class="quick-sub">日常巩固</text>
        </view>
        <view class="quick-item" @click="startQuick(16)">
          <wd-icon name="books" size="28px" color="#ff9500" />
          <text class="quick-title">全量练 16 题</text>
          <text class="quick-sub">完整过一轮</text>
        </view>
        <view class="quick-item" @click="goSetup">
          <wd-icon name="setting" size="28px" color="#7a7e83" />
          <text class="quick-title">自定义练习</text>
          <text class="quick-sub">按分类选题</text>
        </view>
      </view>
    </view>

    <!-- 最近记录 -->
    <view class="section">
      <view class="section-head">
        <text class="section-title">最近练习</text>
      </view>

      <view v-if="checkinStore.recentRecords.length === 0" class="empty-box">
        <wd-icon name="browse" size="40px" color="#c8c9cc" />
        <text class="empty-text">还没有练习记录，开始第一题吧</text>
      </view>

      <view v-else class="record-list">
        <view
          v-for="rec in checkinStore.recentRecords.slice(0, 3)"
          :key="rec.id"
          class="record-item"
        >
          <view class="record-left">
            <view class="record-score" :class="scoreClass(rec)">
              {{ rec.correct }}/{{ rec.total }}
            </view>
          </view>
          <view class="record-mid">
            <text class="record-tag">{{ rec.tag }}</text>
            <text class="record-time">{{ formatTime(rec.timestamp) }}</text>
          </view>
          <view class="record-right">
            <text class="record-rate">{{ Math.round((rec.correct / rec.total) * 100) }}%</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { useCheckinStore } from '@/store/checkin'
import type { PracticeRecord } from '@/store/checkin'

const checkinStore = useCheckinStore()

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const dateText = computed(() => {
  const d = new Date()
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${week}`
})

onShow(() => {
  // 阶段 1 核心：页面级生命周期 onShow —— 回到本页时刷新状态
  console.log('📌 [onShow] 首页重新展示，打卡状态已刷新')
})

onPullDownRefresh(() => {
  // 阶段 1 核心：下拉刷新
  setTimeout(() => {
    uni.stopPullDownRefresh()
    uni.showToast({ title: '已刷新', icon: 'none' })
  }, 600)
})

const startQuick = (count: number) => {
  uni.navigateTo({
    url: `/subpackages/quiz/practice/index?count=${count}&tag=${encodeURIComponent('全部')}`
  })
}

const goSetup = () => {
  uni.navigateTo({ url: '/subpackages/quiz/setup/index' })
}

const goHistory = () => {
  uni.navigateTo({ url: '/subpackages/quiz/history/index' })
}

const scoreClass = (rec: PracticeRecord) => {
  const rate = rec.correct / rec.total
  if (rate >= 0.8) return 'is-good'
  if (rate >= 0.5) return 'is-mid'
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
</script>

<style lang="scss" scoped>
.container {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.hero-card {
  background: linear-gradient(135deg, #4d80f0 0%, #2955c8 100%);
  border-radius: 24rpx;
  padding: 36rpx 32rpx 32rpx;
  color: #fff;
  box-shadow: 0 12rpx 32rpx rgba(77, 128, 240, 0.28);

  .hero-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 36rpx;

    .hero-left {
      display: flex;
      flex-direction: column;
      gap: 8rpx;

      .hero-greeting {
        font-size: 40rpx;
        font-weight: bold;
      }

      .hero-date {
        font-size: 22rpx;
        opacity: 0.82;
      }
    }

    .hero-badge {
      display: flex;
      align-items: center;
      gap: 8rpx;
      padding: 10rpx 20rpx;
      border-radius: 30rpx;
      background: rgba(255, 255, 255, 0.18);
      font-size: 22rpx;
    }
  }

  .hero-stats {
    display: flex;
    align-items: center;
    justify-content: space-around;
    background: rgba(255, 255, 255, 0.14);
    border-radius: 16rpx;
    padding: 24rpx 0;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6rpx;
      flex: 1;

      .stat-num {
        font-size: 44rpx;
        font-weight: bold;
        line-height: 1;

        .stat-unit {
          font-size: 24rpx;
        }
      }

      .stat-label {
        font-size: 22rpx;
        opacity: 0.85;
      }
    }

    .stat-divider {
      width: 2rpx;
      height: 48rpx;
      background: rgba(255, 255, 255, 0.24);
    }
  }
}

.section {
  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;

    .section-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #1a1a1a;
    }

    .section-more {
      font-size: 24rpx;
      color: #4d80f0;
    }
  }
}

.quick-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;

  .quick-item {
    width: calc(50% - 10rpx);
    background: #ffffff;
    border-radius: 18rpx;
    padding: 28rpx 24rpx;
    display: flex;
    flex-direction: column;
    gap: 10rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);

    .quick-title {
      font-size: 28rpx;
      font-weight: 600;
      color: #1a1a1a;
    }

    .quick-sub {
      font-size: 22rpx;
      color: #8c8c8c;
    }

    &.quick-primary {
      background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
      box-shadow: 0 8rpx 24rpx rgba(255, 149, 0, 0.3);

      .quick-title {
        color: #fff;
      }

      .quick-sub {
        color: rgba(255, 255, 255, 0.85);
      }
    }
  }
}

.empty-box {
  background: #ffffff;
  border-radius: 18rpx;
  padding: 60rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;

  .empty-text {
    font-size: 24rpx;
    color: #a0a0a0;
  }
}

.record-list {
  background: #ffffff;
  border-radius: 18rpx;
  overflow: hidden;
}

.record-item {
  display: flex;
  align-items: center;
  padding: 26rpx 24rpx;
  border-bottom: 1rpx solid #f2f3f5;

  &:last-child {
    border-bottom: none;
  }

  .record-left {
    .record-score {
      width: 96rpx;
      height: 56rpx;
      border-radius: 12rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24rpx;
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
  }

  .record-mid {
    flex: 1;
    margin-left: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 6rpx;

    .record-tag {
      font-size: 26rpx;
      color: #333;
      font-weight: 500;
    }

    .record-time {
      font-size: 22rpx;
      color: #a0a0a0;
    }
  }

  .record-right {
    .record-rate {
      font-size: 30rpx;
      font-weight: 600;
      color: #4d80f0;
    }
  }
}
</style>
