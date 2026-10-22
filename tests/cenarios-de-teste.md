# Plano e execução de testes — Buger Eats

## Escopo

Este documento reúne os cenários funcionais automatizados com Playwright, os
testes diretos da API ViaCEP e o smoke test de performance com k6 para o site
[`https://buger-eats.vercel.app/`](https://buger-eats.vercel.app/).

O site tem duas páginas principais:

- `/`: página inicial para cadastro de entregadores.
- `/deliver`: formulário de cadastro de entregadores.

## 1. Testes funcionais e de interface (Playwright)

Os testes automatizados estão em
[`cenarios-de-teste.spec.js`](./cenarios-de-teste.spec.js). São 14 testes que
cobrem os cenários abaixo. Nas consultas de CEP, a resposta do ViaCEP é
simulada para evitar dependência de rede e manter os testes reproduzíveis.

### CT-01 — Validar textos e elementos da página inicial

**Passos:** abrir `/`.

**Resultado esperado:** título da página “Buger Eats”, logotipo, título
“Seja um parceiro entregador pela Buger Eats”, texto introdutório e link de
cadastro com destino `/deliver` estão presentes.

### CT-02 — Navegar para o cadastro

**Passos:** acionar “Cadastre-se para fazer entregas” na página inicial.

**Resultado esperado:** navegação para `/deliver`, título do formulário visível
e link “Voltar para home” apontando para `/`.

### CT-03 — Validar textos, grupos, campos e métodos disponíveis

**Passos:** abrir `/deliver` e conferir os títulos, textos auxiliares, campos,
botões e opções de entrega.

**Resultado esperado:** grupos “Dados”, “Endereço” e “Método de entrega”,
campos pessoais e de endereço, botão “Buscar CEP”, opções Moto/Bicicleta/
Van-Carro, indicação da foto da CNH e botão de cadastro são exibidos. Rua,
Bairro e Cidade/UF começam desabilitados.

### CT-04 — Interagir com os campos editáveis

**Passos:** clicar, verificar o foco, digitar e validar o valor nos campos
Nome, CPF, E-mail, WhatsApp, CEP, Número e Complemento.

**Resultado esperado:** cada campo recebe foco e aceita o valor informado.

### CT-05 — Consultar CEP válido no formulário

**Passos:** preencher `01001000` e acionar “Buscar CEP”.

**Resultado esperado:** Rua, Bairro e Cidade/UF recebem “Praça da Sé”, “Sé” e
“São Paulo/SP”. Os três campos continuam desabilitados para edição manual.

### CT-06 — Enviar o formulário vazio

**Passos:** acionar o botão de cadastro sem preencher o formulário.

**Resultado esperado:** são exibidas mensagens para nome, CPF, e-mail, CEP,
número do endereço, método de entrega e foto da CNH. WhatsApp e complemento
não são obrigatórios.

### CT-07 — Rejeitar CPF inválido

**Passos:** preencher os dados com CPF inválido e tentar cadastrar.

**Resultado esperado:** mensagem “Oops! CPF inválido” e nenhum aviso de sucesso.

### CT-08 — Validar formato de e-mail

**Passos:** preencher o campo E-mail com um valor inválido.

**Resultado esperado:** a validação nativa do navegador considera o campo
inválido.

### CT-09 — Validar WhatsApp opcional

**Passos:** preencher WhatsApp com valor fora do padrão brasileiro e tentar
cadastrar.

**Resultado esperado:** mensagem “Oops! Whatsapp com formato incorreto”.
O campo vazio não é sinalizado como obrigatório.

### CT-10 — Tratar CEP inexistente

**Passos:** consultar o CEP `00000000`.

**Comportamento esperado:** endereço não deve ser preenchido com dados
inválidos e a interface deve indicar que o CEP não foi encontrado.

**Defeito observado:** a interface preenche Cidade/UF com
`undefined/undefined` e não exibe mensagem de erro. O teste automatizado usa
`test.fail()` para registrar a falha conhecida como esperada; quando o site for
corrigido, remova essa anotação e mantenha as verificações como um teste
normal.

### CT-11 — Selecionar método de entrega

**Passos:** clicar em Moto, Bicicleta e Van/Carro.

**Resultado esperado:** a opção clicada recebe a classe visual `selected`.

### CT-12 — Impedir seleção de múltiplos métodos

**Passos:** selecionar mais de um método e tentar cadastrar.

**Resultado esperado:** mensagem “Oops! Selecione apenas um método de entrega”.

### CT-13 — Enviar cadastro válido com foto da CNH

**Passos:** preencher nome, CPF válido, e-mail, endereço obtido por CEP e
número; anexar uma imagem para a CNH; selecionar um método e cadastrar.

**Resultado esperado:** a interface exibe o diálogo “Aí Sim...” com a
confirmação “Recebemos os seus dados...”. Fechar o diálogo retorna à página
inicial.

**Limite do teste:** a navegação observada confirmou a mensagem de sucesso da
interface, mas não demonstrou envio ou persistência do cadastro em uma API.

### CT-14 — Retornar à página inicial

**Passos:** na página `/deliver`, acionar “Voltar para home”.

**Resultado esperado:** navegação para `/`, com o título principal e o link de
cadastro novamente visíveis.

### Executar os testes Playwright

```bash
npm test
```

Para executar apenas os cenários da aplicação:

```bash
npx playwright test tests/cenarios-de-teste.spec.js
```

A URL base padrão do Playwright é `https://buger-eats.vercel.app`.
Cada teste de interface gera um screenshot e um vídeo. Localmente, os arquivos
ficam em `test-results/` e também podem ser consultados no relatório HTML
gerado em `playwright-report/`:

```bash
npm run test:report
```

No GitHub Actions, baixe o artefato `playwright-evidence` para acessar os
screenshots e vídeos, ou `playwright-report` para navegar pelos resultados e
suas evidências. As evidências da API também aparecem como anexos de cada
cenário no relatório: método, URL, status HTTP e corpo da resposta. Os
JSONs também são gravados em `test-results/`, um por cenário. Os artefatos do
GitHub Actions são mantidos por 14 dias.

## 2. Testes de API — ViaCEP

Os testes estão em [`viacep-api.spec.js`](./viacep-api.spec.js) e chamam o
serviço externo diretamente, sem passar pela interface do Buger Eats. Requerem
conexão com a internet e podem ser afetados por indisponibilidade ou mudanças
do ViaCEP.

### API-01 — Consultar CEP válido

**Requisição:** `GET https://viacep.com.br/ws/01001000/json/`

**Resultado esperado:** HTTP 200 e JSON com CEP `01001-000`, logradouro “Praça
da Sé”, bairro “Sé”, localidade “São Paulo” e UF “SP”.

### API-02 — Rejeitar formato de CEP inválido

**Requisição:** `GET https://viacep.com.br/ws/123/json/`

**Resultado esperado:** HTTP 400.

### API-03 — Consultar CEP inexistente

**Requisição:** `GET https://viacep.com.br/ws/00000000/json/`

**Resultado esperado:** HTTP 200 e JSON com `erro: "true"` (string), indicando
que o formato foi aceito, mas não há endereço para o CEP.

### Executar os testes de API

```bash
npm run test:api
```

## 3. Teste de performance — k6

O smoke test está em
[`performance/buger-eats.js`](./performance/buger-eats.js). Ele faz requisições
HTTP às páginas `/` e `/deliver` e verifica o status HTTP e o shell HTML inicial
da aplicação. Como o conteúdo textual é renderizado pelo JavaScript no
navegador, o teste k6 não mede a renderização visual nem o tempo de execução
JavaScript.

### Cenário configurado

No script, o cenário `smoke` está configurado atualmente com:

- Executor: `constant-vus`.
- Usuários virtuais (`vus`): **5**.
- Duração: **60 segundos**.
- Pausa de 1 segundo entre as requisições de cada página.
- Limite de p95 de resposta: abaixo de **1.500 ms**.
- Limite de requisições HTTP com falha: abaixo de **1%**.
- Limite de checks aprovados: acima de **99%**.

Esses valores podem ser alterados no bloco `options.scenarios.smoke` e em
`options.thresholds` de `performance/buger-eats.js`. O aumento de VUs ou duração
altera a carga gerada; faça ajustes gradualmente e somente em ambiente sob sua
responsabilidade ou autorização.

### Instalar e executar

Instale o k6 e deixe `k6` disponível no `PATH`. No ambiente em que foi
executado este projeto, o binário foi instalado no perfil do usuário. Para
usar esse caminho no PowerShell:

```powershell
$env:PATH = "$env:LOCALAPPDATA\Programs\k6;$env:PATH"
```

O destino padrão e autorizado para este teste é
`https://buger-eats.vercel.app`. Basta executar:

```powershell
npm run test:performance
```

Cada execução também gera `k6-summary.md` (relatório visual), `k6-summary.json`
(métricas estruturadas) e `k6-raw.json` (dados completos da execução). No
GitHub Actions, os três arquivos são disponibilizados no artefato
`k6-performance-evidence` por 14 dias.

O destino está definido no script como `https://buger-eats.vercel.app`; não é
necessário configurar variáveis de ambiente para autorizá-lo.

### Resultado registrado

Uma execução anterior, com **1 VU por 30 segundos**, aprovou os thresholds:
15 iterações, 30 requisições HTTP, zero falhas, checks 100% aprovados e p95 de
70,07 ms. O script foi posteriormente configurado para 5 VUs por 60 segundos;
esse novo perfil deve ser executado novamente para obter métricas que
correspondam aos parâmetros atuais.

## Comandos rápidos

```bash
npm test
npm run test:api
npm run test:performance
```
