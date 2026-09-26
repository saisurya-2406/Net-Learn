/**
 * Networking Numerical Mathematics & Protocol Algorithms Engine
 */

export interface SubnetResult {
  ip: string;
  prefix: number;
  ipBinary: string;
  subnetMask: string;
  subnetMaskBinary: string;
  wildcardMask: string;
  networkAddress: string;
  networkAddressBinary: string;
  broadcastAddress: string;
  broadcastAddressBinary: string;
  firstUsableIp: string;
  lastUsableIp: string;
  totalHosts: number;
  usableHosts: number;
  ipClass: 'A' | 'B' | 'C' | 'D' | 'E';
  isPrivate: boolean;
}

export interface FlsmSubnet {
  index: number;
  networkId: string;
  firstUsable: string;
  lastUsable: string;
  broadcast: string;
  usableHosts: number;
}

export interface VlsmAllocation {
  name: string;
  neededHosts: number;
  allocatedHosts: number;
  hostBits: number;
  prefix: number;
  subnetMask: string;
  networkId: string;
  broadcastId: string;
  firstUsable: string;
  lastUsable: string;
  percentageOfBase: number;
}

export interface NodalDelayResult {
  packetSizeBytes: number;
  bandwidthMbps: number;
  distanceKm: number;
  propagationSpeedMps: number;
  processingDelayMs: number;
  queuingDelayMs: number;
  transmissionDelayMs: number;
  propagationDelayMs: number;
  totalDelayMs: number;
  bandwidthDelayProductBits: number;
  optimalTcpWindowBytes: number;
  steps: string[];
}

export interface CrcCalculationStep {
  currentDividend: string;
  quotientBit: '0' | '1';
  subtrahend: string;
  remainder: string;
}

export interface CrcResult {
  dataBits: string;
  generatorBits: string;
  paddedData: string;
  crcRemainder: string;
  codewordTransmitted: string;
  steps: CrcCalculationStep[];
}

// Convert dotted-decimal IP to 32-bit unsigned number
export function ipToNumber(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

// Convert 32-bit unsigned number to dotted-decimal IP
export function numberToIp(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join('.');
}

// Convert number to 8-bit binary string
export function toByteBinary(num: number): string {
  return (num >>> 0).toString(2).padStart(8, '0');
}

// Convert dotted IP to 32-bit binary string (with dots between octets)
export function ipToBinaryString(ip: string): string {
  return ip
    .split('.')
    .map(oct => parseInt(oct, 10).toString(2).padStart(8, '0'))
    .join('.');
}

// Calculate prefix mask to number
export function prefixToNumber(prefix: number): number {
  if (prefix === 0) return 0;
  return (~0 << (32 - prefix)) >>> 0;
}

// Calculate IPv4 Subnet details
export function calculateIpv4Subnet(ipStr: string, prefix: number): SubnetResult | null {
  const parts = ipStr.trim().split('.');
  if (parts.length !== 4) return null;
  for (const part of parts) {
    const val = parseInt(part, 10);
    if (isNaN(val) || val < 0 || val > 255) return null;
  }
  if (prefix < 0 || prefix > 32) return null;

  const ipNum = ipToNumber(ipStr);
  const maskNum = prefixToNumber(prefix);
  const wildcardNum = (~maskNum) >>> 0;

  const netNum = (ipNum & maskNum) >>> 0;
  const bcastNum = (netNum | wildcardNum) >>> 0;

  const totalHosts = prefix === 32 ? 1 : Math.pow(2, 32 - prefix);
  const usableHosts = prefix >= 31 ? (prefix === 31 ? 2 : 1) : totalHosts - 2;

  const firstUsableNum = prefix >= 31 ? netNum : netNum + 1;
  const lastUsableNum = prefix >= 31 ? bcastNum : bcastNum - 1;

  const firstOctet = parseInt(parts[0], 10);
  let ipClass: 'A' | 'B' | 'C' | 'D' | 'E' = 'C';
  if (firstOctet >= 1 && firstOctet <= 126) ipClass = 'A';
  else if (firstOctet >= 128 && firstOctet <= 191) ipClass = 'B';
  else if (firstOctet >= 192 && firstOctet <= 223) ipClass = 'C';
  else if (firstOctet >= 224 && firstOctet <= 239) ipClass = 'D';
  else ipClass = 'E';

  // Check RFC 1918 Private Ranges
  // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  const secondOctet = parseInt(parts[1], 10);
  let isPrivate = false;
  if (firstOctet === 10) isPrivate = true;
  else if (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) isPrivate = true;
  else if (firstOctet === 192 && secondOctet === 168) isPrivate = true;

  const subnetMask = numberToIp(maskNum);
  const networkAddress = numberToIp(netNum);
  const broadcastAddress = numberToIp(bcastNum);

  return {
    ip: ipStr,
    prefix,
    ipBinary: ipToBinaryString(ipStr),
    subnetMask,
    subnetMaskBinary: ipToBinaryString(subnetMask),
    wildcardMask: numberToIp(wildcardNum),
    networkAddress,
    networkAddressBinary: ipToBinaryString(networkAddress),
    broadcastAddress,
    broadcastAddressBinary: ipToBinaryString(broadcastAddress),
    firstUsableIp: numberToIp(firstUsableNum),
    lastUsableIp: numberToIp(lastUsableNum),
    totalHosts,
    usableHosts,
    ipClass,
    isPrivate,
  };
}

// Calculate FLSM (Fixed Length Subnet Masking)
export function calculateFlsm(baseIp: string, basePrefix: number, subnetCount: number): FlsmSubnet[] {
  const borrowedBits = Math.ceil(Math.log2(subnetCount));
  const newPrefix = basePrefix + borrowedBits;
  if (newPrefix > 30) return [];

  const subnets: FlsmSubnet[] = [];
  const baseNetNum = (ipToNumber(baseIp) & prefixToNumber(basePrefix)) >>> 0;
  const blockSize = Math.pow(2, 32 - newPrefix);

  for (let i = 0; i < subnetCount; i++) {
    const netNum = (baseNetNum + i * blockSize) >>> 0;
    const bcastNum = (netNum + blockSize - 1) >>> 0;
    subnets.push({
      index: i + 1,
      networkId: `${numberToIp(netNum)}/${newPrefix}`,
      firstUsable: numberToIp(netNum + 1),
      lastUsable: numberToIp(bcastNum - 1),
      broadcast: numberToIp(bcastNum),
      usableHosts: blockSize - 2,
    });
  }

  return subnets;
}

// Calculate VLSM (Variable Length Subnet Masking)
export function calculateVlsm(
  baseIp: string,
  basePrefix: number,
  requirements: Array<{ name: string; hosts: number }>
): { allocations: VlsmAllocation[]; remainingSpacePercent: number; isOverflow: boolean } {
  // 1. Sort requirements descending by host count
  const sorted = [...requirements].sort((a, b) => b.hosts - a.hosts);
  const allocations: VlsmAllocation[] = [];

  let currentNetNum = (ipToNumber(baseIp) & prefixToNumber(basePrefix)) >>> 0;
  const baseCapacity = Math.pow(2, 32 - basePrefix);
  let totalAllocatedIps = 0;
  let isOverflow = false;

  for (const req of sorted) {
    // hosts needed + 2 (Network + Broadcast)
    let hostBits = 2;
    while (Math.pow(2, hostBits) - 2 < req.hosts) {
      hostBits++;
    }
    const prefix = 32 - hostBits;
    const blockSize = Math.pow(2, hostBits);

    if (totalAllocatedIps + blockSize > baseCapacity) {
      isOverflow = true;
      break;
    }

    const netNum = currentNetNum;
    const bcastNum = (netNum + blockSize - 1) >>> 0;

    allocations.push({
      name: req.name,
      neededHosts: req.hosts,
      allocatedHosts: blockSize - 2,
      hostBits,
      prefix,
      subnetMask: numberToIp(prefixToNumber(prefix)),
      networkId: `${numberToIp(netNum)}/${prefix}`,
      broadcastId: numberToIp(bcastNum),
      firstUsable: numberToIp(netNum + 1),
      lastUsable: numberToIp(bcastNum - 1),
      percentageOfBase: Number(((blockSize / baseCapacity) * 100).toFixed(1)),
    });

    currentNetNum = (currentNetNum + blockSize) >>> 0;
    totalAllocatedIps += blockSize;
  }

  const remainingSpacePercent = Math.max(0, Number(((1 - totalAllocatedIps / baseCapacity) * 100).toFixed(1)));

  return { allocations, remainingSpacePercent, isOverflow };
}

// Calculate Nodal Delay & BDP
export function calculateNodalDelay(
  packetSizeBytes: number,
  bandwidthMbps: number,
  distanceKm: number,
  processingDelayMs = 0.05,
  queuingDelayMs = 0.5,
  propagationSpeedMps = 2e8 // speed of light in copper/fiber approx 200,000 km/s
): NodalDelayResult {
  const packetBits = packetSizeBytes * 8;
  const bandwidthBps = bandwidthMbps * 1e6;
  const distanceMeters = distanceKm * 1000;

  // d_trans = L / R (in seconds, convert to ms)
  const transmissionDelaySec = packetBits / bandwidthBps;
  const transmissionDelayMs = transmissionDelaySec * 1000;

  // d_prop = d / s (in seconds, convert to ms)
  const propagationDelaySec = distanceMeters / propagationSpeedMps;
  const propagationDelayMs = propagationDelaySec * 1000;

  const totalDelayMs = processingDelayMs + queuingDelayMs + transmissionDelayMs + propagationDelayMs;

  // Bandwidth-Delay Product = Bandwidth (bps) * RTT (sec)
  const rttSec = (propagationDelaySec * 2);
  const bdpBits = Math.round(bandwidthBps * rttSec);
  const optimalTcpWindowBytes = Math.round(bdpBits / 8);

  const steps = [
    `1. Transmission Delay (d_trans) = L / R = (${packetBits} bits) / (${bandwidthBps.toLocaleString()} bps) = ${(transmissionDelayMs).toFixed(4)} ms`,
    `2. Propagation Delay (d_prop) = d / s = (${distanceMeters.toLocaleString()} m) / (${propagationSpeedMps.toExponential()} m/s) = ${(propagationDelayMs).toFixed(4)} ms`,
    `3. Total Nodal Delay = d_proc (${processingDelayMs} ms) + d_queue (${queuingDelayMs} ms) + d_trans (${transmissionDelayMs.toFixed(4)} ms) + d_prop (${propagationDelayMs.toFixed(4)} ms) = ${totalDelayMs.toFixed(4)} ms`,
    `4. Bandwidth-Delay Product (BDP) = R * RTT = ${bandwidthMbps} Mbps * ${(rttSec * 1000).toFixed(2)} ms = ${bdpBits.toLocaleString()} bits (${optimalTcpWindowBytes.toLocaleString()} bytes buffer size).`,
  ];

  return {
    packetSizeBytes,
    bandwidthMbps,
    distanceKm,
    propagationSpeedMps,
    processingDelayMs,
    queuingDelayMs,
    transmissionDelayMs: Number(transmissionDelayMs.toFixed(4)),
    propagationDelayMs: Number(propagationDelayMs.toFixed(4)),
    totalDelayMs: Number(totalDelayMs.toFixed(4)),
    bandwidthDelayProductBits: bdpBits,
    optimalTcpWindowBytes,
    steps,
  };
}

// Calculate CRC (Cyclic Redundancy Check) step-by-step
export function calculateCrc(dataBits: string, generatorBits: string): CrcResult {
  const cleanData = dataBits.replace(/[^01]/g, '') || '11010011101100';
  const cleanGen = generatorBits.replace(/[^01]/g, '') || '1011';
  const genDegree = cleanGen.length - 1;

  // Pad data with degree 0s
  const paddedData = cleanData + '0'.repeat(genDegree);
  const steps: CrcCalculationStep[] = [];

  let remainder = paddedData.slice(0, cleanGen.length);
  let currentIndex = cleanGen.length;

  while (currentIndex <= paddedData.length) {
    const isOne = remainder[0] === '1';
    const subtrahend = isOne ? cleanGen : '0'.repeat(cleanGen.length);

    // XOR
    let xorRes = '';
    for (let i = 1; i < cleanGen.length; i++) {
      xorRes += remainder[i] === subtrahend[i] ? '0' : '1';
    }

    if (currentIndex < paddedData.length) {
      xorRes += paddedData[currentIndex];
    }

    steps.push({
      currentDividend: remainder,
      quotientBit: isOne ? '1' : '0',
      subtrahend,
      remainder: xorRes,
    });

    remainder = xorRes;
    currentIndex++;
  }

  const crcRemainder = remainder.slice(-genDegree);
  const codewordTransmitted = cleanData + crcRemainder;

  return {
    dataBits: cleanData,
    generatorBits: cleanGen,
    paddedData,
    crcRemainder,
    codewordTransmitted,
    steps,
  };
}
