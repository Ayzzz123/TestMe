import type { Question } from '../types'

interface Props {
  question: Question
  userAnswer: string
  onAnswer: (answer: string) => void
}

export function QuestionCard({ question, userAnswer, onAnswer }: Props) {
  const typeLabel: Record<string, string> = {
    'single': '单选题',
    'multiple': '多选题',
    'true-false': '判断题',
    'fill-blank': '填空题',
    'short-answer': '简答题',
  }

  const typeColor: Record<string, string> = {
    'single': 'bg-blue-100 text-blue-700',
    'multiple': 'bg-yellow-100 text-yellow-700',
    'true-false': 'bg-purple-100 text-purple-700',
    'fill-blank': 'bg-green-100 text-green-700',
    'short-answer': 'bg-pink-100 text-pink-700',
  }

  if (question.type === 'single' || question.type === 'true-false') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs px-2 py-0.5 rounded-full ${typeColor[question.type]}`}>
            {typeLabel[question.type]}
          </span>
          <span className="text-xs text-gray-400">{question.score}分</span>
        </div>
        <p className="text-lg font-medium text-gray-800 mb-6">{question.stem}</p>
        <div className="flex flex-col gap-3">
          {question.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i)
            const isSelected = userAnswer === letter
            return (
              <button
                key={letter}
                onClick={() => onAnswer(letter)}
                className={`text-left px-4 py-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-2 ${
                  isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {letter}
                </span>
                {opt}
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
      if (newSet.has(letter)) {
        newSet.delete(letter)
      } else {
        newSet.add(letter)
      }
      onAnswer([...newSet].sort().join(''))
    }

    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs px-2 py-0.5 rounded-full ${typeColor.multiple}`}>多选题</span>
          <span className="text-xs text-gray-400">{question.score}分</span>
          <span className="text-xs text-gray-400 ml-auto">可多选</span>
        </div>
        <p className="text-lg font-medium text-gray-800 mb-6">{question.stem}</p>
        <div className="flex flex-col gap-3">
          {question.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i)
            const isSelected = selectedSet.has(letter)
            return (
              <button
                key={letter}
                onClick={() => toggleOption(letter)}
                className={`text-left px-4 py-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold mr-2 ${
                  isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {isSelected ? '✓' : letter}
                </span>
                {opt}
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
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs px-2 py-0.5 rounded-full ${typeColor[question.type]}`}>
            {typeLabel[question.type]}
          </span>
          <span className="text-xs text-gray-400">{question.score}分</span>
        </div>
        <p className="text-lg font-medium text-gray-800 mb-6">{question.stem}</p>
        <textarea
          value={userAnswer || ''}
          onChange={e => onAnswer(e.target.value)}
          placeholder={question.type === 'fill-blank' ? '请输入答案...' : '请输入你的回答...'}
          rows={question.type === 'short-answer' ? 5 : 2}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none text-gray-800"
        />
      </div>
    )
  }

  return null
}
