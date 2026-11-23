import { defineConfig } from 'astro/config';

// GitHub Pages serves the site at https://hamdy123234-alt.github.io/el-eraki/
export default defineConfig({
  site: 'https://hamdy123234-alt.github.io',
  base: process.env.NODE_ENV === 'production' ? '/el-eraki' : '/',
  server: { port: 4322 },
  devToolbar: { enabled: false },
});
