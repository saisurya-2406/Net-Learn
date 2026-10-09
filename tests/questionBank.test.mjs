import assert from 'node:assert/strict';
import test from 'node:test';

import { QUESTION_BANK, QUESTION_BANK_VALIDATION } from '../src/data/questionBank.ts';

test('loads at least 500 distinct, answered question records', () => {
  assert.ok(QUESTION_BANK_VALIDATION.total >= 500);
  assert.equal(QUESTION_BANK_VALIDATION.uniqueQuestions, QUESTION_BANK_VALIDATION.total);
  assert.equal(QUESTION_BANK_VALIDATION.missingAnswers, 0);
  assert.equal(QUESTION_BANK_VALIDATION.missingMetadata, 0);
  assert.equal(QUESTION_BANK_VALIDATION.duplicateIds, 0);
});

test('includes at least 1,000 viva prompts and accurately keyed multiple-choice answers', () => {
  const vivaCount = QUESTION_BANK.filter((question) => question.questionType === 'Viva').length;
  const multipleChoiceQuestions = QUESTION_BANK.filter((question) => question.questionType === 'Multiple choice');

  assert.ok(vivaCount >= 1000);
  assert.ok(multipleChoiceQuestions.length > 0);
  for (const question of multipleChoiceQuestions) {
    assert.ok(question.options?.some((option) => option.id === question.correctOptionId));
    assert.equal(
      question.answer,
      question.options?.find((option) => option.id === question.correctOptionId)?.text,
    );
    assert.ok(question.explanation.length > question.answer.length);
  }
});

test('contains verified numerical-answer examples with their working', () => {
  const serialization = QUESTION_BANK.find((question) =>
    question.question === 'How long does it take to serialize 1,500 bytes at 100 Mb/s, ignoring overhead?');
  const subnet = QUESTION_BANK.find((question) =>
    question.question === 'What is the network address for 10.1.4.77/26?');
  const propagation = QUESTION_BANK.find((question) =>
    question.question === 'What is the propagation delay for 2,000 km at 200,000 km/s?');

  assert.match(serialization?.answer ?? '', /0\.12 ms/);
  assert.match(subnet?.answer ?? '', /10\.1\.4\.64\/26/);
  assert.match(propagation?.answer ?? '', /10 ms one way/);
});
