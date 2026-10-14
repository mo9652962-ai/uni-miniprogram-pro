<template>
  <view class="question-card">
    <!-- 题干区 -->
    <view class="stem-row">
      <view class="q-index">{{ index + 1 }}</view>
      <view class="stem-content">
        <text class="stem-text">{{ question.stem }}</text>
        <wd-tag custom-class="stem-tag" plain size="small">{{ question.tag }}</wd-tag>
      </view>
    </view>

    <!-- 选项区 -->
    <view class="options">
      <view
        v-for="(opt, i) in question.options"
        :key="i"
        class="option-item"
        :class="optionClass(i)"
        @click="handleSelect(i)"
      >
        <view class="option-marker">
          <text>{{ String.fromCharCode(65 + i) }}</text>
        </view>
        <text class="option-text">{{ opt }}</text>
        <wd-icon
          v-if="showResult && i === question.answer"
          name="check-circle-filled"
          size="20px"
          color="#34c759"
        />
        <wd-icon
          v-else-if="showResult && i === selected && i !== question.answer"
          name="close-circle-filled"
          size="20px"
          color="#f5222d"
        />
      </view>
    </view>

    <!-- 解析区 -->
    <view v-if="showResult" class="explain-box">
      <view class="explain-title">
        <wd-icon name="chat1" size="16px" color="#4d80f0" />
        <text>答案解析</text>
      </view>
      <text class="explain-text">{{ question.explain }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { Question } from '@/data/questions'

const props = defineProps<{
  question: Question
  index: number
  selected: number
  showResult: boolean
}>()

const emit = defineEmits<{
  (e: 'select', index: number): void
}>()

const handleSelect = (i: number) => {
  if (props.showResult) return
  emit('select', i)
}

const optionClass = (i: number) => {
  if (!props.showResult) {
    return { 'is-selected': props.selected === i }
  }
  if (i === props.question.answer) return { 'is-correct': true }
  if (i === props.selected) return { 'is-wrong': true }
  return {}
}
</script>

<style lang="scss" scoped>
.question-card {
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 36rpx 32rpx;
  border: 1px solid rgba(228, 233, 242, 0.85);
  box-shadow: 0 10rpx 30rpx rgba(22, 45, 90, 0.07), 0 2rpx 6rpx rgba(22, 45, 90, 0.03);
}

.stem-row {
  display: flex;
  margin-bottom: 34rpx;

  .q-index {
    flex-shrink: 0;
    width: 56rpx;
    height: 56rpx;
    border-radius: 28rpx;
    background: linear-gradient(135deg, #3d73ee, #204ecf);
    color: #fff;
    font-size: 26rpx;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 22rpx;
    box-shadow: 0 6rpx 16rpx rgba(32, 78, 207, 0.3);
  }

  .stem-content {
    flex: 1;
    display: flex;
    flex-direction: column;

    .stem-text {
      font-size: 32rpx;
      line-height: 1.6;
      color: #1a1a1a;
      font-weight: 600;
    }
  }
}

.options {
  display: flex;
  flex-direction: column;
}

.option-item {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 28rpx 26rpx;
  border-radius: 18rpx;
  background: #f7f8fa;
  border: 2rpx solid transparent;
  transition: all 0.2s;
  margin-bottom: 22rpx;

  &:last-child {
    margin-bottom: 0;
  }

  .option-marker {
    flex-shrink: 0;
    width: 52rpx;
    height: 52rpx;
    border-radius: 26rpx;
    background: #ffffff;
    border: 2rpx solid #dcdfe6;
    color: #606266;
    font-size: 26rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 22rpx;
  }

  .option-text {
    flex: 1;
    font-size: 29rpx;
    color: #2c3e50;
    line-height: 1.5;
  }

  &.is-selected {
    background: #eef3fe;
    border-color: #3d73ee;

    .option-marker {
      background: #3d73ee;
      border-color: #3d73ee;
      color: #fff;
    }
  }

  &.is-correct {
    background: #eaf9ef;
    border-color: #34c759;

    .option-marker {
      background: #34c759;
      border-color: #34c759;
      color: #fff;
    }
  }

  &.is-wrong {
    background: #fef0ef;
    border-color: #f5222d;

    .option-marker {
      background: #f5222d;
      border-color: #f5222d;
      color: #fff;
    }
  }
}

.explain-box {
  margin-top: 34rpx;
  padding: 28rpx;
  background: #f5f8ff;
  border-radius: 18rpx;
  border-left: 6rpx solid #3d73ee;

  .explain-title {
    display: flex;
    align-items: center;
    font-size: 28rpx;
    font-weight: 700;
    color: #3d73ee;
    margin-bottom: 16rpx;

    text {
      margin-left: 10rpx;
    }
  }

  .explain-text {
    font-size: 26rpx;
    line-height: 1.7;
    color: #555;
  }
}
</style>
