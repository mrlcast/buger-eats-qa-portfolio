const { test, expect } = require('@playwright/test');

const validCpf = '52998224725';
const validEmail = 'ana.teste@example.com';
const validWhatsapp = '(11) 98765-4321';
const validCepResponse = {
  cep: '01001-000',
  logradouro: 'Praça da Sé',
  complemento: 'lado ímpar',
  bairro: 'Sé',
  localidade: 'São Paulo',
  uf: 'SP',
  estado: 'São Paulo',
  regiao: 'Sudeste',
  ibge: '3550308',
  gia: '1004',
  ddd: '11',
  siafi: '7107',
};
const cnhPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/nN8AAAAASUVORK5CYII=',
  'base64'
);

async function mockPostalCodeLookup(page) {
  await page.route('https://viacep.com.br/ws/**', async (route) => {
    if (route.request().url().includes('/00000000/')) {
      await route.fulfill({ json: { erro: true } });
      return;
    }

    await route.fulfill({ json: validCepResponse });
  });
}

async function fillValidAddress(page) {
  await page.locator('[name="postalcode"]').fill('01001000');
  await page.getByRole('button', { name: 'Buscar CEP' }).click();
  await expect(page.locator('[name="address"]')).toHaveValue('Praça da Sé');
  await page.locator('[name="address-number"]').fill('100');
}

async function fillRequiredFields(page, { cpf = validCpf, whatsapp = '' } = {}) {
  await page.locator('[name="name"]').fill('Ana Exemplo');
  await page.locator('[name="cpf"]').fill(cpf);
  await page.locator('[name="email"]').fill(validEmail);
  if (whatsapp) {
    await page.locator('[name="whatsapp"]').fill(whatsapp);
  }
  await fillValidAddress(page);
}

async function attachCnh(page) {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: 'cnh.png',
    mimeType: 'image/png',
    buffer: cnhPng,
  });
  expect(await fileInput.evaluate((input) => input.files[0].name)).toBe('cnh.png');
}

test('CT-01 — validar textos e elementos da página inicial', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Buger Eats');
  await expect(page.getByRole('banner').getByRole('img', { name: 'Buger Eats' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Seja um parceiro entregador pela Buger Eats' })
  ).toBeVisible();
  await expect(
    page.getByText(
      'Em vez de oportunidades tradicionais de entrega de refeições em horários pouco flexíveis, seja seu próprio chefe.'
    )
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Cadastre-se para fazer entregas' })
  ).toHaveAttribute('href', '/deliver');
});

test('CT-02 — navegar para o cadastro de entregadores', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Cadastre-se para fazer entregas' }).click();

  await expect(page).toHaveURL(/\/deliver$/);
  await expect(
    page.getByRole('heading', { name: 'Cadastre-se para fazer entregas' })
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Voltar para home' })).toHaveAttribute('href', '/');
});

test.describe('validações do cadastro', () => {
  test.beforeEach(async ({ page }) => {
    await mockPostalCodeLookup(page);
    await page.goto('/deliver');
  });

  test('CT-03 — validar textos, grupos, campos e métodos disponíveis', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dados' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Endereço' })).toBeVisible();
    await expect(page.getByText('Informe o cep, número e complemento')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Método de entrega' })).toBeVisible();
    await expect(page.getByText('Escolha um dos métodos abaixo:')).toBeVisible();

    for (const name of ['Nome completo', 'CPF somente números', 'E-mail', 'Whatsapp', 'CEP']) {
      await expect(page.getByRole('textbox', { name })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'Buscar CEP' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Rua' })).toBeDisabled();
    await expect(page.getByRole('textbox', { name: 'Número', exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Complemento' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Bairro' })).toBeDisabled();
    await expect(page.getByRole('textbox', { name: 'Cidade/UF' })).toBeDisabled();

    for (const method of ['Moto', 'Bicicleta', 'Van/Carro']) {
      await expect(page.getByRole('img', { name: method })).toBeVisible();
      await expect(page.getByRole('listitem').getByText(method)).toBeVisible();
    }

    await expect(page.getByText('Foto da sua CNH')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Cadastre-se para fazer entregas' })
    ).toBeVisible();
  });

  test('CT-04 — clicar e digitar em cada campo editável', async ({ page }) => {
    const fields = [
      ['[name="name"]', 'Ana Exemplo'],
      ['[name="cpf"]', validCpf],
      ['[name="email"]', validEmail],
      ['[name="whatsapp"]', validWhatsapp],
      ['[name="postalcode"]', '01001000'],
      ['[name="address-number"]', '100'],
      ['[name="address-details"]', 'Apto 12'],
    ];

    for (const [selector, value] of fields) {
      const field = page.locator(selector);
      await field.click();
      await expect(field).toBeFocused();
      await field.fill(value);
      await expect(field).toHaveValue(value);
    }
  });

  test('CT-05 — buscar CEP e preencher os campos de endereço automaticamente', async ({ page }) => {
    const cep = page.getByRole('textbox', { name: 'CEP' });
    await cep.click();
    await expect(cep).toBeFocused();
    await cep.fill('01001000');
    await page.getByRole('button', { name: 'Buscar CEP' }).click();

    await expect(page.getByRole('textbox', { name: 'Rua' })).toHaveValue('Praça da Sé');
    await expect(page.getByRole('textbox', { name: 'Bairro' })).toHaveValue('Sé');
    await expect(page.getByRole('textbox', { name: 'Cidade/UF' })).toHaveValue('São Paulo/SP');
    await expect(page.getByRole('textbox', { name: 'Rua' })).toBeDisabled();
    await expect(page.getByRole('textbox', { name: 'Bairro' })).toBeDisabled();
    await expect(page.getByRole('textbox', { name: 'Cidade/UF' })).toBeDisabled();
  });

  test('CT-06 — impedir cadastro vazio e exibir todos os campos obrigatórios', async ({ page }) => {
    await page.getByRole('button', { name: 'Cadastre-se para fazer entregas' }).click();

    for (const message of [
      'É necessário informar o nome',
      'É necessário informar o CPF',
      'É necessário informar o email',
      'É necessário informar o CEP',
      'É necessário informar o número do endereço',
      'Selecione o método de entrega',
      'Adicione uma foto da sua CNH',
    ]) {
      await expect(page.locator('.alert-error').getByText(message)).toBeVisible();
    }
    await expect(page.getByText('É necessário informar o Whatsapp')).toHaveCount(0);
    await expect(page.getByText('É necessário informar o complemento')).toHaveCount(0);
  });

  test('CT-07 — rejeitar CPF inválido', async ({ page }) => {
    await fillRequiredFields(page, { cpf: '123' });
    await page.getByRole('button', { name: 'Cadastre-se para fazer entregas' }).click();

    await expect(page.getByText('Oops! CPF inválido')).toBeVisible();
    await expect(page.getByText(/Recebemos os seus dados/)).toHaveCount(0);
  });

  test('CT-08 — validar formato do e-mail com a validação nativa do navegador', async ({ page }) => {
    const email = page.getByRole('textbox', { name: 'E-mail' });
    await email.click();
    await email.fill('email-invalido');

    expect(await email.evaluate((field) => field.checkValidity())).toBe(false);
  });

  test('CT-09 — permitir WhatsApp vazio e rejeitar formato preenchido inválido', async ({ page }) => {
    await fillRequiredFields(page, { whatsapp: '123' });
    await page.getByRole('button', { name: 'Cadastre-se para fazer entregas' }).click();

    await expect(page.getByText('Oops! Whatsapp com formato incorreto')).toBeVisible();
  });

  test('CT-10 — não preencher endereço com dados inválidos de CEP', async ({ page }) => {
    test.fail('O site preenche Cidade/UF com "undefined/undefined" para CEP inexistente.');
    await page.locator('[name="postalcode"]').fill('00000000');
    await page.getByRole('button', { name: 'Buscar CEP' }).click();

    await expect(page.locator('[name="address"]')).toHaveValue('');
    await expect(page.locator('[name="district"]')).toHaveValue('');
    await expect(page.locator('[name="city-uf"]')).not.toHaveValue(/undefined/);
  });

  test('CT-11 — selecionar um método de entrega por clique', async ({ page }) => {
    for (const method of ['Moto', 'Bicicleta', 'Van/Carro']) {
      const option = page.getByRole('listitem').filter({ hasText: method });
      await option.click();
      await expect(option).toHaveClass(/selected/);
    }
  });

  test('CT-12 — impedir envio quando mais de um método de entrega é selecionado', async ({ page }) => {
    await page.getByRole('listitem').filter({ hasText: 'Moto' }).click();
    await page.getByRole('listitem').filter({ hasText: 'Bicicleta' }).click();
    await page.getByRole('button', { name: 'Cadastre-se para fazer entregas' }).click();

    await expect(page.getByText('Oops! Selecione apenas um método de entrega')).toBeVisible();
  });

  test('CT-13 — enviar formulário válido com arquivo da CNH e confirmar sucesso', async ({ page }) => {
    await fillRequiredFields(page, { whatsapp: validWhatsapp });
    await page.locator('[name="address-details"]').fill('Apto 12');
    await attachCnh(page);
    await page.getByRole('listitem').filter({ hasText: 'Moto' }).click();
    await page.getByRole('button', { name: 'Cadastre-se para fazer entregas' }).click();

    await expect(page.getByRole('dialog')).toContainText('Aí Sim...');
    await expect(page.getByRole('dialog')).toContainText(
      'Recebemos os seus dados. Fique de olho na sua caixa de email, pois e em breve retornamos o contato.'
    );
    await page.getByRole('button', { name: 'Fechar' }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test('CT-14 — retornar do cadastro para a página inicial', async ({ page }) => {
  await page.goto('/deliver');
  await page.getByRole('link', { name: 'Voltar para home' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole('heading', { name: 'Seja um parceiro entregador pela Buger Eats' })
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Cadastre-se para fazer entregas' })
  ).toBeVisible();
});
