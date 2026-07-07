# 智能间隔重复复习 — 设计文档

**日期:** 2026-07-07
**状态:** 已确认
**主题:** 为 TestMe 添加基于 SM-2 算法的间隔重复复习系统

---

## 1. 概述

### 1.1 目标

让 TestMe 从"一次性自测工具"升级为"长期记忆巩固平台"。用户在作业或模拟考试中答错的题目自动进入复习队列，系统根据艾宾浩斯遗忘曲线在最佳时间点推送复习，直到用户真正掌握。

### 1.2 核心价值

- 将被动刷题转为主动记忆巩固
- 错题不再被遗忘，而是被系统性消化
- 零外部依赖，纯本地存储，离线可用
- 在航空考试工具细分领域属于差异化功能

---

## 2. 用户体验流程

### 2.1 首页新增「今日复习」卡片

在科目列表上方新增复习入口卡片，显示：
- 今日待复习题数
- 按轮次分类：第1轮 / 第2轮+ / 巩固中
- 复习总览：待复习总量、已掌握数、掌握率
- 点击进入复习模式

### 2.2 成绩页自动衔接

提交作业或考试后，成绩页底部提示：
> "X 道错题已加入复习计划" + 一键跳转复习按钮

### 2.3 复习模式

与普通答题共用 QuestionCard 组件，差异：
- 顶部标签显示复习轮次和上次答对时间
- 作答后用户自评记忆质量（0-5 分），系统据此调整间隔
- 完成显示本轮统计，返回首页

### 2.4 节奏控制

- 每天仅推送到期题目
- 用户可随时主动复习
- 无待复习时卡片收缩为"全部已掌握"

---

## 3. 数据模型

### 3.1 ReviewItem 类型

```typescript
interface ReviewItem {
  questionId: string    // 关联题目 ID
  efactor: number       // 难度因子，初始 2.5，范围 1.3~2.5
  interval: number      // 当前间隔（天），初始 1
  repetitions: number   // 连续答对次数，答错重置为 0
  nextReview: string    // 下次复习日期 (ISO)
  lastReview: string    // 上次复习日期 (ISO)
  lastQuality: number   // 上次自评质量 0-5
  mastered: boolean     // 是否已掌握
}
```

### 3.2 存储

```
localStorage:
  quiz_reviews → ReviewItem[]
```

`quiz_history` 和 `quiz_current` 保持不变。

---

## 4. SM-2 算法

```
quality ≥ 3 (答对):
  if repetitions == 0: interval = 1
  elif repetitions == 1: interval = 6
  else: interval = interval × efactor
  repetitions += 1

quality < 3 (答错):
  interval = 1
  repetitions = 0

efactor = efactor + (0.1 - (5 - quality) × (0.08 + (5 - quality) × 0.02))
efactor = max(efactor, 1.3)

nextReview = today + interval 天

毕业条件: repetitions ≥ 4 && interval ≥ 90 → mastered = true
```

### 自评质量参考

| 分数 | 含义 |
|------|------|
| 0 | 完全忘记 |
| 1 | 有印象但答错 |
| 2 | 答错但看答案后想起 |
| 3 | 答对但有犹豫 |
| 4 | 答对且较流畅 |
| 5 | 非常轻松答对 |

---

## 5. 架构

### 5.1 新增文件

```
src/
├── utils/
│   └── spacedRepetition.ts    # SM-2 算法 + 队列管理
└── components/
    └── ReviewDashboard.tsx     # 首页复习入口卡片
```

### 5.2 修改文件

| 文件 | 改动 |
|------|------|
| `types/index.ts` | 新增 ReviewItem 类型 |
| `utils/storage.ts` | 新增 saveReviews / loadReviews |
| `components/HomePage.tsx` | 引入 ReviewDashboard |
| `components/ResultPage.tsx` | 错题自动入队 + 入队提示 |
| `components/QuizPage.tsx` | 新增复习模式（isReviewMode） |

### 5.3 spacedRepetition.ts 模块接口

```typescript
sm2(quality: number, item: ReviewItem): ReviewItem
enqueueReview(questionId: string): void
getDueReviews(questions: Question[]): ReviewItem[]
getReviewStats(): { due: number, total: number, mastered: number, pct: number }
recordReview(questionId: string, quality: number): void
```

### 5.4 QuizPage 双模式

| | 普通模式 | 复习模式 |
|------|---------|---------|
| 题目来源 | 作业/考试 | getDueReviews() |
| 判分 | 自动对答案 | 用户自评 0-5 |
| 顶部标识 | 题号 | 轮次 + 上次答对时间 |
| 完成后 | 成绩页 | 更新队列 + 统计数据 |

### 5.5 错题入队（去重）

- `enqueueReview` 先检查 questionId 是否已在队列
- 已存在 → 跳过
- 已掌握 → 重置为初始状态重新入队

---

## 6. 测试计划

- `spacedRepetition.test.ts`: SM-2 算法单元测试（各种 quality 输入 → 验证 interval/efactor/repetitions 输出）
- `spacedRepetition.test.ts`: 队列管理测试（入队去重、到期筛选、已掌握重新入队）
- `ReviewDashboard.test.tsx`: 组件渲染测试（有待复习 / 无待复习两种状态）

---

## 7. 非目标（本期不做）

- 不新增服务端/后端
- 不接入外部 API
- 不修改现有题库数据结构
- 不改变普通答题流程
