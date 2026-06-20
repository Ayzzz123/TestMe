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
