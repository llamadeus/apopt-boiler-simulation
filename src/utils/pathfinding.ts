import type { Connection, Node as NodeType } from '../types';


export class Graph {
  public readonly nodes: Map<string, Node>;

  constructor() {
    this.nodes = new Map();
  }

  addNode(node: Node): void {
    this.nodes.set(node.id, node);
  }

  addEdge(node1: Node, node2: Node, weight: number): void {
    if (! this.nodes.has(node1.id) || ! this.nodes.has(node2.id)) {
      throw new Error('Nodes not found in the graph');
    }

    node1.edges.push({ node: node2, weight });
    node2.edges.push({ node: node1, weight });
  }
}

export class Node {
  public readonly id: string;
  public readonly node: NodeType;
  public readonly edges: { node: Node; weight: number }[];
  public readonly heuristic: number;

  constructor(node: NodeType, heuristic = 0) {
    this.id = node.pipeId;
    this.node = node;
    this.edges = [];
    this.heuristic = heuristic; // Heuristic function for A*
  }
}

function reconstructPath(cameFrom: Map<string, Node>, current: Node): string[] {
  const path: string[] = [current.id];

  while (cameFrom.has(current.id)) {
    current = cameFrom.get(current.id)!;
    path.unshift(current.id);
  }

  return path;
}

export function createGraph(nodes: NodeType[], connections: Connection[]): Graph {
  const graph = new Graph();
  const boiler = nodes.find(node => node.pipeId === 'boiler');
  const nodesMap = new Map<string, Node>();

  if (typeof boiler == 'undefined') {
    throw new Error('Cannot find boiler');
  }

  for (const node of nodes) {
    const heuristic = Math.sqrt((boiler.x - node.x) ** 2 + (boiler.y - node.y) ** 2 + (boiler.z - node.z) ** 2);
    const n = new Node(node, heuristic);

    graph.addNode(n);
    nodesMap.set(node.pipeId, n);
  }

  for (const connection of connections) {
    const start = nodesMap.get(connection.nodeA);
    const end = nodesMap.get(connection.nodeB);

    if (typeof start == 'undefined' || typeof end == 'undefined') {
      throw new Error('Cannot find start or end');
    }

    const length = Math.sqrt((end.node.x - start.node.x) ** 2 + (end.node.y - start.node.y) ** 2 + (end.node.z - start.node.z) ** 2);
    const radiusInM = connection.diameterInCm / 2 / 100;
    const volume = Math.PI * radiusInM ** 2 * length;
    const heuristic = (volume * 1000) * connection.lossOfEnergy;

    graph.addEdge(start, end, heuristic);
    // graph.addEdge(start, end, connection.lossOfEnergy);
  }

  return graph;
}

export function aStar(graph: Graph, startId: string, goalId: string): string[] | null {
  const openSet: Set<Node> = new Set();
  const closedSet: Set<Node> = new Set();
  const cameFrom: Map<string, Node> = new Map();
  const gScore: Map<string, number> = new Map();
  const fScore: Map<string, number> = new Map();

  // Initialize scores
  graph.nodes.forEach((node) => {
    gScore.set(node.id, Infinity);
    fScore.set(node.id, Infinity);
  });

  const startNode = graph.nodes.get(startId);
  const goalNode = graph.nodes.get(goalId);

  if (! startNode || ! goalNode) {
    throw new Error('Start or goal node not found in the graph');
  }

  gScore.set(startNode.id, 0);
  fScore.set(startNode.id, startNode.heuristic);

  openSet.add(startNode);

  while (openSet.size > 0) {
    // Get the node with the lowest fScore from openSet
    const current = Array.from(openSet).reduce((minNode, node) =>
      fScore.get(node.id)! < fScore.get(minNode.id)! ? node : minNode,
    );

    if (current.id === goalNode.id) {
      // Reconstruct the path from start to goal
      return reconstructPath(cameFrom, current);
    }

    openSet.delete(current);
    closedSet.add(current);

    for (const edge of current.edges) {
      const neighbor = edge.node;

      if (closedSet.has(neighbor)) {
        continue; // Ignore already evaluated neighbor
      }

      const tentativeGScore = gScore.get(current.id)! + edge.weight;

      if (! openSet.has(neighbor)) {
        openSet.add(neighbor);
      }
      else if (tentativeGScore >= gScore.get(neighbor.id)!) {
        continue; // Not a better path
      }

      // This path is the best so far
      cameFrom.set(neighbor.id, current);
      gScore.set(neighbor.id, tentativeGScore);
      fScore.set(neighbor.id, gScore.get(neighbor.id)! + neighbor.heuristic);
    }
  }

  // No path found
  return null;
}

export function findUnreachableNodes(graph: Graph, goalId: string): Node[] {
  const nodes: Node[] = [];

  for (const node of graph.nodes.values()) {
    const path = aStar(graph, node.id, goalId);

    if (path === null) {
      nodes.push(node);
    }
  }

  return nodes;
}
