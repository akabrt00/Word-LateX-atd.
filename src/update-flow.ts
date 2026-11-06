export interface UpdateInfo { available: boolean; version: string | null; notes: string | null; releaseUrl: string; }
export interface UpdateOperations {
  check(): Promise<UpdateInfo>;
  preflight(): Promise<void>;
  download(version: string): Promise<void>;
  save(): Promise<void>;
  install(version: string): Promise<void>;
}
/** Checking never installs. Only an explicit user action enters this sequence. */
export class UpdateFlow {
  private busy = false;
  private operations: UpdateOperations;
  constructor(operations: UpdateOperations) { this.operations = operations; }
  async check(): Promise<UpdateInfo> {
    if (this.busy) throw new Error("Aktualizace už probíhá.");
    this.busy = true;
    try { return await this.operations.check(); } finally { this.busy = false; }
  }
  async install(version: string): Promise<void> {
    if (this.busy) throw new Error("Aktualizace už probíhá.");
    this.busy = true;
    try {
      await this.operations.preflight();
      await this.operations.download(version);
      await this.operations.preflight();
      await this.operations.save();
      await this.operations.install(version);
    } finally { this.busy = false; }
  }
}
