import assert from 'node:assert/strict';
import test from 'node:test';
import { EXAM_QUESTIONS } from '../src/data/questionsData.ts';

test('the graded quiz has at least 100 unique, complete multiple-choice questions', () => {
  assert.ok(EXAM_QUESTIONS.length >= 100);
  assert.equal(new Set(EXAM_QUESTIONS.map((question) => question.id)).size, EXAM_QUESTIONS.length);
  for (const question of EXAM_QUESTIONS) {
    assert.equal(question.options.length, 4, question.id);
    assert.equal(new Set(question.options.map((option) => option.text)).size, 4, question.id);
    assert.ok(question.options.some((option) => option.id === question.correctOptionId), question.id);
    assert.ok(question.explanation.trim(), question.id);
  }
});
