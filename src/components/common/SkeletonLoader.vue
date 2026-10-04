<template>
  <view class="skeleton-container">
    <wd-skeleton
      v-if="loading"
      :theme="theme"
      :row-col="computedRowCol"
      animation="gradient"
    />
    <view v-else class="skeleton-slot-content">
      <slot />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    loading?: boolean
    theme?: 'text' | 'avatar' | 'paragraph' | 'image'
    type?: 'card' | 'profile' | 'list' | 'custom'
    rows?: number
  }>(),
  {
    loading: true,
    theme: 'paragraph',
    type: 'card',
    rows: 3
  }
)

/** 根据业务场景预设的高精度骨架布局 */
const computedRowCol = computed(() => {
  if (props.type === 'profile') {
    return [
      [{ width: '120rpx', height: '120rpx', borderRadius: '60rpx' }],
      [{ width: '240rpx', height: '36rpx' }, { width: '120rpx', height: '36rpx', marginLeft: '20rpx' }],
      [{ width: '100%', height: '140rpx', borderRadius: '16rpx', marginTop: '20rpx' }]
    ]
  }

  if (props.type === 'list') {
    return [
      [{ width: '100%', height: '120rpx', borderRadius: '16rpx' }],
      [{ width: '100%', height: '120rpx', borderRadius: '16rpx', marginTop: '20rpx' }],
      [{ width: '100%', height: '120rpx', borderRadius: '16rpx', marginTop: '20rpx' }]
    ]
  }

  // 默认 card 场景
  return [
    [{ width: '38%', height: '40rpx' }],
    [{ width: '100%', height: '30rpx', marginTop: '16rpx' }],
    [{ width: '80%', height: '30rpx', marginTop: '12rpx' }],
    [{ width: '100%', height: '88rpx', borderRadius: '44rpx', marginTop: '28rpx' }]
  ]
})
</script>

<style lang="scss" scoped>
.skeleton-container {
  width: 100%;
}
.skeleton-slot-content {
  width: 100%;
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
