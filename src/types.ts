import appliances from './data/appliances.json';
import connections from './data/connections.json';
import nodes from './data/nodes.json';


export type Appliance = typeof appliances[number];
export type Connection = typeof connections[number];
export type Node = typeof nodes[number];

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}
