interface PdfSnapshot { name: string; bytes: Uint8Array; }
interface ExportOperations {
  capture(): Promise<PdfSnapshot | null>;
  choose(name: string): Promise<string | null>;
  write(bytes: Uint8Array, destination: string): Promise<void>;
  busy(value: boolean): void;
}

// Capture the displayed document before the native dialog: switching projects or
// building another PDF while choosing a location must not change the exported copy.
export class PdfExportFlow {
  private saving = false;
  private operations: ExportOperations;
  constructor(operations: ExportOperations) { this.operations = operations; }

  async save(): Promise<string | null> {
    if (this.saving) return null;
    this.saving = true;
    this.operations.busy(true);
    try {
      const snapshot = await this.operations.capture();
      if (!snapshot) return null;
      const destination = await this.operations.choose(snapshot.name);
      if (!destination) return null;
      await this.operations.write(snapshot.bytes, destination);
      return destination;
    } finally {
      this.saving = false;
      this.operations.busy(false);
    }
  }
}
