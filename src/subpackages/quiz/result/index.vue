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
      <wd-button open-type="share">分享战报</wd-button>
      <wd-button block type="primary" @click="retry">再练一次</wd-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'

// ----------------------------------------------------------------
// 微信小程序原生社交分享卡片配置 (练习报告战绩炫耀)
// ----------------------------------------------------------------
onShareAppMessage(() => {
  return {
    title: `我在「刷题打卡」斩获 ${accuracy.value}% 正确率（答对 ${correct.value}/${total.value}），邀你来战！`,
    path: '/pages/index/index'
  }
})

onShareTimeline(() => {
  return {
    title: `【刷题战报】正确率 ${accuracy.value}% · 嵌入式电路练习完成！`,
    query: ''
  }
})

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
  padding: 28rpx 26rpx 60rpx;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.score-card {
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 26rpx;
  padding: 48rpx 32rpx 36rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 34rpx;
  border: 1px solid rgba(228, 233, 242, 0.85);
  box-shadow: 0 10rpx 28rpx rgba(22, 45, 90, 0.07);

  .circle-wrap {
    margin-bottom: 24rpx;
  }

  .circle-inner {
    display: flex;
    align-items: baseline;
    justify-content: center;

    .circle-num {
      font-size: 76rpx;
      font-weight: 800;
      color: #1a1a1a;
    }

    .circle-unit {
      font-size: 28rpx;
      color: #8c8c8c;
      margin-left: 6rpx;
      font-weight: 600;
    }
  }

  .score-comment {
    font-size: 30rpx;
    font-weight: 600;
    color: #444;
    margin-bottom: 38rpx;
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
      flex: 1;

      .meta-num {
        font-size: 34rpx;
        font-weight: 700;
        color: #1a1a1a;
        margin-bottom: 6rpx;
      }

      .meta-label {
        font-size: 24rpx;
        color: #9aa1af;
      }
    }

    .meta-divider {
      width: 2rpx;
      height: 44rpx;
      background: #e8eaef;
    }
  }
}

.block {
  box-sizing: border-box;
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 34rpx;
  border: 1px solid rgba(228, 233, 242, 0.85);
  box-shadow: 0 10rpx 28rpx rgba(22, 45, 90, 0.06);

  .block-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;

    .block-title {
      font-size: 30rpx;
      font-weight: 700;
      color: #1a1a1a;
    }

    .block-sub {
      font-size: 24rpx;
      color: #f5222d;
      font-weight: 600;
    }
  }
}

.all-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 44rpx 0;

  .all-right-text {
    margin-top: 16rpx;
    font-size: 28rpx;
    color: #34c759;
    font-weight: 600;
  }
}

.wrong-list {
  display: flex;
  flex-direction: column;
}

.wrong-item {
  box-sizing: border-box;
  background: #fafbfc;
  border-radius: 18rpx;
  padding: 26rpx;
  margin-bottom: 22rpx;
  border: 1px solid #f0f2f5;

  &:last-child {
    margin-bottom: 0;
  }

  .wrong-stem {
    display: flex;
    margin-bottom: 20rpx;

    .wrong-index {
      flex-shrink: 0;
      width: 44rpx;
      height: 44rpx;
      border-radius: 22rpx;
      background: #fef0ef;
      color: #f5222d;
      font-size: 24rpx;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16rpx;
    }

    .wrong-text {
      flex: 1;
      font-size: 28rpx;
      line-height: 1.55;
      color: #2c3e50;
      font-weight: 500;
    }
  }

  .wrong-answers {
    display: flex;
    margin-bottom: 20rpx;

    .answer-row {
      display: flex;
      align-items: center;
      margin-right: 32rpx;

      .answer-label {
        font-size: 24rpx;
        color: #9aa1af;
        margin-right: 8rpx;
      }

      .answer-value {
        font-size: 26rpx;
        font-weight: 700;

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
    padding-top: 18rpx;
    border-top: 1px dashed #e5e8f0;
    display: flex;
    flex-direction: column;

    .explain-label {
      font-size: 24rpx;
      color: #3d73ee;
      font-weight: 700;
      margin-bottom: 8rpx;
    }

    .explain-text {
      font-size: 25rpx;
      line-height: 1.6;
      color: #555;
    }
  }
}

.footer {
  margin-top: auto;
  display: flex;
  padding-bottom: env(safe-area-inset-bottom);

  :deep(.wd-button) {
    margin-right: 20rpx;

    &:last-child {
      margin-right: 0;
    }
  }

  :deep(.wd-button:first-child) {
    flex-shrink: 0;
  }
}
</style>
