import React, { useState, useEffect, useRef } from 'react';
import { 
  GitFork, Play, Pause, RotateCcw, StepForward, CheckCircle2, 
  HelpCircle, Plus, Trash2, Edit3, ArrowRight, ShieldAlert,
  Zap, Compass, Layers, Shuffle, Info, Check, AlertTriangle
} from 'lucide-react';

export interface GraphNode {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  weight: number;
}

export type AlgorithmType = 'dijkstra' | 'distance_vector' | 'path_vector' | 'flooding';

// Predefined Topology Presets
const PRESET_MESH_6: { nodes: GraphNode[]; edges: GraphEdge[] } = {
  nodes: [
    { id: 'A', name: 'Router A', x: 100, y: 160 },
    { id: 'B', name: 'Router B', x: 260, y: 70 },
    { id: 'C', name: 'Router C', x: 260, y: 250 },
    { id: 'D', name: 'Router D', x: 440, y: 70 },
    { id: 'E', name: 'Router E', x: 440, y: 250 },
    { id: 'F', name: 'Router F', x: 600, y: 160 },
  ],
  edges: [
    { id: 'e1', from: 'A', to: 'B', weight: 4 },
    { id: 'e2', from: 'A', to: 'C', weight: 2 },
    { id: 'e3', from: 'B', to: 'C', weight: 1 },
    { id: 'e4', from: 'B', to: 'D', weight: 5 },
    { id: 'e5', from: 'C', to: 'D', weight: 8 },
    { id: 'e6', from: 'C', to: 'E', weight: 10 },
    { id: 'e7', from: 'D', to: 'E', weight: 2 },
    { id: 'e8', from: 'D', to: 'F', weight: 6 },
    { id: 'e9', from: 'E', to: 'F', weight: 3 },
  ]
};

const PRESET_ENTERPRISE_4: { nodes: GraphNode[]; edges: GraphEdge[] } = {
  nodes: [
    { id: 'R1', name: 'R1 (HQ)', x: 140, y: 160 },
    { id: 'R2', name: 'R2 (North)', x: 350, y: 70 },
    { id: 'R3', name: 'R3 (South)', x: 350, y: 250 },
    { id: 'R4', name: 'R4 (Branch)', x: 560, y: 160 },
  ],
  edges: [
    { id: 's1', from: 'R1', to: 'R2', weight: 3 },
    { id: 's2', from: 'R1', to: 'R3', weight: 7 },
    { id: 's3', from: 'R2', to: 'R3', weight: 2 },
    { id: 's4', from: 'R2', to: 'R4', weight: 4 },
    { id: 's5', from: 'R3', to: 'R4', weight: 1 },
  ]
};

const PRESET_LINEAR_CHAIN: { nodes: GraphNode[]; edges: GraphEdge[] } = {
  nodes: [
    { id: 'A', name: 'Host A', x: 100, y: 160 },
    { id: 'B', name: 'Router B', x: 260, y: 160 },
    { id: 'C', name: 'Router C', x: 420, y: 160 },
    { id: 'D', name: 'Host D', x: 580, y: 160 },
  ],
  edges: [
    { id: 'c1', from: 'A', to: 'B', weight: 1 },
    { id: 'c2', from: 'B', to: 'C', weight: 1 },
    { id: 'c3', from: 'C', to: 'D', weight: 1 },
  ]
};

const PRESET_BGP_WAN: { nodes: GraphNode[]; edges: GraphEdge[] } = {
  nodes: [
    { id: 'AS100', name: 'AS 100 (Tier 1)', x: 120, y: 160 },
    { id: 'AS200', name: 'AS 200 (Transit)', x: 300, y: 80 },
    { id: 'AS300', name: 'AS 300 (Regional)', x: 300, y: 240 },
    { id: 'AS400', name: 'AS 400 (Stub ISP)', x: 500, y: 80 },
    { id: 'AS500', name: 'AS 500 (Enterprise)', x: 500, y: 240 },
  ],
  edges: [
    { id: 'b1', from: 'AS100', to: 'AS200', weight: 10 },
    { id: 'b2', from: 'AS100', to: 'AS300', weight: 20 },
    { id: 'b3', from: 'AS200', to: 'AS400', weight: 10 },
    { id: 'b4', from: 'AS300', to: 'AS500', weight: 15 },
    { id: 'b5', from: 'AS400', to: 'AS500', weight: 5 },
    { id: 'b6', from: 'AS200', to: 'AS300', weight: 10 },
  ]
};

// Step Trace Interface
interface AlgorithmStep {
  stepNumber: number;
  title: string;
  currentNode: string;
  visitedNodes: string[];
  activeEdges: string[]; // Edge IDs currently relaxing or transmitting
  treeEdges: string[];   // Edge IDs in Shortest Path Tree
  distances: { [nodeId: string]: number };
  previousNodes: { [nodeId: string]: string | null };
  explanation: string;
  formula?: string;
  distanceVectorMatrix?: { [nodeId: string]: { [destId: string]: { cost: number; via: string } } };
  asPaths?: { [destId: string]: string[] };
}

export const RoutingAlgorithmsVisualizer: React.FC = () => {
  // Current Topology Graph
  const [nodes, setNodes] = useState<GraphNode[]>(PRESET_MESH_6.nodes);
  const [edges, setEdges] = useState<GraphEdge[]>(PRESET_MESH_6.edges);
  const [sourceNodeId, setSourceNodeId] = useState<string>('A');

  // Algorithm Selection
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmType>('dijkstra');

  // Simulation Step States
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeedMs, setPlaySpeedMs] = useState<number>(2000);

  // User Graph Input Modal / State
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [newNodeName, setNewNodeName] = useState<string>('');
  const [edgeFrom, setEdgeFrom] = useState<string>('A');
  const [edgeTo, setEdgeTo] = useState<string>('B');
  const [edgeWeight, setEdgeWeight] = useState<number>(3);

  // Distance Vector Simulation Options
  const [splitHorizonEnabled, setSplitHorizonEnabled] = useState<boolean>(true);
  const [simulatedLinkFailure, setSimulatedLinkFailure] = useState<string | null>(null);

  // Computed Steps
  const [steps, setSteps] = useState<AlgorithmStep[]>([]);

  // -------------------------------------------------------------
  // Dynamic Step Generation Engine for Dijkstra's Algorithm
  // -------------------------------------------------------------
  const generateDijkstraSteps = (
    currentNodes: GraphNode[],
    currentEdges: GraphEdge[],
    srcId: string
  ): AlgorithmStep[] => {
    const generated: AlgorithmStep[] = [];
    const nodeIds = currentNodes.map(n => n.id);
    if (!nodeIds.includes(srcId)) return [];

    // Adjacency Map: nodeId -> { neighborId, weight, edgeId }
    const adj: { [id: string]: { neighbor: string; weight: number; edgeId: string }[] } = {};
    nodeIds.forEach(id => { adj[id] = []; });

    currentEdges.forEach(e => {
      if (e.id === simulatedLinkFailure) return; // Skip failed link
      if (adj[e.from] && adj[e.to]) {
        adj[e.from].push({ neighbor: e.to, weight: e.weight, edgeId: e.id });
        adj[e.to].push({ neighbor: e.from, weight: e.weight, edgeId: e.id });
      }
    });

    // Initial Distances and Predecessors
    const dist: { [id: string]: number } = {};
    const prev: { [id: string]: string | null } = {};
    nodeIds.forEach(id => {
      dist[id] = id === srcId ? 0 : Infinity;
      prev[id] = null;
    });

    const unvisited = new Set<string>(nodeIds);
    const visited: string[] = [];
    const treeEdges: string[] = [];

    // Step 0: Initialization
    generated.push({
      stepNumber: 0,
      title: `Initialization: Source Router ${srcId}`,
      currentNode: srcId,
      visitedNodes: [srcId],
      activeEdges: [],
      treeEdges: [],
      distances: { ...dist },
      previousNodes: { ...prev },
      explanation: `Set distance to source node ${srcId} = 0, and all other destination nodes = ∞. Permanent set = { ${srcId} }.`,
      formula: `dist(${srcId}) = 0, dist(v) = ∞ for all v ≠ ${srcId}`
    });

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let minNode: string | null = null;
      let minDist = Infinity;
      for (const u of unvisited) {
        if (dist[u] < minDist) {
          minDist = dist[u];
          minNode = u;
        }
      }

      if (minNode === null || minDist === Infinity) {
        // Remaining unvisited nodes are disconnected
        break;
      }

      unvisited.delete(minNode);
      if (!visited.includes(minNode)) visited.push(minNode);

      // Edge that connected minNode to SPT
      if (prev[minNode]) {
        const connEdge = currentEdges.find(
          e => (e.from === minNode && e.to === prev[minNode]) || 
               (e.to === minNode && e.from === prev[minNode])
        );
        if (connEdge && !treeEdges.includes(connEdge.id)) {
          treeEdges.push(connEdge.id);
        }
      }

      const activeEdgesInStep: string[] = [];
      const relaxations: string[] = [];

      // Relax all outgoing edges from minNode
      adj[minNode].forEach(({ neighbor, weight, edgeId }) => {
        if (unvisited.has(neighbor)) {
          activeEdgesInStep.push(edgeId);
          const newDist = dist[minNode!] + weight;
          if (newDist < dist[neighbor]) {
            relaxations.push(
              `Relax edge (${minNode} -> ${neighbor}): ${dist[minNode!]} + ${weight} = ${newDist} < ${dist[neighbor] === Infinity ? '∞' : dist[neighbor]}. Updated!`
            );
            dist[neighbor] = newDist;
            prev[neighbor] = minNode;
          } else {
            relaxations.push(
              `Check edge (${minNode} -> ${neighbor}): ${dist[minNode!]} + ${weight} = ${newDist} >= ${dist[neighbor]}. No update.`
            );
          }
        }
      });

      generated.push({
        stepNumber: generated.length,
        title: `Explore Router ${minNode} (Cost: ${dist[minNode]})`,
        currentNode: minNode,
        visitedNodes: [...visited],
        activeEdges: activeEdgesInStep,
        treeEdges: [...treeEdges],
        distances: { ...dist },
        previousNodes: { ...prev },
        explanation: relaxations.length > 0 
          ? relaxations.join(' | ') 
          : `Router ${minNode} has no remaining unvisited neighbors to relax. Node finalized.`,
        formula: `dist(v) = min(dist(v), dist(u) + cost(u,v))`
      });
    }

    // Final Completion Step
    generated.push({
      stepNumber: generated.length,
      title: `Shortest Path Tree (SPT) Converged!`,
      currentNode: srcId,
      visitedNodes: [...visited],
      activeEdges: [],
      treeEdges: [...treeEdges],
      distances: { ...dist },
      previousNodes: { ...prev },
      explanation: `Dijkstra calculation finalized. All nodes processed. OSPF routing table has been constructed with lowest cumulative link metrics.`,
      formula: `Shortest Path Tree (SPT) computation complete with zero loops.`
    });

    return generated;
  };

  // -------------------------------------------------------------
  // Dynamic Step Generation Engine for Distance Vector (Bellman-Ford)
  // -------------------------------------------------------------
  const generateDistanceVectorSteps = (
    currentNodes: GraphNode[],
    currentEdges: GraphEdge[],
    srcId: string
  ): AlgorithmStep[] => {
    const generated: AlgorithmStep[] = [];
    const nodeIds = currentNodes.map(n => n.id);
    if (!nodeIds.includes(srcId)) return [];

    // Distance Vector Table: matrix[sourceNode][destinationNode] = { cost, via }
    let matrix: { [u: string]: { [v: string]: { cost: number; via: string } } } = {};

    nodeIds.forEach(u => {
      matrix[u] = {};
      nodeIds.forEach(v => {
        if (u === v) matrix[u][v] = { cost: 0, via: 'Local' };
        else matrix[u][v] = { cost: Infinity, via: '-' };
      });
    });

    // Round 0: Direct local links
    currentEdges.forEach(e => {
      if (e.id === simulatedLinkFailure) return;
      matrix[e.from][e.to] = { cost: e.weight, via: e.to };
      matrix[e.to][e.from] = { cost: e.weight, via: e.from };
    });

    generated.push({
      stepNumber: 0,
      title: 'Round 0: Local Interface Discovery',
      currentNode: srcId,
      visitedNodes: [srcId],
      activeEdges: [],
      treeEdges: [],
      distances: Object.fromEntries(nodeIds.map(id => [id, matrix[srcId][id].cost])),
      previousNodes: Object.fromEntries(nodeIds.map(id => [id, matrix[srcId][id].via])),
      explanation: 'Every router initializes its distance vector table using only its directly connected links. All non-neighbor destinations are marked as ∞.',
      formula: 'D_x(y) = c(x,y) for direct neighbors; ∞ otherwise',
      distanceVectorMatrix: JSON.parse(JSON.stringify(matrix))
    });

    // Iterative Rounds (up to 4 iterations or until convergence)
    let converged = false;
    let round = 1;

    while (!converged && round <= 5) {
      converged = true;
      const nextMatrix = JSON.parse(JSON.stringify(matrix));
      const activeEdgesInRound: string[] = [];
      const explanations: string[] = [];

      nodeIds.forEach(x => {
        // Neighbors of x
        const neighbors = currentEdges
          .filter(e => e.id !== simulatedLinkFailure && (e.from === x || e.to === x))
          .map(e => ({
            id: e.from === x ? e.to : e.from,
            cost: e.weight,
            edgeId: e.id
          }));

        nodeIds.forEach(y => {
          if (x === y) return;

          let bestCost = matrix[x][y].cost;
          let bestVia = matrix[x][y].via;

          neighbors.forEach(({ id: v, cost: c_xv, edgeId }) => {
            activeEdgesInRound.push(edgeId);

            // Bellman-Ford equation: D_x(y) = min_v { c(x,v) + D_v(y) }
            const cand = c_xv + matrix[v][y].cost;

            // Split Horizon check: do not learn route back from neighbor if neighbor routes through x
            if (splitHorizonEnabled && matrix[v][y].via === x) {
              return; // Suppressed by Split Horizon
            }

            if (cand < bestCost) {
              bestCost = cand;
              bestVia = v;
              converged = false;
              if (x === srcId) {
                explanations.push(
                  `Router ${srcId} updated path to ${y} via ${v}: cost ${bestCost} (c(${srcId},${v})=${c_xv} + D_${v}(${y})=${matrix[v][y].cost})`
                );
              }
            }
          });

          nextMatrix[x][y] = { cost: bestCost, via: bestVia };
        });
      });

      matrix = nextMatrix;

      generated.push({
        stepNumber: round,
        title: `Round ${round}: Distance Vector Advertisement Exchange`,
        currentNode: srcId,
        visitedNodes: nodeIds,
        activeEdges: Array.from(new Set(activeEdgesInRound)),
        treeEdges: [],
        distances: Object.fromEntries(nodeIds.map(id => [id, matrix[srcId][id].cost])),
        previousNodes: Object.fromEntries(nodeIds.map(id => [id, matrix[srcId][id].via])),
        explanation: explanations.length > 0 
          ? explanations.slice(0, 3).join(' | ') 
          : `Round ${round}: Distance vectors exchanged between all adjacent routers. No shorter routes found.`,
        formula: 'Bellman-Ford: D_x(y) = min_v { c(x,v) + D_v(y) }',
        distanceVectorMatrix: JSON.parse(JSON.stringify(matrix))
      });

      round++;
    }

    // Final Convergence Step
    generated.push({
      stepNumber: generated.length,
      title: 'Distance Vector Protocol Converged!',
      currentNode: srcId,
      visitedNodes: nodeIds,
      activeEdges: [],
      treeEdges: [],
      distances: Object.fromEntries(nodeIds.map(id => [id, matrix[srcId][id].cost])),
      previousNodes: Object.fromEntries(nodeIds.map(id => [id, matrix[srcId][id].via])),
      explanation: `All routers have exchanged periodic distance vectors. Bellman-Ford matrices are stabilized. Split Horizon: ${splitHorizonEnabled ? 'ACTIVE (Loops Prevented)' : 'DISABLED'}.`,
      formula: 'Convergence reached: D^(k)(x,y) == D^(k-1)(x,y)',
      distanceVectorMatrix: JSON.parse(JSON.stringify(matrix))
    });

    return generated;
  };

  // -------------------------------------------------------------
  // Dynamic Step Generation Engine for Path Vector (BGP)
  // -------------------------------------------------------------
  const generatePathVectorSteps = (
    currentNodes: GraphNode[],
    currentEdges: GraphEdge[],
    srcId: string
  ): AlgorithmStep[] => {
    const generated: AlgorithmStep[] = [];
    const nodeIds = currentNodes.map(n => n.id);

    // Initial Path Vector Table: destination -> AS-Path
    const asPaths: { [dest: string]: string[] } = {};
    const dist: { [dest: string]: number } = {};

    nodeIds.forEach(id => {
      if (id === srcId) {
        asPaths[id] = [srcId];
        dist[id] = 0;
      } else {
        asPaths[id] = [];
        dist[id] = Infinity;
      }
    });

    generated.push({
      stepNumber: 0,
      title: `BGP Peering Session Initialization for ${srcId}`,
      currentNode: srcId,
      visitedNodes: [srcId],
      activeEdges: [],
      treeEdges: [],
      distances: { ...dist },
      previousNodes: {},
      explanation: `Autonomous System ${srcId} initializes its BGP Routing Information Base (RIB). Establishes TCP Port 179 sessions with eBGP neighbor peers.`,
      formula: `AS-Path initialized: [${srcId}]`,
      asPaths: { ...asPaths }
    });

    // BFS Path Discovery recording exact AS-Path sequences
    const queue: { current: string; path: string[]; cost: number }[] = [
      { current: srcId, path: [srcId], cost: 0 }
    ];
    const visitedSet = new Set<string>([srcId]);

    let stepNum = 1;
    while (queue.length > 0) {
      const { current, path, cost } = queue.shift()!;

      // Find neighbor ASes
      const neighbors = currentEdges
        .filter(e => e.from === current || e.to === current)
        .map(e => ({
          neighbor: e.from === current ? e.to : e.from,
          weight: e.weight,
          edgeId: e.id
        }));

      for (const { neighbor, weight, edgeId } of neighbors) {
        // BGP Loop Prevention: Check if neighbor already appears in AS-Path
        if (path.includes(neighbor)) {
          generated.push({
            stepNumber: stepNum++,
            title: `BGP Loop Prevention Check: Discarded Update to ${neighbor}`,
            currentNode: current,
            visitedNodes: Array.from(visitedSet),
            activeEdges: [edgeId],
            treeEdges: [],
            distances: { ...dist },
            previousNodes: {},
            explanation: `LOOP PREVENTED! Update proposed path [${path.join(' -> ')} -> ${neighbor}]. Because ${neighbor} already exists in the AS-Path, the update is dropped according to RFC 4271.`,
            formula: `Loop Check: If Own_ASN ∈ AS_PATH => DROP_ROUTE`,
            asPaths: { ...asPaths }
          });
          continue;
        }

        const newCost = cost + weight;
        const newPath = [...path, neighbor];

        if (!visitedSet.has(neighbor) || newCost < dist[neighbor]) {
          visitedSet.add(neighbor);
          dist[neighbor] = newCost;
          asPaths[neighbor] = newPath;

          generated.push({
            stepNumber: stepNum++,
            title: `eBGP Update Accepted: Path to ${neighbor}`,
            currentNode: neighbor,
            visitedNodes: Array.from(visitedSet),
            activeEdges: [edgeId],
            treeEdges: [],
            distances: { ...dist },
            previousNodes: {},
            explanation: `Route to ${neighbor} accepted via AS-Path: [${newPath.join(' -> ')}]. Next-Hop is ${path[1] || neighbor}. AS-Path length = ${newPath.length}.`,
            formula: `BGP Attribute: AS_PATH = [${newPath.join(', ')}]`,
            asPaths: { ...asPaths }
          });

          queue.push({ current: neighbor, path: newPath, cost: newCost });
        }
      }
    }

    generated.push({
      stepNumber: stepNum,
      title: 'BGP Path Vector Routing Table Finalized!',
      currentNode: srcId,
      visitedNodes: Array.from(visitedSet),
      activeEdges: [],
      treeEdges: [],
      distances: { ...dist },
      previousNodes: {},
      explanation: `All eBGP prefix advertisements processed without loops. Internet routing paths established across Autonomous Systems.`,
      formula: `Path Vector Best Path: Lowest AS-Path Length & Origin IGP`,
      asPaths: { ...asPaths }
    });

    return generated;
  };

  // -------------------------------------------------------------
  // Dynamic Step Generation Engine for Controlled Flooding / RPF
  // -------------------------------------------------------------
  const generateFloodingSteps = (
    currentNodes: GraphNode[],
    currentEdges: GraphEdge[],
    srcId: string
  ): AlgorithmStep[] => {
    const generated: AlgorithmStep[] = [];
    const nodeIds = currentNodes.map(n => n.id);
    if (!nodeIds.includes(srcId)) return [];

    const dist: { [dest: string]: number } = {};
    const prev: { [dest: string]: string | null } = {};
    nodeIds.forEach(id => {
      dist[id] = id === srcId ? 0 : Infinity;
      prev[id] = null;
    });

    // Step 0: Broadcast origin
    generated.push({
      stepNumber: 0,
      title: `Flooding Origin: Packet Generated at ${srcId}`,
      currentNode: srcId,
      visitedNodes: [srcId],
      activeEdges: [],
      treeEdges: [],
      distances: { ...dist },
      previousNodes: { ...prev },
      explanation: `Router ${srcId} originates a broadcast packet with Hop Count / TTL = 3. It floods copies out of ALL active network interfaces simultaneously.`,
      formula: `Flooding Rule: Forward incoming packet out on every outgoing interface (except arrival interface).`
    });

    let currentFrontier = [srcId];
    const visitedSet = new Set<string>([srcId]);
    let hop = 1;
    const maxHops = 3;

    while (currentFrontier.length > 0 && hop <= maxHops) {
      const nextFrontier: string[] = [];
      const activeEdgesInHop: string[] = [];
      const transmissions: string[] = [];

      currentFrontier.forEach(u => {
        const neighbors = currentEdges
          .filter(e => e.id !== simulatedLinkFailure && (e.from === u || e.to === u))
          .map(e => ({
            v: e.from === u ? e.to : e.from,
            edgeId: e.id,
            w: e.weight
          }));

        neighbors.forEach(({ v, edgeId, w }) => {
          activeEdgesInHop.push(edgeId);
          if (!visitedSet.has(v)) {
            visitedSet.add(v);
            nextFrontier.push(v);
            dist[v] = (dist[u] || 0) + w;
            prev[v] = u;
            transmissions.push(`Node ${u} flooded packet to ${v} (TTL decremented to ${maxHops - hop})`);
          } else {
            transmissions.push(`Node ${v} received duplicate packet from ${u} -> DROPPED (Sequence cache match)`);
          }
        });
      });

      if (activeEdgesInHop.length > 0) {
        generated.push({
          stepNumber: hop,
          title: `Hop ${hop}: Simultaneous Parallel Wave Transmission`,
          currentNode: currentFrontier[0] || srcId,
          visitedNodes: Array.from(visitedSet),
          activeEdges: Array.from(new Set(activeEdgesInHop)),
          treeEdges: [],
          distances: { ...dist },
          previousNodes: { ...prev },
          explanation: transmissions.slice(0, 4).join(' | '),
          formula: `Controlled Flooding: Drop if already seen; decrement TTL; forward copies to remaining neighbors.`
        });
      }

      currentFrontier = Array.from(new Set(nextFrontier));
      hop++;
    }

    generated.push({
      stepNumber: generated.length,
      title: 'Flooding Wave Complete (All Reachable Nodes Reached)',
      currentNode: srcId,
      visitedNodes: Array.from(visitedSet),
      activeEdges: [],
      treeEdges: [],
      distances: { ...dist },
      previousNodes: { ...prev },
      explanation: `All reachable network nodes have received the broadcast. Duplicate packets were suppressed by sequence caches, preventing a broadcast storm.`,
      formula: `Flooding complete. Total hops traversed: ${hop - 1}.`
    });

    return generated;
  };

  // Node Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const handleMouseDownNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggingNodeId(nodeId);
  };

  const handleMouseMoveSvg = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingNodeId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(30, Math.min(rect.width - 30, e.clientX - rect.left));
    const y = Math.max(30, Math.min(rect.height - 30, e.clientY - rect.top));
    setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x, y } : n));
  };

  const handleMouseUpSvg = () => {
    setDraggingNodeId(null);
  };

  // Re-generate steps whenever graph or algorithm changes
  useEffect(() => {
    let generated: AlgorithmStep[] = [];
    if (selectedAlgo === 'dijkstra') {
      generated = generateDijkstraSteps(nodes, edges, sourceNodeId);
    } else if (selectedAlgo === 'distance_vector') {
      generated = generateDistanceVectorSteps(nodes, edges, sourceNodeId);
    } else if (selectedAlgo === 'path_vector') {
      generated = generatePathVectorSteps(nodes, edges, sourceNodeId);
    } else if (selectedAlgo === 'flooding') {
      generated = generateFloodingSteps(nodes, edges, sourceNodeId);
    } else {
      generated = generateDijkstraSteps(nodes, edges, sourceNodeId);
    }
    setSteps(generated);
    setCurrentStepIdx(0);
    setIsPlaying(false);
  }, [nodes, edges, sourceNodeId, selectedAlgo, splitHorizonEnabled, simulatedLinkFailure]);

  // Auto-play timer
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIdx(prev => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, playSpeedMs);
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps.length, playSpeedMs]);

  const activeStep = steps[currentStepIdx] || {
    stepNumber: 0,
    title: 'Loading Algorithm...',
    currentNode: sourceNodeId,
    visitedNodes: [sourceNodeId],
    activeEdges: [],
    treeEdges: [],
    distances: {},
    previousNodes: {},
    explanation: 'Initializing topology graph...'
  };

  // Preset Loaders
  const handleLoadPreset = (presetType: 'mesh' | 'enterprise' | 'linear' | 'bgp') => {
    if (presetType === 'mesh') {
      setNodes(PRESET_MESH_6.nodes);
      setEdges(PRESET_MESH_6.edges);
      setSourceNodeId('A');
      setSelectedAlgo('dijkstra');
    } else if (presetType === 'enterprise') {
      setNodes(PRESET_ENTERPRISE_4.nodes);
      setEdges(PRESET_ENTERPRISE_4.edges);
      setSourceNodeId('R1');
      setSelectedAlgo('dijkstra');
    } else if (presetType === 'linear') {
      setNodes(PRESET_LINEAR_CHAIN.nodes);
      setEdges(PRESET_LINEAR_CHAIN.edges);
      setSourceNodeId('A');
      setSelectedAlgo('distance_vector');
    } else if (presetType === 'bgp') {
      setNodes(PRESET_BGP_WAN.nodes);
      setEdges(PRESET_BGP_WAN.edges);
      setSourceNodeId('AS100');
      setSelectedAlgo('path_vector');
    }
    setSimulatedLinkFailure(null);
  };

  // Add Custom Node
  const handleAddCustomNode = () => {
    const trimmed = newNodeName.trim().toUpperCase() || `N${nodes.length + 1}`;
    if (nodes.some(n => n.id === trimmed)) return;
    const newNode: GraphNode = {
      id: trimmed,
      name: `Router ${trimmed}`,
      x: 150 + Math.random() * 350,
      y: 90 + Math.random() * 160
    };
    setNodes([...nodes, newNode]);
    setNewNodeName('');
  };

  // Delete Node
  const handleDeleteNode = (id: string) => {
    if (nodes.length <= 2) return; // Keep at least 2 nodes
    setNodes(nodes.filter(n => n.id !== id));
    setEdges(edges.filter(e => e.from !== id && e.to !== id));
    if (sourceNodeId === id) {
      setSourceNodeId(nodes.find(n => n.id !== id)?.id || 'A');
    }
  };

  // Add / Update Edge
  const handleAddEdge = () => {
    if (edgeFrom === edgeTo) return;
    const existing = edges.find(
      e => (e.from === edgeFrom && e.to === edgeTo) || (e.from === edgeTo && e.to === edgeFrom)
    );
    if (existing) {
      setEdges(edges.map(e => e.id === existing.id ? { ...e, weight: edgeWeight } : e));
    } else {
      const newEdge: GraphEdge = {
        id: `e-${Date.now()}`,
        from: edgeFrom,
        to: edgeTo,
        weight: Number(edgeWeight) || 1
      };
      setEdges([...edges, newEdge]);
    }
  };

  // Delete Edge
  const handleDeleteEdge = (edgeId: string) => {
    setEdges(edges.filter(e => e.id !== edgeId));
  };

  return (
    <div className="flex flex-col gap-6 select-none font-sans text-xs">
      
      {/* 1. Header Banner & Mode Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-950 text-sky-400 border border-sky-800 uppercase">
              Unit 3: Network Layer Algorithms
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 text-xs">Interactive Graph Visualizer with User Input</span>
          </div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mt-1">
            <GitFork className="w-5 h-5 text-sky-400" />
            <span>Routing Algorithms & Shortest Path Simulator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize Dijkstra (Link State / OSPF), Bellman-Ford (Distance Vector / RIP), and BGP (Path Vector / AS-Path) with custom topology inputs.
          </p>
        </div>

        {/* Algorithm Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg">
          <button
            onClick={() => setSelectedAlgo('dijkstra')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${
              selectedAlgo === 'dijkstra'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            1. Link State (OSPF)
          </button>
          <button
            onClick={() => setSelectedAlgo('distance_vector')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${
              selectedAlgo === 'distance_vector'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            2. Distance Vector (RIP)
          </button>
          <button
            onClick={() => setSelectedAlgo('path_vector')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${
              selectedAlgo === 'path_vector'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            3. Path Vector (BGP)
          </button>
          <button
            onClick={() => setSelectedAlgo('flooding')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${
              selectedAlgo === 'flooding'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            4. Flooding / RPF
          </button>
        </div>
      </div>

      {/* 2. Topology Presets & Graph Input Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
            Topology Presets:
          </span>
          <button
            onClick={() => handleLoadPreset('mesh')}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 hover:text-white font-medium transition-colors"
          >
            6-Node Mesh
          </button>
          <button
            onClick={() => handleLoadPreset('enterprise')}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-sky-400 hover:text-sky-300 font-medium transition-colors"
          >
            4-Router Enterprise Lab
          </button>
          <button
            onClick={() => handleLoadPreset('linear')}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            Linear Chain (Count-to-Infinity)
          </button>
          <button
            onClick={() => handleLoadPreset('bgp')}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-amber-400 hover:text-amber-300 font-medium transition-colors"
          >
            Multi-AS WAN (BGP)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditorOpen(!isEditorOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all ${
              isEditorOpen
                ? 'bg-sky-950 border-sky-500 text-sky-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-sky-400" />
            <span>{isEditorOpen ? 'Close Graph Editor' : 'Edit Graph / Add Custom Nodes'}</span>
          </button>

          {/* Source Node Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="text-slate-400 text-[11px] font-semibold">Source:</span>
            <select
              value={sourceNodeId}
              onChange={(e) => setSourceNodeId(e.target.value)}
              className="bg-transparent text-white font-mono font-bold focus:outline-none"
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id} className="bg-slate-900 text-white">
                  {n.id} ({n.name})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2B. Graph Editor Drawer (When Open) */}
      {isEditorOpen && (
        <div className="p-4 bg-slate-900 border border-sky-500/50 rounded-xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="font-bold text-white text-xs flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-400" />
              <span>Interactive Graph Topology Editor (User Input)</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              Add custom routers or adjust link costs to test edge relaxation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Add Node Form */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <span className="font-bold text-slate-300 text-[11px] block">1. Add New Router Node</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  placeholder="Node ID e.g. G, R5"
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-white font-mono text-xs flex-1"
                />
                <button
                  onClick={handleAddCustomNode}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Node</span>
                </button>
              </div>

              {/* Node List with Delete */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {nodes.map(n => (
                  <span
                    key={n.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[10px]"
                  >
                    <span>{n.id}</span>
                    {nodes.length > 2 && (
                      <button
                        onClick={() => handleDeleteNode(n.id)}
                        className="text-slate-500 hover:text-rose-400"
                        title="Delete node"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Add / Edit Edge Form */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <span className="font-bold text-slate-300 text-[11px] block">2. Connect Weighted Link (Edge)</span>
              <div className="flex items-center gap-2">
                <select
                  value={edgeFrom}
                  onChange={(e) => setEdgeFrom(e.target.value)}
                  className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white font-mono text-xs"
                >
                  {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
                </select>
                <span className="text-slate-500">↔</span>
                <select
                  value={edgeTo}
                  onChange={(e) => setEdgeTo(e.target.value)}
                  className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white font-mono text-xs"
                >
                  {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
                </select>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 text-[10px]">Cost:</span>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={edgeWeight}
                    onChange={(e) => setEdgeWeight(Number(e.target.value) || 1)}
                    className="w-14 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white font-mono text-xs"
                  />
                </div>
                <button
                  onClick={handleAddEdge}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Set Link</span>
                </button>
              </div>

              {/* Edge List */}
              <div className="flex flex-wrap gap-1.5 pt-2 max-h-24 overflow-y-auto">
                {edges.map(e => (
                  <span
                    key={e.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[10px]"
                  >
                    <span>{e.from}-{e.to} (w:{e.weight})</span>
                    <button
                      onClick={() => handleDeleteEdge(e.id)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Split View: SVG Graph Canvas + Execution Step & Routing Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Topology Canvas */}
        <div className="lg:col-span-7 p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Topology Graph View
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                ({nodes.length} Nodes · {edges.length} Links)
              </span>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span>Source</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Active</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Permanent</span>
              </div>
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="relative w-full h-[320px] bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center">
            <svg 
              ref={svgRef}
              onMouseMove={handleMouseMoveSvg}
              onMouseUp={handleMouseUpSvg}
              onMouseLeave={handleMouseUpSvg}
              className="w-full h-full select-none"
            >
              {/* Edges */}
              {edges.map(e => {
                const u = nodes.find(n => n.id === e.from);
                const v = nodes.find(n => n.id === e.to);
                if (!u || !v) return null;

                const isFailed = e.id === simulatedLinkFailure;
                const isTreeEdge = activeStep.treeEdges.includes(e.id);
                const isActiveEdge = activeStep.activeEdges.includes(e.id);

                let strokeColor = '#334155'; // default slate-700
                let strokeWidth = 2;
                let strokeDash = '';

                if (isFailed) {
                  strokeColor = '#ef4444';
                  strokeDash = '5 4';
                } else if (isTreeEdge) {
                  strokeColor = '#10b981'; // emerald tree
                  strokeWidth = 3.5;
                } else if (isActiveEdge) {
                  strokeColor = '#f59e0b'; // amber active
                  strokeWidth = 3;
                  strokeDash = '4 2';
                }

                // Midpoint for weight badge
                const midX = (u.x + v.x) / 2;
                const midY = (u.y + v.y) / 2;

                return (
                  <g key={e.id}>
                    {/* Glowing under-line when active */}
                    {(isTreeEdge || isActiveEdge) && (
                      <line
                        x1={u.x}
                        y1={u.y}
                        x2={v.x}
                        y2={v.y}
                        stroke={isTreeEdge ? '#10b981' : '#f59e0b'}
                        strokeWidth={7}
                        strokeOpacity={0.25}
                      />
                    )}

                    <line
                      x1={u.x}
                      y1={u.y}
                      x2={v.x}
                      y2={v.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDash}
                    />

                    {/* Weight Label Pill */}
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-14"
                        y="-9"
                        width="28"
                        height="18"
                        rx="4"
                        fill="#020617"
                        stroke={isFailed ? '#ef4444' : isActiveEdge ? '#f59e0b' : '#475569'}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3.5"
                        fill={isFailed ? '#ef4444' : isActiveEdge ? '#f59e0b' : '#94a3b8'}
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {isFailed ? 'X' : e.weight}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Nodes */}
              {nodes.map(n => {
                const isSource = n.id === sourceNodeId;
                const isCurrent = n.id === activeStep.currentNode;
                const isVisited = activeStep.visitedNodes.includes(n.id);
                const curDist = activeStep.distances[n.id];

                let nodeFill = '#0f172a';
                let nodeStroke = '#475569';

                if (isCurrent) {
                  nodeFill = '#78350f';
                  nodeStroke = '#f59e0b';
                } else if (isSource) {
                  nodeFill = '#0c4a6e';
                  nodeStroke = '#38bdf8';
                } else if (isVisited) {
                  nodeFill = '#064e3b';
                  nodeStroke = '#10b981';
                }

                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x}, ${n.y})`}
                    className="cursor-grab active:cursor-grabbing group"
                    onMouseDown={(e) => handleMouseDownNode(e, n.id)}
                    onClick={() => setSourceNodeId(n.id)}
                  >
                    {/* Pulse ring on active node */}
                    {isCurrent && (
                      <circle
                        r="24"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        opacity="0.5"
                        className="animate-ping"
                      />
                    )}

                    {/* Outer Circle */}
                    <circle
                      r="18"
                      fill={nodeFill}
                      stroke={nodeStroke}
                      strokeWidth={isCurrent || isSource ? 3 : 2}
                    />

                    {/* Node ID */}
                    <text
                      x="0"
                      y="4"
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {n.id}
                    </text>

                    {/* Current Cost Badge below node */}
                    <g transform="translate(0, 28)">
                      <rect
                        x="-20"
                        y="-7"
                        width="40"
                        height="14"
                        rx="3"
                        fill="#020617"
                        stroke={isCurrent ? '#f59e0b' : '#334155'}
                        strokeWidth="0.8"
                      />
                      <text
                        x="0"
                        y="3.5"
                        fill={curDist === Infinity ? '#94a3b8' : '#38bdf8'}
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {curDist === undefined ? '' : curDist === Infinity ? 'd: ∞' : `d: ${curDist}`}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Stepper Controls Bar */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStepIdx(Math.max(0, currentStepIdx - 1))}
                disabled={currentStepIdx === 0}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white rounded-lg font-semibold transition-colors flex items-center gap-1"
              >
                <span>Back</span>
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                  isPlaying 
                    ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
              </button>

              <button
                onClick={() => setCurrentStepIdx(Math.min(steps.length - 1, currentStepIdx + 1))}
                disabled={currentStepIdx >= steps.length - 1}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-lg font-semibold transition-colors flex items-center gap-1"
              >
                <span>Next Step</span>
                <StepForward className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => { setCurrentStepIdx(0); setIsPlaying(false); }}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Reset to Step 0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
              <span>Step:</span>
              <span className="font-bold text-sky-400">{currentStepIdx + 1}</span>
              <span>/</span>
              <span>{steps.length || 1}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Mathematical Reasoning & Real-time Routing Table */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Step Explanation Card */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{activeStep.title}</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-400 border border-slate-800">
                Node {activeStep.currentNode}
              </span>
            </div>

            <p className="text-slate-300 leading-relaxed text-xs">
              {activeStep.explanation}
            </p>

            {activeStep.formula && (
              <div className="p-2.5 bg-black rounded font-mono text-[11px] text-emerald-400 border border-slate-800">
                {activeStep.formula}
              </div>
            )}
          </div>

          {/* Resulting Routing / Forwarding Table */}
          <div className="flex-1 p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-sky-400" />
                  <span>Router {sourceNodeId} Routing Table</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {selectedAlgo.toUpperCase()}
                </span>
              </div>

              {/* Table Data */}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800 text-[10px]">
                      <th className="pb-2">Destination</th>
                      <th className="pb-2">Metric / Cost</th>
                      <th className="pb-2">{selectedAlgo === 'path_vector' ? 'AS-Path' : 'Next Hop'}</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {nodes.map(n => {
                      const cost = activeStep.distances[n.id];
                      const prev = activeStep.previousNodes[n.id];
                      const asPath = activeStep.asPaths?.[n.id];
                      const isSelf = n.id === sourceNodeId;
                      const isFinalized = activeStep.visitedNodes.includes(n.id);

                      return (
                        <tr key={n.id} className="hover:bg-slate-800/40">
                          <td className="py-1.5 font-bold text-white">
                            {n.id} {isSelf && '(Self)'}
                          </td>
                          <td className="py-1.5">
                            {cost === undefined ? '-' : cost === Infinity ? (
                              <span className="text-slate-500">∞ (Unreachable)</span>
                            ) : (
                              <span className="text-emerald-400 font-bold">{cost}</span>
                            )}
                          </td>
                          <td className="py-1.5 text-sky-300">
                            {selectedAlgo === 'path_vector' ? (
                              asPath && asPath.length > 0 ? asPath.join(' → ') : '-'
                            ) : (
                              isSelf ? 'Direct' : prev || '-'
                            )}
                          </td>
                          <td className="py-1.5">
                            {isFinalized ? (
                              <span className="text-emerald-400 text-[10px] font-bold">Permanent</span>
                            ) : (
                              <span className="text-amber-400 text-[10px]">Tentative</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Distance Vector Loop Control Addon (When Distance Vector is active) */}
            {selectedAlgo === 'distance_vector' && (
              <div className="pt-3 mt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={splitHorizonEnabled}
                      onChange={(e) => setSplitHorizonEnabled(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-sky-500"
                    />
                    <span className="text-slate-300 font-semibold">Enable Split Horizon with Poison Reverse</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono">RFC 2453</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Prevents Count-to-Infinity routing loops by suppressing updates sent back out the arrival interface.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Complete Theory Reference for the Selected Algorithm */}
      <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-400" />
          <span>
            {selectedAlgo === 'dijkstra' && 'Link State Routing & Dijkstra’s Algorithm (OSPF / IS-IS)'}
            {selectedAlgo === 'distance_vector' && 'Distance Vector Routing & Bellman-Ford Algorithm (RIP / IGRP)'}
            {selectedAlgo === 'path_vector' && 'Path Vector Routing & Border Gateway Protocol (BGP-4)'}
            {selectedAlgo === 'flooding' && 'Flooding & Reverse Path Forwarding (Multicast & Broadcast)'}
          </span>
        </h3>

        {selectedAlgo === 'dijkstra' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-300 text-xs">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="font-bold text-sky-400 block">1. Link-State Advertisements (LSAs)</span>
              <p>Every router floods LSAs describing its local links to ALL routers in the area. Each router builds an identical topology map (Link-State Database / LSDB).</p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="font-bold text-emerald-400 block">2. Dijkstra SPF Execution</span>
              <p>Each router independently computes the Shortest Path Tree (SPT) with itself as root. Tentative nodes are relaxed until finalized into the permanent set.</p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="font-bold text-amber-400 block">3. OSPF Cost Metric</span>
              <p>Cost = Reference Bandwidth (100 Mbps) / Interface Bandwidth. FastEthernet = 1, GigabitEthernet = 1, Serial 1.544M = 64. Fast convergence, immune to loops.</p>
            </div>
          </div>
        )}

        {selectedAlgo === 'distance_vector' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-300 text-xs">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="font-bold text-sky-400 block">1. "Routing by Rumor"</span>
              <p>Routers only share copies of their routing tables periodically with directly connected neighbors. Hop count is metric (max 15 hops; 16 = unreachable).</p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="font-bold text-rose-400 block">2. Count-to-Infinity Problem</span>
              <p>When a link fails, neighbors with stale routes continuously increment hop counts back and forth until reaching infinity (16), delaying convergence.</p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="font-bold text-emerald-400 block">3. Split Horizon & Poison Reverse</span>
              <p>Split Horizon forbids advertising a route back out the interface it was learned from. Poison Reverse immediately advertises a failed route with metric 16.</p>
            </div>
          </div>
        )}

        {selectedAlgo === 'path_vector' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-300 text-xs">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="font-bold text-sky-400 block">1. Inter-Domain Routing (EGP)</span>
              <p>BGP connects independent Autonomous Systems (ASes) over reliable TCP Port 179 connections, enforcing policy-based and peering agreements.</p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="font-bold text-emerald-400 block">2. AS-Path Loop Detection</span>
              <p>The AS-Path attribute records the exact sequence of Autonomous Systems traversed. If an AS detects its own ASN in the path, it discards the route.</p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="font-bold text-amber-400 block">3. eBGP vs iBGP</span>
              <p>eBGP connects different ASes (AD = 20); iBGP operates within the same AS (AD = 200). Uses Next-Hop, Local Preference, and MED attributes.</p>
            </div>
          </div>
        )}

        {selectedAlgo === 'flooding' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-300 text-xs">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="font-bold text-purple-400 block">1. Blind vs Controlled Flooding</span>
              <p>Blind flooding forwards every incoming packet out all interfaces, causing infinite broadcast storms. Controlled flooding uses Hop Counts (TTL) or Sequence Number tracking to suppress duplicates.</p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="font-bold text-emerald-400 block">2. Reverse Path Forwarding (RPF)</span>
              <p>A router forwards a multicast packet only if it arrived on the interface used to reach the source. Ensures loop-free tree construction.</p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="font-bold text-amber-400 block">3. Robustness Guarantee</span>
              <p>At least one packet is guaranteed to find the shortest delay path because all paths are explored concurrently. Highly resilient in military/disaster recovery networks.</p>
            </div>
          </div>
        )}
      </div>

      {/* 5. Comprehensive 4-Way Routing Algorithm Comparison Table (Exam Goldmine) */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Unit 3: Comprehensive Routing Algorithms Comparison Table</span>
          </h3>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">Academic Exam Key Point</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs border border-slate-800">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] font-mono">
                <th className="p-2.5">Feature</th>
                <th className="p-2.5 text-sky-400 font-bold">Link State (Dijkstra)</th>
                <th className="p-2.5 text-emerald-400 font-bold">Distance Vector (Bellman-Ford)</th>
                <th className="p-2.5 text-amber-400 font-bold">Path Vector (BGP)</th>
                <th className="p-2.5 text-purple-400 font-bold">Flooding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-[11px]">
              <tr className="hover:bg-slate-800/40">
                <td className="p-2.5 font-bold text-slate-300">Topology Knowledge</td>
                <td className="p-2.5 text-slate-300">Global (Every router has entire LSDB map)</td>
                <td className="p-2.5 text-slate-300">Local (Knows only neighbor distances)</td>
                <td className="p-2.5 text-slate-300">AS Sequence Path Vector</td>
                <td className="p-2.5 text-slate-300">None (Zero routing table needed)</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="p-2.5 font-bold text-slate-300">Metric</td>
                <td className="p-2.5 text-slate-300">Bandwidth Cost (10^8 / BW)</td>
                <td className="p-2.5 text-slate-300">Hop Count (max 15 hops)</td>
                <td className="p-2.5 text-slate-300">Policy / AS-Path length</td>
                <td className="p-2.5 text-slate-300">Latency / First Arrival</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="p-2.5 font-bold text-slate-300">Convergence Speed</td>
                <td className="p-2.5 text-emerald-400 font-bold">Fast (Sub-second with triggered LSA)</td>
                <td className="p-2.5 text-amber-400 font-bold">Slow (Periodic 30s update timer)</td>
                <td className="p-2.5 text-slate-300">Moderate (Policy validation)</td>
                <td className="p-2.5 text-emerald-400 font-bold">Instantaneous (Parallel flood)</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="p-2.5 font-bold text-slate-300">Routing Loops</td>
                <td className="p-2.5 text-emerald-400 font-bold">Loop-Free (SPT Math)</td>
                <td className="p-2.5 text-rose-400 font-bold">Prone to Count-to-Infinity</td>
                <td className="p-2.5 text-emerald-400 font-bold">Loop-Free (AS-Path check)</td>
                <td className="p-2.5 text-amber-400 font-bold">Storms (requires TTL/history)</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="p-2.5 font-bold text-slate-300">Loop Prevention</td>
                <td className="p-2.5 text-slate-300">Dijkstra Tree Structure</td>
                <td className="p-2.5 text-slate-300">Split Horizon & Poison Reverse</td>
                <td className="p-2.5 text-slate-300">Drop route if own ASN in path</td>
                <td className="p-2.5 text-slate-300">Hop Count (TTL) & Cache</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="p-2.5 font-bold text-slate-300">Real-World Protocol</td>
                <td className="p-2.5 text-sky-400 font-bold font-mono">OSPF, IS-IS</td>
                <td className="p-2.5 text-emerald-400 font-bold font-mono">RIP v1/v2, IGRP</td>
                <td className="p-2.5 text-amber-400 font-bold font-mono">BGP-4 (Internet Backbone)</td>
                <td className="p-2.5 text-purple-400 font-bold font-mono">OSPF LSA Flooding, PIM-DM</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
