# Allberto na VPS StayCloud

Publicado em 19/11/2026 no EasyPanel 2.33.1 existente em `http://192.102.140.18:3000/`, com domínios temporários HTTPS autorizados pelo proprietário. O domínio futuro é `allber.to`, ainda não adquirido; nenhum DNS dele foi alterado.

| Serviço | Endereço |
| --- | --- |
| Frontend Allberto | https://allberto-web.cxfujw.easypanel.host |
| API / portal de clientes | https://allberto-backend.cxfujw.easypanel.host |

Saúde, certificados, versão da API, login/refresh, CORS, login pela interface e rotas profundas passaram. A validação funcional final continua em andamento: o teste revelou perda do preço ao avançar antes do debounce numérico; após edição confirmada, o rascunho e PDF têm R$ 10,00, mas o PDF apresenta imagens vazias. A [story 003](stories/003-easypanel-deploy.md) acompanha correções, persistência e cópias de segurança. Não confundir publicação com aceite final para dados reais.

A integração local foi concluída com Invoice Ninja 5.13.49: [aceite CTO](reviews/fable-local-backend.md). Ela cobre autenticação de administrador, dados persistidos, pagamento manual e PDF, com e-mails apenas em log. O histórico de e-mails do cliente/fatura depende de eventos de provedor e ainda deve ser validado em homologação com transporte real. A topologia local sem saída externa não é uma configuração de produção.

A [arquitetura EasyPanel](architecture-easypanel.md) define os serviços, volumes, pré-condições P1–P6 e testes E1–E10. O [handoff Astra](handoffs/astra-easypanel.md) registra os artefatos e checks locais; a [story 003](stories/003-easypanel-deploy.md) acompanha a publicação. Não usar `local-backend/compose.yml` na VPS nem executar os smokes locais contra o servidor.

## O que este repositório entrega

Este é o frontend React do Invoice Ninja, construído com Vite. `npm run build` executa TypeScript e gera arquivos estáticos em `dist/` (bundles em `dist/react/`). Ele não contém o backend PHP, banco, filas, agendador ou armazenamento de documentos do Invoice Ninja.

O novo painel também consulta `/api/v1/charts/analytics_totals`. Antes da implantação, confirmar que a versão do backend disponibiliza a rota e os formatos de dados documentados no [handoff do painel](handoffs/opus-shell-dashboard.md). A indisponibilidade de indicadores não deve ser apresentada como valor zero.

## Configuração observada

- VPS Linux amd64: 2 CPUs, 3.915 MiB de memória total, sem swap, 44 GB livres no inventário inicial.
- Projeto `allberto`, Compose `backend` com Invoice Ninja 5.13.49, nginx, MySQL e Redis; quatro volumes persistentes.
- App, banco e Redis exclusivamente na rede interna. Só nginx alcança as redes do proxy; nenhuma porta do projeto é publicada diretamente no host.
- Dois hosts HTTPS, CORS verificado. `APP_URL` HTTPS, `REQUIRE_HTTPS=true`; confiança no proxy depende de não abrir porta direta do nginx.
- Conta inicial vazia configurada para Allberto, pt_BR, BRL e Brasil. Sem dados fiscais ou endereços inventados.
- Segredos novos somente no ambiente do serviço backend e na cópia local privada do proprietário `~/.config/allberto/easypanel-backend.env` (0600). Nenhum segredo no projeto/web ou Git.
- Backup externo, retenção e restauração continuam pendentes. Antes de dados reais, configurar e testar esse procedimento.

## Build e publicação do frontend

Usar Node.js 22 ou superior e instalar versões do lockfile com `npm ci`. Copiar apenas as opções necessárias de `.env.example` para um arquivo de ambiente local ao build. Para self-hosted, manter `VITE_IS_HOSTED=false`; definir `VITE_API_URL` como a origem correta da API, sem duplicar `/api/v1`. Se não houver URL explícita, o helper usa a origem do navegador.

`VITE_*` é incorporado ao JavaScript público durante o build. Não colocar senhas, chaves secretas de gateway ou tokens administrativos nessas variáveis. Manter telemetria hosted vazia, e configurar explicitamente `VITE_IS_TEST=false` para produção. O arquivo de exemplo upstream inclui opções de teste; não copiá-lo sem revisão.

Executar os checks documentados no [README](../README.md), depois `npm run build`. O servidor web deve servir `dist/`, entregar os assets estáticos e fazer fallback das rotas do SPA para `index.html` quando `VITE_ROUTER=browser`. Se a API estiver na mesma origem, sua rota deve ser encaminhada ao backend antes desse fallback. Não publicar `tests/`, `design/`, relatórios, arquivos `.env` ou o checkout inteiro como raiz web.

Os dois serviços usam Git `allber-to/web`, branch `main` e Build Path `/deploy/easypanel`. Backend usa `compose.yml`; web usa o `Dockerfile` leve padrão. Deploy manual, sem webhook configurado. **Não compilar Node/Vite na VPS de 3,8 GB:** `frontend.Dockerfile` gera o pacote fora dela; o Dockerfile leve baixa uma release pública, verifica SHA-256 e extrai sobre nginx. URL e hash são versionados, sem argumentos ou segredos obrigatórios no web.

Primeiro pacote: [web-52db1b5423ea-1](https://github.com/allber-to/web/releases/tag/web-52db1b5423ea-1), compilado do commit `52db1b5423eafac06d43c38b710f23b6a5fdc6c4`. `/version.json` identifica a revisão de compilação, que pode diferir do commit posterior que fixa URL/hash e mescla a PR. Para atualizar, repetir os checks, compilar novo pacote, conferir checksum público, versionar URL/hash, revisar/mesclar e implantar manualmente. Preservar releases anteriores para rollback.

## Validação de homologação e rollback

Validar login/logout, troca de empresa, permissões, listagem/paginação/filtros, criação/edição, overview com valores persistidos, PDF, exportação, envio de e-mail e integrações de cobrança em modo de teste. A suíte E2E upstream reseta contas: usar somente contas/ambiente descartáveis explicitamente identificados.

Publicar cada build em uma versão separada e manter o anterior acessível para reversão. Mudanças de backend ou banco exigem plano próprio de migração/backup; trocar arquivos estáticos não reverte alterações financeiras ou de dados.

`MAIL_MAILER=log` e a rede interna impedem envio real. Gateway, cobrança automática, integrações externas e usuários não administradores não foram homologados. Nunca executar os smokes locais ou resets upstream na VPS. Uma cópia de banco/storage na mesma VPS não protege contra perda dela; APP_KEY deve ser guardada separadamente, e backup externo/restauração são necessários antes de dados reais. Não apagar serviços/volumes ou trocar credenciais como rollback.

Licença e avisos do upstream permanecem em [LICENSE](../LICENSE); arquivos e atribuições das fontes estão em `public/allberto/fonts/OFL.txt`.
