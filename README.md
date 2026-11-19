# Allberto — frontend baseado no Invoice Ninja

Fork: [allber-to/web](https://github.com/allber-to/web). Upstream: [invoiceninja/web](https://github.com/invoiceninja/web).

Este fork está sendo modificado para aplicar a identidade e o frontend Allberto, preservando os fluxos e contratos do Invoice Ninja. A referência visual e as alterações estão documentadas; a implantação na VPS StayCloud será uma etapa posterior.

## Desenvolvimento local

Requer Node.js 22 ou superior. Instale com `npm ci` e execute `npm run dev` (porta 3000). A aplicação depende de um backend Invoice Ninja; configure as opções pertinentes de `.env.example` em um arquivo `.env` local, com `VITE_IS_HOSTED=false` e a URL correta do backend. Nunca inclua credenciais no Git nem variáveis secretas com prefixo `VITE_`, pois esse prefixo é exposto ao navegador.

Verificações: `npm test`, `npx tsc --noEmit`, `npm run lint` e `npm run build`. A suíte E2E upstream reseta contas e altera dados; execute-a somente contra ambiente de teste descartável explicitamente identificado.

## Documentação do projeto

- [Briefing e critérios de aceite](docs/project-brief.md)
- [Plano, progresso e verificações](docs/stories/001-github-frontend.md)
- [Decisões de arquitetura](docs/architecture.md)
- [Handoff do design](docs/front-end-spec.md)
- [Referência e licenças das fontes](design/README.md)
- [Regras de trabalho e acesso ao WHMCS](AGENTS.md)

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
