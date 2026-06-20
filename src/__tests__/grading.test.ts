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
      answer: '自动驾驶仪控制飞机姿态高度速度',
      options: [],
    }
    const result = gradeQuestion(q, '自动驾驶仪控制飞机的姿态高度还有速度')
    expect(result.earnedScore).toBeGreaterThanOrEqual(4)
    expect(result.coverage).toBeGreaterThanOrEqual(0.8)
  })

  it('简答题：低覆盖率零分', () => {
    const q: Question = {
      ...baseQuestion,
      type: 'short-answer',
      answer: '自动驾驶仪控制飞机姿态高度速度',
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
