import type { ReviewItem } from '../types'
import { loadReviews, saveReviews } from './storage'

/** Today's date as YYYY-MM-DD */
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Add N days to a date string */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** SM-2 core algorithm: update review item based on self-assessed quality (0-5) */
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

/** Create a fresh ReviewItem with default SM-2 starting values */
function makeReviewItem(questionId: string): ReviewItem {
  return {
    questionId,
    efactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReview: today(),
    lastReview: today(),
    lastQuality: 0,
    mastered: false,
  }
}

/** Add a wrong answer to the review queue (dedup) */
export function enqueueReview(questionId: string): void {
  const reviews = loadReviews()
  const idx = reviews.findIndex(r => r.questionId === questionId)

  if (idx !== -1) {
    if (reviews[idx].mastered) {
      reviews[idx] = makeReviewItem(questionId)
      saveReviews(reviews)
    }
    return
  }

  reviews.push(makeReviewItem(questionId))
  saveReviews(reviews)
}

/** Get a combined snapshot of due items and stats (single localStorage read, single pass) */
export function getReviewSnapshot(): {
  dueItems: ReviewItem[]
  stats: { due: number; total: number; mastered: number; pct: number }
} {
  const reviews = loadReviews()
  const t = today()
  const dueItems: ReviewItem[] = []
  let mastered = 0

  for (const r of reviews) {
    if (r.mastered) { mastered++ }
    else if (r.nextReview <= t) { dueItems.push(r) }
  }

  const total = reviews.length
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0
  return { dueItems, stats: { due: dueItems.length, total, mastered, pct } }
}

/** Get review items due today (not mastered) */
export function getDueReviewItems(): ReviewItem[] {
  return getReviewSnapshot().dueItems
}

/** Get review statistics */
export function getReviewStats(): { due: number; total: number; mastered: number; pct: number } {
  return getReviewSnapshot().stats
}

/** Record a review result and update the item */
export function recordReview(questionId: string, quality: number): void {
  const reviews = loadReviews()
  const idx = reviews.findIndex(r => r.questionId === questionId)
  if (idx === -1) return
  reviews[idx] = sm2(quality, reviews[idx])
  saveReviews(reviews)
}

/** Clear all review data (for testing) */
export function clearAllReviews(): void {
  saveReviews([])
}
