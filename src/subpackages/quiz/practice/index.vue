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
import { type Question } from '@/data/questions'
import { useCheckinStore } from '@/store/checkin'
import { apiGetQuestions, apiSyncPractice } from '@/services/quizApi'

const checkinStore = useCheckinStore()

const questions = ref<Question[]>([])
const loading = ref(true)
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

// 阶段 2 核心：异步从云端/云仿真拉取题目数据
onLoad(async (options) => {
  const count = Number(options?.count) || 5
  const tag = options?.tag ? decodeURIComponent(options.tag) : '全部'

  console.log('📌 [onLoad] 异步拉取云端题库:', { count, tag })

  try {
    loading.value = true
    const res = await apiGetQuestions({ tag, count, random: true })
    if (res && res.list && res.list.length > 0) {
      questions.value = res.list
    }
  } catch (err) {
    console.error('拉取云端题目失败:', err)
  } finally {
    loading.value = false
  }

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

const finishPractice = async () => {
  if (timer) clearInterval(timer)

  const correct = questions.value.reduce((sum, q, i) => {
    return sum + (answers.value[i] === q.answer ? 1 : 0)
  }, 0)

  const durationSec = Math.floor((Date.now() - startTime.value) / 1000)
  const tag = questions.value[0]?.tag === questions.value[questions.value.length - 1]?.tag
    ? questions.value[0].tag
    : '综合'

  // 整理错题信息
  const wrongDetails = questions.value
    .map((q, i) => ({
      questionId: q.id,
      stem: q.stem,
      userAnswer: answers.value[i],
      answer: q.answer
    }))
    .filter((q) => q.userAnswer !== q.answer)

  // 1. 本地存储持久化 (阶段 1 机制)
  checkinStore.addRecord({
    tag,
    total: questions.value.length,
    correct,
    durationSec
  })

  // 记录错题到错题集
  wrongDetails.forEach((w) => {
    checkinStore.recordWrong(w.questionId)
  })

  // 2. 云端打卡状态与记录异步同步 (阶段 2 核心)
  try {
    await apiSyncPractice({
      tag,
      total: questions.value.length,
      correct,
      durationSec,
      wrongDetails
    })
    console.log('✅ [CloudBase] 打卡记录已同步至云端集合 practice_records')
  } catch (err) {
    console.warn('云端记录同步降级:', err)
  }

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
  padding: 28rpx 26rpx 40rpx;
  box-sizing: border-box;
}

.progress-bar-wrap {
  margin-bottom: 28rpx;

  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;

    .progress-text {
      font-size: 28rpx;
      font-weight: 700;
      color: #3d73ee;
    }

    .progress-timer {
      display: flex;
      align-items: center;
      font-size: 26rpx;
      color: #8c93a0;
      font-weight: 500;

      text {
        margin-left: 8rpx;
      }
    }
  }

  .progress-track {
    height: 12rpx;
    background: #e5e8f0;
    border-radius: 6rpx;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3d73ee, #204ecf);
      border-radius: 6rpx;
      transition: width 0.3s ease;
    }
  }
}

.card-wrap {
  flex: 1;
  margin-bottom: 32rpx;
}

.footer {
  padding-bottom: env(safe-area-inset-bottom);

  .footer-actions {
    display: flex;

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
}
</style>
