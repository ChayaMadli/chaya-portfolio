import { test, expect } from '@playwright/test';

test('primary assistant flow completes with streaming response and tool result', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.route('**/api/chat', async (route) => {
    const stream = [
      'data: {"type":"text","text":"I found the relevant project."}\n\n',
      'data: {"type":"tool-input-streaming","toolName":"getProjectDetails"}\n\n',
      'data: {"type":"tool-input-available","toolName":"getProjectDetails","input":{"project":"soldierMonitoring"}}\n\n',
      'data: {"type":"tool-output-available","toolName":"getProjectDetails","output":{"name":"Wearable IoT-Based Soldier Health and Safety Monitoring System","category":"IoT / Embedded Systems","technologies":["ESP32","React","Node.js"],"description":"A wearable monitoring system designed to collect soldier health and environmental information.","role":"Full-stack engineer"}}\n\n',
      'data: {"type":"text","text":" This project is a wearable monitoring system for soldiers."}\n\n',
      'data: [DONE]\n\n',
    ].join('');

    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream; charset=utf-8',
      body: stream,
    });
  });

  await page.goto('/');

  await expect(page.locator('h1')).toBeVisible();

  const input = page.getByRole('textbox', { name: /message input/i });
  await input.fill('Tell me about the soldier monitoring project');
  await page.getByRole('button', { name: /send message/i }).click();

  await expect(page.getByText('Tell me about the soldier monitoring project')).toBeVisible();

  await expect(
    page.getByRole('heading', { name: /Wearable IoT-Based Soldier Health and Safety Monitoring System/i })
  ).toBeVisible();

  await expect(page.getByText('PROJECT RESULT')).toBeVisible();
  await expect(page.getByText('A wearable monitoring system designed to collect soldier health and environmental information.')).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
