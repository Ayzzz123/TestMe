const fs = require('fs');
const path = require('path');

// Read the mammoth markdown output
const raw = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'engine-raw.md'), 'utf-8');

// Strip HTML tags to get plain text
const text = raw
  .replace(/<p>/g, '\n')
  .replace(/<\/p>/g, '')
  .replace(/<br\s*\/?>/g, '\n')
  .replace(/&gt;/g, '>')
  .replace(/&lt;/g, '<')
  .replace(/&amp;/g, '&');

// Split into lines and normalize
const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

// Join back to process
const full = lines.join('\n');

// Now parse questions. We need to find patterns like:
// "N.题目：..." or "N.(单选题,0.4分)" followed by stem, options, answer
// The answer format is "答案：X" or "答案：XY"

// First, let's find all question boundaries
// Questions start with a number followed by . or .
// Pattern: "N.题目：" or "N.(单选题" or "N. " or "N."

// Let's use a regex to split by question numbers
// We'll match "N." at the start of a line (or after a newline)

const questionStarts = [];
const numRegex = /^(\d+)\.\s*/gm;
let match;
while ((match = numRegex.exec(full)) !== null) {
  questionStarts.push({ num: parseInt(match[1]), pos: match.index });
}

console.log(`Found ${questionStarts.length} question starts`);

const questions = [];

for (let i = 0; i < questionStarts.length; i++) {
  const start = questionStarts[i].pos;
  const end = i < questionStarts.length - 1 ? questionStarts[i + 1].pos : full.length;
  const block = full.slice(start, end).trim();

  // Parse the question block
  const q = parseBlock(block, questionStarts[i].num);
  if (q) {
    questions.push(q);
  }
}

console.log(`Parsed ${questions.length} questions`);

// Write JSON
const outputPath = path.join(__dirname, '..', 'src', 'data', 'engine-exam.json');
fs.writeFileSync(outputPath, JSON.stringify(questions), 'utf-8');
console.log(`Written to ${outputPath}`);

function parseBlock(block, num) {
  // Remove the question number prefix
  let content = block.replace(/^\d+\.\s*/, '');

  // Strip section headers that leaked into blocks
  content = content
    .replace(/^一、选择题（单选）\s*/g, '')
    .replace(/^二、多选题\s*/g, '')
    .replace(/\n一、选择题（单选）\s*/g, '\n')
    .replace(/\n二、多选题\s*/g, '\n');

  // Check for type tags like "(单选题,0.4分)"
  content = content.replace(/^\(单选题[^)]*\)\s*/, '');
  content = content.replace(/^\(多选题[^)]*\)\s*/, '');

  // Remove "题目：" prefix
  content = content.replace(/^题目[：:]\s*/, '');

  // Extract answer - look for "答案：X" at the end
  let answer = '';
  const answerMatch = content.match(/答案[：:]\s*(.+?)\s*$/m);
  if (answerMatch) {
    answer = answerMatch[1].trim();
    // Remove the answer line from content
    content = content.replace(/\n*答案[：:].*$/m, '');
  }

  // Handle inline multi-option: "A.xxx  B.yyy  C.zzz  D.www" on one line
  // Split option text that contains embedded [B-E]. markers
  content = content.replace(/^([A-E])\.\s*(.+)$/gm, (match, letter, text) => {
    // Check if this line's text contains more option markers
    const embedded = text.split(/\s+(?=[B-E]\.)/);
    if (embedded.length > 1) {
      return `${letter}. ${embedded[0]}\n` + embedded.slice(1).join('\n');
    }
    return match;
  });

  // Extract options - lines starting with A. B. C. D. E.
  const options = [];
  const optionRegex = /^([A-E])\.\s*(.+)$/gm;
  let optMatch;
  const optionPositions = [];
  while ((optMatch = optionRegex.exec(content)) !== null) {
    optionPositions.push({
      letter: optMatch[1],
      text: optMatch[2].trim(),
      pos: optMatch.index,
      endPos: optMatch.index + optMatch[0].length
    });
  }

  // Extract stem (everything before options)
  let stem = content;
  if (optionPositions.length > 0) {
    const firstOptPos = optionPositions[0].pos;
    stem = content.slice(0, firstOptPos).trim();
  }

  // Clean stem: remove remaining tags, normalize whitespace
  stem = stem
    .replace(/^\([^)]*\)\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Sort options by letter
  optionPositions.sort((a, b) => a.letter.localeCompare(b.letter));
  const sortedOptions = optionPositions.map(o => o.text);

  // Determine type from answer: multi-letter → multiple, single-letter → single
  let type = 'single';
  if (answer.length > 1 && /^[A-E]{2,}$/.test(answer)) {
    type = 'multiple';
  }

  const id = `eng-q${num}`;

  return {
    id,
    type,
    stem,
    options: sortedOptions,
    answer,
    explanation: '',
    chapter: '',
    score: 5,
  };
}
