<template>
  <view class="page">
    <view class="head-card">
      <text class="head-title">自定义练习</text>
      <text class="head-sub">选择题目数量和分类，开始针对性训练</text>
    </view>

    <!-- 题量选择 -->
    <view class="block">
      <text class="block-title">题目数量</text>
      <view class="count-grid">
        <view
          v-for="n in countOptions"
          :key="n"
          class="count-item"
          :class="{ 'is-active': count === n }"
          @click="count = n"
        >
          <text class="count-num">{{ n }}</text>
          <text class="count-unit">题</text>
        </view>
      </view>
    </view>

    <!-- 分类选择 -->
    <view class="block">
      <text class="block-title">题目分类</text>
      <view class="tag-grid">
        <view
          v-for="t in tags"
          :key="t"
          class="tag-item"
          :class="{ 'is-active': tag === t }"
          @click="tag = t"
        >
          <text>{{ t }}</text>
        </view>
      </view>
      <text class="tag-hint">当前分类可用题目：{{ availableCount }} 题</text>
    </view>

    <!-- 开始按钮 -->
    <view class="footer">
      <wd-button block type="primary" size="large" :disabled="availableCount === 0" @click="start">
        开始练习（{{ actualCount }} 题）
      </wd-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { getAllTags, QUESTION_BANK } from '@/data/questions'

const countOptions = [5, 10, 15, 20]
const count = ref(10)
const tags = getAllTags()
const tag = ref('全部')

const availableCount = computed(() => {
  if (tag.value === '全部') return QUESTION_BANK.length
  return QUESTION_BANK.filter((q) => q.tag === tag.value).length
})

const actualCount = computed(() => Math.min(count.value, availableCount.value))

const start = () => {
  uni.navigateTo({
    url: `/subpackages/quiz/practice/index?count=${actualCount.value}&tag=${encodeURIComponent(tag.value)}`
  })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  box-sizing: border-box;
}

.head-card {
  background: linear-gradient(135deg, #4d80f0 0%, #2955c8 100%);
  border-radius: 20rpx;
  padding: 36rpx 32rpx;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 10rpx;

  .head-title {
    font-size: 38rpx;
    font-weight: bold;
  }

  .head-sub {
    font-size: 24rpx;
    opacity: 0.85;
  }
}

.block {
  background: #fff;
  border-radius: 18rpx;
  padding: 28rpx;

  .block-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #1a1a1a;
    display: block;
    margin-bottom: 20rpx;
  }
}

.count-grid {
  display: flex;
  gap: 20rpx;

  .count-item {
    flex: 1;
    height: 110rpx;
    border-radius: 14rpx;
    background: #f7f8fa;
    border: 2rpx solid transparent;
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 4rpx;
    transition: all 0.2s;

    .count-num {
      font-size: 40rpx;
      font-weight: bold;
      color: #333;
    }

    .count-unit {
      font-size: 22rpx;
      color: #999;
    }

    &.is-active {
      background: #eef3fe;
      border-color: #4d80f0;

      .count-num {
        color: #4d80f0;
      }

      .count-unit {
        color: #4d80f0;
      }
    }
  }
}

.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;

  .tag-item {
    padding: 16rpx 32rpx;
    border-radius: 40rpx;
    background: #f7f8fa;
    border: 2rpx solid transparent;
    font-size: 26rpx;
    color: #555;
    transition: all 0.2s;

    &.is-active {
      background: #eef3fe;
      border-color: #4d80f0;
      color: #4d80f0;
      font-weight: 500;
    }
  }
}

.tag-hint {
  display: block;
  margin-top: 20rpx;
  font-size: 22rpx;
  color: #a0a0a0;
}

.footer {
  margin-top: auto;
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
