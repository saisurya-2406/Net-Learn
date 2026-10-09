import { setTimeout as sleep } from 'node:timers/promises';
import { LEARNING_RESOURCES } from '../src/data/resourceLibrary.ts';

const checkable = LEARNING_RESOURCES.filter((resource) => !resource.appSection && resource.status !== 'Discovery link');
const lastRequestByOrigin = new Map();
let available = 0;
let manualReview = 0;

for (const resource of checkable) {
  const origin = new URL(resource.url).origin;
  const lastRequest = lastRequestByOrigin.get(origin) ?? 0;
  const waitMs = Math.max(0, 1000 - (Date.now() - lastRequest));
  if (waitMs) await sleep(waitMs);
  lastRequestByOrigin.set(origin, Date.now());

  try {
    let response = await fetch(resource.url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
      headers: { 'user-agent': 'NetLearnResourceLinkCheck/1.0' },
    });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(resource.url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(10_000),
        headers: { range: 'bytes=0-0', 'user-agent': 'NetLearnResourceLinkCheck/1.0' },
      });
      await response.body?.cancel();
    }
    if (response.ok) {
      available += 1;
      console.log(`AVAILABLE ${response.status} ${resource.url}`);
    } else {
      manualReview += 1;
      console.log(`REVIEW HTTP ${response.status} ${resource.url}`);
    }
  } catch (error) {
    manualReview += 1;
    console.log(`REVIEW REQUEST FAILED (${error instanceof Error ? error.message : 'unknown error'}) ${resource.url}`);
  }
}

console.log(`\n${available} responded successfully; ${manualReview} need manual review. Failures are not proof that a resource is permanently broken.`);
