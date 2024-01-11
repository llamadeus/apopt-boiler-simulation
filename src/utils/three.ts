import * as THREE from 'three';
import { Material, Texture } from 'three';
import type { Vec3 } from '../types';


function loadTexture(url: string): Promise<Texture> {
  return new Promise(resolve => new THREE.TextureLoader().load(url, resolve));
}

export async function createPlane(url: string, z: number, scale = 0.0076) {
  const map = await loadTexture(url);
  const { width, height } = map.image;
  const geometry = new THREE.PlaneGeometry(width * scale, height * scale);
  const material = new THREE.MeshBasicMaterial({
    map,
    side: THREE.DoubleSide,
    opacity: 0.75,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(0, 0, z - 0.1);

  return mesh;
}

export function createLine(start: Vec3, end: Vec3, material: Material) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(start.x, start.y, start.z),
    new THREE.Vector3(end.x, end.y, end.z),
  ]);

  return new THREE.Line(geometry, material);
}

export function createNode(point: Vec3, material: Material, { special = false, size = 0.2 } = {}) {
  const geometry = new THREE.BoxGeometry(size, size, size);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.name = `node:${mesh.uuid}`;

  if (special) {
    mesh.rotation.set(Math.PI / 4, Math.PI / 4, Math.PI / 4);
  }

  mesh.position.set(point.x, point.y, point.z);

  return mesh;
}

export function createSphere(point: Vec3, material: Material, radius = 0.4) {
  const geometry = new THREE.SphereGeometry(radius);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(point.x, point.y, point.z);

  return mesh;
}
