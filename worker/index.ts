import type { Env } from './env';
import { configured } from '../lib/server';
import { generate } from './generate';
import { status } from './status';
import { generationIntent } from './intent';
import { account, logout, requestCode, verifyCode, authConfigured, paymentsConfigured } from './account';
import { createCheckout, createPortal, stripeWebhook } from './billing';
import { analyticsSummary, recordAnalytics } from './analytics';
import { recordEditingInterest } from './editing-interest';
import { dashboard, deleteAccount, deleteGeneration, exportAccount, exportedGenerationImage, generationImage } from './dashboard';
import { runDailyReporting } from './gsc';
import { reconcileGenerationIntents } from './reconcile';
export { GenerationState } from './state';
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.protocol === 'http:' || url.hostname === 'www.mossimage.run') {
      url.protocol = 'https:';
      url.hostname = 'mossimage.run';
      url.port = '';
      return Response.redirect(url.href, 308);
    }
    if (url.pathname === '/guide/base-vs-sft' || url.pathname === '/guide/base-vs-sft/') {
      url.pathname = '/compare/base-vs-sft/';
      return Response.redirect(url.href, 308);
    }
    if (url.pathname === '/year' || url.pathname === '/year/') {
      url.pathname = '/pricing/';
      return Response.redirect(url.href, 308);
    }
    if (url.pathname === '/use-cases/menu' || url.pathname === '/use-cases/menu/') {
      url.pathname = '/presets/menu/';
      return Response.redirect(url.href, 308);
    }
    if (url.pathname === '/moss-image-generator-online' || url.pathname === '/moss-image-generator-online/') {
      url.pathname = '/';
      return Response.redirect(url.href, 308);
    }
    if (url.pathname === '/guide/json-layout-generator' || url.pathname === '/guide/json-layout-generator/') {
      url.pathname = '/json-layout/';
      return Response.redirect(url.href, 308);
    }
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const apiMethods: Record<string, string> = {
      '/api/config': 'GET', '/api/generate': 'POST', '/api/generate/status': 'GET', '/api/generate/intent': 'GET',
      '/api/account': 'GET', '/api/auth/request': 'POST', '/api/auth/verify': 'POST',
      '/api/auth/logout': 'POST', '/api/billing/checkout': 'POST',
      '/api/billing/portal': 'POST', '/api/stripe/webhook': 'POST',
      '/api/analytics': 'POST', '/api/analytics/summary': 'GET', '/api/editing-interest': 'POST',
      '/api/account/dashboard': 'GET', '/api/account/generations/image': 'GET',
      '/api/account/generations/delete': 'POST', '/api/account/export': 'GET',
      '/api/account/export/image': 'GET', '/api/account/delete': 'POST',
    };
    if (path in apiMethods) {
      const expected = apiMethods[path];
      if (request.method !== expected) return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { Allow: expected, 'Cache-Control': 'no-store' } });
      if (path === '/api/config') return Response.json({ enabled: configured(env) && !!env.GENERATION_STATE, authEnabled: authConfigured(env), paymentsEnabled: paymentsConfigured(env), anonymousPreviewLimit: env.AUTH_ENABLED === 'true' ? 1 : 0 }, { headers: { 'Cache-Control': 'no-store' } });
      try {
        const handlers: Record<string, () => Promise<Response>> = {
          '/api/generate': () => generate(request, env),
          '/api/generate/status': () => status(request, env),
          '/api/generate/intent': () => generationIntent(request, env),
          '/api/account': () => account(request, env),
          '/api/auth/request': () => requestCode(request, env),
          '/api/auth/verify': () => verifyCode(request, env),
          '/api/auth/logout': () => logout(request, env),
          '/api/billing/checkout': () => createCheckout(request, env),
          '/api/billing/portal': () => createPortal(request, env),
          '/api/stripe/webhook': () => stripeWebhook(request, env),
          '/api/analytics': () => recordAnalytics(request, env),
          '/api/analytics/summary': () => analyticsSummary(request, env),
          '/api/editing-interest': () => recordEditingInterest(request, env),
          '/api/account/dashboard': () => dashboard(request, env),
          '/api/account/generations/image': () => generationImage(request, env),
          '/api/account/generations/delete': () => deleteGeneration(request, env),
          '/api/account/export': () => exportAccount(request, env),
          '/api/account/export/image': () => exportedGenerationImage(request, env),
          '/api/account/delete': () => deleteAccount(request, env),
        };
        const response = await handlers[path]();
        response.headers.set('Cache-Control', 'no-store');
        return response;
      } catch {
        console.error(JSON.stringify({ event: 'generation_api_failed' }));
        return Response.json({ error: 'Generation is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
      }
    }
    const assetResponse = env.ASSETS ? await env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });
    if (url.pathname.startsWith('/workflows/') && url.pathname.endsWith('.json')) {
      const headers = new Headers(assetResponse.headers);
      headers.set('X-Robots-Tag', 'noindex');
      return new Response(assetResponse.body, {
        status: assetResponse.status,
        statusText: assetResponse.statusText,
        headers,
      });
    }
    return assetResponse;
  },
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    if (controller.cron === '17 2 * * *') ctx.waitUntil(runDailyReporting(env, controller.scheduledTime));
    else ctx.waitUntil(reconcileGenerationIntents(env));
  },
} satisfies ExportedHandler<Env>;
