import type { Appliance, Connection, Node } from '../types';
import appliances from './appliances.json';
import connections from './connections.json';
import nodes from './nodes.json';


export function getAppliances(): Appliance[] {
  return [...appliances];
}

export function getConnections(): Connection[] {
  return [...connections];
}

export function getNodes(): Node[] {
  return [...nodes];
}
