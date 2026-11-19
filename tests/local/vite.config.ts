import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fixtureResponse } from './fixtures';

const root = resolve(import.meta.dirname, '../..');
export default defineConfig({
  root,
  envDir: false,
  resolve: {
    alias: [
      {
        find: /^\$app$/,
        replacement: resolve(root, 'tests/local/runtime-bridge.ts'),
      },
      {
        find: /^\$app\/App$/,
        replacement: resolve(root, 'tests/local/runtime-bridge.ts'),
      },
      { find: '$app', replacement: resolve(root, 'src') },
      { find: '~', replacement: root },
    ],
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('http://127.0.0.1:4178'),
    'import.meta.env.VITE_IS_HOSTED': JSON.stringify('false'),
    'import.meta.env.VITE_DISABLE_FEEDBACK_FEATURE': JSON.stringify('true'),
    'import.meta.env.VITE_DOCUNINJA_API_URL': JSON.stringify(
      'http://127.0.0.1:4178/blocked-docuninja'
    ),
  },
  plugins: [
    react(),
    {
      name: 'local-fixtures-only',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          res.setHeader(
            'Content-Security-Policy',
            "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws://127.0.0.1:4178; frame-src 'none'; form-action 'none'; base-uri 'self'"
          );
          const url = new URL(req.url || '/', 'http://127.0.0.1:4178');
          if (
            url.pathname.startsWith('/api/') ||
            url.pathname.startsWith('/blocked-')
          ) {
            const response = fixtureResponse(req.method || 'GET', url);
            res.statusCode = response === undefined ? 501 : 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify(
                response ?? {
                  error: 'UNMAPPED LOCAL FIXTURE',
                  method: req.method,
                  path: url.pathname,
                }
              )
            );
            return;
          }
          next();
        });
      },
    },
  ],
  server: { host: '127.0.0.1', port: 4178, strictPort: true },
});
