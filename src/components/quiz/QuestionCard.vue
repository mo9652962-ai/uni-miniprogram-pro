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
  background: #ffffff;
  border-radius: 20rpx;
  padding: 32rpx;
}

.stem-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 32rpx;

  .q-index {
    flex-shrink: 0;
    width: 52rpx;
    height: 52rpx;
    border-radius: 26rpx;
    background: linear-gradient(135deg, #4d80f0, #2955c8);
    color: #fff;
    font-size: 26rpx;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stem-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12rpx;

    .stem-text {
      font-size: 30rpx;
      line-height: 1.6;
      color: #1a1a1a;
      font-weight: 500;
    }
  }
}

.options {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 26rpx 24rpx;
  border-radius: 14rpx;
  background: #f7f8fa;
  border: 2rpx solid transparent;
  transition: all 0.2s;

  .option-marker {
    flex-shrink: 0;
    width: 48rpx;
    height: 48rpx;
    border-radius: 24rpx;
    background: #ffffff;
    border: 2rpx solid #dcdfe6;
    color: #606266;
    font-size: 26rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .option-text {
    flex: 1;
    font-size: 28rpx;
    color: #333;
    line-height: 1.5;
  }

  &.is-selected {
    background: #eef3fe;
    border-color: #4d80f0;

    .option-marker {
      background: #4d80f0;
      border-color: #4d80f0;
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
  margin-top: 32rpx;
  padding: 24rpx;
  background: #f5f8ff;
  border-radius: 14rpx;
  border-left: 6rpx solid #4d80f0;

  .explain-title {
    display: flex;
    align-items: center;
    gap: 10rpx;
    font-size: 26rpx;
    font-weight: 600;
    color: #4d80f0;
    margin-bottom: 14rpx;
  }

  .explain-text {
    font-size: 26rpx;
    line-height: 1.7;
    color: #555;
  }
}
</style>
