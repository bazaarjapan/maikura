// Bridge utilities to convert MeshData to THREE.Mesh
declare const THREE: any;
import type { MeshData } from './mesher';

export function meshDataToThreeMesh(m: MeshData): any {
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(m.positions, 3));
  geom.setIndex(new THREE.BufferAttribute(m.indices, 1));
  geom.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ color: 0x9e9e9e });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  return mesh;
}

