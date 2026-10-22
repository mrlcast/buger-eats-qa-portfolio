# Testes automatizados — Buger Eats

Testes end-to-end e de API com Playwright Test, além de um smoke test de
performance com k6.

## Requisitos

- Node.js
- A aplicação sob teste em execução para os testes de interface
- k6 instalado e disponível no `PATH` para os testes de performance

Os testes Playwright usam o site oficial
`https://buger-eats.vercel.app`.

## Instalação

```bash
npm install
npx playwright install
```

## Executar os testes

```bash
npm test
npm run test:api
npm run test:headed
npm run test:ui
npm run test:report
```

Os testes Playwright ficam em `tests/` e usam o padrão `*.spec.js`.

## Portfolio

O currículo/portfólio em inglês está em `portfolio/`, com seções de perfil,
carreira, habilidades, automação, formação e contato, além de alternância de
tema claro/escuro. O workflow `.github/workflows/pages.yml` publica esse
diretório após um push para `main` ou `master`. A fonte **GitHub Actions**
precisa estar selecionada em
**Settings → Pages**; ela já foi configurada para este repositório.

Quando o workflow terminar, o endereço do portfólio será
`https://mrlcast.github.io/buger-eats-qa-portfolio/`.

## CI/CD com GitHub Actions

O workflow `.github/workflows/pages.yml` roda `npm test` em pull requests e em
pushes para `main`/`master`. A suíte inclui 14 cenários de UI e 3 verificações
da API ViaCEP. O relatório HTML do Playwright fica disponível como artefato
por 14 dias.

O smoke test k6 roda em paralelo nos mesmos eventos, diariamente às 09:00 no
horário de Brasília (12:00 UTC) e também pode ser iniciado manualmente em
**Actions → Portfolio CI/CD and quality tests → Run workflow**. O deploy do
GitHub Pages acontece em pushes para `main`/`master` e em execuções manuais
nessas branches, depois que UI/API passam. O k6 tem job e resultado próprios;
ele não bloqueia a publicação do portfólio.

## Teste de performance com k6

O cenário em `tests/performance/buger-eats.js` faz um smoke test das páginas
inicial e de cadastro: cinco usuários virtuais por 60 segundos, com pausas
entre requisições. Os limites são p95 abaixo de 1,5 s, menos de 1% de
requisições com falha e pelo menos 99% de verificações aprovadas.

O alvo padrão e autorizado é `https://buger-eats.vercel.app`. Com k6 instalado,
execute:

```bash
npm run test:performance
```

O script tem o destino oficial fixo em
`https://buger-eats.vercel.app`. O cenário é intencionalmente limitado e não
substitui um teste de carga dimensionado para um ambiente de staging.
