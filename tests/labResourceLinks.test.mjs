import assert from 'node:assert/strict';
import test from 'node:test';

import { ACADEMIC_EXPERIMENTS } from '../src/data/labData.ts';
import { buildLabVideoSearchUrl } from '../src/utils/labResourceLinks.ts';

test('all 15 lab reference links use HTTPS and have descriptive titles', () => {
  assert.equal(ACADEMIC_EXPERIMENTS.length, 15);
  for (const experiment of ACADEMIC_EXPERIMENTS) {
    assert.match(experiment.resources.referenceUrl, /^https:\/\//, experiment.title);
    assert.ok(experiment.resources.referenceTitle.trim(), experiment.title);
    assert.ok(experiment.resources.youtubeTitle.trim(), experiment.title);
  }
});

test('each lab video action opens a YouTube search for that experiment topic', () => {
  for (const experiment of ACADEMIC_EXPERIMENTS) {
    const searchUrl = new URL(buildLabVideoSearchUrl(experiment));
    assert.equal(searchUrl.origin, 'https://www.youtube.com');
    assert.equal(searchUrl.pathname, '/results');
    assert.match(searchUrl.searchParams.get('search_query') ?? '', new RegExp(experiment.resources.youtubeTitle.split(' ')[0], 'i'));
  }
});
