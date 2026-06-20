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
