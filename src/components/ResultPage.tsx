import { useState } from 'react'
import type { GradingResult, Question } from '../types'
import { saveHistory } from '../utils/storage'

interface Props {
  results: GradingResult[]
  totalScore: number
  maxScore: number
  questions: Question[]
  examTitle: string
  onRestart: () => void
  onGoHome: () => void
}

export function ResultPage({ results, totalScore, maxScore, questions, examTitle, onRestart, onGoHome }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const displayScore = Math.round(totalScore * 100) / 100
  const displayMax = Math.round(maxScore * 100) / 100
  const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0
  const correctCount = results.filter(r => r.isCorrect).length
  const partialCount = results.filter(r => r.isPartial).length
  const wrongCount = results.length - correctCount - partialCount

  if (!saved) {
    saveHistory({
      date: new Date().toLocaleDateString('zh-CN'),
      totalScore: displayScore,
      maxScore: displayMax,
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

  const scoreEmoji = pct >= 90 ? '🎉' : pct >= 70 ? '👍' : pct >= 50 ? '📚' : '💪'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* 总分卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mb-6 mt-4">
          {examTitle && (
            <p className="text-gray-400 text-sm mb-1">{examTitle}</p>
          )}
          <p className="text-gray-400 text-sm mb-3">你的得分</p>
          <div className="text-6xl font-bold text-blue-500 mb-2 tracking-tight">
            {displayScore}
            <span className="text-xl text-gray-300 font-normal ml-1">/ {displayMax}</span>
          </div>
          <p className="text-gray-400 text-sm mb-4">{scoreEmoji} 正确率 {pct}%</p>

          {/* 得分环 */}
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <span className="text-2xl font-bold text-emerald-600">{correctCount}</span>
              </div>
              <span className="text-xs text-gray-400 mt-1">正确</span>
            </div>
            {partialCount > 0 && (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
                  <span className="text-2xl font-bold text-amber-600">{partialCount}</span>
                </div>
                <span className="text-xs text-gray-400 mt-1">部分</span>
              </div>
            )}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                <span className="text-2xl font-bold text-red-500">{wrongCount}</span>
              </div>
              <span className="text-xs text-gray-400 mt-1">错误</span>
            </div>
          </div>
        </div>

        {/* 逐题详情 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <h3 className="px-6 py-4 font-bold text-gray-800 border-b border-gray-50">答题详情</h3>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {results.map((r, i) => (
              <div
                key={r.questionId}
                className="px-6 py-3 hover:bg-gray-50/50 cursor-pointer transition-colors"
                onClick={() => setExpandedId(expandedId === r.questionId ? null : r.questionId)}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                    r.isCorrect
                      ? 'bg-emerald-50 text-emerald-500'
                      : r.isPartial
                        ? 'bg-amber-50 text-amber-500'
                        : 'bg-red-50 text-red-500'
                  }`}>
                    {r.isCorrect ? '✓' : r.isPartial ? '△' : '✗'}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 truncate">
                    <strong className="text-gray-400 mr-1">{i + 1}.</strong>
                    {getQuestionStem(r.questionId)}
                  </span>
                  <span className={`text-sm font-bold flex-shrink-0 ${
                    r.isCorrect ? 'text-emerald-600' : r.isPartial ? 'text-amber-600' : 'text-red-500'
                  }`}>
                    {Math.round(r.earnedScore * 100) / 100} 分
                  </span>
                </div>

                {expandedId === r.questionId && (
                  <div className="mt-2 ml-10 text-xs space-y-1.5 bg-gray-50 rounded-xl p-3">
                    <div className="flex gap-2">
                      <span className="text-gray-400 flex-shrink-0">你的答案：</span>
                      <span className={`font-medium ${r.isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                        {r.userAnswer || '(未作答)'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-gray-400 flex-shrink-0">标准答案：</span>
                      <span className="font-medium text-gray-700">{r.correctAnswer}</span>
                    </div>
                    {r.coverage !== undefined && (
                      <div className="flex gap-2">
                        <span className="text-gray-400 flex-shrink-0">关键词覆盖：</span>
                        <span className="font-medium text-gray-700">{Math.round(r.coverage * 100)}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 操作 */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={onRestart}
            className="flex-1 py-3.5 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 shadow-sm shadow-blue-200 transition-all"
          >
            重新作答
          </button>
          <button
            onClick={onGoHome}
            className="py-3.5 px-6 border border-gray-200 bg-white text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-all"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  )
}
