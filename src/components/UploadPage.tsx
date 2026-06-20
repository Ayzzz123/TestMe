import { useState, useCallback, useRef, type DragEvent } from 'react'
import type { Question } from '../types'
import { extractPdfText } from '../parsers/pdfExtractor'
import { extractDocxText } from '../parsers/docxExtractor'
import { extractPptxText } from '../parsers/pptxExtractor'
import { parseQuestions } from '../parsers/questionParser'

interface Props {
  onQuestionsLoaded: (questions: Question[]) => void
}

export function UploadPage({ onQuestionsLoaded }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    setError(null)
    setLoading(true)

    try {
      const ext = file.name.split('.').pop()?.toLowerCase()
      let text: string

      if (ext === 'pdf') {
        text = await extractPdfText(file)
      } else if (ext === 'docx') {
        text = await extractDocxText(file)
      } else if (ext === 'pptx') {
        text = await extractPptxText(file)
      } else if (ext === 'txt') {
        text = await file.text()
      } else {
        throw new Error(`不支持的文件格式：.${ext}。请上传 PDF、DOCX、PPTX 或 TXT 文件。`)
      }

      if (!text.trim()) {
        throw new Error('未能从文件中提取到文字内容。文件可能是扫描版或图片，请尝试导出为 TXT 后重新上传。')
      }

      const questions = parseQuestions(text)

      if (questions.length === 0) {
        throw new Error('未能解析到题目。请确认文件包含 "题号. [题型] 题干 + 选项 + 答案" 格式的内容。')
      }

      const singleCount = questions.filter(q => q.type === 'single').length
      const multiCount = questions.filter(q => q.type === 'multiple').length
      const tfCount = questions.filter(q => q.type === 'true-false').length
      const blankCount = questions.filter(q => q.type === 'fill-blank').length
      const saCount = questions.filter(q => q.type === 'short-answer').length

      setStats(`共 ${questions.length} 题：单选 ${singleCount} · 多选 ${multiCount} · 判断 ${tfCount} · 填空 ${blankCount} · 简答 ${saCount}`)

      // 短暂延迟让用户看到统计信息
      setTimeout(() => {
        onQuestionsLoaded(questions)
      }, 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析失败')
    } finally {
      setLoading(false)
    }
  }, [onQuestionsLoaded])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">📝 期末考试自测</h1>
      <p className="text-gray-500 mb-8">上传题库文件，逐题自测，自动评分</p>

      <div
        className={`w-full max-w-lg border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {loading ? (
          <div>
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-600 font-medium">正在解析文件...</p>
            {stats && <p className="text-sm text-green-600 mt-2">{stats}</p>}
          </div>
        ) : (
          <>
            <div className="text-4xl mb-4">📁</div>
            <p className="text-gray-700 font-medium mb-2">
              拖拽题库文件到这里
            </p>
            <p className="text-sm text-gray-400 mb-4">支持 PDF · DOCX · PPTX · TXT</p>
            <label className="relative inline-block px-6 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors overflow-hidden">
              选择文件
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.pptx,.txt"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </label>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 max-w-lg w-full bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <p className="mt-6 text-xs text-gray-400 text-center max-w-md">
        🔒 文件仅在浏览器本地处理，不会上传到任何服务器
      </p>
    </div>
  )
}
