import assert from 'node:assert/strict';
import test from 'node:test';

import { ACADEMIC_EXPERIMENTS } from '../src/data/labData.ts';
import { FIVE_UNITS_DATA } from '../src/data/units/index.ts';
import { TOPIC_LAB_MAPPINGS, UNIT_LAB_MAPPINGS } from '../src/data/syllabusLabMappings.ts';

test('every syllabus unit lab mapping points to an existing experiment', () => {
  const availableLabNumbers = new Set(ACADEMIC_EXPERIMENTS.map((experiment) => experiment.number));
  for (const [unitNumber, labNumbers] of Object.entries(UNIT_LAB_MAPPINGS)) {
    for (const labNumber of labNumbers) {
      assert.ok(availableLabNumbers.has(labNumber), `Unit ${unitNumber} maps to missing Lab ${labNumber}`);
    }
  }
});

test('Unit 5 maps only to the existing Telnet lab, not routing experiments', () => {
  const mappedLabs = UNIT_LAB_MAPPINGS[5].map((number) => ACADEMIC_EXPERIMENTS.find((lab) => lab.number === number));
  assert.deepEqual(mappedLabs.map((lab) => lab?.number), [15]);
  assert.match(mappedLabs[0]?.title ?? '', /Telnet/i);
  assert.ok(!UNIT_LAB_MAPPINGS[5].includes(13));
  assert.ok(!UNIT_LAB_MAPPINGS[5].includes(14));
});

test('every Unit 5 topic has a reachable standards or study reference', () => {
  const unitFive = FIVE_UNITS_DATA.find((unit) => unit.unitNumber === 5);
  assert.ok(unitFive);
  assert.equal(unitFive.topics.length, 5);
  for (const topic of unitFive.topics) {
    assert.ok(topic.references?.length, `${topic.id} has no reference link`);
    for (const reference of topic.references) {
      assert.match(reference.url, /^https:\/\//, `${topic.id}: ${reference.url}`);
    }
  }
});

test('every syllabus topic-to-lab shortcut points at an existing experiment', () => {
  for (const [topicId, mapping] of Object.entries(TOPIC_LAB_MAPPINGS)) {
    assert.ok(FIVE_UNITS_DATA.some((unit) => unit.topics.some((topic) => topic.id === topicId)), `Unknown topic ${topicId}`);
    assert.ok(ACADEMIC_EXPERIMENTS.some((lab) => lab.number === mapping.labNumber), `${topicId} links to a missing lab`);
  }
});
