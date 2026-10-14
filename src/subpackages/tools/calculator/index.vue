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
  box-sizing: border-box;
  padding: 28rpx 26rpx 60rpx;
  display: flex;
  flex-direction: column;
}

.banner {
  box-sizing: border-box;
  background: linear-gradient(135deg, #2c3e50 0%, #1a252f 100%);
  padding: 34rpx 32rpx;
  border-radius: 24rpx;
  color: #fff;
  margin-bottom: 30rpx;
  box-shadow: 0 12rpx 32rpx rgba(26, 37, 47, 0.25);

  .title {
    font-size: 34rpx;
    font-weight: 800;
    display: block;
    margin-bottom: 10rpx;
    letter-spacing: 0.5rpx;
  }

  .subtitle {
    font-size: 24rpx;
    opacity: 0.85;
  }
}

.card {
  box-sizing: border-box;
  background: #fff;
  padding: 32rpx;
  border-radius: 24rpx;
  margin-bottom: 28rpx;
  border: 1px solid rgba(228, 233, 242, 0.85);
  box-shadow: 0 10rpx 28rpx rgba(22, 45, 90, 0.06);

  .card-title {
    font-size: 30rpx;
    font-weight: 700;
    margin-bottom: 20rpx;
    color: #1a1a1a;
  }

  .param-val {
    font-size: 26rpx;
    color: #3d73ee;
    font-weight: 600;
  }

  .form-row {
    display: flex;
    align-items: center;
    margin-top: 20rpx;

    .label {
      font-size: 28rpx;
      color: #4a5568;
      width: 140rpx;
      flex-shrink: 0;
    }

    .input {
      flex: 1;
      height: 76rpx;
      border: 1px solid #e2e8f0;
      border-radius: 12rpx;
      padding: 0 20rpx;
      font-size: 28rpx;
      background: #fafbfc;
    }
  }

  .result-row {
    margin-top: 28rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 28rpx;
    padding-top: 20rpx;
    border-top: 1px dashed #edf0f5;

    .total {
      font-size: 40rpx;
      font-weight: 800;
      color: #ff4d4f;
    }
  }

  .mt-3 {
    margin-top: 28rpx;
  }
}
</style>
