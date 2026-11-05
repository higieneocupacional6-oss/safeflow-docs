/** One active write and one replaceable pending snapshot, never a backlog. */
export class AetValeSaveQueue<T> {
  private pending: { value: T; markSaved: boolean; waiters: ((ok: boolean) => void)[] } | null = null;
  private running = false;
  private last: T | null = null;
  private marked = false;

  constructor(private write: (value: T, markSaved: boolean, contentChanged: boolean) => Promise<void>) {}

  initialize(value: T, marked: boolean) { this.last = value; this.marked = marked; }
  isSaved(value: T) { return this.last === value; }

  save(value: T, markSaved = false): Promise<boolean> {
    return new Promise(resolve => {
      if (this.pending) {
        this.pending.value = value;
        this.pending.markSaved ||= markSaved;
        this.pending.waiters.push(resolve);
      } else {
        this.pending = { value, markSaved, waiters: [resolve] };
      }
      void this.drain();
    });
  }

  private async drain() {
    if (this.running) return;
    this.running = true;
    while (this.pending) {
      const task = this.pending;
      this.pending = null;
      let ok = false;
      try {
        const changed = this.last !== task.value;
        if (changed || (task.markSaved && !this.marked)) {
          await this.write(task.value, task.markSaved, changed);
          this.last = task.value;
          this.marked ||= task.markSaved;
        }
        ok = true;
      } catch { /* Keep the previous successful baseline for retry. */ }
      task.waiters.forEach(resolve => resolve(ok));
    }
    this.running = false;
  }
}