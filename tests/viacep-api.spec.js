const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');

const viaCepUrl = 'https://viacep.com.br/ws';

async function attachApiEvidence(testInfo, response, url, responseBody) {
  const evidencePath = testInfo.outputPath('api-response.json');
  const evidence = {
    method: 'GET',
    url,
    status: response.status(),
    contentType: response.headers()['content-type'],
    responseBody,
  };

  await fs.writeFile(evidencePath, JSON.stringify(evidence, null, 2));
  await testInfo.attach('api-response.json', {
    path: evidencePath,
    contentType: 'application/json',
  });
}

test.describe('API ViaCEP', () => {
  test('API-01 — consultar CEP válido e conferir o endereço retornado', async ({ request }, testInfo) => {
    const url = `${viaCepUrl}/01001000/json/`;
    const response = await request.get(url);
    const responseBody = await response.text();
    await attachApiEvidence(testInfo, response, url, responseBody);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const address = JSON.parse(responseBody);
    expect(address).toMatchObject({
      cep: '01001-000',
      logradouro: 'Praça da Sé',
      bairro: 'Sé',
      localidade: 'São Paulo',
      uf: 'SP',
    });
    expect(address.erro).toBeUndefined();
  });

  test('API-02 — rejeitar CEP com formato inválido', async ({ request }, testInfo) => {
    const url = `${viaCepUrl}/123/json/`;
    const response = await request.get(url);
    const responseBody = await response.text();
    await attachApiEvidence(testInfo, response, url, responseBody);

    expect(response.status()).toBe(400);
  });

  test('API-03 — indicar CEP válido no formato, mas inexistente', async ({ request }, testInfo) => {
    const url = `${viaCepUrl}/00000000/json/`;
    const response = await request.get(url);
    const responseBody = await response.text();
    await attachApiEvidence(testInfo, response, url, responseBody);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    expect(JSON.parse(responseBody)).toMatchObject({ erro: 'true' });
  });
});
