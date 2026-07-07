import { describe, it, expect, beforeEach } from 'vitest'
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
    const result = sm2(5, makeItem())
    // interval=1, so nextReview = tomorrow
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    expect(result.nextReview).toBe(tomorrow)
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
