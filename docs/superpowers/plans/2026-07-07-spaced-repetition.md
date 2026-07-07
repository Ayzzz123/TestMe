# 智能间隔重复复习 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 TestMe 添加基于 SM-2 算法的间隔重复复习系统，错题自动入队、每日推送复习、自评记忆质量

**Architecture:** 新增 `spacedRepetition.ts`（算法+队列）和 `ReviewDashboard.tsx`（入口卡片）两个文件；修改 QuizPage 支持双模式（普通/复习）；修改 ResultPage 实现错题自动入队。纯前端，localStorage 存储，零外部依赖。

**Tech Stack:** React 19 + TypeScript + Tailwind CSS 4 + Vitest

---

## 文件结构

```
Create: src/utils/spacedRepetition.ts       — SM-2 算法 + 队列管理
Create: src/__tests__/spacedRepetition.test.ts — 算法 + 队列单元测试
Create: src/components/ReviewDashboard.tsx   — 首页复习入口卡片
Create: src/__tests__/ReviewDashboard.test.tsx — 组件渲染测试
Modify: src/types/index.ts                  — 新增 ReviewItem 接口
Modify: src/utils/storage.ts                — 新增 saveReviews / loadReviews
Modify: src/components/HomePage.tsx          — 引入 ReviewDashboard，新增 onStartReview prop
Modify: src/components/QuizPage.tsx          — 新增 isReviewMode / reviewItems props
Modify: src/App.tsx                          — 新增 handleStartReview，管理复习模式状态
Modify: src/components/ResultPage.tsx        — 错题自动入队 + 复习跳转
```

---

### Task 1: 新增 ReviewItem 类型

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: 在 types/index.ts 末尾添加 ReviewItem 接口**

```typescript
export interface ReviewItem {
  questionId: string
  efactor: number
  interval: number
  repetitions: number
  nextReview: string
  lastReview: string
  lastQuality: number
  mastered: boolean
}
```

插入位置：`QuizHistory` 接口之后，`AppPage` 类型之前。

- [ ] **Step 2: 验证类型检查通过**

Run: `npx tsc --noEmit`
Expected: 无类型错误。

- [ ] **Step 3: 提交**

```bash
git add src/types/index.ts
git commit -m "feat: add ReviewItem type for spaced repetition"
```

---

### Task 2: 新增复习数据存储函数

**Files:**
- Modify: `src/utils/storage.ts`

- [ ] **Step 1: 在 storage.ts 添加 saveReviews / loadReviews**

在文件末尾（`loadHistory` 函数之后）添加：

```typescript
const REVIEWS_KEY = 'quiz_reviews'

export function saveReviews(reviews: ReviewItem[]): void {
  try {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews))
  } catch {
    // 静默失败
  }
}

export function loadReviews(): ReviewItem[] {
  try {
    const data = localStorage.getItem(REVIEWS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}
```

需要在文件顶部添加 import：
```typescript
import type { QuizSession, QuizHistory, ReviewItem } from '../types'
```

- [ ] **Step 2: 验证类型检查通过**

Run: `npx tsc --noEmit`
Expected: 无类型错误。

- [ ] **Step 3: 提交**

```bash
git add src/utils/storage.ts
git commit -m "feat: add saveReviews/loadReviews for spaced repetition storage"
```

---

### Task 3: 实现 SM-2 算法 + 队列管理

**Files:**
- Create: `src/utils/spacedRepetition.ts`
- Create: `src/__tests__/spacedRepetition.test.ts`

- [ ] **Step 1: 编写算法单元测试**

创建 `src/__tests__/spacedRepetition.test.ts`：

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { sm2, enqueueReview, getDueReviewItems, getReviewStats, recordReview, clearAllReviews } from '../utils/spacedRepetition'
import { loadReviews, saveReviews } from '../utils/storage'
import type { ReviewItem } from '../types'

function makeItem(overrides: Partial<ReviewItem> = {}): ReviewItem {
  return {
    questionId: 'q1',
    efactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReview: '2026-07-08',
    lastReview: '2026-07-07',
    lastQuality: 0,
    mastered: false,
    ...overrides,
  }
}

describe('sm2', () => {
  it('quality 5 on first review: interval=1, repetitions=1', () => {
    const item = makeItem({ repetitions: 0, interval: 1 })
    const result = sm2(5, item)
    expect(result.repetitions).toBe(1)
    expect(result.interval).toBe(1)
  })

  it('quality 5 on second review: interval=6, repetitions=2', () => {
    const item = makeItem({ repetitions: 1, interval: 1 })
    const result = sm2(5, item)
    expect(result.repetitions).toBe(2)
    expect(result.interval).toBe(6)
  })

  it('quality 5 on third review: interval = prevInterval * efactor', () => {
    const item = makeItem({ repetitions: 2, interval: 6, efactor: 2.5 })
    const result = sm2(5, item)
    expect(result.repetitions).toBe(3)
    expect(result.interval).toBeCloseTo(15, 0)
  })

  it('quality < 3 resets interval to 1 and repetitions to 0', () => {
    const item = makeItem({ repetitions: 3, interval: 30, efactor: 2.3 })
    const result = sm2(2, item)
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(0)
  })

  it('efactor decreases on low quality', () => {
    const item = makeItem({ efactor: 2.5 })
    const result = sm2(0, item)
    expect(result.efactor).toBeLessThan(2.5)
  })

  it('efactor increases on high quality', () => {
    const item = makeItem({ efactor: 2.0 })
    const result = sm2(5, item)
    expect(result.efactor).toBeGreaterThan(2.0)
  })

  it('efactor never goes below 1.3', () => {
    const item = makeItem({ efactor: 1.3 })
    const result = sm2(0, item)
    expect(result.efactor).toBeGreaterThanOrEqual(1.3)
  })

  it('mastered becomes true when repetitions >= 4 and interval >= 90', () => {
    const item = makeItem({ repetitions: 3, interval: 60, efactor: 2.0 })
    const result = sm2(5, item)
    expect(result.repetitions).toBe(4)
    expect(result.interval).toBeCloseTo(120, 0)
    expect(result.mastered).toBe(true)
  })

  it('nextReview is set correctly based on interval', () => {
    const item = makeItem({ lastReview: '2026-07-01' })
    const result = sm2(5, item)
    expect(result.nextReview).toBe('2026-07-02')
  })
})

describe('queue management', () => {
  beforeEach(() => {
    clearAllReviews()
  })

  it('enqueueReview adds a new item', () => {
    enqueueReview('q1')
    const all = getReviewStats()
    expect(all.total).toBe(1)
  })

  it('enqueueReview does not duplicate existing questionId', () => {
    enqueueReview('q1')
    enqueueReview('q1')
    const all = getReviewStats()
    expect(all.total).toBe(1)
  })

  it('enqueueReview re-enqueues mastered item', () => {
    enqueueReview('q1')
    // Manually mark as mastered
    const items = loadReviews()
    items[0].mastered = true
    items[0].repetitions = 5
    saveReviews(items)

    enqueueReview('q1')
    const all = loadReviews()
    expect(all[0].mastered).toBe(false)
    expect(all[0].repetitions).toBe(0)
  })

  it('getDueReviewItems returns only items due today or earlier', () => {
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

    saveReviews([
      makeItem({ questionId: 'due1', nextReview: today, mastered: false }),
      makeItem({ questionId: 'due2', nextReview: yesterday, mastered: false }),
      makeItem({ questionId: 'future', nextReview: tomorrow, mastered: false }),
      makeItem({ questionId: 'mastered', nextReview: yesterday, mastered: true }),
    ])

    const due = getDueReviewItems()
    expect(due.length).toBe(2)
    expect(due.map(d => d.questionId).sort()).toEqual(['due1', 'due2'])
  })

  it('recordReview updates item with sm2 result', () => {
    enqueueReview('q1')
    recordReview('q1', 5)
    const due = getDueReviewItems()
    // After quality 5 on first review, nextReview should be 1 day from now
    expect(due.length).toBe(0) // not due today anymore
  })

  it('getReviewStats returns correct counts', () => {
    const today = new Date().toISOString().slice(0, 10)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

    saveReviews([
      makeItem({ questionId: 'due1', nextReview: today, mastered: false }),
      makeItem({ questionId: 'future1', nextReview: tomorrow, mastered: false }),
      makeItem({ questionId: 'mastered1', nextReview: today, mastered: true }),
    ])

    const stats = getReviewStats()
    expect(stats.due).toBe(1)
    expect(stats.total).toBe(3)
    expect(stats.mastered).toBe(1)
    expect(stats.pct).toBe(33)
  })
})
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npx vitest run src/__tests__/spacedRepetition.test.ts`
Expected: FAIL — 模块尚未创建。

- [ ] **Step 3: 实现 spacedRepetition.ts**

创建 `src/utils/spacedRepetition.ts`：

```typescript
import type { ReviewItem } from '../types'
import { loadReviews, saveReviews } from './storage'

/** 今天的日期字符串 YYYY-MM-DD */
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** 在指定日期上加 N 天 */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/** SM-2 核心算法：根据自评质量更新复习项 */
export function sm2(quality: number, item: ReviewItem): ReviewItem {
  let { efactor, interval, repetitions } = item

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * efactor)
    }
    repetitions += 1
  } else {
    interval = 1
    repetitions = 0
  }

  efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (efactor < 1.3) efactor = 1.3

  const mastered = repetitions >= 4 && interval >= 90

  return {
    ...item,
    efactor: Math.round(efactor * 100) / 100,
    interval,
    repetitions,
    nextReview: addDays(today(), interval),
    lastReview: today(),
    lastQuality: quality,
    mastered,
  }
}

/** 将一道错题加入复习队列（去重） */
export function enqueueReview(questionId: string): void {
  const reviews = loadReviews()
  const existing = reviews.find(r => r.questionId === questionId)

  if (existing) {
    if (existing.mastered) {
      // 已掌握的题重新入队，重置状态
      existing.efactor = 2.5
      existing.interval = 1
      existing.repetitions = 0
      existing.nextReview = addDays(today(), 1)
      existing.lastReview = today()
      existing.lastQuality = 0
      existing.mastered = false
      saveReviews(reviews)
    }
    // 已在队列中且未掌握 → 跳过
    return
  }

  const newItem: ReviewItem = {
    questionId,
    efactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReview: addDays(today(), 1),
    lastReview: today(),
    lastQuality: 0,
    mastered: false,
  }

  reviews.push(newItem)
  saveReviews(reviews)
}

/** 获取今日到期的复习项（不含已掌握） */
export function getDueReviewItems(): ReviewItem[] {
  const reviews = loadReviews()
  const t = today()
  return reviews.filter(r => !r.mastered && r.nextReview <= t)
}

/** 获取复习统计概览 */
export function getReviewStats(): { due: number; total: number; mastered: number; pct: number } {
  const reviews = loadReviews()
  const t = today()
  const due = reviews.filter(r => !r.mastered && r.nextReview <= t).length
  const mastered = reviews.filter(r => r.mastered).length
  const total = reviews.length
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0
  return { due, total, mastered, pct }
}

/** 记录一次复习结果 */
export function recordReview(questionId: string, quality: number): void {
  const reviews = loadReviews()
  const idx = reviews.findIndex(r => r.questionId === questionId)
  if (idx === -1) return
  reviews[idx] = sm2(quality, reviews[idx])
  saveReviews(reviews)
}

/** 清空所有复习数据（测试用） */
export function clearAllReviews(): void {
  saveReviews([])
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npx vitest run src/__tests__/spacedRepetition.test.ts`
Expected: 所有测试 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/utils/spacedRepetition.ts src/__tests__/spacedRepetition.test.ts
git commit -m "feat: implement SM-2 algorithm and review queue management"
```

---

### Task 4: 创建 ReviewDashboard 组件

**Files:**
- Create: `src/components/ReviewDashboard.tsx`

- [ ] **Step 1: 创建 ReviewDashboard 组件**

创建 `src/components/ReviewDashboard.tsx`：

```typescript
import { getDueReviewItems, getReviewStats } from '../utils/spacedRepetition'

interface Props {
  onStartReview: () => void
}

export function ReviewDashboard({ onStartReview }: Props) {
  const stats = getReviewStats()
  const dueItems = getDueReviewItems()

  // 统计各轮次
  const round1 = dueItems.filter(r => r.repetitions === 0).length
  const round2Plus = dueItems.filter(r => r.repetitions >= 1 && r.repetitions < 4).length
  const consolidating = dueItems.filter(r => r.repetitions >= 4).length

  // 无待复习且无历史 → 不显示
  if (stats.total === 0) return null

  // 无待复习 → 收缩状态
  if (stats.due === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl flex items-center justify-center text-xl shadow-sm">
            ✅
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm">全部已掌握</h3>
            <p className="text-xs text-gray-400">
              {stats.mastered} 题已掌握 · 复习队列 {stats.total} 题
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
      <div
        onClick={onStartReview}
        className="px-6 py-5 cursor-pointer hover:bg-purple-50/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl flex items-center justify-center text-xl shadow-sm">
            🧠
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800 text-sm">今日复习</h3>
              <span className="text-xs font-bold text-white bg-purple-500 px-2 py-0.5 rounded-full">
                {stats.due} 题待复习
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
              {round1 > 0 && <span>🟢 {round1}题 · 第1轮</span>}
              {round2Plus > 0 && <span>🟡 {round2Plus}题 · 巩固</span>}
              {consolidating > 0 && <span>🔴 {consolidating}题 · 冲刺</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-lg font-bold text-purple-600">{stats.pct}%</div>
            <div className="text-[10px] text-gray-400">掌握率</div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 验证类型检查通过**

Run: `npx tsc --noEmit`
Expected: 无类型错误。

- [ ] **Step 3: 提交**

```bash
git add src/components/ReviewDashboard.tsx
git commit -m "feat: add ReviewDashboard component with due count and stats"
```

---

### Task 5: 集成 ReviewDashboard 到 HomePage

**Files:**
- Modify: `src/components/HomePage.tsx`

- [ ] **Step 1: 修改 HomePage props，添加 onStartReview**

将 Props 接口改为：

```typescript
interface Props {
  onStartQuiz: (questions: Question[], title: string) => void
  onStartReview: (questions: Question[], title: string) => void
}
```

在 `export function HomePage({ onStartQuiz, onStartReview }: Props)` 中解构新 prop。

- [ ] **Step 2: 添加 handleStartReview 逻辑**

在 `startStructureExam` 函数之后添加：

```typescript
const handleStartReview = () => {
  const dueItems = getDueReviewItems()
  const reviewQuestions = dueItems
    .map(item =>
      allQuestions.find(q => q.id === item.questionId) ||
      allStructureQuestions.find(q => q.id === item.questionId)
    )
    .filter((q): q is Question => q !== undefined)

  if (reviewQuestions.length > 0) {
    onStartReview(reviewQuestions, '间隔复习')
  }
}
```

- [ ] **Step 3: 在 JSX 中插入 ReviewDashboard**

在 `{/* 考试栏 */}` 的 `<div>` 内部，标题之后、第一个科目分组之前，添加：

```tsx
<ReviewDashboard onStartReview={handleStartReview} />
```

需要 import ReviewDashboard：
```typescript
import { ReviewDashboard } from './ReviewDashboard'
```

- [ ] **Step 4: 验证类型检查通过**

Run: `npx tsc --noEmit`
Expected: 无类型错误。

- [ ] **Step 5: 提交**

```bash
git add src/components/HomePage.tsx
git commit -m "feat: integrate ReviewDashboard into HomePage with onStartReview"
```

---

### Task 6: QuizPage 复习模式

**Files:**
- Modify: `src/components/QuizPage.tsx`

- [ ] **Step 1: 添加 isReviewMode 和 reviewItems props**

修改现有 import 语句（第1行）和 Props 接口：

```typescript
// 第1行 — 在现有 import 中添加 ReviewItem
import type { Question, GradingResult, ReviewItem } from '../types'

// Props 接口
interface Props {
  questions: Question[]
  onFinish: (results: GradingResult[], totalScore: number, maxScore: number) => void
  isReviewMode?: boolean
  reviewItems?: ReviewItem[]
  onReviewComplete?: (results: { questionId: string; quality: number }[]) => void
}
```

在组件中解构：
```typescript
export function QuizPage({ questions, onFinish, isReviewMode = false, reviewItems = [], onReviewComplete }: Props) {
```

- [ ] **Step 2: 添加复习自评状态**

在现有 state 声明之后添加：

```typescript
const [reviewQualities, setReviewQualities] = useState<Record<string, number>>({})
const [showQualityPicker, setShowQualityPicker] = useState(false)
```

- [ ] **Step 3: 复习模式下的自评质量选择器**

在 `handleSubmit` 之后添加复习提交逻辑：

```typescript
const handleReviewSubmit = useCallback(() => {
  if (!onReviewComplete) return
  const results = questions.map(q => ({
    questionId: q.id,
    quality: reviewQualities[q.id] ?? 3,
  }))
  clearProgress()
  onReviewComplete(results)
}, [questions, reviewQualities, onReviewComplete])
```

- [ ] **Step 4: 修改底部导航栏（复习模式下显示自评按钮）**

将现有的底部导航栏（`{/* 底部导航 */}` 部分）替换为条件渲染。在复习模式下显示自评按钮组，普通模式下保持原样。

在 `{/* 底部导航 */}` 的 `<div>` 之前添加条件判断。将现有导航包裹在 `{!isReviewMode && (` ... `)}` 中，然后添加 `{isReviewMode && (` ... `)}` 分支。

复习模式下的底部导航：

```tsx
{isReviewMode && (
  <div className="flex flex-col gap-3 mt-5 pb-4">
    {showQualityPicker && (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <p className="text-xs text-gray-400 mb-3 text-center">你对这道题的掌握程度？</p>
        <div className="flex gap-2">
          {[
            { q: 0, label: '完全忘记', emoji: '😰' },
            { q: 1, label: '有印象', emoji: '🤔' },
            { q: 2, label: '看答案想起', emoji: '💡' },
            { q: 3, label: '犹豫答对', emoji: '👍' },
            { q: 4, label: '较流畅', emoji: '😊' },
            { q: 5, label: '非常轻松', emoji: '🚀' },
          ].map(({ q, label, emoji }) => (
            <button
              key={q}
              onClick={() => {
                const newQualities = { ...reviewQualities, [currentQuestion.id]: q }
                setReviewQualities(newQualities)
                setShowQualityPicker(false)
                if (isLast) {
                  handleReviewSubmit()
                } else {
                  setCurrentIndex(currentIndex + 1)
                }
              }}
              className="flex-1 flex flex-col items-center gap-1 py-3 px-1 rounded-xl hover:bg-purple-50 transition-colors border border-gray-100 hover:border-purple-200 text-xs"
            >
              <span className="text-lg">{emoji}</span>
              <span className="text-[10px] text-gray-500">{label}</span>
              <span className="text-[10px] font-bold text-gray-400">{q}</span>
            </button>
          ))}
        </div>
      </div>
    )}
    <div className="flex items-center justify-between">
      <button
        onClick={goPrev}
        disabled={isFirst}
        className={`px-5 py-3 rounded-xl text-sm font-medium transition-all ${
          isFirst
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-600 hover:bg-white hover:shadow-sm border border-gray-200 bg-white'
        }`}
      >
        ← 上一题
      </button>
      <button
        onClick={() => setShowQualityPicker(true)}
        disabled={!hasAnswer(currentQuestion.id)}
        className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
          hasAnswer(currentQuestion.id)
            ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-sm shadow-purple-200'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isLast ? '评估并完成' : '评估掌握度'}
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 5: 复习模式下显示轮次标签**

在题目卡片上方（`ProgressBar` 之后、`{/* 题目卡片 */}` 之前），复习模式下显示轮次标签：

```tsx
{isReviewMode && (() => {
  const ri = reviewItems.find(r => r.questionId === currentQuestion.id)
  return ri ? (
    <div className="flex items-center gap-2 mb-3 mt-4">
      <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-purple-50 text-purple-600">
        🔄 第 {ri.repetitions + 1} 轮复习
      </span>
      <span className="text-xs text-gray-400">
        上次复习: {ri.lastReview}
      </span>
    </div>
  ) : null
})()}
```

- [ ] **Step 6: 验证类型检查通过**

Run: `npx tsc --noEmit`
Expected: 无类型错误。

- [ ] **Step 7: 提交**

```bash
git add src/components/QuizPage.tsx
git commit -m "feat: add review mode to QuizPage with self-assessment quality picker"
```

---

### Task 7: App.tsx 路由连接

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 添加复习模式状态和导航**

添加 import：
```typescript
import { recordReview } from './utils/spacedRepetition'
import type { ReviewItem } from './types'
```

添加 state：
```typescript
const [isReviewMode, setIsReviewMode] = useState(false)
const [reviewItems, setReviewItems] = useState<ReviewItem[]>([])
```

- [ ] **Step 2: 添加 handleStartReview 回调**

在顶部添加 import（合并到现有 import 中）：
```typescript
import { getDueReviewItems, recordReview } from './utils/spacedRepetition'
import type { ReviewItem } from './types'
```

在 `handleStartQuiz` 之后添加：

```typescript
const handleStartReview = useCallback((q: Question[], title: string) => {
  const items = getDueReviewItems()
  const normalized = q.map((item, i) => ({
    ...item,
    score: 0,
  }))
  setQuestions(normalized)
  setExamTitle(title)
  setIsReviewMode(true)
  setReviewItems(items)
  navigateTo('quiz')
}, [navigateTo])
```

- [ ] **Step 3: 添加 handleReviewComplete 回调**

```typescript
const handleReviewComplete = useCallback((results: { questionId: string; quality: number }[]) => {
  results.forEach(r => recordReview(r.questionId, r.quality))
  setIsReviewMode(false)
  setReviewItems([])
  navigateTo('upload')
}, [navigateTo])
```

- [ ] **Step 4: 传递新 props 到 HomePage 和 QuizPage**

`HomePage` 调用添加 `onStartReview` prop：
```tsx
<HomePage onStartQuiz={handleStartQuiz} onStartReview={handleStartReview} />
```

`QuizPage` 调用添加复习模式 props：
```tsx
<QuizPage
  questions={questions}
  onFinish={handleFinish}
  isReviewMode={isReviewMode}
  reviewItems={reviewItems}
  onReviewComplete={handleReviewComplete}
/>
```

- [ ] **Step 5: 验证类型检查通过**

Run: `npx tsc --noEmit`
Expected: 无类型错误。

- [ ] **Step 6: 提交**

```bash
git add src/App.tsx
git commit -m "feat: wire up review mode navigation in App.tsx"
```

---

### Task 8: ResultPage 错题自动入队

**Files:**
- Modify: `src/components/ResultPage.tsx`

- [ ] **Step 1: 添加 enqueueReview 调用**

在文件顶部添加 import：
```typescript
import { enqueueReview } from '../utils/spacedRepetition'
```

在 `saveHistory` 调用之后，添加错题入队逻辑。将现有的 `if (!saved)` 块中的 `saveHistory` 之后添加：

```typescript
// 错题自动加入复习队列
const wrongIds = results.filter(r => !r.isCorrect).map(r => r.questionId)
wrongIds.forEach(id => enqueueReview(id))
```

完整替换现有的 `if (!saved)` 块：

```typescript
if (!saved) {
  saveHistory({
    date: new Date().toLocaleDateString('zh-CN'),
    totalScore: displayScore,
    maxScore: displayMax,
    correctCount,
    totalCount: results.length,
    results,
  })
  // 错题自动加入复习队列
  const wrongIds = results.filter(r => !r.isCorrect).map(r => r.questionId)
  wrongIds.forEach(id => enqueueReview(id))
  setSaved(true)
}
```

- [ ] **Step 2: 添加复习跳转提示**

在 `{/* 操作 */}` 按钮区域中，"重新作答"按钮之后添加：

```tsx
{wrongCount > 0 && (
  <button
    onClick={onGoHome}
    className="flex-1 py-3.5 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 shadow-sm shadow-purple-200 transition-all text-sm"
  >
    🧠 {wrongCount} 道错题已加入复习
  </button>
)}
```

这段需要放在 `{/* 操作 */}` 的 `<div>` 内，在现有两个按钮之前。修改操作区域的 div：

```tsx
<div className="flex flex-col gap-3 mb-8">
  {wrongCount > 0 && (
    <button
      onClick={onGoHome}
      className="py-3.5 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 shadow-sm shadow-purple-200 transition-all text-sm"
    >
      🧠 {wrongCount} 道错题已加入复习计划，返回首页开始复习
    </button>
  )}
  <div className="flex gap-3">
    <button
      onClick={onRestart}
      className="flex-1 py-3.5 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 shadow-sm shadow-blue-200 transition-all"
    >
      重新作答
    </button>
    <button
      onClick={onGoHome}
      className="py-3.5 px-6 border border-gray-200 bg-white text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-all"
    >
      返回首页
    </button>
  </div>
</div>
```

- [ ] **Step 3: 验证类型检查通过**

Run: `npx tsc --noEmit`
Expected: 无类型错误。

- [ ] **Step 4: 提交**

```bash
git add src/components/ResultPage.tsx
git commit -m "feat: auto-enqueue wrong answers to review queue from ResultPage"
```

---

### Task 9: 全量验证

**Files:**
- 无新建/修改

- [ ] **Step 1: 运行全部测试**

```bash
npx vitest run
```
Expected: 所有测试 PASS（包括已有的 grading、questionParser、similarity、storage 和新增的 spacedRepetition 测试）。

- [ ] **Step 2: 类型检查**

```bash
npx tsc --noEmit
```
Expected: 无类型错误。

- [ ] **Step 3: 生产构建**

```bash
npm run build
```
Expected: 构建成功，无错误。

- [ ] **Step 4: 开发服务器冒烟测试**

```bash
npm run dev
```

手动验证以下流程：
1. 首页显示「今日复习」卡片（初始状态：无待复习时不显示，或显示空状态）
2. 完成一次作业 → 成绩页显示错题入队提示
3. 返回首页 → 「今日复习」卡片显示待复习数量
4. 点击进入复习 → 显示复习轮次标签
5. 答题后出现自评按钮（0-5）
6. 完成复习 → 返回首页，卡片更新

- [ ] **Step 5: 提交最终确认**

```bash
git add -A
git commit -m "chore: final verification, all tests pass"
```
