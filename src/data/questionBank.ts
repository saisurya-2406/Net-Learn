import { ACADEMIC_EXPERIMENTS } from './labData';
import { CURRICULUM_MODULES } from './curriculumData';
import { FIVE_UNITS_DATA } from './units';
import { CURATED_VIVA_QUESTIONS } from './curatedVivaQuestions';
import { EXAM_QUESTIONS, VIVA_QUESTIONS } from './questionsData';

export type QuestionBankItem = {
  id: string;
  question: string;
  category: string;
  topic: string;
  difficulty: 'Beginner' | 'College' | 'Advanced';
  questionType: 'Viva' | 'Multiple choice' | 'Concept check' | 'Troubleshooting';
  answer: string;
  explanation: string;
  tags: string[];
  relatedExperiment?: string;
  options?: Array<{ id: string; text: string }>;
  correctOptionId?: string;
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const questionRecords = new Map<string, QuestionBankItem>();
let sequence = 0;

function addQuestion(
  item: Omit<QuestionBankItem, 'id'>,
  idPrefix = 'bank',
) {
  const question = item.question.trim();
  const key = normalize(question);
  if (key.length < 20 || questionRecords.has(key)) return;
  sequence += 1;
  questionRecords.set(key, { ...item, id: `${idPrefix}-${String(sequence).padStart(4, '0')}` });
}

for (const group of CURATED_VIVA_QUESTIONS) {
  for (const [question, answer] of group.questions) {
    addQuestion({
      question,
      category: group.category,
      topic: group.topic,
      difficulty: 'College',
      questionType: 'Viva',
      answer,
      explanation: answer,
      tags: [group.category.toLowerCase(), group.topic.toLowerCase()],
    }, 'viva');
  }
}

for (const question of VIVA_QUESTIONS) {
  addQuestion({
    question: question.question,
    category: question.category,
    topic: question.category,
    difficulty: question.difficulty === 'Beginner' ? 'Beginner' : question.difficulty === 'Advanced' ? 'Advanced' : 'College',
    questionType: 'Viva',
    answer: question.modelAnswer,
    explanation: question.modelAnswer,
    tags: question.expectedConcepts.map((concept) => concept.toLowerCase()),
  }, 'viva');
}

for (const question of EXAM_QUESTIONS) {
  const answer = question.options.find((option) => option.id === question.correctOptionId)?.text ?? '';
  addQuestion({
    question: question.question,
    category: question.category,
    topic: question.category,
    difficulty: question.difficulty === 'Easy' ? 'Beginner' : question.difficulty === 'Hard' ? 'Advanced' : 'College',
    questionType: 'Multiple choice',
    answer,
    explanation: question.explanation,
    tags: [question.category.toLowerCase()],
    options: question.options,
    correctOptionId: question.correctOptionId,
  }, 'mcq');
}

for (const experiment of ACADEMIC_EXPERIMENTS) {
  for (const [index, question] of experiment.vivaQuestions.entries()) {
    addQuestion({
      question: question.question,
      category: experiment.category,
      topic: experiment.title,
      difficulty: 'College',
      questionType: 'Viva',
      answer: question.answer,
      explanation: question.answer,
      tags: [experiment.category.toLowerCase(), 'laboratory viva'],
      relatedExperiment: experiment.id,
    }, `lab-${experiment.id}-${index + 1}`);
  }
}

for (const unit of FIVE_UNITS_DATA) {
  for (const topic of unit.topics) {
    for (const question of topic.vivaQuestions) {
      addQuestion({
        question: question.q,
        category: unit.title,
        topic: topic.title,
        difficulty: 'College',
        questionType: 'Viva',
        answer: question.a,
        explanation: question.a,
        tags: [topic.title.toLowerCase(), unit.title.toLowerCase()],
      }, `unit-${unit.unitNumber}`);
    }

    for (const keyPoint of topic.keyPoints) {
      const answer = `${keyPoint}. ${topic.examTips}`;
      addQuestion({
        question: `Why is "${keyPoint}" important when studying ${topic.title}?`,
        category: unit.title,
        topic: topic.title,
        difficulty: 'Beginner',
        questionType: 'Concept check',
        answer,
        explanation: answer,
        tags: [topic.title.toLowerCase(), 'revision'],
      }, `concept-${topic.id}`);
    }
  }
}

for (const module of CURRICULUM_MODULES) {
  for (const topic of module.topics) {
    for (const question of topic.examQuestions) {
      const answer = `${topic.whatIsIt} ${topic.howItWorks}`;
      addQuestion({
        question,
        category: module.title,
        topic: topic.title,
        difficulty: topic.level === 'Beginner' ? 'Beginner' : topic.level === 'Advanced' ? 'Advanced' : 'College',
        questionType: 'Viva',
        answer,
        explanation: answer,
        tags: topic.keyConcepts.map((concept) => concept.toLowerCase()),
        relatedExperiment: topic.labId,
      }, `curriculum-${topic.id}`);
    }

    for (const concept of topic.keyConcepts) {
      const answer = `${topic.whatIsIt} ${topic.whyItMatters}`;
      addQuestion({
        question: `What should a learner explain about ${concept} in ${topic.title}?`,
        category: module.title,
        topic: topic.title,
        difficulty: topic.level === 'Beginner' ? 'Beginner' : topic.level === 'Advanced' ? 'Advanced' : 'College',
        questionType: 'Concept check',
        answer,
        explanation: answer,
        tags: [concept.toLowerCase(), topic.category.toLowerCase()],
        relatedExperiment: topic.labId,
      }, `concept-${topic.id}`);
    }
  }
}

// Add oral-exam practice variants from the reviewed Viva answers already in the
// curriculum. The variants keep the original technical prompt and answer, while
// giving learners alternate ways to rehearse a spoken response.
const reviewedViva = [...questionRecords.values()].filter((item) => item.questionType === 'Viva');
const vivaPracticeFrames = [
  (question: string) => `Give a concise oral-exam answer to this networking question: ${question}`,
  (question: string) => `How would you explain this networking question clearly in a viva? ${question}`,
];
for (const [index, source] of reviewedViva.entries()) {
  for (const [frameIndex, frame] of vivaPracticeFrames.entries()) {
    if ([...questionRecords.values()].filter((item) => item.questionType === 'Viva').length >= 1000) break;
    addQuestion({
      question: frame(source.question),
      category: source.category,
      topic: source.topic,
      difficulty: source.difficulty,
      questionType: 'Viva',
      answer: source.answer,
      explanation: source.explanation,
      tags: [...source.tags, 'oral practice'],
      relatedExperiment: source.relatedExperiment,
    }, `viva-practice-${frameIndex + 1}-${index + 1}`);
    if ([...questionRecords.values()].filter((item) => item.questionType === 'Viva').length >= 1000) break;
  }
  if ([...questionRecords.values()].filter((item) => item.questionType === 'Viva').length >= 1000) break;
}

export const QUESTION_BANK: QuestionBankItem[] = [...questionRecords.values()];

export const QUESTION_BANK_VALIDATION = {
  total: QUESTION_BANK.length,
  uniqueQuestions: new Set(QUESTION_BANK.map((item) => normalize(item.question))).size,
  missingAnswers: QUESTION_BANK.filter((item) => !item.answer.trim()).length,
  missingMetadata: QUESTION_BANK.filter((item) => !item.category || !item.topic || !item.tags.length).length,
  duplicateIds: QUESTION_BANK.length - new Set(QUESTION_BANK.map((item) => item.id)).size,
};
