import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateCrc,
  calculateFlsm,
  calculateIpv4Subnet,
  calculateNodalDelay,
  calculateVlsm,
} from '../src/utils/networkingMath.ts';

test('calculates subnet boundaries, masks, and usable host counts', () => {
  const subnet = calculateIpv4Subnet('10.1.4.77', 26);
  assert.equal(subnet?.subnetMask, '255.255.255.192');
  assert.equal(subnet?.networkAddress, '10.1.4.64');
  assert.equal(subnet?.broadcastAddress, '10.1.4.127');
  assert.equal(subnet?.firstUsableIp, '10.1.4.65');
  assert.equal(subnet?.lastUsableIp, '10.1.4.126');
  assert.equal(subnet?.usableHosts, 62);
});

test('rejects malformed IPv4 octets and non-integer prefixes', () => {
  assert.equal(calculateIpv4Subnet('10.1.4.77abc', 26), null);
  assert.equal(calculateIpv4Subnet('10.1.4.256', 26), null);
  assert.equal(calculateIpv4Subnet('10.1.4.77', 26.5), null);
});

test('treats /31 as two usable point-to-point addresses', () => {
  const subnet = calculateIpv4Subnet('192.0.2.10', 31);
  assert.equal(subnet?.usableHosts, 2);
  assert.equal(subnet?.firstUsableIp, '192.0.2.10');
  assert.equal(subnet?.lastUsableIp, '192.0.2.11');
});

test('allocates aligned fixed-length subnets', () => {
  const subnets = calculateFlsm('192.168.1.0', 24, 4);
  assert.equal(subnets.length, 4);
  assert.equal(subnets[0].networkId, '192.168.1.0/26');
  assert.equal(subnets[0].broadcast, '192.168.1.63');
  assert.equal(subnets[3].networkId, '192.168.1.192/26');
  assert.deepEqual(calculateFlsm('not-an-ip', 24, 4), []);
});

test('allocates variable-length subnets largest first and reports overflow', () => {
  const result = calculateVlsm('10.0.0.0', 24, [
    { name: 'Small', hosts: 2 },
    { name: 'Large', hosts: 60 },
    { name: 'Medium', hosts: 30 },
  ]);
  assert.deepEqual(result.allocations.map((item) => item.networkId), ['10.0.0.0/26', '10.0.0.64/27', '10.0.0.96/30']);
  assert.equal(result.allocations[2].broadcastId, '10.0.0.99');
  assert.equal(result.isOverflow, false);

  const overflow = calculateVlsm('10.0.0.0', 30, [{ name: 'Too large', hosts: 100 }]);
  assert.equal(overflow.isOverflow, true);
  assert.equal(overflow.allocations.length, 0);
});

test('calculates transmission and propagation delay for a known example', () => {
  const result = calculateNodalDelay(1500, 100, 2000, 0, 0);
  assert.equal(result.transmissionDelayMs, 0.12);
  assert.equal(result.propagationDelayMs, 10);
  assert.equal(result.bandwidthDelayProductBits, 2_000_000);
});

test('calculates a CRC remainder and transmitted codeword', () => {
  const result = calculateCrc('11010011101100', '1011');
  assert.equal(result.crcRemainder, '100');
  assert.equal(result.codewordTransmitted, '11010011101100100');
});
