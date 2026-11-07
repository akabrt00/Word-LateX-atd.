/** Local editor changes and PDF provenance are independent of saving to disk. */
export class DocumentProgress {
  revision = 0;
  pdfRevision: number | null = null;
  readonly unsaved = new Set<string>();
  readonly listeners: (() => void)[] = [];
  private notify() { for (const listener of this.listeners) listener(); }
  reset() { this.revision++; this.pdfRevision = null; this.unsaved.clear(); this.notify(); }
  changed(file: string) { this.revision++; this.unsaved.add(file); this.notify(); }
  saved(file: string) { this.unsaved.delete(file); this.notify(); }
  moved(from: string, to: string) {
    if (from === to) return;
    if (this.unsaved.delete(from)) this.unsaved.add(to);
    this.invalidate();
  }
  /** A known source change outside an editor, or a change of compile target. */
  invalidate() { this.revision++; this.notify(); }
  published(revision: number | null) { this.pdfRevision = revision; this.notify(); }
  get pdfState(): "unknown" | "current" | "stale" {
    return this.pdfRevision === null ? "unknown" : this.pdfRevision === this.revision ? "current" : "stale";
  }
}

export const documentProgress = new DocumentProgress();
