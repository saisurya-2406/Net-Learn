import test from 'node:test';
import assert from 'node:assert/strict';
import { ACADEMIC_EXPERIMENTS } from '../src/data/labData.ts';
import { runCliScript } from '../src/utils/routerCli.ts';

test('all 15 published lab manuals contain a topology and verification objective', () => {
  assert.equal(ACADEMIC_EXPERIMENTS.length, 15);
  for (const lab of ACADEMIC_EXPERIMENTS) {
    assert.ok(lab.initialTopology.devices.length, `Lab ${lab.number} needs devices`);
    assert.ok(lab.verificationCheck.description && lab.verificationCheck.hint, `Lab ${lab.number} needs verification guidance`);
  }
});

test('IOS commands published by the 15 labs are accepted by the simulated router/switch CLI', () => {
  const failures = [];
  for (const lab of ACADEMIC_EXPERIMENTS) {
    let devices = [...lab.initialTopology.devices];
    const sessions = new Map();
    for (const reference of lab.cliCommands || []) {
      const marker = reference.search(/[>#]/);
      if (marker < 0) continue;
      const prompt = reference.slice(0, marker);
      if (/^(PC|Remote-PC)/i.test(prompt)) continue;
      const promptDevice = prompt.replace(/\([^)]*\)/g, '');
      let device = devices.find(item => item.name.toLowerCase() === promptDevice.toLowerCase());
      if (!device) device = devices.find(item => item.type === 'router') || devices.find(item => item.type === 'switch');
      if (!device) continue;
      const prior = sessions.get(device.id) || { mode: 'priv', selectedInterface: '' };
      const result = runCliScript(device, prior, reference);
      const errors = result.output.filter(line => /^%\s*(Invalid input|Usage:|Command is unavailable|Selected interface|Next hop|Invalid or ambiguous|Switchport commands)/i.test(line));
      if (errors.length) failures.push(`Lab ${lab.number} [${reference}]: ${errors.join(' ')}`);
      devices = devices.map(item => item.id === device.id ? result.device : item);
      sessions.set(device.id, result.session);
    }
  }
  assert.deepEqual(failures, []);
});
