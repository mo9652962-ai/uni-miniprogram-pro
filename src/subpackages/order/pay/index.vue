<template>
  <view class="page">
    <!-- 1. 会员状态卡片 -->
    <view class="vip-card" :class="{ 'is-vip': userStore.userInfo.isVip }">
      <view class="vip-top">
        <view class="vip-icon-wrap">
          <wd-icon name="star-filled" size="24px" :color="userStore.userInfo.isVip ? '#ffd700' : '#8c8c8c'" />
        </view>
        <view class="vip-title-box">
          <text class="vip-status-title">
            {{ userStore.userInfo.isVip ? 'Pro 尊享会员' : '标准学习者' }}
          </text>
          <text class="vip-status-sub">
            {{ userStore.userInfo.isVip ? `有效期限至：${userStore.userInfo.vipExpireDate}` : '升级会员解锁题库全解析与答题报告' }}
          </text>
        </view>
      </view>
    </view>

    <!-- 2. 全局骨架屏加载与商品选购区 -->
    <view class="section">
      <view class="section-head">
        <text class="section-title">会员权益升级方案</text>
        <text class="section-sub">即时生效 · 随时退款</text>
      </view>

      <SkeletonLoader :loading="pageLoading" type="card">
        <view class="goods-grid">
          <view
            v-for="item in goodsList"
            :key="item.id"
            class="goods-card"
            :class="{ 'is-active': selectedGoods?.id === item.id }"
            @click="selectGoods(item)"
          >
            <view v-if="item.badge" class="badge">{{ item.badge }}</view>
            <text class="goods-title">{{ item.title }}</text>
            <view class="price-box">
              <text class="currency">¥</text>
              <text class="price">{{ item.price }}</text>
              <text v-if="item.originalPrice" class="origin-price">¥{{ item.originalPrice }}</text>
            </view>
            <text class="goods-desc">{{ item.desc }}</text>
          </view>
        </view>
      </SkeletonLoader>
    </view>

    <!-- 3. 微信支付说明卡片 -->
    <view class="notice-card">
      <view class="notice-item">
        <wd-icon name="check-circle-filled" size="14px" color="#34c759" />
        <text>微信支付 V3 原生加密</text>
      </view>
      <view class="notice-item">
        <wd-icon name="check-circle-filled" size="14px" color="#34c759" />
        <text>服务端 Webhook 异步防重入账</text>
      </view>
      <view class="notice-item">
        <wd-icon name="check-circle-filled" size="14px" color="#34c759" />
        <text>极速退款状态机保护</text>
      </view>
    </view>

    <!-- 4. 订单历史与退款演示 -->
    <view class="section">
      <view class="section-head">
        <text class="section-title">购买记录与售后</text>
        <text class="refresh-btn" @click="refreshOrders">刷新</text>
      </view>

      <view v-if="orders.length === 0" class="empty-orders">
        <text class="empty-text">暂无购买记录</text>
      </view>

      <view v-else class="order-list">
        <view v-for="ord in orders" :key="ord.orderId" class="order-item">
          <view class="order-head">
            <text class="order-title">{{ ord.title }}</text>
            <view class="order-badge" :class="statusClass(ord.status)">
              {{ statusText(ord.status) }}
            </view>
          </view>
          <view class="order-info">
            <text class="order-no">订单号: {{ ord.outTradeNo }}</text>
            <text class="order-time">{{ formatTime(ord.createTime) }}</text>
          </view>
          <view class="order-foot">
            <text class="order-amount">实付: ¥{{ ord.amount }}</text>
            <wd-button
              v-if="ord.status === 'PAID'"
              size="small"
              plain
              type="error"
              :loading="refundLoading"
              @click="handleRefund(ord)"
            >
              申请退款
            </wd-button>
          </view>
        </view>
      </view>
    </view>

    <!-- 5. 底部支付吸底行动条 -->
    <view class="footer-bar">
      <view class="footer-left">
        <text class="footer-label">应付金额：</text>
        <text class="footer-currency">¥</text>
        <text class="footer-price">{{ selectedGoods?.price || '0.00' }}</text>
      </view>
      <wd-button
        type="primary"
        class="pay-submit-btn"
        :loading="paying"
        :disabled="!selectedGoods || paying"
        @click="handlePay"
      >
        立即支付升级
      </wd-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import {
  COMMERCIAL_GOODS,
  apiCreateOrder,
  callUniRequestPayment,
  apiPollOrderStatus,
  apiApplyRefund,
  getOrderHistory,
  type PayGoodsItem,
  type OrderDetail,
  type OrderStatus
} from '@/services/pay'

const userStore = useUserStore()
const pageLoading = ref(true)
const paying = ref(false)
const refundLoading = ref(false)

const goodsList = ref<PayGoodsItem[]>(COMMERCIAL_GOODS)
const selectedGoods = ref<PayGoodsItem | null>(COMMERCIAL_GOODS[1]) // 默认选中年度会员
const orders = ref<OrderDetail[]>([])

onMounted(() => {
  // 模拟骨架屏加载动画
  setTimeout(() => {
    pageLoading.value = false
    refreshOrders()
  }, 400)
})

const selectGoods = (item: PayGoodsItem) => {
  selectedGoods.value = item
}

const refreshOrders = () => {
  orders.value = getOrderHistory()
}

/** 阶段 3 微信支付 V3 全链路执行 */
const handlePay = async () => {
  if (!selectedGoods.value) return

  paying.value = true
  uni.showLoading({ title: '创建订单中...', mask: true })

  try {
    // 步骤 1: 统一下单获取预支付凭证
    const orderRes = await apiCreateOrder(selectedGoods.value)
    console.log('📦 [Step 1] 统一下单完成, 商户单号:', orderRes.outTradeNo)

    uni.hideLoading()

    // 步骤 2: 调起微信支付收银台
    const payResult = await callUniRequestPayment(orderRes.payParams)
    if (!payResult.success) {
      uni.showToast({ title: payResult.errMsg || '支付已取消', icon: 'none' })
      return
    }

    // 步骤 3: 核心安全红线——向服务端轮询确认入账
    uni.showLoading({ title: '确认入账中...', mask: true })
    const paidOrder = await apiPollOrderStatus(orderRes.outTradeNo)
    console.log('🎉 [Step 3] 订单状态服务端确认成功:', paidOrder)

    uni.showToast({ title: '会员开通成功！', icon: 'success' })
    refreshOrders()
  } catch (err: any) {
    console.error('支付流程异常:', err)
    uni.showToast({ title: err?.message || '支付失败，请重试', icon: 'none' })
  } finally {
    uni.hideLoading()
    paying.value = false
  }
}

/** 申请退款 */
const handleRefund = (ord: OrderDetail) => {
  uni.showModal({
    title: '申请退款确认',
    content: `确认对订单 [${ord.outTradeNo}] 发起退款吗？退款后相应会员权限将同步收回。`,
    confirmColor: '#f5222d',
    success: async (res) => {
      if (res.confirm) {
        refundLoading.value = true
        try {
          await apiApplyRefund(ord.outTradeNo, '学习计划调整')
          uni.showToast({ title: '退款成功已原路返回', icon: 'success' })
          refreshOrders()
        } catch (e: any) {
          uni.showToast({ title: e?.message || '退款失败', icon: 'none' })
        } finally {
          refundLoading.value = false
        }
      }
    }
  })
}

const statusText = (s: OrderStatus) => {
  switch (s) {
    case 'PAID':
      return '已完成'
    case 'PENDING':
      return '待支付'
    case 'REFUNDED':
      return '已退款'
    case 'REFUNDING':
      return '退款中'
    case 'CLOSED':
      return '已关闭'
    default:
      return s
  }
}

const statusClass = (s: OrderStatus) => {
  switch (s) {
    case 'PAID':
      return 'status-paid'
    case 'PENDING':
      return 'status-pending'
    case 'REFUNDED':
      return 'status-refunded'
    default:
      return ''
  }
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
.page {
  min-height: 100vh;
  padding: 24rpx 24rpx 140rpx;
  background-color: #f7f8fc;
  box-sizing: border-box;
}

.vip-card {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-radius: 24rpx;
  padding: 36rpx;
  color: #fff;
  margin-bottom: 28rpx;
  box-shadow: 0 10rpx 30rpx rgba(26, 32, 44, 0.15);

  &.is-vip {
    background: linear-gradient(135deg, #3d2f14 0%, #1a1608 100%);
    border: 2rpx solid rgba(255, 215, 0, 0.3);
  }

  .vip-top {
    display: flex;
    align-items: center;
    gap: 20rpx;
  }

  .vip-icon-wrap {
    width: 68rpx;
    height: 68rpx;
    border-radius: 34rpx;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vip-status-title {
    font-size: 34rpx;
    font-weight: bold;
    display: block;
    color: #ffd700;
  }

  .vip-status-sub {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 6rpx;
    display: block;
  }
}

.section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;

  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 24rpx;

    .section-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #1a1a1a;
    }

    .section-sub {
      font-size: 24rpx;
      color: #8c8c8c;
    }

    .refresh-btn {
      font-size: 24rpx;
      color: #4d80f0;
    }
  }
}

.goods-grid {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.goods-card {
  position: relative;
  border: 3rpx solid #edf0f5;
  border-radius: 18rpx;
  padding: 28rpx;
  transition: all 0.2s ease;

  &.is-active {
    border-color: #4d80f0;
    background-color: #f6f9ff;
  }

  .badge {
    position: absolute;
    top: 0;
    right: 0;
    background: linear-gradient(90deg, #ff6b6b, #ff4757);
    color: #fff;
    font-size: 20rpx;
    padding: 4rpx 14rpx;
    border-top-right-radius: 16rpx;
    border-bottom-left-radius: 16rpx;
    font-weight: 500;
  }

  .goods-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #222;
  }

  .price-box {
    margin: 12rpx 0;
    display: flex;
    align-items: baseline;

    .currency {
      font-size: 26rpx;
      color: #f5222d;
      font-weight: bold;
    }

    .price {
      font-size: 44rpx;
      color: #f5222d;
      font-weight: 800;
      margin-left: 4rpx;
    }

    .origin-price {
      font-size: 24rpx;
      color: #a0a0a0;
      text-decoration: line-through;
      margin-left: 12rpx;
    }
  }

  .goods-desc {
    font-size: 24rpx;
    color: #666;
    line-height: 1.4;
  }
}

.notice-card {
  background: #f0fdf4;
  border: 1rpx solid #bbf7d0;
  border-radius: 16rpx;
  padding: 20rpx 28rpx;
  display: flex;
  justify-content: space-between;
  margin-bottom: 24rpx;

  .notice-item {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 22rpx;
    color: #166534;
  }
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.order-item {
  background: #fafbfc;
  border-radius: 14rpx;
  padding: 20rpx;

  .order-head {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .order-title {
      font-size: 28rpx;
      font-weight: 600;
      color: #333;
    }

    .order-badge {
      font-size: 20rpx;
      padding: 4rpx 12rpx;
      border-radius: 8rpx;

      &.status-paid {
        background: #e6f7ed;
        color: #34c759;
      }
      &.status-pending {
        background: #fff7e6;
        color: #ff9500;
      }
      &.status-refunded {
        background: #fee2e2;
        color: #ef4444;
      }
    }
  }

  .order-info {
    margin: 10rpx 0;
    display: flex;
    justify-content: space-between;
    font-size: 22rpx;
    color: #8c8c8c;
  }

  .order-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1rpx dashed #e8eaef;
    padding-top: 14rpx;

    .order-amount {
      font-size: 26rpx;
      font-weight: 600;
      color: #1a1a1a;
    }
  }
}

.empty-orders {
  padding: 30rpx 0;
  text-align: center;
  color: #c8c9cc;
  font-size: 24rpx;
}

.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 110rpx;
  background: #ffffff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32rpx;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 99;

  .footer-left {
    display: flex;
    align-items: baseline;

    .footer-label {
      font-size: 26rpx;
      color: #666;
    }

    .footer-currency {
      font-size: 28rpx;
      color: #f5222d;
      font-weight: bold;
    }

    .footer-price {
      font-size: 42rpx;
      color: #f5222d;
      font-weight: 800;
    }
  }

  .pay-submit-btn {
    min-width: 240rpx;
  }
}
</style>
