import { describe, it, expect } from 'vitest'
import { parseQuestions } from '../parsers/questionParser'
import { readFileSync } from 'fs'

describe('UTF-8 PDF parsing', () => {
  it('parses all 112 questions from the sample file', () => {
    const text = readFileSync('avionics-utf8.txt', 'utf8')
    const questions = parseQuestions(text)

    console.log('Total:', questions.length)
    console.log('Single:', questions.filter(q => q.type === 'single').length)
    console.log('Multiple:', questions.filter(q => q.type === 'multiple').length)
    console.log('TrueFalse:', questions.filter(q => q.type === 'true-false').length)
    console.log('FillBlank:', questions.filter(q => q.type === 'fill-blank').length)
    console.log('ShortAnswer:', questions.filter(q => q.type === 'short-answer').length)

    if (questions.length > 0) {
      console.log('\nFirst 5:')
      questions.slice(0, 5).forEach(q => {
        console.log(`  ${q.id} [${q.type}] "${q.stem.substring(0, 60)}" → ${q.answer}`)
      })
      console.log('\nMulti-choice samples:')
      questions.filter(q => q.type === 'multiple').slice(0, 3).forEach(q => {
        console.log(`  ${q.id}: answer=${q.answer}, options=${JSON.stringify(q.options)}`)
      })
    }

    expect(questions.length).toBeGreaterThanOrEqual(100)
  })
})
