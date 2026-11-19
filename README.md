# Allberto — frontend baseado no Invoice Ninja

Fork: [allber-to/web](https://github.com/allber-to/web). Upstream: [invoiceninja/web](https://github.com/invoiceninja/web).

Este fork aplica a identidade e o frontend Allberto sobre os fluxos e contratos do Invoice Ninja. A implementação foi validada localmente; referência visual, alterações e limites estão documentados. A integração com backend real e a implantação na VPS StayCloud serão etapas posteriores.

## Desenvolvimento local

Requer Node.js 22 ou superior. Instale com `npm ci` e execute `npm run dev` (porta 3000). A aplicação depende de um backend Invoice Ninja; configure as opções pertinentes de `.env.example` em um arquivo `.env` local, com `VITE_IS_HOSTED=false` e a URL correta do backend. Nunca inclua credenciais no Git nem variáveis secretas com prefixo `VITE_`, pois esse prefixo é exposto ao navegador.

Verificações: `npm test`, `npx tsc --noEmit`, `npm run lint` e `npm run build`. A suíte E2E upstream reseta contas e altera dados; execute-a somente contra ambiente de teste descartável explicitamente identificado.

Para validar sem backend, use `npx playwright test --config playwright.allberto-local.config.ts`. Essa configuração separada renderiza os componentes reais com dados fictícios locais, bloqueia rede externa e não executa o reset de contas upstream. Requer o Google Chrome instalado. Veja [escopo e evidências da validação local](docs/handoffs/astra-local-validation.md).

Para explorar a prévia com esses mesmos dados fictícios, execute `npx vite --config tests/local/vite.config.ts` e abra [o painel local em português](http://127.0.0.1:4178/tests/local/index.html?route=%2Fdashboard&lang=pt_BR&theme=light). Essa prévia cobre as sete telas documentadas e não grava dados. Encerre a prévia antes de rodar Playwright: ambos usam a porta 4178.

## Documentação do projeto

- [Briefing e critérios de aceite](docs/project-brief.md)
- [Plano, progresso e verificações](docs/stories/001-github-frontend.md)
- [Validação e limites da entrega](docs/validation.md)
- [Decisões de arquitetura](docs/architecture.md)
- [Handoff do design](docs/front-end-spec.md)
- [Referência e licenças das fontes](design/README.md)
- [Regras de trabalho e acesso ao WHMCS](AGENTS.md)
- [Preparação para implantação na StayCloud](docs/staycloud.md)

A licença e os avisos de copyright do upstream permanecem em [LICENSE](LICENSE) e nos arquivos de origem.

## Notas do upstream

### `npm run dev`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### Code of conduct
For the code of conduct, check our [main repository](https://github.com/invoiceninja/invoiceninja/blob/master/CODE_OF_CONDUCT.md).

### Licence

For the licence, check our [main repository](https://github.com/invoiceninja/invoiceninja/blob/master/LICENSE).
