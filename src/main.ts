import * as console from 'console';
import { v4 as uuidv4 } from 'uuid';
import { localPath, readCsv } from '~/utils/file';


//
// const paths = trace(connections, 'shower_c');
//
// console.log(paths);

const scene = {
  metadata: {
    version: 4.6,
    type: 'Object',
    generator: 'Object3D.toJSON',
  },
  geometries: [{
    uuid: 'ef595c63-dc99-4da4-b0ae-d8dfaabb44ae',
    type: 'CylinderGeometry',
    radiusTop: 1,
    radiusBottom: 1,
    height: 3,
    radialSegments: 32,
    heightSegments: 1,
    openEnded: false,
    thetaStart: 0,
    thetaLength: 6.283185307179586,
  }],
  materials: [{
    uuid: '4ce279e0-2f99-4574-aaf6-fac1d85e20d9',
    type: 'MeshStandardMaterial',
    color: 16777215,
    roughness: 1,
    metalness: 0,
    emissive: 0,
    envMapIntensity: 1,
    blendColor: 0,
  }],
  object: {
    uuid: '31517222-A9A7-4EAF-B5F6-60751C0BABA3',
    type: 'Scene',
    name: 'Scene',
    layers: 1,
    matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    up: [0, 1, 0],
    children: [{
      uuid: 'f59c5f73-2e80-48a1-8286-1df30affdad7',
      type: 'Mesh',
      name: 'Cylinder',
      layers: 1,
      matrix: [0.9907374393020276, 0.11032020935707203, -0.07917561349729463, 0, -0.10413070090691419, 0.9914637906923447, 0.07846240421119695, 0, 0.08715574274765817, -0.06949102930147368, 0.9937680178757645, 0, 1, 2, 3, 1],
      up: [0, 1, 0],
      geometry: 'ef595c63-dc99-4da4-b0ae-d8dfaabb44ae',
      material: '4ce279e0-2f99-4574-aaf6-fac1d85e20d9',
    }],
  },
};

for (const connection of connections) {
  const start = nodesMap.get(connection.nodeA);
  const end = nodesMap.get(connection.nodeB);
  // const

  // scene.geometries.push({
  //   uuid: uuidv4(),
  //   type: 'CylinderGeometry',
  //   radiusTop: 1,
  //   radiusBottom: 1,
  //   height: 3,
  //   radialSegments: 16,
  //   heightSegments: 1,
  //   openEnded: false,
  //   thetaStart: 0,
  //   thetaLength: 2 * Math.PI,
  // });
}
