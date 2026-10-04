<template>
  <view class="page">
    <!-- 成绩环形展示 -->
    <view class="score-card">
      <view class="circle-wrap">
        <wd-circle
          :model-value="accuracy"
          :size="200"
          :stroke-width="14"
          :color="circleColor"
          layer-color="#eef1f6"
        >
          <view class="circle-inner">
            <text class="circle-num">{{ accuracy }}</text>
            <text class="circle-unit">分</text>
          </view>
        </wd-circle>
      </view>

      <text class="score-comment">{{ comment }}</text>

      <view class="score-meta">
        <view class="meta-item">
          <text class="meta-num">{{ correct }}/{{ total }}</text>
          <text class="meta-label">答对题数</text>
        </view>
        <view class="meta-divider"></view>
        <view class="meta-item">
          <text class="meta-num">{{ durationText }}</text>
          <text class="meta-label">用时</text>
        </view>
        <view class="meta-divider"></view>
        <view class="meta-item">
          <text class="meta-num">{{ avgText }}</text>
          <text class="meta-label">平均每题</text>
        </view>
      </view>
    </view>

    <!-- 错题回顾 -->
    <view class="block">
      <view class="block-head">
        <text class="block-title">答题详情</text>
        <text class="block-sub">错题 {{ wrongList.length }} 道</text>
      </view>

      <view v-if="wrongList.length === 0" class="all-right">
        <wd-icon name="check-circle-filled" size="36px" color="#34c759" />
        <text class="all-right-text">全部答对，太棒了！</text>
      </view>

      <view v-else class="wrong-list">
        <view v-for="(item, i) in wrongList" :key="item.id" class="wrong-item">
          <view class="wrong-stem">
            <text class="wrong-index">{{ i + 1 }}</text>
            <text class="wrong-text">{{ item.stem }}</text>
          </view>
          <view class="wrong-answers">
            <view class="answer-row">
              <text class="answer-label">你的答案</text>
              <text class="answer-value is-wrong">{{ item.userAnswerText }}</text>
            </view>
            <view class="answer-row">
              <text class="answer-label">正确答案</text>
              <text class="answer-value is-correct">{{ item.answerText }}</text>
            </view>
          </view>
          <view class="wrong-explain">
            <text class="explain-label">解析</text>
            <text class="explain-text">{{ item.explain }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="footer">
      <wd-button plain @click="goHome">返回首页</wd-button>
      <wd-button block type="primary" @click="retry">再练一次</wd-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

interface DetailQuestion {
  id: string
  stem: string
  answer: number
  userAnswer: number
  explain: string
}

interface DetailData {
  correct: number
  total: number
  durationSec: number
  tag: string
  questions: DetailQuestion[]
}

const detail = ref<DetailData | null>(null)

onLoad((options) => {
  if (options?.detail) {
    try {
      detail.value = JSON.parse(decodeURIComponent(options.detail))
    } catch (e) {
      console.error('解析结果数据失败', e)
    }
  }
})

const correct = computed(() => detail.value?.correct ?? 0)
const total = computed(() => detail.value?.total ?? 0)
const accuracy = computed(() => (total.value === 0 ? 0 : Math.round((correct.value / total.value) * 100)))

const circleColor = computed(() => {
  if (accuracy.value >= 80) return '#34c759'
  if (accuracy.value >= 60) return '#4d80f0'
  return '#f5222d'
})

const comment = computed(() => {
  if (accuracy.value === 100) return '完美通关，稳！'
  if (accuracy.value >= 80) return '掌握扎实，保持节奏'
  if (accuracy.value >= 60) return '基础可以，错题再巩固'
  return '薄弱点明显，建议复盘错题'
})

const durationText = computed(() => {
  const s = detail.value?.durationSec ?? 0
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}分${sec}秒` : `${sec}秒`
})

const avgText = computed(() => {
  if (!detail.value || total.value === 0) return '-'
  return `${Math.round(detail.value.durationSec / total.value)}秒`
})

const letter = (i: number) => String.fromCharCode(65 + i)

const wrongList = computed(() => {
  if (!detail.value) return []
  return detail.value.questions
    .filter((q) => q.userAnswer !== q.answer)
    .map((q) => ({
      ...q,
      answerText: `${letter(q.answer)}. ${(q as any).options?.[q.answer] ?? ''}`,
      userAnswerText: q.userAnswer >= 0 ? `${letter(q.userAnswer)}` : '未作答'
    }))
})

const goHome = () => {
  uni.switchTab({ url: '/pages/index/index' })
}

const retry = () => {
  uni.redirectTo({
    url: `/subpackages/quiz/practice/index?count=${total.value}&tag=${encodeURIComponent(detail.value?.tag || '全部')}`
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

.score-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 44rpx 32rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.05);

  .circle-wrap {
    margin-bottom: 24rpx;
  }

  .circle-inner {
    display: flex;
    align-items: baseline;
    justify-content: center;

    .circle-num {
      font-size: 72rpx;
      font-weight: bold;
      color: #1a1a1a;
    }

    .circle-unit {
      font-size: 26rpx;
      color: #8c8c8c;
      margin-left: 4rpx;
    }
  }

  .score-comment {
    font-size: 28rpx;
    color: #555;
    margin-bottom: 36rpx;
  }

  .score-meta {
    display: flex;
    align-items: center;
    width: 100%;
    justify-content: space-around;

    .meta-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6rpx;
      flex: 1;

      .meta-num {
        font-size: 32rpx;
        font-weight: 600;
        color: #1a1a1a;
      }

      .meta-label {
        font-size: 22rpx;
        color: #a0a0a0;
      }
    }

    .meta-divider {
      width: 2rpx;
      height: 44rpx;
      background: #f0f1f4;
    }
  }
}

.block {
  background: #ffffff;
  border-radius: 18rpx;
  padding: 28rpx;

  .block-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;

    .block-title {
      font-size: 30rpx;
      font-weight: 600;
      color: #1a1a1a;
    }

    .block-sub {
      font-size: 24rpx;
      color: #f5222d;
    }
  }
}

.all-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 40rpx 0;

  .all-right-text {
    font-size: 26rpx;
    color: #34c759;
  }
}

.wrong-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.wrong-item {
  background: #fafbfc;
  border-radius: 14rpx;
  padding: 24rpx;

  .wrong-stem {
    display: flex;
    gap: 14rpx;
    margin-bottom: 18rpx;

    .wrong-index {
      flex-shrink: 0;
      width: 40rpx;
      height: 40rpx;
      border-radius: 20rpx;
      background: #fef0ef;
      color: #f5222d;
      font-size: 22rpx;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .wrong-text {
      flex: 1;
      font-size: 27rpx;
      line-height: 1.55;
      color: #333;
    }
  }

  .wrong-answers {
    display: flex;
    gap: 32rpx;
    margin-bottom: 18rpx;

    .answer-row {
      display: flex;
      align-items: center;
      gap: 10rpx;

      .answer-label {
        font-size: 22rpx;
        color: #a0a0a0;
      }

      .answer-value {
        font-size: 24rpx;
        font-weight: 600;

        &.is-wrong {
          color: #f5222d;
        }

        &.is-correct {
          color: #34c759;
        }
      }
    }
  }

  .wrong-explain {
    padding-top: 16rpx;
    border-top: 1rpx dashed #e8eaef;
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    .explain-label {
      font-size: 22rpx;
      color: #4d80f0;
      font-weight: 600;
    }

    .explain-text {
      font-size: 24rpx;
      line-height: 1.6;
      color: #666;
    }
  }
}

.footer {
  margin-top: auto;
  display: flex;
  gap: 20rpx;
  padding-bottom: env(safe-area-inset-bottom);

  :deep(.wd-button:first-child) {
    flex-shrink: 0;
  }
}
</style>
