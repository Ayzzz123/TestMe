import { getDueReviewItems, getReviewStats } from '../utils/spacedRepetition'

interface Props {
  onStartReview: () => void
}

export function ReviewDashboard({ onStartReview }: Props) {
  const stats = getReviewStats()
  const dueItems = getDueReviewItems()

  // Count items by review round
  const round1 = dueItems.filter(r => r.repetitions === 0).length
  const round2Plus = dueItems.filter(r => r.repetitions >= 1 && r.repetitions < 4).length
  const consolidating = dueItems.filter(r => r.repetitions >= 4).length

  // No reviews at all → don't show
  if (stats.total === 0) return null

  // No due reviews → collapsed state
  if (stats.due === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl flex items-center justify-center text-xl shadow-sm">
            ✅
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm">全部已掌握</h3>
            <p className="text-xs text-gray-400">
              {stats.mastered} 题已掌握 · 复习队列 {stats.total} 题
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
      <div
        onClick={onStartReview}
        className="px-6 py-5 cursor-pointer hover:bg-purple-50/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl flex items-center justify-center text-xl shadow-sm">
            🧠
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800 text-sm">今日复习</h3>
              <span className="text-xs font-bold text-white bg-purple-500 px-2 py-0.5 rounded-full">
                {stats.due} 题待复习
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
              {round1 > 0 && <span>🟢 {round1}题 · 第1轮</span>}
              {round2Plus > 0 && <span>🟡 {round2Plus}题 · 巩固</span>}
              {consolidating > 0 && <span>🔴 {consolidating}题 · 冲刺</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-lg font-bold text-purple-600">{stats.pct}%</div>
            <div className="text-[10px] text-gray-400">掌握率</div>
          </div>
        </div>
      </div>
    </div>
  )
}
