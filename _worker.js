// Deployment entry only. The application's source and archive stay separate.
const CONTENT_ORIGIN = 'https://thevoyager.pages.dev';

export default {
  async fetch(request) {
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('This exhibit is read-only.', {
        status: 405, headers: { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' },
      });
    }
    const incoming = new URL(request.url);
    const target = new URL(CONTENT_ORIGIN);
    target.pathname = incoming.pathname;
    target.search = incoming.search;
    const headers = new Headers();
    for (const name of ['Accept', 'Range', 'If-None-Match', 'If-Modified-Since']) {
      const value = request.headers.get(name);
      if (value !== null) headers.set(name, value);
    }
    try {
      const response = await fetch(target, {
        method: request.method, headers, redirect: 'manual', signal: request.signal,
      });
      const outgoing = new Headers(response.headers);
      outgoing.delete('Set-Cookie');
      const location = outgoing.get('Location');
      if (location) {
        const redirect = new URL(location, target);
        if (redirect.origin === CONTENT_ORIGIN) {
          outgoing.set('Location', `${incoming.origin}${redirect.pathname}${redirect.search}${redirect.hash}`);
        }
      }
      return new Response(response.body, {
        status: response.status, statusText: response.statusText, headers: outgoing,
      });
    } catch {
      return new Response('The exhibit is temporarily unavailable. Please try again later.', {
        status: 502, headers: { 'Cache-Control': 'no-store' },
      });
    }
  },
};
