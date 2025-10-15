declare const THREE: any;
import { ChunkManager } from './chunkManager';
import { generateChunk } from './generator';
import { meshChunk } from './mesher';
import { meshDataToThreeMesh } from './threeBridge';

type ChunkKeyStr = string;

export class RuntimeWorld {
  private cm: ChunkManager;
  private scene: any;
  private meshes = new Map<ChunkKeyStr, any>();
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
      this.cm.onChunkGenerated({ key: { seed: req.seed, cx: req.cx, cz: req.cz }, blocks: data.blocks });
    }
  }
}

