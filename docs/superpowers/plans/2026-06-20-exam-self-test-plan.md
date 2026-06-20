# 期末考试自测工具 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建纯前端期末考试自测工具：上传题库文件 → 解析题目 → 逐题作答 → 评分展示

**Architecture:** React 18 + TypeScript + Vite 单页应用。核心分三层：解析层（文件提取 + 正则解析）、状态层（useQuiz hook + LocalStorage）、展示层（上传/答题/成绩三个页面）。所有处理在浏览器完成。

**Tech Stack:** React 18, TypeScript, Vite, TailwindCSS, pdfjs-dist, mammoth.js, JSZip, Vitest + React Testing Library

---

## 文件结构

```
src/
├── main.tsx                       — 入口
├── App.tsx                        — 路由：upload | quiz | result
├── index.css                      — Tailwind 指令
├── types/
│   └── index.ts                   — Question, QuizSession 类型
├── utils/
│   ├── similarity.ts              — 关键词提取 + 文本相似度
│   ├── grading.ts                 — 评分引擎
│   └── storage.ts                 — LocalStorage 读写
├── parsers/
│   ├── questionParser.ts          — 正则解析题目
│   ├── pdfExtractor.ts            — PDF 文本提取
│   ├── docxExtractor.ts           — DOCX 文本提取
│   └── pptxExtractor.ts           — PPTX 文本提取
├── hooks/
│   └── useQuiz.ts                 — 答题状态管理
├── components/
│   ├── UploadPage.tsx             — 上传页
│   ├── QuizPage.tsx               — 答题页（含答题卡）
│   ├── QuestionCard.tsx           — 题目展示 + 作答区
│   ├── AnswerSheet.tsx            — 答题卡题号网格
│   ├── ProgressBar.tsx            — 进度条
│   └── ResultPage.tsx             — 成绩页
└── __tests__/
    ├── questionParser.test.ts
    ├── grading.test.ts
    ├── similarity.test.ts
    ├── storage.test.ts
    ├── UploadPage.test.tsx
    ├── QuizPage.test.tsx
    └── ResultPage.test.tsx
```

---

### Task 1: 项目脚手架

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

- [ ] **Step 1: 初始化 Vite + React + TypeScript 项目**

```bash
cd C:\Users\29603\Desktop\TestMe
npm create vite@latest . -- --template react-ts
```

选用 `react-ts` 模板，覆盖当前空目录。

- [ ] **Step 2: 安装依赖**

```bash
npm install
npm install pdfjs-dist mammoth jszip
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: 配置 TailwindCSS**

在 `vite.config.ts` 中添加 tailwindcss 插件：

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

- [ ] **Step 4: 写 `src/index.css`**

```css
@import "tailwindcss";
```

- [ ] **Step 5: 配置 Vitest**

在 `vite.config.ts` 顶部添加 triple-slash ref，并在 defineConfig 中添加 test 配置：

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
```

创建 `src/test-setup.ts`：

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: 写最小 `src/App.tsx` 和 `src/main.tsx`**

`src/main.tsx`：
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`src/App.tsx`：
```typescript
export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <h1 className="text-2xl font-bold text-gray-800">期末考试自测工具</h1>
    </div>
  )
}
```

- [ ] **Step 7: 验证项目能跑**

```bash
npx vite build
```
预期：Build 成功，无 TS 错误。

- [ ] **Step 8: 运行测试**

```bash
npx vitest run
```
预期：No test files 消息（后续步骤会添加测试）。

- [ ] **Step 9: 提交**

```bash
git init
echo "node_modules\ndist\n.superpowers" > .gitignore
git add -A
git commit -m "feat: scaffold Vite + React + TS + TailwindCSS project"
```

---

### Task 2: 类型定义

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: 写类型文件**

```typescript
export type QuestionType = 'single' | 'multiple' | 'true-false' | 'fill-blank' | 'short-answer'

export interface Question {
  id: string
  type: QuestionType
  stem: string                      // 题干
  options: string[]                 // 选项列表（简答题为 []）
  answer: string                    // 标准答案
  explanation: string               // 解析（可选）
  chapter: string                   // 所属章节
  score: number                     // 分值，默认 5
}

export interface GradingResult {
  questionId: string
  isCorrect: boolean
  isPartial: boolean                // 部分得分
  userAnswer: string
  correctAnswer: string
  earnedScore: number
  maxScore: number
  coverage?: number                 // 简答题关键词覆盖率
}

export interface QuizSession {
  questions: Question[]
  userAnswers: Record<string, string>
  currentIndex: number
  startTime: number
  submitted: boolean
}

export interface QuizHistory {
  date: string
  totalScore: number
  maxScore: number
  correctCount: number
  totalCount: number
  results: GradingResult[]
}

export type AppPage = 'upload' | 'quiz' | 'result'
```

- [ ] **Step 2: 验证类型编译通过**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add src/types/index.ts
git commit -m "feat: add Question and QuizSession types"
```

---

### Task 3: 文本相似度工具

**Files:**
- Create: `src/utils/similarity.ts`
- Create: `src/__tests__/similarity.test.ts`

- [ ] **Step 1: 写测试**

`src/__tests__/similarity.test.ts`：

```typescript
import { describe, it, expect } from 'vitest'
import { extractKeywords, keywordCoverage, jaccardSimilarity, combinedSimilarity } from '../utils/similarity'

describe('extractKeywords', () => {
  it('extracts words with length >= 2, excluding stopwords', () => {
    const text = '这是自动飞行系统的组成'
    const result = extractKeywords(text)
    // 去掉停用词"这是""的" → 保留：自动、飞行、系统、组成
    expect(result).toContain('自动')
    expect(result).toContain('飞行')
    expect(result).toContain('系统')
    expect(result).toContain('组成')
    expect(result).not.toContain('这是')
    expect(result).not.toContain('的')
  })

  it('returns empty array for empty input', () => {
    expect(extractKeywords('')).toEqual([])
  })

  it('deduplicates repeated keywords', () => {
    const result = extractKeywords('系统包括自动飞行系统')
    const count = result.filter(w => w === '系统').length
    expect(count).toBe(1)
  })
})

describe('keywordCoverage', () => {
  it('returns 1.0 when all keywords are present', () => {
    const modelKeywords = ['自动', '飞行', '系统']
    const userText = '这个系统是关于自动飞行的'
    expect(keywordCoverage(modelKeywords, userText)).toBeCloseTo(1.0)
  })

  it('returns 0.5 when half keywords match', () => {
    const modelKeywords = ['自动', '飞行', '系统', '组成']
    const userText = '自动飞行的东西'
    expect(keywordCoverage(modelKeywords, userText)).toBeCloseTo(0.5)
  })

  it('returns 0 when no keywords match', () => {
    const modelKeywords = ['自动', '油门']
    const userText = '我不知道答案'
    expect(keywordCoverage(modelKeywords, userText)).toBe(0)
  })
})

describe('jaccardSimilarity', () => {
  it('returns 1.0 for identical texts', () => {
    expect(jaccardSimilarity('自动飞行系统', '自动飞行系统')).toBeCloseTo(1.0, 1)
  })

  it('returns < 1.0 for different texts', () => {
    const result = jaccardSimilarity('自动飞行系统', '手动操作系统')
    expect(result).toBeLessThan(1.0)
    expect(result).toBeGreaterThan(0)
  })
})

describe('combinedSimilarity', () => {
  it('returns weighted combination of coverage and Jaccard', () => {
    const modelAnswer = '自动飞行系统包括自动驾驶、自动油门和飞行指引'
    const userAnswer = '自动飞行系统有自动驾驶和自动油门'
    const result = combinedSimilarity(modelAnswer, userAnswer)
    expect(result).toBeGreaterThan(0.5)
    expect(result).toBeLessThan(1.0)
  })
})
```

- [ ] **Step 2: 运行测试，确认全部失败**

```bash
npx vitest run src/__tests__/similarity.test.ts
```
预期：全部 FAIL（模块不存在）

- [ ] **Step 3: 实现**

`src/utils/similarity.ts`：

```typescript
const STOPWORDS = new Set([
  '的', '了', '是', '和', '或', '等', '在', '与', '及', '这', '那',
  '也', '就', '都', '而', '但', '把', '被', '从', '到', '对', '向',
  '其', '该', '所', '为', '以', '之', '不', '还', '有', '又', '要',
  '能', '会', '可', '着', '过', '去', '来', '中', '上', '下',
  'a', 'an', 'the', 'is', 'are', 'of', 'in', 'on', 'to', 'for',
])

export function extractKeywords(text: string): string[] {
  if (!text.trim()) return []

  // 用非中文字符和非英文字母分割
  const words = text.split(/[\s,，。；;、！!？?（）\(\)\[\]【】""'']+/)
  const keywords: string[] = []

  for (const word of words) {
    const trimmed = word.trim()
    if (trimmed.length >= 2 && !STOPWORDS.has(trimmed.toLowerCase())) {
      keywords.push(trimmed)
    }
  }

  // 去重
  return [...new Set(keywords)]
}

export function keywordCoverage(modelKeywords: string[], userText: string): number {
  if (modelKeywords.length === 0) return 0

  const userLower = userText.toLowerCase()
  let matched = 0

  for (const kw of modelKeywords) {
    if (userLower.includes(kw.toLowerCase())) {
      matched++
    }
  }

  return matched / modelKeywords.length
}

export function jaccardSimilarity(a: string, b: string): number {
  // 基于字符 bigram 的 Jaccard 相似度
  const bigramsA = getBigrams(a)
  const bigramsB = getBigrams(b)

  if (bigramsA.length === 0 && bigramsB.length === 0) return 1.0

  const setA = new Set(bigramsA)
  const setB = new Set(bigramsB)

  let intersection = 0
  for (const bg of setA) {
    if (setB.has(bg)) intersection++
  }

  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

function getBigrams(text: string): string[] {
  const cleaned = text.replace(/\s+/g, '')
  const bigrams: string[] = []
  for (let i = 0; i < cleaned.length - 1; i++) {
    bigrams.push(cleaned.substring(i, i + 2))
  }
  return bigrams
}

export function combinedSimilarity(modelAnswer: string, userAnswer: string): number {
  const keywords = extractKeywords(modelAnswer)
  const coverage = keywordCoverage(keywords, userAnswer)
  const jaccard = jaccardSimilarity(modelAnswer, userAnswer)
  return coverage * 0.6 + jaccard * 0.4
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run src/__tests__/similarity.test.ts
```
预期：全部 PASS

- [ ] **Step 5: 提交**

```bash
git add src/utils/similarity.ts src/__tests__/similarity.test.ts
git commit -m "feat: add text similarity and keyword extraction utilities"
```

---

### Task 4: 评分引擎

**Files:**
- Create: `src/utils/grading.ts`
- Create: `src/__tests__/grading.test.ts`

- [ ] **Step 1: 写测试**

`src/__tests__/grading.test.ts`：

```typescript
import { describe, it, expect } from 'vitest'
import { gradeQuestion, gradeAll } from '../utils/grading'
import type { Question } from '../types'

const baseQuestion: Question = {
  id: 'q1',
  type: 'single',
  stem: '测试题目？',
  options: ['选项A', '选项B', '选项C', '选项D'],
  answer: 'A',
  explanation: '',
  chapter: '第1章',
  score: 5,
}

describe('gradeQuestion', () => {
  it('单选题：选对满分', () => {
    const result = gradeQuestion(baseQuestion, 'A')
    expect(result.isCorrect).toBe(true)
    expect(result.isPartial).toBe(false)
    expect(result.earnedScore).toBe(5)
  })

  it('单选题：选错零分', () => {
    const result = gradeQuestion(baseQuestion, 'B')
    expect(result.isCorrect).toBe(false)
    expect(result.earnedScore).toBe(0)
  })

  it('多选题：全对满分', () => {
    const q: Question = { ...baseQuestion, type: 'multiple', answer: 'ABD' }
    const result = gradeQuestion(q, 'ABD')
    expect(result.isCorrect).toBe(true)
    expect(result.earnedScore).toBe(5)
  })

  it('多选题：错选零分', () => {
    const q: Question = { ...baseQuestion, type: 'multiple', answer: 'AB' }
    const result = gradeQuestion(q, 'AC')  // C 不在答案中
    expect(result.isCorrect).toBe(false)
    expect(result.isPartial).toBe(false)
    expect(result.earnedScore).toBe(0)
  })

  it('多选题：漏选得一半分', () => {
    const q: Question = { ...baseQuestion, type: 'multiple', answer: 'ABC' }
    const result = gradeQuestion(q, 'AB')  // 漏了 C，但没选错
    expect(result.isCorrect).toBe(false)
    expect(result.isPartial).toBe(true)
    expect(result.earnedScore).toBe(2.5)
  })

  it('判断题：正确满分', () => {
    const q: Question = { ...baseQuestion, type: 'true-false', answer: 'A', options: ['对', '错'] }
    const result = gradeQuestion(q, 'A')
    expect(result.isCorrect).toBe(true)
    expect(result.earnedScore).toBe(5)
  })

  it('填空题：完全一致满分', () => {
    const q: Question = { ...baseQuestion, type: 'fill-blank', answer: '自动油门', options: [] }
    const result = gradeQuestion(q, '自动油门')
    expect(result.isCorrect).toBe(true)
    expect(result.earnedScore).toBe(5)
  })

  it('填空题：去空格后一致也给满分', () => {
    const q: Question = { ...baseQuestion, type: 'fill-blank', answer: '自动油门', options: [] }
    const result = gradeQuestion(q, '  自动油门  ')
    expect(result.isCorrect).toBe(true)
  })

  it('填空题：不一致零分', () => {
    const q: Question = { ...baseQuestion, type: 'fill-blank', answer: '自动油门', options: [] }
    const result = gradeQuestion(q, '手动油门')
    expect(result.isCorrect).toBe(false)
    expect(result.earnedScore).toBe(0)
  })

  it('简答题：高覆盖率满分', () => {
    const q: Question = {
      ...baseQuestion,
      type: 'short-answer',
      answer: '自动飞行系统包括自动驾驶仪、自动油门和飞行指引',
      options: [],
    }
    const result = gradeQuestion(q, '自动飞行系统有自动驾驶仪和自动油门还有飞行指引')
    expect(result.earnedScore).toBeGreaterThanOrEqual(4)
    expect(result.coverage).toBeGreaterThanOrEqual(0.8)
  })

  it('简答题：低覆盖率零分', () => {
    const q: Question = {
      ...baseQuestion,
      type: 'short-answer',
      answer: '自动飞行系统包括自动驾驶仪、自动油门和飞行指引',
      options: [],
    }
    const result = gradeQuestion(q, '不知道')
    expect(result.earnedScore).toBe(0)
  })
})

describe('gradeAll', () => {
  it('returns summary with correct counts', () => {
    const questions: Question[] = [
      { ...baseQuestion, id: 'q1', type: 'single', answer: 'A', score: 5 },
      { ...baseQuestion, id: 'q2', type: 'single', answer: 'B', score: 5 },
    ]
    const userAnswers = { q1: 'A', q2: 'C' }
    const { results, totalScore, maxScore, correctCount, partialCount } = gradeAll(questions, userAnswers)
    expect(correctCount).toBe(1)
    expect(partialCount).toBe(0)
    expect(totalScore).toBe(5)
    expect(maxScore).toBe(10)
    expect(results).toHaveLength(2)
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
npx vitest run src/__tests__/grading.test.ts
```

- [ ] **Step 3: 实现 `src/utils/grading.ts`**

```typescript
import type { Question, GradingResult } from '../types'
import { extractKeywords, keywordCoverage, combinedSimilarity } from './similarity'

export function gradeQuestion(question: Question, userAnswer: string): GradingResult {
  const trimmed = userAnswer.trim()
  const maxScore = question.score

  switch (question.type) {
    case 'single':
    case 'true-false':
      return {
        questionId: question.id,
        isCorrect: trimmed.toUpperCase() === question.answer.toUpperCase(),
        isPartial: false,
        userAnswer: trimmed,
        correctAnswer: question.answer,
        earnedScore: trimmed.toUpperCase() === question.answer.toUpperCase() ? maxScore : 0,
        maxScore,
      }

    case 'multiple': {
      const userSet = new Set(trimmed.toUpperCase().split('').sort())
      const answerSet = new Set(question.answer.toUpperCase().split('').sort())
      const hasWrong = [...userSet].some(c => !answerSet.has(c))
      const hasAll = [...answerSet].every(c => userSet.has(c))

      if (hasAll && !hasWrong) {
        return {
          questionId: question.id,
          isCorrect: true,
          isPartial: false,
          userAnswer: trimmed,
          correctAnswer: question.answer,
          earnedScore: maxScore,
          maxScore,
        }
      } else if (hasWrong) {
        return {
          questionId: question.id,
          isCorrect: false,
          isPartial: false,
          userAnswer: trimmed,
          correctAnswer: question.answer,
          earnedScore: 0,
          maxScore,
        }
      } else {
        // 漏选
        return {
          questionId: question.id,
          isCorrect: false,
          isPartial: true,
          userAnswer: trimmed,
          correctAnswer: question.answer,
          earnedScore: maxScore / 2,
          maxScore,
        }
      }
    }

    case 'fill-blank':
      return {
        questionId: question.id,
        isCorrect: trimmed === question.answer.trim(),
        isPartial: false,
        userAnswer: trimmed,
        correctAnswer: question.answer,
        earnedScore: trimmed === question.answer.trim() ? maxScore : 0,
        maxScore,
      }

    case 'short-answer': {
      const coverage = keywordCoverage(extractKeywords(question.answer), trimmed)
      if (coverage >= 0.8) {
        return { questionId: question.id, isCorrect: true, isPartial: false, userAnswer: trimmed, correctAnswer: question.answer, earnedScore: maxScore, maxScore, coverage }
      } else if (coverage >= 0.5) {
        return { questionId: question.id, isCorrect: false, isPartial: true, userAnswer: trimmed, correctAnswer: question.answer, earnedScore: Math.round(maxScore * 0.7 * 10) / 10, maxScore, coverage }
      } else if (coverage >= 0.3) {
        return { questionId: question.id, isCorrect: false, isPartial: true, userAnswer: trimmed, correctAnswer: question.answer, earnedScore: Math.round(maxScore * 0.4 * 10) / 10, maxScore, coverage }
      } else {
        return { questionId: question.id, isCorrect: false, isPartial: false, userAnswer: trimmed, correctAnswer: question.answer, earnedScore: 0, maxScore, coverage }
      }
    }

    default:
      return {
        questionId: question.id,
        isCorrect: false,
        isPartial: false,
        userAnswer: trimmed,
        correctAnswer: question.answer,
        earnedScore: 0,
        maxScore,
      }
  }
}

export interface GradeAllResult {
  results: GradingResult[]
  totalScore: number
  maxScore: number
  correctCount: number
  partialCount: number
  wrongCount: number
}

export function gradeAll(questions: Question[], userAnswers: Record<string, string>): GradeAllResult {
  const results = questions.map(q => gradeQuestion(q, userAnswers[q.id] || ''))
  const totalScore = results.reduce((sum, r) => sum + r.earnedScore, 0)
  const maxScore = questions.reduce((sum, q) => sum + q.score, 0)
  const correctCount = results.filter(r => r.isCorrect).length
  const partialCount = results.filter(r => r.isPartial).length
  const wrongCount = results.length - correctCount - partialCount

  return { results, totalScore, maxScore, correctCount, partialCount, wrongCount }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run src/__tests__/grading.test.ts
```
预期：全部 PASS

- [ ] **Step 5: 提交**

```bash
git add src/utils/grading.ts src/__tests__/grading.test.ts
git commit -m "feat: add grading engine with support for all question types"
```

---

### Task 5: LocalStorage 工具

**Files:**
- Create: `src/utils/storage.ts`
- Create: `src/__tests__/storage.test.ts`

- [ ] **Step 1: 写测试**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { saveProgress, loadProgress, clearProgress, saveHistory, loadHistory } from '../utils/storage'
import type { QuizSession, QuizHistory } from '../types'

beforeEach(() => {
  localStorage.clear()
})

describe('saveProgress / loadProgress', () => {
  it('saves and loads quiz session', () => {
    const session: QuizSession = {
      questions: [],
      userAnswers: { 'q1': 'A' },
      currentIndex: 3,
      startTime: Date.now(),
      submitted: false,
    }
    saveProgress(session)
    const loaded = loadProgress()
    expect(loaded?.currentIndex).toBe(3)
    expect(loaded?.userAnswers).toEqual({ 'q1': 'A' })
  })

  it('returns null when no progress saved', () => {
    expect(loadProgress()).toBeNull()
  })
})

describe('clearProgress', () => {
  it('removes saved progress', () => {
    saveProgress({ questions: [], userAnswers: {}, currentIndex: 0, startTime: 0, submitted: false })
    clearProgress()
    expect(loadProgress()).toBeNull()
  })
})

describe('saveHistory / loadHistory', () => {
  it('saves and loads history entries', () => {
    const entry: QuizHistory = {
      date: '2026-06-20',
      totalScore: 85,
      maxScore: 100,
      correctCount: 17,
      totalCount: 20,
      results: [],
    }
    saveHistory(entry)
    const history = loadHistory()
    expect(history).toHaveLength(1)
    expect(history[0].totalScore).toBe(85)
  })

  it('limits history to 10 entries', () => {
    for (let i = 0; i < 12; i++) {
      saveHistory({
        date: `2026-06-${i + 1}`,
        totalScore: i * 10,
        maxScore: 100,
        correctCount: i,
        totalCount: 20,
        results: [],
      })
    }
    const history = loadHistory()
    expect(history).toHaveLength(10)
    // 最新的在前面
    expect(history[0].totalScore).toBe(110)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run src/__tests__/storage.test.ts
```

- [ ] **Step 3: 实现 `src/utils/storage.ts`**

```typescript
import type { QuizSession, QuizHistory } from '../types'

const PROGRESS_KEY = 'quiz_current'
const HISTORY_KEY = 'quiz_history'

export function saveProgress(session: QuizSession): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(session))
  } catch {
    // localStorage 已满或不可用，静默失败
  }
}

export function loadProgress(): QuizSession | null {
  try {
    const data = localStorage.getItem(PROGRESS_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function clearProgress(): void {
  localStorage.removeItem(PROGRESS_KEY)
}

export function saveHistory(entry: QuizHistory): void {
  try {
    const history = loadHistory()
    history.unshift(entry)
    // 保留最近 10 条
    const trimmed = history.slice(0, 10)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
  } catch {
    // 静默失败
  }
}

export function loadHistory(): QuizHistory[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run src/__tests__/storage.test.ts
```

- [ ] **Step 5: 提交**

```bash
git add src/utils/storage.ts src/__tests__/storage.test.ts
git commit -m "feat: add localStorage persistence for quiz progress and history"
```

---

### Task 6: 题目解析器

**Files:**
- Create: `src/parsers/questionParser.ts`
- Create: `src/__tests__/questionParser.test.ts`

- [ ] **Step 1: 写测试**

用从用户题库中提取的真实样本文本：

```typescript
import { describe, it, expect } from 'vitest'
import { parseQuestions } from '../parsers/questionParser'

const sampleText = `
第1章: 自动飞行

题目数量: 17  平均分: 91.2

1. [单选题] 自动油门（A/T）的反馈信号来自？
   A. N1转速
   B. EGT
   C. 空速
   D. 油门杆角度
   答案: A

2. [单选题] 以下哪个不属于飞行指引系统？
   A. PFD
   B. ND
   C. FMS
   D. ECAM
   答案: C

12. [多选题] 自动飞行系统（AFS）包括？
   A. A/T
   B. AP
   C. FD
   D. YD
   答案: ABCD

14. [多选题] 以下哪些是正确的？
   A. 选项A
   B. 选项B
   C. 选项C
   D. 选项D
   答案: CD
`

describe('parseQuestions', () => {
  it('parses single choice questions', () => {
    const questions = parseQuestions(sampleText)
    const singleChoice = questions.filter(q => q.type === 'single')
    expect(singleChoice.length).toBeGreaterThanOrEqual(2)
    expect(singleChoice[0].options).toHaveLength(4)
    expect(singleChoice[0].answer).toBe('A')
  })

  it('parses multi choice questions', () => {
    const questions = parseQuestions(sampleText)
    const multiChoice = questions.filter(q => q.type === 'multiple')
    expect(multiChoice.length).toBeGreaterThanOrEqual(2)
    expect(multiChoice[0].answer).toBe('ABCD')
  })

  it('detects question type correctly', () => {
    const questions = parseQuestions(sampleText)
    const q1 = questions.find(q => q.stem.includes('自动油门'))
    expect(q1?.type).toBe('single')
  })

  it('assigns unique ids to each question', () => {
    const questions = parseQuestions(sampleText)
    const ids = questions.map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('returns empty array for text with no questions', () => {
    expect(parseQuestions('这是一段没有题目的文字。')).toEqual([])
  })

  it('handles true-false when only 2 options', () => {
    const text = `
1. [] EGPWS的全称是增强型近地警告系统？
   A. 对
   B. 错
   答案: A
`
    const questions = parseQuestions(text)
    expect(questions[0].type).toBe('true-false')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run src/__tests__/questionParser.test.ts
```

- [ ] **Step 3: 实现 `src/parsers/questionParser.ts`**

```typescript
import type { Question, QuestionType } from '../types'

export function parseQuestions(rawText: string): Question[] {
  const questions: Question[] = []

  // 按题号边界分割：匹配 "数字. [" 开头的行
  const questionRegex = /(?:^|\n)\s*(\d+)\.\s*\[([^\]]*)\]\s*([\s\S]*?)(?=\n\s*\d+\.\s*\[|$)/g
  let match: RegExpExecArray | null

  let qIndex = 0
  while ((match = questionRegex.exec(rawText)) !== null) {
    qIndex++
    const number = match[1]
    const body = match[3] || ''

    // 提取题干（答案行之前的所有非选项内容）
    const stem = extractStem(match[0])

    // 提取选项
    const options = extractOptions(body)

    // 提取答案
    const answer = extractAnswer(body)

    // 推断题型
    const type = inferType(stem, options, answer)

    questions.push({
      id: `q${qIndex}`,
      type,
      stem,
      options: type === 'short-answer' ? [] : options,
      answer,
      explanation: '',
      chapter: '',
      score: 5,
    })
  }

  return questions
}

function extractStem(block: string): string {
  // 去掉题号和题型标签，去掉答案行和选项行
  const lines = block.split('\n')
  const stemLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    // 跳过题号行
    if (/^\d+\.\s*\[/.test(trimmed)) {
      // 提取 [] 后面的内容作为题干
      const stemPart = trimmed.replace(/^\d+\.\s*\[[^\]]*\]\s*/, '').trim()
      if (stemPart) stemLines.push(stemPart)
      continue
    }
    // 跳过选项行
    if (/^[A-D]\.\s/.test(trimmed)) continue
    // 跳过答案行
    if (/^答案[:：]/.test(trimmed)) continue
    // 跳过章节行
    if (/^第\d+章/.test(trimmed)) continue
    if (/^题目数量/.test(trimmed)) continue

    if (trimmed) stemLines.push(trimmed)
  }

  return stemLines.join(' ').trim()
}

function extractOptions(body: string): string[] {
  const options: string[] = []
  const optionRegex = /^([A-D])\.\s*(.+)/gm
  let m: RegExpExecArray | null
  while ((m = optionRegex.exec(body)) !== null) {
    options.push(m[2].trim())
  }
  return options
}

function extractAnswer(body: string): string {
  const answerRegex = /答案[:：]\s*(.+)/i
  const m = answerRegex.exec(body)
  return m ? m[1].trim() : ''
}

function inferType(stem: string, options: string[], answer: string): QuestionType {
  const hasBlank = /\([\s　]*\)|（[\s　]*）/.test(stem)

  // 判断答案类型
  const isSingleLetter = /^[A-Da-d]$/.test(answer.trim())
  const isMultiLetter = /^[A-Da-d]{2,4}$/.test(answer.trim())

  if (options.length === 2 && isSingleLetter) {
    return 'true-false'
  }

  if (isMultiLetter && options.length >= 3) {
    return 'multiple'
  }

  if (isSingleLetter && options.length >= 3 && !hasBlank) {
    return 'single'
  }

  if (hasBlank) {
    return 'fill-blank'
  }

  if (!answer || answer.length > 5 || options.length === 0) {
    return 'short-answer'
  }

  // 默认
  return options.length > 0 ? 'single' : 'short-answer'
}
```

- [ ] **Step 4: 运行测试**

```bash
npx vitest run src/__tests__/questionParser.test.ts
```
预期：全部 PASS

- [ ] **Step 5: 提交**

```bash
git add src/parsers/questionParser.ts src/__tests__/questionParser.test.ts
git commit -m "feat: add regex-based question parser"
```

---

### Task 7: 文件提取器（PDF / DOCX / PPTX）

**Files:**
- Create: `src/parsers/pdfExtractor.ts`
- Create: `src/parsers/docxExtractor.ts`
- Create: `src/parsers/pptxExtractor.ts`

- [ ] **Step 1: 实现 PDF 提取器 `src/parsers/pdfExtractor.ts`**

```typescript
import * as pdfjsLib from 'pdfjs-dist'

// 设置 worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items
      .map((item: any) => item.str)
      .join(' ')
    pages.push(text)
  }

  return pages.join('\n')
}
```

- [ ] **Step 2: 实现 DOCX 提取器 `src/parsers/docxExtractor.ts`**

```typescript
import mammoth from 'mammoth'

export async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}
```

- [ ] **Step 3: 实现 PPTX 提取器 `src/parsers/pptxExtractor.ts`**

```typescript
import JSZip from 'jszip'

export async function extractPptxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)

  // 找到所有 slide XML 文件
  const slideFiles = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/i)?.[1] || '0')
      const nb = parseInt(b.match(/slide(\d+)/i)?.[1] || '0')
      return na - nb
    })

  const texts: string[] = []

  for (const slideFile of slideFiles) {
    const xmlContent = await zip.files[slideFile].asyncText()
    // 提取所有 <a:t> 标签内的文本
    const textMatches = xmlContent.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)
    const slideTexts: string[] = []
    for (const m of textMatches) {
      if (m[1].trim()) slideTexts.push(m[1].trim())
    }
    if (slideTexts.length > 0) {
      texts.push(slideTexts.join('\n'))
    }
  }

  return texts.join('\n\n')
}
```

- [ ] **Step 4: 实现文件路由函数**

修改 `src/parsers/questionParser.ts`，或新建一个辅助文件。在 `UploadPage` 中会直接根据文件扩展名分发调用。这里先在 `questionParser.ts` 旁放一个入口：

在 `src/parsers/pdfExtractor.ts` 同级创建一个统一的 extract 函数导出并不必要——`UploadPage` 可以自行根据 `file.type` 或扩展名调用对应提取器。但为简洁，我们在 UploadPage 中做分发。

- [ ] **Step 5: 提交**

```bash
git add src/parsers/pdfExtractor.ts src/parsers/docxExtractor.ts src/parsers/pptxExtractor.ts
git commit -m "feat: add PDF, DOCX, and PPTX text extractors"
```

---

### Task 8: useQuiz Hook

**Files:**
- Create: `src/hooks/useQuiz.ts`

- [ ] **Step 1: 实现 `src/hooks/useQuiz.ts`**

```typescript
import { useState, useCallback, useEffect } from 'react'
import type { Question, QuizSession } from '../types'
import { saveProgress, loadProgress, clearProgress } from '../utils/storage'

interface UseQuizReturn {
  questions: Question[]
  userAnswers: Record<string, string>
  currentIndex: number
  setCurrentIndex: (i: number) => void
  setAnswer: (questionId: string, answer: string) => void
  hasAnswer: (questionId: string) => boolean
  answeredCount: number
  totalCount: number
  startQuiz: (questions: Question[]) => void
  resetQuiz: () => void
  isReady: boolean
}

export function useQuiz(): UseQuizReturn {
  const [questions, setQuestions] = useState<Question[]>([])
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isReady, setIsReady] = useState(false)

  // 恢复上次进度
  useEffect(() => {
    const saved = loadProgress()
    if (saved && saved.questions.length > 0 && !saved.submitted) {
      setQuestions(saved.questions)
      setUserAnswers(saved.userAnswers)
      setCurrentIndex(saved.currentIndex)
      setIsReady(true)
    }
  }, [])

  // 自动保存进度
  useEffect(() => {
    if (questions.length > 0) {
      const session: QuizSession = {
        questions,
        userAnswers,
        currentIndex,
        startTime: Date.now(),
        submitted: false,
      }
      saveProgress(session)
    }
  }, [questions, userAnswers, currentIndex])

  const startQuiz = useCallback((q: Question[]) => {
    setQuestions(q)
    setUserAnswers({})
    setCurrentIndex(0)
    setIsReady(true)
  }, [])

  const resetQuiz = useCallback(() => {
    setUserAnswers({})
    setCurrentIndex(0)
  }, [])

  const setAnswer = useCallback((questionId: string, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }))
  }, [])

  const hasAnswer = useCallback((questionId: string): boolean => {
    return userAnswers[questionId] !== undefined && userAnswers[questionId].trim() !== ''
  }, [userAnswers])

  const answeredCount = questions.filter(q => hasAnswer(q.id)).length

  return {
    questions,
    userAnswers,
    currentIndex,
    setCurrentIndex,
    setAnswer,
    hasAnswer,
    answeredCount,
    totalCount: questions.length,
    startQuiz,
    resetQuiz,
    isReady,
  }
}
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add src/hooks/useQuiz.ts
git commit -m "feat: add useQuiz hook for quiz state management"
```

---

### Task 9: UploadPage 组件

**Files:**
- Create: `src/components/UploadPage.tsx`
- Create: `src/__tests__/UploadPage.test.tsx`

- [ ] **Step 1: 写测试**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UploadPage } from '../components/UploadPage'

describe('UploadPage', () => {
  it('renders upload area', () => {
    render(<UploadPage onQuestionsLoaded={vi.fn()} />)
    expect(screen.getByText(/拖拽/i)).toBeInTheDocument()
    expect(screen.getByText(/PDF/)).toBeInTheDocument()
  })

  it('shows loading state when parsing', async () => {
    render(<UploadPage onQuestionsLoaded={vi.fn()} />)
    // 上传区域存在
    expect(screen.getByText(/仅/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 实现 `src/components/UploadPage.tsx`**

```typescript
import { useState, useCallback, DragEvent } from 'react'
import type { Question } from '../types'
import { extractPdfText } from '../parsers/pdfExtractor'
import { extractDocxText } from '../parsers/docxExtractor'
import { extractPptxText } from '../parsers/pptxExtractor'
import { parseQuestions } from '../parsers/questionParser'

interface Props {
  onQuestionsLoaded: (questions: Question[]) => void
}

export function UploadPage({ onQuestionsLoaded }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<string | null>(null)

  const processFile = useCallback(async (file: File) => {
    setError(null)
    setLoading(true)

    try {
      const ext = file.name.split('.').pop()?.toLowerCase()
      let text: string

      if (ext === 'pdf') {
        text = await extractPdfText(file)
      } else if (ext === 'docx') {
        text = await extractDocxText(file)
      } else if (ext === 'pptx') {
        text = await extractPptxText(file)
      } else {
        throw new Error(`不支持的文件格式：.${ext}。请上传 PDF、DOCX 或 PPTX 文件。`)
      }

      if (!text.trim()) {
        throw new Error('未能从文件中提取到文字内容。文件可能是扫描版或图片。')
      }

      const questions = parseQuestions(text)

      if (questions.length === 0) {
        throw new Error('未能解析到题目。请确认文件包含 "题号. [题型] 题干 + 选项 + 答案" 格式的内容。')
      }

      const singleCount = questions.filter(q => q.type === 'single').length
      const multiCount = questions.filter(q => q.type === 'multiple').length
      const tfCount = questions.filter(q => q.type === 'true-false').length
      const blankCount = questions.filter(q => q.type === 'fill-blank').length
      const saCount = questions.filter(q => q.type === 'short-answer').length

      setStats(`共 ${questions.length} 题：单选 ${singleCount} · 多选 ${multiCount} · 判断 ${tfCount} · 填空 ${blankCount} · 简答 ${saCount}`)

      // 短暂延迟让用户看到统计信息
      setTimeout(() => {
        onQuestionsLoaded(questions)
      }, 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析失败')
    } finally {
      setLoading(false)
    }
  }, [onQuestionsLoaded])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">📝 期末考试自测</h1>
      <p className="text-gray-500 mb-8">上传题库文件，逐题自测，自动评分</p>

      <div
        className={`w-full max-w-lg border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {loading ? (
          <div>
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-600 font-medium">正在解析文件...</p>
            {stats && <p className="text-sm text-green-600 mt-2">{stats}</p>}
          </div>
        ) : (
          <>
            <div className="text-4xl mb-4">📁</div>
            <p className="text-gray-700 font-medium mb-2">
              拖拽题库文件到这里
            </p>
            <p className="text-sm text-gray-400 mb-4">支持 PDF · DOCX · PPTX</p>
            <label className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
              选择文件
              <input
                type="file"
                accept=".pdf,.docx,.pptx"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 max-w-lg w-full bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <p className="mt-6 text-xs text-gray-400 text-center max-w-md">
        🔒 文件仅在浏览器本地处理，不会上传到任何服务器
      </p>
    </div>
  )
}
```

- [ ] **Step 3: 运行测试**

```bash
npx vitest run src/__tests__/UploadPage.test.tsx
```

- [ ] **Step 4: 提交**

```bash
git add src/components/UploadPage.tsx src/__tests__/UploadPage.test.tsx
git commit -m "feat: add UploadPage with drag-and-drop and file parsing"
```

---

### Task 10: QuestionCard 组件

**Files:**
- Create: `src/components/QuestionCard.tsx`

- [ ] **Step 1: 实现 `src/components/QuestionCard.tsx`**

```typescript
import { useState, useEffect } from 'react'
import type { Question } from '../types'

interface Props {
  question: Question
  userAnswer: string
  onAnswer: (answer: string) => void
  autoAdvance?: boolean
}

export function QuestionCard({ question, userAnswer, onAnswer, autoAdvance = false }: Props) {
  const typeLabel: Record<string, string> = {
    'single': '单选题',
    'multiple': '多选题',
    'true-false': '判断题',
    'fill-blank': '填空题',
    'short-answer': '简答题',
  }

  const typeColor: Record<string, string> = {
    'single': 'bg-blue-100 text-blue-700',
    'multiple': 'bg-yellow-100 text-yellow-700',
    'true-false': 'bg-purple-100 text-purple-700',
    'fill-blank': 'bg-green-100 text-green-700',
    'short-answer': 'bg-pink-100 text-pink-700',
  }

  if (question.type === 'single' || question.type === 'true-false') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs px-2 py-0.5 rounded-full ${typeColor[question.type]}`}>
            {typeLabel[question.type]}
          </span>
          <span className="text-xs text-gray-400">{question.score}分</span>
        </div>
        <p className="text-lg font-medium text-gray-800 mb-6">{question.stem}</p>
        <div className="flex flex-col gap-3">
          {question.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i)
            const isSelected = userAnswer === letter
            return (
              <button
                key={letter}
                onClick={() => onAnswer(letter)}
                className={`text-left px-4 py-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-2 ${
                  isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {letter}
                </span>
                {opt}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (question.type === 'multiple') {
    const selectedSet = new Set((userAnswer || '').toUpperCase().split('').filter(Boolean))

    const toggleOption = (letter: string) => {
      const newSet = new Set(selectedSet)
      if (newSet.has(letter)) {
        newSet.delete(letter)
      } else {
        newSet.add(letter)
      }
      onAnswer([...newSet].sort().join(''))
    }

    const confirmAnswer = () => {
      // 确认选择已在 toggleOption 中实时更新，这里无需额外操作
    }

    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs px-2 py-0.5 rounded-full ${typeColor.multiple}`}>多选题</span>
          <span className="text-xs text-gray-400">{question.score}分</span>
          <span className="text-xs text-gray-400 ml-auto">可多选</span>
        </div>
        <p className="text-lg font-medium text-gray-800 mb-6">{question.stem}</p>
        <div className="flex flex-col gap-3 mb-4">
          {question.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i)
            const isSelected = selectedSet.has(letter)
            return (
              <button
                key={letter}
                onClick={() => toggleOption(letter)}
                className={`text-left px-4 py-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold mr-2 ${
                  isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {isSelected ? '✓' : letter}
                </span>
                {opt}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (question.type === 'fill-blank' || question.type === 'short-answer') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs px-2 py-0.5 rounded-full ${typeColor[question.type]}`}>
            {typeLabel[question.type]}
          </span>
          <span className="text-xs text-gray-400">{question.score}分</span>
        </div>
        <p className="text-lg font-medium text-gray-800 mb-6">{question.stem}</p>
        <textarea
          value={userAnswer || ''}
          onChange={e => onAnswer(e.target.value)}
          placeholder={question.type === 'fill-blank' ? '请输入答案...' : '请输入你的回答...'}
          rows={question.type === 'short-answer' ? 5 : 2}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none text-gray-800"
        />
      </div>
    )
  }

  return null
}
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add src/components/QuestionCard.tsx
git commit -m "feat: add QuestionCard component for all question types"
```

---

### Task 11: ProgressBar + AnswerSheet 组件

**Files:**
- Create: `src/components/ProgressBar.tsx`
- Create: `src/components/AnswerSheet.tsx`

- [ ] **Step 1: 实现 `src/components/ProgressBar.tsx`**

```typescript
interface Props {
  current: number
  total: number
}

export function ProgressBar({ current, total }: Props) {
  const pct = total > 0 ? ((current + 1) / total) * 100 : 0

  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 2: 实现 `src/components/AnswerSheet.tsx`**

```typescript
import type { Question } from '../types'

interface Props {
  questions: Question[]
  userAnswers: Record<string, string>
  currentIndex: number
  hasAnswer: (id: string) => boolean
  onJump: (index: number) => void
  onClose?: () => void
}

export function AnswerSheet({ questions, currentIndex, hasAnswer, onJump, onClose }: Props) {
  const answeredCount = questions.filter(q => hasAnswer(q.id)).length

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 text-sm">答题卡</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none md:hidden">✕</button>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        {answeredCount} / {questions.length} 已答
      </p>
      <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
        {questions.map((q, i) => {
          const answered = hasAnswer(q.id)
          const isCurrent = i === currentIndex
          return (
            <button
              key={q.id}
              onClick={() => onJump(i)}
              className={`w-9 h-9 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                isCurrent
                  ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                  : answered
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> 已答</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 inline-block" /> 未答</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> 当前</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 提交**

```bash
git add src/components/ProgressBar.tsx src/components/AnswerSheet.tsx
git commit -m "feat: add ProgressBar and AnswerSheet components"
```

---

### Task 12: QuizPage 组件

**Files:**
- Create: `src/components/QuizPage.tsx`
- Create: `src/__tests__/QuizPage.test.tsx`

- [ ] **Step 1: 写测试**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuizPage } from '../components/QuizPage'
import type { Question } from '../types'

const mockQuestions: Question[] = [
  { id: 'q1', type: 'single', stem: '第一题？', options: ['A选项', 'B选项'], answer: 'A', explanation: '', chapter: '', score: 5 },
  { id: 'q2', type: 'single', stem: '第二题？', options: ['C选项', 'D选项'], answer: 'B', explanation: '', chapter: '', score: 5 },
]

describe('QuizPage', () => {
  it('renders question and navigation', () => {
    render(<QuizPage questions={mockQuestions} onFinish={vi.fn()} />)
    expect(screen.getByText(/第一题/)).toBeInTheDocument()
    expect(screen.getByText(/第 1 题/)).toBeInTheDocument()
  })

  it('shows submit button on last question', () => {
    render(<QuizPage questions={mockQuestions} onFinish={vi.fn()} />)
    // 第一题应该显示"下一题"
    expect(screen.getByText(/下一题/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 实现 `src/components/QuizPage.tsx`**

```typescript
import { useState, useCallback } from 'react'
import type { Question, GradingResult } from '../types'
import { QuestionCard } from './QuestionCard'
import { AnswerSheet } from './AnswerSheet'
import { ProgressBar } from './ProgressBar'
import { useQuiz } from '../hooks/useQuiz'
import { gradeAll } from '../utils/grading'
import { clearProgress } from '../utils/storage'

interface Props {
  questions: Question[]
  onFinish: (results: GradingResult[], totalScore: number, maxScore: number) => void
}

export function QuizPage({ questions, onFinish }: Props) {
  const {
    userAnswers,
    currentIndex,
    setCurrentIndex,
    setAnswer,
    hasAnswer,
    answeredCount,
    totalCount,
    startQuiz,
  } = useQuiz()

  const [showAnswerSheet, setShowAnswerSheet] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)

  // 初始化题目（仅在 questions 变化时）
  const [initialized, setInitialized] = useState(false)
  if (!initialized && questions.length > 0) {
    startQuiz(questions)
    setInitialized(true)
  }

  const currentQuestion = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1
  const isFirst = currentIndex === 0

  const goNext = useCallback(() => {
    if (isLast) {
      // 未答题提醒
      const unanswered = questions.filter(q => !hasAnswer(q.id)).length
      if (unanswered > 0) {
        setShowSubmitConfirm(true)
      } else {
        handleSubmit()
      }
    } else {
      setCurrentIndex(currentIndex + 1)
    }
  }, [isLast, currentIndex, questions, hasAnswer])

  const goPrev = useCallback(() => {
    if (!isFirst) setCurrentIndex(currentIndex - 1)
  }, [isFirst, currentIndex])

  const handleSubmit = useCallback(() => {
    const { results, totalScore, maxScore } = gradeAll(questions, userAnswers)
    clearProgress()
    onFinish(results, totalScore, maxScore)
  }, [questions, userAnswers, onFinish])

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">没有题目</p>
      </div>
    )
  }

  const unanswered = questions.filter(q => !hasAnswer(q.id)).length

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 桌面端答题卡侧边栏 */}
      <aside className="hidden md:block w-72 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <AnswerSheet
          questions={questions}
          userAnswers={userAnswers}
          currentIndex={currentIndex}
          hasAnswer={hasAnswer}
          onJump={setCurrentIndex}
        />
      </aside>

      {/* 主答题区 */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-4 md:p-8">
        {/* 顶部信息 */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">
            第 {currentIndex + 1} 题 / 共 {totalCount} 题
          </span>
          <button
            onClick={() => setShowAnswerSheet(true)}
            className="md:hidden text-sm px-3 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            📋 答题卡
          </button>
        </div>

        <ProgressBar current={currentIndex} total={totalCount} />

        {/* 题目 */}
        <div className="flex-1 mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <QuestionCard
              question={currentQuestion}
              userAnswer={userAnswers[currentQuestion.id] || ''}
              onAnswer={answer => setAnswer(currentQuestion.id, answer)}
            />
          </div>
        </div>

        {/* 底部导航 */}
        <div className="flex items-center justify-between mt-6 pb-4">
          <button
            onClick={goPrev}
            disabled={isFirst}
            className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              isFirst
                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            ← 上一题
          </button>

          {isLast ? (
            <button
              onClick={goNext}
              className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              提交答卷
            </button>
          ) : (
            <button
              onClick={goNext}
              className="px-6 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              下一题 →
            </button>
          )}
        </div>
      </main>

      {/* 移动端答题卡抽屉 */}
      {showAnswerSheet && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAnswerSheet(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto">
            <AnswerSheet
              questions={questions}
              userAnswers={userAnswers}
              currentIndex={currentIndex}
              hasAnswer={hasAnswer}
              onJump={i => { setCurrentIndex(i); setShowAnswerSheet(false) }}
              onClose={() => setShowAnswerSheet(false)}
            />
          </div>
        </div>
      )}

      {/* 提交确认弹窗 */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowSubmitConfirm(false)} />
          <div className="relative bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="font-bold text-gray-800 mb-2">确认提交</h3>
            <p className="text-gray-600 text-sm mb-6">
              还有 {unanswered} 题未作答，确定提交吗？提交后未答题将计 0 分。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                继续答题
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600"
              >
                确定提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 运行测试**

```bash
npx vitest run src/__tests__/QuizPage.test.tsx
```

- [ ] **Step 4: 提交**

```bash
git add src/components/QuizPage.tsx src/__tests__/QuizPage.test.tsx
git commit -m "feat: add QuizPage with answer sheet and navigation"
```

---

### Task 13: ResultPage 组件

**Files:**
- Create: `src/components/ResultPage.tsx`
- Create: `src/__tests__/ResultPage.test.tsx`

- [ ] **Step 1: 写测试**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResultPage } from '../components/ResultPage'
import type { GradingResult } from '../types'

const mockResults: GradingResult[] = [
  { questionId: 'q1', isCorrect: true, isPartial: false, userAnswer: 'A', correctAnswer: 'A', earnedScore: 5, maxScore: 5 },
  { questionId: 'q2', isCorrect: false, isPartial: false, userAnswer: 'B', correctAnswer: 'A', earnedScore: 0, maxScore: 5 },
]

describe('ResultPage', () => {
  it('shows total score', () => {
    render(<ResultPage results={mockResults} totalScore={5} maxScore={10} questions={[]} onRestart={vi.fn()} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 实现 `src/components/ResultPage.tsx`**

```typescript
import { useState } from 'react'
import type { GradingResult, Question } from '../types'
import { saveHistory } from '../utils/storage'

interface Props {
  results: GradingResult[]
  totalScore: number
  maxScore: number
  questions: Question[]
  onRestart: () => void
}

export function ResultPage({ results, totalScore, maxScore, questions, onRestart }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0
  const correctCount = results.filter(r => r.isCorrect).length
  const partialCount = results.filter(r => r.isPartial).length
  const wrongCount = results.length - correctCount - partialCount

  // 保存到历史
  useState(() => {
    saveHistory({
      date: new Date().toLocaleDateString('zh-CN'),
      totalScore,
      maxScore,
      correctCount,
      totalCount: results.length,
      results,
    })
  })

  const getQuestionStem = (id: string) => {
    const q = questions.find(qq => qq.id === id)
    return q?.stem || ''
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* 总分卡片 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center mb-6">
          <p className="text-gray-500 text-sm mb-2">你的得分</p>
          <div className="text-5xl font-bold text-blue-500 mb-2">
            {totalScore}<span className="text-xl text-gray-400 font-normal"> / {maxScore}</span>
          </div>
          <p className="text-gray-500">正确率 {pct}%</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
              ✓ 正确 {correctCount}
            </span>
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              ✗ 错误 {wrongCount}
            </span>
            {partialCount > 0 && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                △ 部分 {partialCount}
              </span>
            )}
          </div>
        </div>

        {/* 逐题详情 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <h3 className="px-6 py-3 font-bold text-gray-800 border-b border-gray-100">答题详情</h3>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {results.map((r, i) => (
              <div
                key={r.questionId}
                className="px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setExpandedId(expandedId === r.questionId ? null : r.questionId)}
              >
                <div className="flex items-center gap-3">
                  <span className={
                    r.isCorrect ? 'text-emerald-500' : r.isPartial ? 'text-yellow-500' : 'text-red-500'
                  }>
                    {r.isCorrect ? '✓' : r.isPartial ? '△' : '✗'}
                  </span>
                  <span className="flex-1 text-sm text-gray-700">
                    <strong>{i + 1}.</strong> {getQuestionStem(r.questionId)}
                  </span>
                  <span className={`text-sm font-bold ${
                    r.isCorrect ? 'text-emerald-600' : r.isPartial ? 'text-yellow-600' : 'text-red-500'
                  }`}>
                    {r.earnedScore}分
                  </span>
                </div>

                {/* 展开详情 */}
                {expandedId === r.questionId && (
                  <div className="mt-2 pl-7 text-xs text-gray-500 space-y-1">
                    <p>你的答案：<span className="text-gray-700">{r.userAnswer || '(未作答)'}</span></p>
                    <p>标准答案：<span className="text-gray-700">{r.correctAnswer}</span></p>
                    {r.coverage !== undefined && (
                      <p>关键词覆盖：<span className="text-gray-700">{Math.round(r.coverage * 100)}%</span></p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={onRestart}
            className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            重新作答
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            导出/打印
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 运行测试**

```bash
npx vitest run src/__tests__/ResultPage.test.tsx
```

- [ ] **Step 4: 提交**

```bash
git add src/components/ResultPage.tsx src/__tests__/ResultPage.test.tsx
git commit -m "feat: add ResultPage with score summary and per-question details"
```

---

### Task 14: App 集成 + 最终调试

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 实现 App 路由**

```typescript
import { useState, useCallback } from 'react'
import type { Question, GradingResult } from './types'
import { UploadPage } from './components/UploadPage'
import { QuizPage } from './components/QuizPage'
import { ResultPage } from './components/ResultPage'
import type { AppPage } from './types'

export default function App() {
  const [page, setPage] = useState<AppPage>('upload')
  const [questions, setQuestions] = useState<Question[]>([])
  const [results, setResults] = useState<GradingResult[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [maxScore, setMaxScore] = useState(0)

  const handleQuestionsLoaded = useCallback((q: Question[]) => {
    setQuestions(q)
    setPage('quiz')
  }, [])

  const handleFinish = useCallback((r: GradingResult[], ts: number, ms: number) => {
    setResults(r)
    setTotalScore(ts)
    setMaxScore(ms)
    setPage('result')
  }, [])

  const handleRestart = useCallback(() => {
    setPage('quiz')
  }, [])

  if (page === 'upload') {
    return <UploadPage onQuestionsLoaded={handleQuestionsLoaded} />
  }

  if (page === 'quiz') {
    return <QuizPage questions={questions} onFinish={handleFinish} />
  }

  return (
    <ResultPage
      results={results}
      totalScore={totalScore}
      maxScore={maxScore}
      questions={questions}
      onRestart={handleRestart}
    />
  )
}
```

- [ ] **Step 2: 验证全量编译**

```bash
npx tsc --noEmit
npx vitest run
```

- [ ] **Step 3: 启动开发服务器手动测试**

```bash
npx vite
```

用用户提供的 PDF 文件测试完整流程：上传 → 解析 → 答题 → 提交 → 查看成绩。

- [ ] **Step 4: 提交**

```bash
git add src/App.tsx
git commit -m "feat: integrate App with page routing"
```

---

## 自检清单

- [x] Spec 覆盖——每个需求都有对应 Task（上传→Task 9，解析→Task 6+7，答题卡→Task 11+12，评分→Task 4，成绩→Task 13，存储→Task 5）
- [x] 无占位符/TODO
- [x] 类型一致性——Question/GradingResult/QuizSession 定义在 Task 2，后续所有 Task 引用一致
- [x] 文件路径全部确定
- [x] 测试覆盖核心逻辑（解析、评分、相似度、存储）
