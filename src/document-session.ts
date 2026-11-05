/** One editor's acknowledged disk revision. Background reads cannot replace it. */
export interface DocumentSnapshot { content: string; revision: string; }
export type DocumentWriter = (content: string, expectedRevision: string) => Promise<string>;

export class DocumentSession {
  revision: string;
  private pending: Promise<unknown> = Promise.resolve();
  private write: DocumentWriter;

  constructor(snapshot: DocumentSnapshot, write: DocumentWriter) {
    this.revision = snapshot.revision;
    this.write = write;
  }

  save(content: string): Promise<void> {
    const job = this.pending.then(async () => {
      this.revision = await this.write(content, this.revision);
    });
    // A failed save must not acknowledge the conflicting version or poison the queue.
    this.pending = job.catch(() => {});
    return job;
  }
}
