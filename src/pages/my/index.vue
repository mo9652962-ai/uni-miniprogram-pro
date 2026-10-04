<template>
  <view class="page">
    <!-- 个人卡片 -->
    <view class="profile-card">
      <image class="avatar" :src="userStore.userInfo.avatarUrl" mode="aspectFill" />
      <view class="profile-info">
        <text class="nickname">{{ userStore.userInfo.nickName }}</text>
        <view class="status-tag" :class="{ 'is-login': userStore.isLogin }">
          {{ userStore.isLogin ? '已登录' : '游客模式' }}
        </view>
      </view>
    </view>

    <!-- 学习数据 -->
    <view class="stat-card">
      <view class="stat-item">
        <text class="stat-num">{{ checkinStore.streakDays }}</text>
        <text class="stat-label">连续打卡</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">{{ checkinStore.totalAnswered }}</text>
        <text class="stat-label">累计答题</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">{{ checkinStore.accuracy }}<text class="unit">%</text></text>
        <text class="stat-label">正确率</text>
      </view>
    </view>

    <!-- 功能列表 -->
    <view class="menu-card">
      <view class="menu-item" @click="goHistory">
        <view class="menu-left">
          <wd-icon name="clock" size="20px" color="#4d80f0" />
          <text class="menu-title">练习记录</text>
        </view>
        <view class="menu-right">
          <text class="menu-value">{{ checkinStore.records.length }} 条</text>
          <wd-icon name="chevron-right" size="16px" color="#c8c9cc" />
        </view>
      </view>

      <view class="menu-item" @click="goWrongBook">
        <view class="menu-left">
          <wd-icon name="error-circle-filled" size="20px" color="#ef4444" />
          <text class="menu-title">错题专练本</text>
        </view>
        <view class="menu-right">
          <text class="menu-value" :style="{ color: checkinStore.wrongCount > 0 ? '#ef4444' : '#8c8c8c' }">
            {{ checkinStore.wrongCount }} 题
          </text>
          <wd-icon name="chevron-right" size="16px" color="#c8c9cc" />
        </view>
      </view>

      <!-- 阶段 3 商业实战：微信支付收银台入口 -->
      <view class="menu-item" @click="goVipPay">
        <view class="menu-left">
          <wd-icon name="star-filled" size="20px" color="#ffd700" />
          <text class="menu-title">会员中心 / 微信支付</text>
        </view>
        <view class="menu-right">
          <text class="menu-value" style="color: #f5222d; font-weight: bold;">
            {{ userStore.userInfo.isVip ? '已激活' : '立减特惠' }}
          </text>
          <wd-icon name="chevron-right" size="16px" color="#c8c9cc" />
        </view>
      </view>

      <view class="menu-item" @click="goCalculator">
        <view class="menu-left">
          <wd-icon name="chart" size="20px" color="#ff9500" />
          <text class="menu-title">报价估算工具</text>
        </view>
        <view class="menu-right">
          <wd-icon name="chevron-right" size="16px" color="#c8c9cc" />
        </view>
      </view>

      <view class="menu-item" @click="handleLogin">
        <view class="menu-left">
          <wd-icon name="user" size="20px" color="#34c759" />
          <text class="menu-title">{{ userStore.isLogin ? '退出登录' : '微信登录' }}</text>
        </view>
        <view class="menu-right">
          <wd-icon name="chevron-right" size="16px" color="#c8c9cc" />
        </view>
      </view>
    </view>

    <!-- 缓存诊断（阶段 1 教学点：本地存储可视化） -->
    <view class="debug-card">
      <view class="debug-head">
        <text class="debug-title">本地缓存诊断</text>
        <text class="debug-refresh" @click="refreshStorage">刷新</text>
      </view>
      <view class="debug-row">
        <text class="debug-key">practice_records</text>
        <text class="debug-val">{{ storageSize }} 条记录</text>
      </view>
      <view class="debug-row">
        <text class="debug-key">access_token</text>
        <text class="debug-val">{{ tokenPreview }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { useCheckinStore } from '@/store/checkin'
import { apiLogin } from '@/services/quizApi'

const userStore = useUserStore()
const checkinStore = useCheckinStore()

const storageSize = ref(0)

const tokenPreview = computed(() => {
  const t = userStore.token
  if (!t) return '(空)'
  return t.length > 16 ? `${t.slice(0, 16)}...` : t
})

const refreshStorage = () => {
  // 阶段 1 核心：直接读本地缓存
  const raw = uni.getStorageSync('practice_records')
  try {
    const arr = raw ? JSON.parse(raw) : []
    storageSize.value = arr.length
  } catch {
    storageSize.value = 0
  }
  uni.showToast({ title: '已刷新', icon: 'none' })
}

onShow(() => {
  refreshStorage()
})

const goHistory = () => {
  uni.navigateTo({ url: '/subpackages/quiz/history/index' })
}

const goWrongBook = () => {
  uni.navigateTo({ url: '/subpackages/quiz/wrong/index' })
}

const goVipPay = () => {
  uni.navigateTo({ url: '/subpackages/order/pay/index' })
}

const goCalculator = () => {
  uni.navigateTo({ url: '/subpackages/tools/calculator/index' })
}

const handleLogin = async () => {
  if (userStore.isLogin) {
    userStore.logout()
    return
  }
  // 阶段 2 核心：调用云函数 login 获取 OPENID 并同步用户文档
  try {
    uni.showLoading({ title: '云端登录中...' })
    const res = await apiLogin({
      nickName: 'sora',
      avatarUrl: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
    })
    if (res && res.openid) {
      userStore.setToken(`cloud_${res.openid.slice(0, 12)}`)
      userStore.setUserInfo({
        nickName: res.user?.nickName || 'sora',
        avatarUrl: res.user?.avatarUrl || 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
      })
      uni.showToast({ title: '登录成功', icon: 'success' })
    }
  } catch (err) {
    console.error('云端登录失败:', err)
    uni.showToast({ title: '登录降级', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
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

.profile-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;

  .avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 60rpx;
    background: #f2f3f5;
  }

  .profile-info {
    display: flex;
    flex-direction: column;
    gap: 12rpx;

    .nickname {
      font-size: 34rpx;
      font-weight: 600;
      color: #1a1a1a;
    }

    .status-tag {
      align-self: flex-start;
      font-size: 22rpx;
      padding: 4rpx 16rpx;
      border-radius: 20rpx;
      background: #f2f3f5;
      color: #8c8c8c;

      &.is-login {
        background: #eaf9ef;
        color: #34c759;
      }
    }
  }
}

.stat-card {
  background: linear-gradient(135deg, #4d80f0 0%, #2955c8 100%);
  border-radius: 20rpx;
  padding: 32rpx 0;
  display: flex;
  align-items: center;
  color: #fff;

  .stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;

    .stat-num {
      font-size: 42rpx;
      font-weight: bold;

      .unit {
        font-size: 22rpx;
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

.menu-card {
  background: #fff;
  border-radius: 18rpx;
  overflow: hidden;

  .menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30rpx 28rpx;
    border-bottom: 1rpx solid #f2f3f5;

    &:last-child {
      border-bottom: none;
    }

    .menu-left {
      display: flex;
      align-items: center;
      gap: 18rpx;

      .menu-title {
        font-size: 28rpx;
        color: #333;
      }
    }

    .menu-right {
      display: flex;
      align-items: center;
      gap: 10rpx;

      .menu-value {
        font-size: 24rpx;
        color: #a0a0a0;
      }
    }
  }
}

.debug-card {
  background: #fff;
  border-radius: 18rpx;
  padding: 24rpx 28rpx;

  .debug-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18rpx;

    .debug-title {
      font-size: 26rpx;
      font-weight: 600;
      color: #1a1a1a;
    }

    .debug-refresh {
      font-size: 22rpx;
      color: #4d80f0;
    }
  }

  .debug-row {
    display: flex;
    justify-content: space-between;
    padding: 12rpx 0;
    border-bottom: 1rpx dashed #f0f1f4;

    &:last-child {
      border-bottom: none;
    }

    .debug-key {
      font-size: 23rpx;
      color: #8c8c8c;
      font-family: monospace;
    }

    .debug-val {
      font-size: 23rpx;
      color: #333;
      font-family: monospace;
    }
  }
}
</style>
