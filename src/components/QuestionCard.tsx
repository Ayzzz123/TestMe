import type { Question } from '../types'

interface Props {
  question: Question
  userAnswer: string
  onAnswer: (answer: string) => void
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'single':       { label: '单选题', color: 'text-blue-600', bg: 'bg-blue-50' },
  'multiple':     { label: '多选题', color: 'text-amber-600', bg: 'bg-amber-50' },
  'true-false':   { label: '判断题', color: 'text-violet-600', bg: 'bg-violet-50' },
  'fill-blank':   { label: '填空题', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'short-answer': { label: '简答题', color: 'text-rose-600', bg: 'bg-rose-50' },
}

export function QuestionCard({ question, userAnswer, onAnswer }: Props) {
  const cfg = TYPE_CONFIG[question.type]

  if (question.type === 'single' || question.type === 'true-false') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-5">
          <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </span>
          <span className="text-xs text-gray-400">{question.score} 分</span>
        </div>
        <p className="text-lg font-semibold text-gray-800 leading-relaxed mb-6">{question.stem}</p>
        <div className="flex flex-col gap-2.5">
          {question.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i)
            const isSelected = userAnswer === letter
            return (
              <button
                key={letter}
                onClick={() => onAnswer(letter)}
                className={`group text-left px-5 py-3.5 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-400 bg-blue-50 shadow-sm'
                    : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-white'
                }`}
              >
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold mr-3 transition-all ${
                  isSelected
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-400 group-hover:border-gray-300'
                }`}>
                  {letter}
                </span>
                <span className={isSelected ? 'text-blue-800 font-medium' : 'text-gray-700'}>{opt}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (question.type === 'multiple') {
    const selectedSet = new Set((userAnswer || '').toUpperCase().split('').filter(Boolean))

    const toggleOption = (letter: string) => {
      const newSet = new Set(selectedSet)
      if (newSet.has(letter)) newSet.delete(letter)
      else newSet.add(letter)
      onAnswer([...newSet].sort().join(''))
    }

    return (
      <div>
        <div className="flex items-center gap-2 mb-5">
          <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </span>
          <span className="text-xs text-gray-400">{question.score} 分</span>
          <span className="text-xs text-gray-400 ml-auto bg-gray-100 px-2 py-0.5 rounded-full">多选</span>
        </div>
        <p className="text-lg font-semibold text-gray-800 leading-relaxed mb-6">{question.stem}</p>
        <div className="flex flex-col gap-2.5">
          {question.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i)
            const isSelected = selectedSet.has(letter)
            return (
              <button
                key={letter}
                onClick={() => toggleOption(letter)}
                className={`group text-left px-5 py-3.5 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-400 bg-blue-50 shadow-sm'
                    : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-white'
                }`}
              >
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold mr-3 transition-all ${
                  isSelected
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-400 group-hover:border-gray-300'
                }`}>
                  {isSelected ? '✓' : letter}
                </span>
                <span className={isSelected ? 'text-blue-800 font-medium' : 'text-gray-700'}>{opt}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (question.type === 'fill-blank' || question.type === 'short-answer') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-5">
          <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </span>
          <span className="text-xs text-gray-400">{question.score} 分</span>
        </div>
        <p className="text-lg font-semibold text-gray-800 leading-relaxed mb-6">{question.stem}</p>
        <textarea
          value={userAnswer || ''}
          onChange={e => onAnswer(e.target.value)}
          placeholder={question.type === 'fill-blank' ? '输入答案...' : '输入你的回答...'}
          rows={question.type === 'short-answer' ? 5 : 2}
          className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-400 focus:bg-white focus:outline-none resize-none text-gray-800 transition-all placeholder:text-gray-300"
        />
      </div>
    )
  }

  return null
}
