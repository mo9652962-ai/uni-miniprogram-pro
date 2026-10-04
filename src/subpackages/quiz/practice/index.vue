<template>
  <view class="page">
    <!-- 顶部进度条 -->
    <view class="progress-bar-wrap">
      <view class="progress-info">
        <text class="progress-text">{{ currentIndex + 1 }} / {{ questions.length }}</text>
        <text class="progress-timer">
          <wd-icon name="clock" size="14px" color="#8c8c8c" />
          {{ elapsedText }}
        </text>
      </view>
      <view class="progress-track">
        <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
      </view>
    </view>

    <!-- 题目卡片（自定义组件） -->
    <view class="card-wrap">
      <QuestionCard
        v-if="currentQuestion"
        :question="currentQuestion"
        :index="currentIndex"
        :selected="selectedIndex"
        :show-result="showResult"
        @select="handleSelect"
      />
    </view>

    <!-- 底部操作区 -->
    <view class="footer">
      <wd-button
        v-if="!showResult"
        block
        type="primary"
        :disabled="selectedIndex === -1"
        @click="confirmAnswer"
      >
        确认答案
      </wd-button>

      <view v-else class="footer-actions">
        <wd-button v-if="currentIndex > 0" plain @click="prevQuestion">上一题</wd-button>
        <wd-button block type="primary" @click="nextQuestion">
          {{ isLast ? '查看结果' : '下一题' }}
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import QuestionCard from '@/components/quiz/QuestionCard.vue'
import { pickQuestions, type Question } from '@/data/questions'
import { useCheckinStore } from '@/store/checkin'

const checkinStore = useCheckinStore()

const questions = ref<Question[]>([])
const currentIndex = ref(0)
const selectedIndex = ref(-1)
const showResult = ref(false)
const answers = ref<number[]>([])
const startTime = ref(0)
const elapsedSec = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const currentQuestion = computed(() => questions.value[currentIndex.value])
const isLast = computed(() => currentIndex.value === questions.value.length - 1)
const progressPercent = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.round(((currentIndex.value + 1) / questions.value.length) * 100)
})

const elapsedText = computed(() => {
  const m = Math.floor(elapsedSec.value / 60)
  const s = elapsedSec.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

// 阶段 1 核心：页面级 onLoad 接收路由参数
onLoad((options) => {
  const count = Number(options?.count) || 5
  const tag = options?.tag ? decodeURIComponent(options.tag) : '全部'

  console.log('📌 [onLoad] 接收参数:', { count, tag })

  questions.value = pickQuestions(count, tag)
  answers.value = new Array(questions.value.length).fill(-1)
  startTime.value = Date.now()

  timer = setInterval(() => {
    elapsedSec.value = Math.floor((Date.now() - startTime.value) / 1000)
  }, 1000)
})

onUnload(() => {
  if (timer) clearInterval(timer)
})

const handleSelect = (i: number) => {
  selectedIndex.value = i
}

const confirmAnswer = () => {
  if (selectedIndex.value === -1) return
  answers.value[currentIndex.value] = selectedIndex.value
  showResult.value = true
}

const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    selectedIndex.value = answers.value[currentIndex.value]
    showResult.value = selectedIndex.value !== -1
  }
}

const nextQuestion = () => {
  if (isLast.value) {
    finishPractice()
    return
  }
  currentIndex.value++
  selectedIndex.value = answers.value[currentIndex.value]
  showResult.value = selectedIndex.value !== -1
}

const finishPractice = () => {
  if (timer) clearInterval(timer)

  const correct = questions.value.reduce((sum, q, i) => {
    return sum + (answers.value[i] === q.answer ? 1 : 0)
  }, 0)

  const durationSec = Math.floor((Date.now() - startTime.value) / 1000)
  const tag = questions.value[0]?.tag === questions.value[questions.value.length - 1]?.tag
    ? questions.value[0].tag
    : '综合'

  // 写入本地记录（阶段 1 核心：uni.setStorageSync 持久化）
  checkinStore.addRecord({
    tag,
    total: questions.value.length,
    correct,
    durationSec
  })

  const detail = encodeURIComponent(JSON.stringify({
    correct,
    total: questions.value.length,
    durationSec,
    tag,
    questions: questions.value.map((q, i) => ({
      id: q.id,
      stem: q.stem,
      options: q.options,
      answer: q.answer,
      userAnswer: answers.value[i],
      explain: q.explain
    }))
  }))

  uni.redirectTo({
    url: `/subpackages/quiz/result/index?detail=${detail}`
  })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 24rpx;
  box-sizing: border-box;
}

.progress-bar-wrap {
  margin-bottom: 24rpx;

  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14rpx;

    .progress-text {
      font-size: 26rpx;
      font-weight: 600;
      color: #4d80f0;
    }

    .progress-timer {
      display: flex;
      align-items: center;
      gap: 6rpx;
      font-size: 24rpx;
      color: #8c8c8c;
    }
  }

  .progress-track {
    height: 10rpx;
    background: #e8eaef;
    border-radius: 5rpx;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4d80f0, #2955c8);
      border-radius: 5rpx;
      transition: width 0.3s ease;
    }
  }
}

.card-wrap {
  flex: 1;
  margin-bottom: 24rpx;
}

.footer {
  padding-bottom: env(safe-area-inset-bottom);

  .footer-actions {
    display: flex;
    gap: 20rpx;

    :deep(.wd-button:first-child) {
      flex-shrink: 0;
    }
  }
}
</style>
