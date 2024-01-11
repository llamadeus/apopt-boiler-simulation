import { getAppliances, getConnections, getNodes } from '../data';
import type { Connection, Node } from '../types';


export function* iterate(
  connections: Connection[],
  nodes = getNodes(),
): IterableIterator<[Connection, Node, Node]> {
  const nodesMap = new Map(nodes.map(node => [node.pipeId, node]));

  for (const connection of connections) {
    const start = nodesMap.get(connection.nodeA);
    const end = nodesMap.get(connection.nodeB);

    if (typeof start == 'undefined' || typeof end == 'undefined') {
      throw new Error('Cannot find start or end');
    }

    yield [connection, start, end];
  }
}

export function computeVolume(connections: Connection[], nodes = getNodes()): number {
  let volume = 0;

  for (const [connection, start, end] of iterate(connections, nodes)) {
    const radiusInM = connection.diameterInCm / 2 / 100;
    const length = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2 + (end.z - start.z) ** 2);

    volume += Math.PI * radiusInM ** 2 * length * 1000;
  }

  return volume;
}

export function computeLoss(connections: Connection[], nodes = getNodes()): number {
  let loss = 0;

  for (const [connection, start, end] of iterate(connections, nodes)) {
    const radiusInM = connection.diameterInCm / 2 / 100;
    const length = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2 + (end.z - start.z) ** 2);
    const volume = Math.PI * radiusInM ** 2 * length * 1000;

    loss += volume * connection.lossOfEnergy;
  }

  return loss;
}

export function cleanConnections(connections: Connection[], nodes = getNodes()): Connection[] {
  return connections.filter((connection) => {
    const hasStart = nodes.some(node => node.pipeId === connection.nodeA);
    const hasEnd = nodes.some(node => node.pipeId === connection.nodeB);

    return hasStart && hasEnd;
  });
}

export function isApplianceNode(node: Node, appliances = getAppliances()): boolean {
  const applianceNames = new Set<string>(appliances.map(appliance => {
    if (appliance.household === 'shop' || appliance.household === 'shared') {
      return appliance.name;
    }

    return `${appliance.name}_${appliance.household[0].toLowerCase()}`;
  }));

  return node.pipeId === 'boiler' || applianceNames.has(node.pipeId);
}

export function getConnectionsFromPath(path: string[], connections = getConnections()): Connection[] {
  const connectionsMap = new Map<string, Connection>(connections.map(connection => ([
    connectionKey(connection),
    connection,
  ])));
  const result: Connection[] = [];

  for (let i = 0; i < path.length - 1; i++) {
    const key = connectionKey(path[i], path[i + 1]);
    const connection = connectionsMap.get(key);

    if (typeof connection == 'undefined') {
      throw new Error('Cannot find connection');
    }

    result.push(connection);
  }

  return result;
}

export function connectionKey(connection: Connection): string;
export function connectionKey(node1: Node | string, node2: Node | string): string;
export function connectionKey(node1: Connection | Node | string, node2?: Node | string): string {
  if (typeof node1 == 'object' && 'lossOfEnergy' in node1) {
    return [node1.nodeA, node1.nodeB].toSorted().join(';');
  }

  if (typeof node2 == 'undefined') {
    throw new Error('Missing node2');
  }

  return [
    typeof node1 == 'string' ? node1 : node1.pipeId,
    typeof node2 == 'string' ? node2 : node2.pipeId,
  ].toSorted().join(';');
}

export function computeLitresPerHourFromConsumption(consumption: number): number {
  return consumption / 160;
}
