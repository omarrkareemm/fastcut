export class OPFSFrameStore {
  private handle!: FileSystemSyncAccessHandle;
  private frameByteSize: number;
  private nextIndex = 0;
  private constructor(frameByteSize: number) { this.frameByteSize = frameByteSize; }
  static async open(frameByteSize: number, capacityFrames: number) {
    const store = new OPFSFrameStore(frameByteSize);
    const root = await navigator.storage.getDirectory();
    const fh = await root.getFileHandle('frames.raw', { create: true });
    (store as any).handle = await (fh as any).createSyncAccessHandle();
    const total = frameByteSize * capacityFrames;
    if (store.handle.getSize() < total) store.handle.truncate(total);
    return store;
  }
  writeFrame(index: number, data: Uint8Array): void {
    this.handle.write(data, { at: index * this.frameByteSize });
    this.nextIndex = Math.max(this.nextIndex, index + 1);
  }
  readFrame(index: number, into: Uint8Array): void { this.handle.read(into, { at: index * this.frameByteSize }); }
  get frameCount(): number { return this.nextIndex; }
  async close(): Promise<void> { this.handle.close(); }
}
export async function estimateOPFSQuota(requiredBytes: number) {
  const est = await navigator.storage.estimate();
  const available = (est.quota ?? 0) - (est.usage ?? 0);
  return { sufficient: available >= requiredBytes, available, required: requiredBytes };
}