import assert from 'node:assert/strict';
import test from 'node:test';
import { LEARNING_RESOURCES } from '../src/data/resourceLibrary.ts';

test('resource library has unique IDs and valid source metadata', () => {
  const ids = LEARNING_RESOURCES.map((resource) => resource.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const resource of LEARNING_RESOURCES) {
    assert.ok(resource.title.trim());
    assert.ok(resource.description.trim());
    assert.ok(resource.topic.trim());
    assert.ok(resource.provider.trim());
    assert.match(resource.url, /^https:\/\//);
    assert.ok(resource.tags.length > 0);
    assert.ok(resource.status);
    assert.ok(resource.lastChecked);
  }
});

test('YouTube discovery searches are not represented as verified videos', () => {
  const searches = LEARNING_RESOURCES.filter((resource) => resource.kind === 'YouTube search');
  assert.ok(searches.length >= 50);
  for (const resource of searches) {
    assert.equal(resource.status, 'Discovery link');
    assert.match(resource.url, /^https:\/\/www\.youtube\.com\/results\?/);
    assert.match(resource.description, /not individually reviewed videos/i);
  }
});

test('retains the existing practical lab collection in the resource hub', () => {
  assert.equal(LEARNING_RESOURCES.filter((resource) => resource.kind === 'Lab').length, 15);
});

test('includes official simulator, tool, and protocol reference categories', () => {
  for (const kind of ['Simulator', 'Tool', 'Protocol specification']) {
    assert.ok(LEARNING_RESOURCES.some((resource) => resource.kind === kind));
  }
  assert.ok(LEARNING_RESOURCES.some((resource) => resource.id === 'rfc-tcp' && resource.url.endsWith('/rfc/rfc9293')));
});
