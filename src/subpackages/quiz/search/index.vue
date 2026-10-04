<template>
  <view class="page">
    <!-- 1. 顶部搜索栏 -->
    <view class="search-bar-wrap">
      <view class="search-input-box">
        <wd-icon name="search" size="18px" color="#999" />
        <input
          v-model="searchKeyword"
          class="search-input"
          placeholder="搜索考点、芯片、定律、术语..."
          confirm-type="search"
          @confirm="onSearch"
        />
        <wd-icon
          v-if="searchKeyword"
          name="close-circle-filled"
          size="16px"
          color="#c8c9cc"
          @click="clearSearch"
        />
      </view>
    </view>

    <!-- 2. 分类标签横向滑动栏 -->
    <scroll-view class="tag-scroll" scroll-x :show-scrollbar="false">
      <view class="tag-list">
        <view
          v-for="cat in categoryList"
          :key="cat.name"
          class="tag-item"
          :class="{ 'is-active': activeCategory === cat.name }"
          @click="selectCategory(cat.name)"
        >
          <text class="tag-name">{{ cat.name }}</text>
          <text class="tag-count">{{ cat.count }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 3. 结果汇总统计 -->
    <view class="summary-row">
      <text class="summary-text">
        找到 <text class="highlight">{{ filteredQuestions.length }}</text> 道题目
      </text>
      <text v-if="filteredQuestions.length > 0" class="batch-practice-btn" @click="startCategoryPractice">
        练习本组题目 ({{ Math.min(filteredQuestions.length, 10) }}题) ›
      </text>
    </view>

    <!-- 4. 骨架屏加载状态 -->
    <view v-if="loading" class="skeleton-wrap">
      <wd-skeleton
        theme="paragraph"
        animation="gradient"
        :row-col="[[{ width: '100%', height: '140rpx', borderRadius: '16rpx' }], [{ width: '100%', height: '140rpx', borderRadius: '16rpx', marginTop: '20rpx' }], [{ width: '100%', height: '140rpx', borderRadius: '16rpx', marginTop: '20rpx' }]]"
      />
    </view>

    <!-- 5. 题目列表内容 -->
    <view v-else>
      <view v-if="filteredQuestions.length === 0" class="empty-box">
        <wd-icon name="search" size="48px" color="#c8c9cc" />
        <text class="empty-title">没有找到相关题目</text>
        <text class="empty-sub">换个关键词或切换到「全部」分类试试吧</text>
      </view>

      <view v-else class="question-list">
        <view
          v-for="(q, idx) in filteredQuestions"
          :key="q.id"
          class="q-card"
          @click="toggleExpand(q.id)"
        >
          <view class="q-head">
            <view class="q-idx">{{ idx + 1 }}</view>
            <wd-tag size="small" plain>{{ q.tag }}</wd-tag>
            <text class="expand-tip">{{ expandedIds.includes(q.id) ? '收起解析' : '展开答案' }}</text>
            <wd-icon
              :name="expandedIds.includes(q.id) ? 'chevron-up' : 'chevron-down'"
              size="14px"
              color="#999"
            />
          </view>

          <!-- 题干（高亮搜索词） -->
          <text class="q-stem">{{ q.stem }}</text>

          <!-- 展开内容：选项与解析 -->
          <view v-if="expandedIds.includes(q.id)" class="expand-body">
            <view class="options-group">
              <view
                v-for="(opt, optIdx) in q.options"
                :key="optIdx"
                class="opt-line"
                :class="{ 'is-answer': optIdx === q.answer }"
              >
                <text class="opt-prefix">{{ String.fromCharCode(65 + optIdx) }}.</text>
                <text class="opt-val">{{ opt }}</text>
                <wd-icon
                  v-if="optIdx === q.answer"
                  name="check"
                  size="14px"
                  color="#34c759"
                />
              </view>
            </view>

            <view class="explain-wrap">
              <view class="explain-title">
                <wd-icon name="bulb" size="14px" color="#ff9500" />
                <text>答案与考点精讲</text>
              </view>
              <text class="explain-detail">{{ q.explain }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { QUESTION_BANK, type Question } from '@/data/questions'

const searchKeyword = ref('')
const activeCategory = ref('全部')
const loading = ref(false)
const expandedIds = ref<string[]>([])

// 统计各大分类的题目数量
const categoryList = computed(() => {
  const counts: Record<string, number> = { 全部: QUESTION_BANK.length }
  QUESTION_BANK.forEach((q) => {
    counts[q.tag] = (counts[q.tag] || 0) + 1
  })
  return Object.entries(counts).map(([name, count]) => ({ name, count }))
})

// 多维检索：标签筛选 + 关键词模糊匹配
const filteredQuestions = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  return QUESTION_BANK.filter((q) => {
    // 1. 分类匹配
    const matchCat = activeCategory.value === '全部' || q.tag === activeCategory.value
    if (!matchCat) return false

    // 2. 关键词模糊检索（题干、选项、解析）
    if (!kw) return true
    const inStem = q.stem.toLowerCase().includes(kw)
    const inOptions = q.options.some((opt) => opt.toLowerCase().includes(kw))
    const inExplain = q.explain.toLowerCase().includes(kw)
    return inStem || inOptions || inExplain
  })
})

onLoad((options) => {
  if (options?.tag) {
    activeCategory.value = decodeURIComponent(options.tag)
  }
  if (options?.kw) {
    searchKeyword.value = decodeURIComponent(options.kw)
  }
})

onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 250)
})

const selectCategory = (name: string) => {
  activeCategory.value = name
}

const onSearch = () => {
  // 触发搜索
}

const clearSearch = () => {
  searchKeyword.value = ''
}

const toggleExpand = (id: string) => {
  const idx = expandedIds.value.indexOf(id)
  if (idx >= 0) {
    expandedIds.value.splice(idx, 1)
  } else {
    expandedIds.value.push(id)
  }
}

/** 直接针对当前分类/搜索结果开启专项练习 */
const startCategoryPractice = () => {
  const count = Math.min(filteredQuestions.value.length, 10)
  uni.navigateTo({
    url: `/subpackages/quiz/practice/index?count=${count}&tag=${encodeURIComponent(activeCategory.value)}`
  })
}

// ----------------------------------------------------------------
// 微信小程序原生社交分享卡片配置 (onShareAppMessage + onShareTimeline)
// ----------------------------------------------------------------
onShareAppMessage(() => {
  const tagText = activeCategory.value === '全部' ? '嵌入式与电路' : activeCategory.value
  return {
    title: `【真题检索】${tagText} 高频核心考点专项题库速查`,
    path: `/subpackages/quiz/search/index?tag=${encodeURIComponent(activeCategory.value)}`
  }
})

onShareTimeline(() => {
  return {
    title: `刷题打卡 · 嵌入式与电路 ${activeCategory.value} 核心真题`,
    query: `tag=${encodeURIComponent(activeCategory.value)}`
  }
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 20rpx 24rpx 60rpx;
  background-color: #f7f8fc;
  box-sizing: border-box;
}

.search-bar-wrap {
  margin-bottom: 20rpx;
}

.search-input-box {
  background: #ffffff;
  border-radius: 40rpx;
  height: 76rpx;
  padding: 0 28rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);

  .search-input {
    flex: 1;
    font-size: 28rpx;
    color: #1a1a1a;
  }
}

.tag-scroll {
  white-space: nowrap;
  margin-bottom: 20rpx;
}

.tag-list {
  display: inline-flex;
  gap: 16rpx;
  padding-right: 20rpx;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  background: #ffffff;
  border-radius: 30rpx;
  border: 1rpx solid #e2e8f0;
  transition: all 0.2s ease;

  &.is-active {
    background: #4d80f0;
    border-color: #4d80f0;

    .tag-name,
    .tag-count {
      color: #ffffff;
    }
  }

  .tag-name {
    font-size: 26rpx;
    color: #4a5568;
    font-weight: 500;
  }

  .tag-count {
    font-size: 20rpx;
    color: #a0aec0;
  }
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding: 0 8rpx;

  .summary-text {
    font-size: 24rpx;
    color: #8c8c8c;

    .highlight {
      color: #4d80f0;
      font-weight: bold;
    }
  }

  .batch-practice-btn {
    font-size: 24rpx;
    color: #4d80f0;
    font-weight: 500;
  }
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.q-card {
  background: #ffffff;
  border-radius: 18rpx;
  padding: 26rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.03);

  .q-head {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 16rpx;

    .q-idx {
      width: 40rpx;
      height: 40rpx;
      border-radius: 20rpx;
      background: #edf2f7;
      color: #4a5568;
      font-size: 22rpx;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .expand-tip {
      margin-left: auto;
      font-size: 22rpx;
      color: #999;
    }
  }

  .q-stem {
    font-size: 28rpx;
    color: #1a1a1a;
    line-height: 1.5;
    font-weight: 500;
    display: block;
  }

  .expand-body {
    margin-top: 20rpx;
    border-top: 1rpx dashed #edf0f5;
    padding-top: 20rpx;
    animation: fadeIn 0.2s ease;
  }

  .options-group {
    display: flex;
    flex-direction: column;
    gap: 10rpx;
    margin-bottom: 16rpx;
  }

  .opt-line {
    display: flex;
    align-items: center;
    padding: 12rpx 16rpx;
    background: #f8fafc;
    border-radius: 10rpx;
    font-size: 24rpx;
    color: #4a5568;

    &.is-answer {
      background: #e6f7ed;
      color: #166534;
      font-weight: bold;
    }

    .opt-prefix {
      margin-right: 12rpx;
    }

    .opt-val {
      flex: 1;
    }
  }

  .explain-wrap {
    background: #fffbe6;
    border: 1rpx solid #ffe58f;
    border-radius: 10rpx;
    padding: 16rpx;

    .explain-title {
      display: flex;
      align-items: center;
      gap: 8rpx;
      font-size: 22rpx;
      color: #d46b08;
      font-weight: bold;
      margin-bottom: 6rpx;
    }

    .explain-detail {
      font-size: 22rpx;
      color: #873800;
      line-height: 1.4;
    }
  }
}

.empty-box {
  padding: 100rpx 40rpx;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;

  .empty-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #4a5568;
    margin-top: 20rpx;
  }

  .empty-sub {
    font-size: 24rpx;
    color: #a0aec0;
    margin-top: 8rpx;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
