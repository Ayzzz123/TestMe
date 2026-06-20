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
