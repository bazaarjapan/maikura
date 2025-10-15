declare const THREE: any;
import { ChunkManager } from './chunkManager';
import { generateChunk } from './generator';
import { meshChunk } from './mesher';
import { meshDataToThreeMesh } from './threeBridge';
import { CHUNK_SIZE, CHUNK_HEIGHT, offsetOf, inBounds, type ChunkData } from './types';

type ChunkKeyStr = string;

export class RuntimeWorld {
  private cm: ChunkManager;
  private scene: any;
  private meshes = new Map<ChunkKeyStr, any>();
  private chunks = new Map<ChunkKeyStr, Uint8Array>();
  private perFrameBudget = 2; // handle at most N chunk builds per frame

  constructor(scene: any, seed: string, renderDistance = 1) {
    this.scene = scene;
    this.cm = new ChunkManager(seed, renderDistance);
  }

  update(playerX: number, playerZ: number) {
    const res = this.cm.updatePlayerPosition(playerX, playerZ);
    // unload
    for (const k of res.unload) {
      const mesh = this.meshes.get(k);
      if (mesh) {
        this.scene.remove(mesh);
        this.meshes.delete(k);
      }
    }
    // process a small number of queued requests per frame to avoid jank
    let budget = this.perFrameBudget;
    while (budget-- > 0) {
      const req = this.cm.nextRequest();
      if (!req) break;
      const data = generateChunk(req.seed, req.cx, req.cz);
      const meshData = meshChunk(data.blocks);
      const mesh = meshDataToThreeMesh(meshData);
      mesh.position.set(req.cx * 16, 0, req.cz * 16);
      this.scene.add(mesh);
      this.meshes.set(`${req.cx},${req.cz}`, mesh);
      this.chunks.set(`${req.cx},${req.cz}`, data.blocks);
      this.cm.onChunkGenerated({ key: { seed: req.seed, cx: req.cx, cz: req.cz }, blocks: data.blocks });
    }
  }

  getCollisionTargets(): any[] {
    return Array.from(this.meshes.values());
  }

  private key(cx: number, cz: number) { return `${cx},${cz}`; }

  private worldToChunkLocal(x: number, y: number, z: number) {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const lx = Math.floor(x - cx * CHUNK_SIZE);
    const lz = Math.floor(z - cz * CHUNK_SIZE);
    const ly = Math.floor(y);
    return { cx, cz, lx, ly, lz };
  }

  setBlockAtWorld(x: number, y: number, z: number, id: number): boolean {
    const { cx, cz, lx, ly, lz } = this.worldToChunkLocal(x, y, z);
    const k = this.key(cx, cz);
    const data = this.chunks.get(k);
    if (!data) return false; // 未ロード
    if (!inBounds(lx, ly, lz)) return false;
    data[offsetOf(lx, ly, lz)] = id;
    this.remesh(cx, cz, data);
    return true;
  }

  getBlockAtWorld(x: number, y: number, z: number): number | null {
    const { cx, cz, lx, ly, lz } = this.worldToChunkLocal(x, y, z);
    const data = this.chunks.get(this.key(cx, cz));
    if (!data || !inBounds(lx, ly, lz)) return null;
    return data[offsetOf(lx, ly, lz)];
  }

  private remesh(cx: number, cz: number, blocks: Uint8Array) {
    const k = this.key(cx, cz);
    const old = this.meshes.get(k);
    if (old) this.scene.remove(old);
    const meshData = meshChunk(blocks);
    const mesh = meshDataToThreeMesh(meshData);
    mesh.position.set(cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE);
    this.scene.add(mesh);
    this.meshes.set(k, mesh);
  }
}
