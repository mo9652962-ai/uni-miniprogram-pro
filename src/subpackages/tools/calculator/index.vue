<template>
  <view class="container">
    <view class="banner">
      <text class="title">🧮 工具分包 (subpackages/tools)</text>
      <text class="subtitle">此页面资源独立打包，进入首页时由 preloadRule 静默预加载</text>
    </view>

    <view class="card">
      <view class="card-title">路由参数接收 (onLoad)</view>
      <text class="param-val">来源标记: {{ sourceTag }}</text>
    </view>

    <view class="card">
      <view class="card-title">独立功能：简易税费 / 报价估算</view>
      <view class="form-row">
        <text class="label">基准金额 (元):</text>
        <input class="input" type="digit" v-model.number="basePrice" placeholder="请输入金额" />
      </view>
      <view class="result-row">
        <text>预估到手 (按 85% 计算):</text>
        <text class="total">¥{{ estimatedNet }}</text>
      </view>
      <wd-button block class="mt-3" @click="goBack">返回主包首页</wd-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const sourceTag = ref('无')
const basePrice = ref<number>(100)

onLoad((options) => {
  if (options && options.source) {
    sourceTag.value = options.source
  }
})

const estimatedNet = computed(() => {
  return (basePrice.value * 0.85).toFixed(2)
})

const goBack = () => {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.container {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.banner {
  background: #34495e;
  padding: 30rpx;
  border-radius: 16rpx;
  color: #fff;

  .title {
    font-size: 32rpx;
    font-weight: bold;
    display: block;
    margin-bottom: 8rpx;
  }

  .subtitle {
    font-size: 22rpx;
    opacity: 0.8;
  }
}

.card {
  background: #fff;
  padding: 28rpx;
  border-radius: 16rpx;

  .card-title {
    font-size: 28rpx;
    font-weight: 600;
    margin-bottom: 16rpx;
  }

  .param-val {
    font-size: 26rpx;
    color: #4d80f0;
  }

  .form-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-top: 16rpx;

    .label {
      font-size: 26rpx;
      color: #555;
    }

    .input {
      flex: 1;
      height: 72rpx;
      border: 1rpx solid #e0e0e0;
      border-radius: 8rpx;
      padding: 0 16rpx;
      font-size: 28rpx;
    }
  }

  .result-row {
    margin-top: 24rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 28rpx;

    .total {
      font-size: 36rpx;
      font-weight: bold;
      color: #ff4d4f;
    }
  }

  .mt-3 {
    margin-top: 24rpx;
  }
}
</style>
