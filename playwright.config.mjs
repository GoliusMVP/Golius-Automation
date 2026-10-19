import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests',testMatch:'**/*.spec.mjs',fullyParallel:true,workers:2,
  reporter:[['list']],use:{baseURL:'http://127.0.0.1:4173',headless:true,trace:'retain-on-failure'},
  webServer:{command:'npm run dev',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI},
  projects:[{name:'chromium',use:{browserName:'chromium'}}]
});
