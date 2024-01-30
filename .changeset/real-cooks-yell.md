---
'@hono/vite-dev-server': minor
---

Leverage vite error handling. To leverage this, return client errors in development like in the example below:

```ts
honoApp.get('*', async c => {
  try {
    // react, solid, etc
    const app = await renderClientApp(<App />);

    return new Response(app, { headers: { 'Content-Type': 'text/html' } });
  } catch (err: any) {
    // in dev, pass the error back to the vite dev server to display in the error overlay
    if (import.meta.env.DEV) return err;

    throw err;
  }
});
```
