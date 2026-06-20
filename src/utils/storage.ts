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
