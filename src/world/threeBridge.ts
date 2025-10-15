// Bridge utilities to convert MeshData to THREE.Mesh
declare const THREE: any;
import type { MeshData } from './mesher';

export function meshDataToThreeMesh(m: MeshData): any {
  const geom = new THREE.BufferGeometry();
  // Safety: expand to non-indexed triangles to avoid Uint32 index issues on WebGL1.
  const tris = new Float32Array(m.quads * 6 * 3);
  // m.positions は quad ごとに 4頂点(=12要素) で並ぶ。
  // インデックスは常に [0,1,2, 0,2,3] を想定。
  for (let q = 0; q < m.quads; q++) {
    const basePos = q * 12; // 4 verts * 3 comps
    const p0 = m.positions.subarray(basePos + 0, basePos + 3);
    const p1 = m.positions.subarray(basePos + 3, basePos + 6);
    const p2 = m.positions.subarray(basePos + 6, basePos + 9);
    const p3 = m.positions.subarray(basePos + 9, basePos + 12);
    const outBase = q * 18; // 6 verts * 3 comps
    // tri1: 0,1,2
    tris.set(p0, outBase + 0);
    tris.set(p1, outBase + 3);
    tris.set(p2, outBase + 6);
    // tri2: 0,2,3
    tris.set(p0, outBase + 9);
    tris.set(p2, outBase + 12);
    tris.set(p3, outBase + 15);
  }
  geom.setAttribute('position', new THREE.BufferAttribute(tris, 3));
  geom.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ color: 0x9e9e9e });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  return mesh;
}
