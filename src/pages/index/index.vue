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
        <view class="quick-item" @click="goSearch">
          <wd-icon name="search" size="28px" color="#34c759" />
          <text class="quick-title">题库分类检索</text>
          <text class="quick-sub">搜考点·看全析</text>
        </view>
        <view class="quick-item" @click="goWrongBook">
          <wd-icon name="error-circle-filled" size="28px" color="#ef4444" />
          <text class="quick-title">错题专练本</text>
          <text class="quick-sub">{{ checkinStore.wrongCount > 0 ? `${checkinStore.wrongCount} 题待攻克` : '全部已掌握' }}</text>
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
import { onShow, onPullDownRefresh, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { useCheckinStore } from '@/store/checkin'
import type { PracticeRecord } from '@/store/checkin'
import { apiGetUserStats } from '@/services/quizApi'

// ----------------------------------------------------------------
// 微信小程序原生社交分享卡片配置 (onShareAppMessage + onShareTimeline)
// ----------------------------------------------------------------
onShareAppMessage(() => {
  return {
    title: `我已在「刷题打卡」连续打卡 ${checkinStore.streakDays} 天，一起来挑战嵌入式与电路真题！`,
    path: '/pages/index/index'
  }
})

onShareTimeline(() => {
  return {
    title: `今日刷题打卡 · 嵌入式/电路高频题库，累计答题 ${checkinStore.totalAnswered} 道！`,
    query: ''
  }
})

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

const loadCloudStats = async () => {
  try {
    const stats = await apiGetUserStats()
    if (stats) {
      console.log('☁️ [CloudBase] 同步云端数据成功:', stats)
    }
  } catch (e) {
    console.warn('拉取云端看板异常:', e)
  }
}

onShow(() => {
  console.log('📌 [onShow] 首页重新展示，拉取云端与本地状态')
  loadCloudStats()
})

onPullDownRefresh(async () => {
  // 阶段 2 核心：下拉刷新同步云端
  await loadCloudStats()
  uni.stopPullDownRefresh()
  uni.showToast({ title: '已同步云端', icon: 'none' })
})

const startQuick = (count: number) => {
  uni.navigateTo({
    url: `/subpackages/quiz/practice/index?count=${count}&tag=${encodeURIComponent('全部')}`
  })
}

const goSetup = () => {
  uni.navigateTo({ url: '/subpackages/quiz/setup/index' })
}

const goSearch = () => {
  uni.navigateTo({ url: '/subpackages/quiz/search/index' })
}

const goWrongBook = () => {
  uni.navigateTo({ url: '/subpackages/quiz/wrong/index' })
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
  box-sizing: border-box;
  padding: 28rpx 26rpx 60rpx;
}

.hero-card {
  box-sizing: border-box;
  margin-bottom: 42rpx;
  background: linear-gradient(135deg, #3d73ee 0%, #204ecf 100%);
  border-radius: 28rpx;
  padding: 40rpx 32rpx 36rpx;
  color: #fff;
  box-shadow: 0 16rpx 40rpx rgba(32, 78, 207, 0.35), 0 4rpx 12rpx rgba(32, 78, 207, 0.15);

  .hero-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 40rpx;

    .hero-left {
      display: flex;
      flex-direction: column;

      .hero-greeting {
        font-size: 42rpx;
        font-weight: 800;
        margin-bottom: 10rpx;
        letter-spacing: 0.5rpx;
      }

      .hero-date {
        font-size: 24rpx;
        opacity: 0.85;
      }
    }

    .hero-badge {
      display: flex;
      align-items: center;
      padding: 12rpx 22rpx;
      border-radius: 32rpx;
      background: rgba(255, 255, 255, 0.2);
      font-size: 24rpx;
      font-weight: 500;

      text {
        margin-left: 10rpx;
      }
    }
  }

  .hero-stats {
    display: flex;
    align-items: center;
    justify-content: space-around;
    background: rgba(255, 255, 255, 0.16);
    border-radius: 20rpx;
    padding: 26rpx 0;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;

      .stat-num {
        font-size: 48rpx;
        font-weight: 800;
        line-height: 1;
        margin-bottom: 8rpx;

        .stat-unit {
          font-size: 26rpx;
          font-weight: 600;
        }
      }

      .stat-label {
        font-size: 24rpx;
        opacity: 0.88;
      }
    }

    .stat-divider {
      width: 2rpx;
      height: 52rpx;
      background: rgba(255, 255, 255, 0.28);
    }
  }
}

.section {
  margin-bottom: 44rpx;

  &:last-child {
    margin-bottom: 0;
  }

  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;

    .section-title {
      font-size: 34rpx;
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: 0.5rpx;
    }

    .section-more {
      font-size: 26rpx;
      color: #4d80f0;
      font-weight: 500;
    }
  }
}

.quick-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;

  .quick-item {
    box-sizing: border-box;
    width: calc(50% - 14rpx);
    min-height: 236rpx;
    margin-bottom: 28rpx;
    background: #ffffff;
    border-radius: 24rpx;
    padding: 36rpx 28rpx 32rpx;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    border: 1px solid rgba(228, 233, 242, 0.8);
    box-shadow: 0 10rpx 26rpx rgba(22, 45, 90, 0.08), 0 2rpx 6rpx rgba(22, 45, 90, 0.03);

    .quick-title {
      margin-top: 18rpx;
      margin-bottom: 8rpx;
      font-size: 30rpx;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1.25;
    }

    .quick-sub {
      font-size: 23rpx;
      color: #8c93a0;
      line-height: 1.35;
    }

    &.quick-primary {
      background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
      border: 1px solid rgba(255, 120, 0, 0.35);
      box-shadow: 0 14rpx 36rpx rgba(255, 87, 34, 0.38), 0 4rpx 12rpx rgba(255, 87, 34, 0.18);

      .quick-title {
        color: #fff;
      }

      .quick-sub {
        color: rgba(255, 255, 255, 0.9);
      }
    }
  }
}

.empty-box {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 70rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid rgba(228, 233, 242, 0.8);
  box-shadow: 0 10rpx 26rpx rgba(22, 45, 90, 0.05);

  .empty-text {
    margin-top: 18rpx;
    font-size: 26rpx;
    color: #9aa1af;
  }
}

.record-list {
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  border: 1px solid rgba(228, 233, 242, 0.8);
  box-shadow: 0 10rpx 26rpx rgba(22, 45, 90, 0.06);
}

.record-item {
  display: flex;
  align-items: center;
  padding: 26rpx 24rpx;
  border-bottom: 1px solid #f2f3f5;

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

    .record-tag {
      font-size: 26rpx;
      color: #333;
      font-weight: 500;
      margin-bottom: 6rpx;
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
