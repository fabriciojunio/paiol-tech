import { test, expect } from '@playwright/test';

test.describe('Auth flow', () => {
  test('exibe tela de login e aceita telefone', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /paiol/i })).toBeVisible();
    await page.getByPlaceholder(/telefone/i).fill('+5511987654321');
    await page.getByRole('button', { name: /entrar|continuar/i }).click();
    await expect(page.getByText(/código|otp/i)).toBeVisible({ timeout: 5000 });
  });

  test('bloqueia acesso sem autenticação', async ({ page }) => {
    await page.goto('/debts');
    await expect(page).toHaveURL(/login|\/$/);
  });
});
