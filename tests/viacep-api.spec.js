const { test, expect } = require('@playwright/test');

const viaCepUrl = 'https://viacep.com.br/ws';

test.describe('API ViaCEP', () => {
  test('API-01 — consultar CEP válido e conferir o endereço retornado', async ({ request }) => {
    const response = await request.get(`${viaCepUrl}/01001000/json/`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const address = await response.json();
    expect(address).toMatchObject({
      cep: '01001-000',
      logradouro: 'Praça da Sé',
      bairro: 'Sé',
      localidade: 'São Paulo',
      uf: 'SP',
    });
    expect(address.erro).toBeUndefined();
  });

  test('API-02 — rejeitar CEP com formato inválido', async ({ request }) => {
    const response = await request.get(`${viaCepUrl}/123/json/`);

    expect(response.status()).toBe(400);
  });

  test('API-03 — indicar CEP válido no formato, mas inexistente', async ({ request }) => {
    const response = await request.get(`${viaCepUrl}/00000000/json/`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    await expect(response.json()).resolves.toMatchObject({ erro: 'true' });
  });
});
