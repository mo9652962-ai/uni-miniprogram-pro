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
  padding: 28rpx 26rpx 60rpx;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.head-card {
  box-sizing: border-box;
  background: linear-gradient(135deg, #3d73ee 0%, #204ecf 100%);
  border-radius: 26rpx;
  padding: 40rpx 32rpx;
  color: #fff;
  display: flex;
  flex-direction: column;
  margin-bottom: 34rpx;
  box-shadow: 0 16rpx 40rpx rgba(32, 78, 207, 0.32), 0 4rpx 12rpx rgba(32, 78, 207, 0.15);

  .head-title {
    font-size: 40rpx;
    font-weight: 800;
    margin-bottom: 10rpx;
    letter-spacing: 0.5rpx;
  }

  .head-sub {
    font-size: 24rpx;
    opacity: 0.88;
  }
}

.block {
  box-sizing: border-box;
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 34rpx;
  border: 1px solid rgba(228, 233, 242, 0.8);
  box-shadow: 0 10rpx 28rpx rgba(22, 45, 90, 0.06);

  .block-title {
    font-size: 30rpx;
    font-weight: 700;
    color: #1a1a1a;
    display: block;
    margin-bottom: 24rpx;
  }
}

.count-grid {
  display: flex;

  .count-item {
    box-sizing: border-box;
    flex: 1;
    height: 116rpx;
    border-radius: 18rpx;
    background: #f7f8fa;
    border: 2rpx solid transparent;
    display: flex;
    align-items: baseline;
    justify-content: center;
    margin-right: 18rpx;
    transition: all 0.2s;

    &:last-child {
      margin-right: 0;
    }

    .count-num {
      font-size: 42rpx;
      font-weight: 800;
      color: #333;
      margin-right: 4rpx;
    }

    .count-unit {
      font-size: 24rpx;
      color: #999;
      font-weight: 500;
    }

    &.is-active {
      background: #eef3fe;
      border-color: #3d73ee;

      .count-num {
        color: #3d73ee;
      }

      .count-unit {
        color: #3d73ee;
      }
    }
  }
}

.tag-grid {
  display: flex;
  flex-wrap: wrap;

  .tag-item {
    box-sizing: border-box;
    padding: 16rpx 32rpx;
    border-radius: 40rpx;
    background: #f7f8fa;
    border: 2rpx solid transparent;
    font-size: 26rpx;
    color: #555;
    margin-right: 18rpx;
    margin-bottom: 18rpx;
    transition: all 0.2s;

    &.is-active {
      background: #eef3fe;
      border-color: #3d73ee;
      color: #3d73ee;
      font-weight: 600;
    }
  }
}

.tag-hint {
  display: block;
  margin-top: 10rpx;
  font-size: 23rpx;
  color: #9aa1af;
}

.footer {
  margin-top: auto;
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
