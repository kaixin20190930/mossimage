// Test-only entry. Never referenced by wrangler.jsonc or production bundles.
import app from '../worker/index';
import { GenerationState } from '../worker/state';
export class TestState extends GenerationState {
  private clock?: number;
  protected now() { return this.clock ?? Date.now(); }
  async fetch(request: Request) {
    if (new URL(request.url).pathname === '/test-clock') {
      this.clock = await request.json() as number;
      return Response.json({ ok: true });
    }
    return super.fetch(request);
  }
}
export default app;
