import { test, expect } from '@playwright/test';

test.use({ storageState: 'tests/.auth/user.json' });

test.describe('Débitos', () => {
  test('lista débitos do produtor', async ({ page }) => {
    await page.goto('/debts');
    await expect(page.getByRole('heading', { name: /dívidas/i })).toBeVisible();
  });

  test('abre formulário de novo débito', async ({ page }) => {
    await page.goto('/debts/new');
    await expect(page.getByLabel(/credor/i)).toBeVisible();
    await expect(page.getByLabel(/valor/i)).toBeVisible();
    await expect(page.getByLabel(/vencimento/i)).toBeVisible();
  });

  test('valida campos obrigatórios', async ({ page }) => {
    await page.goto('/debts/new');
    await page.getByRole('button', { name: /salvar|cadastrar/i }).click();
    await expect(page.getByText(/obrigatório|required/i).first()).toBeVisible();
  });
});
