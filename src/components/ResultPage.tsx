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
  const [saved, setSaved] = useState(false)

  const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0
  const correctCount = results.filter(r => r.isCorrect).length
  const partialCount = results.filter(r => r.isPartial).length
  const wrongCount = results.length - correctCount - partialCount

  // 保存到历史（只保存一次）
  if (!saved) {
    saveHistory({
      date: new Date().toLocaleDateString('zh-CN'),
      totalScore,
      maxScore,
      correctCount,
      totalCount: results.length,
      results,
    })
    setSaved(true)
  }

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
                  <span className="flex-1 text-sm text-gray-700 truncate">
                    <strong>{i + 1}.</strong> {getQuestionStem(r.questionId)}
                  </span>
                  <span className={`text-sm font-bold ${
                    r.isCorrect ? 'text-emerald-600' : r.isPartial ? 'text-yellow-600' : 'text-red-500'
                  }`}>
                    {r.earnedScore}分
                  </span>
                </div>

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
