import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import chatHandler from './api/chat.js';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables (.env, .env.local) into process.env for dev server
  const env = loadEnv(mode, process.cwd(), '');
  if (env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  }

  return {
    plugins: [
      react(),
      {
        name: 'api-chat-dev-server',
        configureServer(server) {
          server.middlewares.use('/api/chat', (req, res) => {
            let bodyStr = '';
            req.on('data', (chunk) => {
              bodyStr += chunk;
            });
            req.on('end', async () => {
              try {
                req.body = bodyStr ? JSON.parse(bodyStr) : {};
              } catch (e) {
                req.body = {};
              }
              await chatHandler(req, res);
            });
          });
        }
      }
    ],
    test: {
      environment: 'jsdom',
      setupFiles: './src/setupTests.js',
      css: true,
      globals: true,
      restoreMocks: true,
      clearMocks: true,
      include: ['src/**/*.test.{js,jsx,ts,tsx}'],
      exclude: ['tests/**', 'node_modules/**'],
    },
  };
});
