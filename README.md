# Allberto — frontend baseado no Invoice Ninja

Fork: [allber-to/web](https://github.com/allber-to/web). Upstream: [invoiceninja/web](https://github.com/invoiceninja/web).

Este fork aplica a identidade e o frontend Allberto sobre os fluxos e contratos do Invoice Ninja. O frontend e a integração com backend real local foram validados e aprovados pelo CTO Fable 5.2. O [Allberto está publicado na VPS StayCloud](https://painel.allber.to), conectado ao backend real por HTTPS. Na publicação inicial, login, edição de rascunho, PDF, portal e persistência após redeploy foram conferidos; a [story de publicação](docs/stories/003-easypanel-deploy.md) registra as evidências e os limites da homologação. A [migração para o domínio próprio](docs/stories/004-custom-domain.md) já tem API, PDF, TLS e pacote aprovados; o login no endereço administrativo pelo Chrome ainda está pendente por indisponibilidade de controle exclusivo da janela. E-mail permanece somente em log; backup externo com restauração testada é necessário antes de dados reais.

## Desenvolvimento local

Requer Node.js 22 ou superior. Instale com `npm ci` e execute `npm run dev` (porta 3000). A aplicação depende de um backend Invoice Ninja; configure as opções pertinentes de `.env.example` em um arquivo `.env` local, com `VITE_IS_HOSTED=false` e a URL correta do backend. Nunca inclua credenciais no Git nem variáveis secretas com prefixo `VITE_`, pois esse prefixo é exposto ao navegador.

Verificações: `npm test`, `npx tsc --noEmit`, `npm run lint` e `npm run build`. A suíte E2E upstream reseta contas e altera dados; execute-a somente contra ambiente de teste descartável explicitamente identificado.

Para validar sem backend, use `npx playwright test --config playwright.allberto-local.config.ts`. Essa configuração separada renderiza os componentes reais com dados fictícios locais, bloqueia rede externa e não executa o reset de contas upstream. Requer o Google Chrome instalado. Veja [escopo e evidências da validação local](docs/handoffs/astra-local-validation.md).

Para explorar a prévia com esses mesmos dados fictícios, execute `npx vite --config tests/local/vite.config.ts` e abra [o painel local em português](http://127.0.0.1:4178/tests/local/index.html?route=%2Fdashboard&lang=pt_BR&theme=light). Essa prévia cobre as sete telas documentadas e não grava dados. Encerre a prévia antes de rodar Playwright: ambos usam a porta 4178.

## Backend local real

Requer Docker Desktop com contexto local `desktop-linux`. O ambiente usa Invoice Ninja 5.13.49, equivalente ao fork backend, fixado por digest, com banco e volumes exclusivos. A partir da raiz do checkout:

```sh
sh local-backend/init-env.sh
docker --context desktop-linux compose -p allberto-ninja-local -f local-backend/compose.yml --env-file local-backend/.env up -d
```

Depois que os serviços estiverem prontos, inicie o frontend real:

```sh
VITE_API_URL=http://localhost:8012 VITE_IS_HOSTED=false npm run dev -- --host 127.0.0.1 --port 3100 --strictPort
```

Abra [Allberto local](http://127.0.0.1:3100). O usuário é `admin@allberto.test`; a senha gerada fica em `IN_PASSWORD` no arquivo local ignorado `local-backend/.env`. Não regenere esse arquivo com os volumes existentes. A porta 8012 também contém a interface original da imagem: use a porta 3100 para acessar o novo frontend.

O smoke próprio usa `node local-backend/smoke.mjs`, cria dados com prefixo `ALB-LOCAL-` e exige a instância local. Com o frontend iniciado, `node local-backend/browser-smoke.mjs` valida a interface real. Não execute as specs E2E upstream: elas possuem resets por spec mesmo quando o global setup é desabilitado. Os e-mails deste ambiente são gravados em log e o app não tem acesso externo; o histórico de eventos de provedor fica vazio nesse transporte.

Para parar preservando os dados:

```sh
docker --context desktop-linux compose -p allberto-ninja-local -f local-backend/compose.yml --env-file local-backend/.env stop
```

Execute novamente `up -d` para retomar. Pare o ambiente quando não estiver em uso: a recorrente de teste pode emitir novas faturas, alterando os valores esperados pelo smoke. As datas do script usam UTC (após 21h em Brasília, a data é a do dia seguinte). Consulte a [arquitetura](docs/architecture-local-backend.md), os [resultados](docs/handoffs/astra-backend-local.md) e o [aceite do CTO](docs/reviews/fable-local-backend.md). Essa configuração é apenas local.

## Documentação do projeto

O [Allberto no EasyPanel](https://painel.allber.to) usa o subdomínio administrativo `painel.allber.to`, com [API separada](https://api.allber.to) e nenhuma porta do projeto publicada diretamente. O frontend é pré-compilado fora da VPS e instalado por pacote com SHA-256. Artefatos: `deploy/easypanel/`. A [arquitetura](docs/architecture-easypanel.md), o [handoff operacional](docs/handoffs/astra-easypanel.md) e a [story 003](docs/stories/003-easypanel-deploy.md) registram configuração, verificações e limites. A [story 004](docs/stories/004-custom-domain.md) documenta DNS na Cloudflare, origem do portal, verificações e reversão; os hosts temporários foram preservados. `allber.to` e `www` ficam destinados ao futuro site público e servem como aliases de transição enquanto esse site não é publicado. Não reutilize credenciais ou dados do backend local nesse ambiente.

- [Briefing e critérios de aceite](docs/project-brief.md)
- [Marca Allberto na autenticação e publicação](docs/stories/005-auth-branding.md)
- [Plano, progresso e verificações](docs/stories/001-github-frontend.md)
- [Integração com backend local](docs/stories/002-local-backend.md)
- [Validação e limites da entrega](docs/validation.md)
- [Decisões de arquitetura](docs/architecture.md)
- [Handoff do design](docs/front-end-spec.md)
- [Referência e licenças das fontes](design/README.md)
- [Regras de trabalho e acesso ao WHMCS](AGENTS.md)
- [Instalação e operação na StayCloud](docs/staycloud.md)

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
