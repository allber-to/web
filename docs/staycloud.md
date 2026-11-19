# Allberto na VPS StayCloud

Publicado em 19/11/2026 no EasyPanel 2.33.1 existente em `http://192.102.140.18:3000/`. O domínio `allber.to`, adquirido na Namecheap, está delegado à zona gratuita da conta Cloudflare StayCloud. Os hosts próprios têm HTTPS e os temporários permanecem disponíveis para reversão. A [story 004](stories/004-custom-domain.md) registra a migração e suas verificações.

| Serviço | Endereço |
| --- | --- |
| Frontend Allberto | https://allber.to |
| Host adicional do frontend | https://www.allber.to |
| API / portal de clientes | https://api.allber.to |
| Frontend temporário preservado | https://allberto-web.cxfujw.easypanel.host |
| Backend temporário preservado | https://allberto-backend.cxfujw.easypanel.host |

Para operar o sistema, abrir **https://allber.to**. `www` serve o mesmo frontend diretamente, sem redirecionamento por preferência do proprietário; alternar entre as origens pode exigir login separado. A raiz da API ainda oferece a interface original incluída na imagem do Invoice Ninja, e os caminhos do portal continuam com o design upstream. API e novo frontend administrativo usam os mesmos dados.

Na publicação inicial pelos hosts temporários, saúde, certificados, versão da API, login/refresh, CORS, login pela interface, rotas profundas, PDF e persistência após redeploy passaram. O incidente de perda de preço ao avançar rapidamente foi corrigido, testado e revisado; o pacote v2 foi implantado e conferido na interface. O cliente e o rascunho fictícios foram arquivados reversivelmente ao fim, deixando zero clientes e faturas ativos. O [CTO aprovou a entrega de homologação](reviews/fable-easypanel-runtime.md); a [story 003](stories/003-easypanel-deploy.md) registra evidências e limites. Backup externo e restauração continuam necessários antes de dados reais.

Na migração de domínio, API autenticada, dados preservados, link do portal, PDF, TLS e arquivos do frontend foram conferidos. O login no domínio próprio pelo Chrome ainda está pendente: a primeira navegação expirou, sem entrada de credenciais, enquanto a resolução do macOS ainda devolvia estacionamento. Endpoints do novo container web estão respondendo; nenhuma mudança extra de DNS/serviço foi feita para contornar isso. Veja a [revisão da migração](reviews/fable-custom-domain-runtime.md).

A integração local foi concluída com Invoice Ninja 5.13.49: [aceite CTO](reviews/fable-local-backend.md). Ela cobre autenticação de administrador, dados persistidos, pagamento manual e PDF, com e-mails apenas em log. O histórico de e-mails do cliente/fatura depende de eventos de provedor e ainda deve ser validado em homologação com transporte real. A topologia local sem saída externa não é uma configuração de produção.

A [arquitetura EasyPanel](architecture-easypanel.md) define os serviços, volumes, pré-condições P1–P6 e testes E1–E10. O [handoff Astra](handoffs/astra-easypanel.md) registra os artefatos e checks locais; a [story 003](stories/003-easypanel-deploy.md) acompanha a publicação. Não usar `local-backend/compose.yml` na VPS nem executar os smokes locais contra o servidor.

## O que este repositório entrega

Este é o frontend React do Invoice Ninja, construído com Vite. `npm run build` executa TypeScript e gera arquivos estáticos em `dist/` (bundles em `dist/react/`). Ele não contém o backend PHP, banco, filas, agendador ou armazenamento de documentos do Invoice Ninja.

O novo painel também consulta `/api/v1/charts/analytics_totals`. Essa rota e `/api/v1/charts/totals_v2` responderam 200 no backend publicado, após o redeploy. Em futuras atualizações, preservar os contratos documentados no [handoff do painel](handoffs/opus-shell-dashboard.md). A indisponibilidade de indicadores não deve ser apresentada como valor zero.

## Configuração observada

- VPS Linux amd64: 2 CPUs, 3.915 MiB de memória total, sem swap, 44 GB livres no inventário inicial.
- Projeto `allberto`, Compose `backend` com Invoice Ninja 5.13.49, nginx, MySQL e Redis; quatro volumes persistentes.
- MySQL e Redis exclusivamente na rede interna. O app usa backend + egress própria para saída normal à internet; não há filtro por destino. Só nginx alcança as redes do proxy; nenhuma porta do projeto é publicada diretamente no host.
- Sentry do upstream desativado e autoatualização bloqueada, ambos conferidos na configuração efetiva. Atualizações devem passar pelo repositório e deploy, mantendo a imagem fixada.
- Hosts próprios HTTPS: apex/www no web e api no nginx do backend, além dos temporários preservados. `APP_URL` e `company.portal_domain` são `https://api.allber.to`; `REQUIRE_HTTPS=true`. CORS aceita o frontend com token; confiança no proxy depende de não abrir porta direta do nginx.
- Cloudflare DNS only: A apex/api `192.102.140.18`, CNAME www `allber.to`, TTL Auto. NS `jerry.ns.cloudflare.com` e `melinda.ns.cloudflare.com`; cinco MX e SPF anteriores preservados. Não havia destinatário de encaminhamento configurado na Namecheap. DNSSEC e IPv6 não foram adicionados.
- `TRUSTED_PROXIES=*` é provisório. Antes de dados reais ou de adicionar outros serviços ao painel, restringir a confiança ao proxy observado, conforme o parecer do CTO.
- Conta inicial vazia configurada para Allberto, pt_BR, BRL e Brasil. Sem dados fiscais ou endereços inventados.
- Na validação completa anterior ao último deploy web: cinco containers ativos, quatro healthy (nginx do backend sem healthcheck), nenhum reinício ou OOM. Memória pontual somada de aproximadamente 1,15 GiB. No novo container web, healthz/version conferidos e memória indicada no painel de 4,4 MB; inspect completo não repetido após essa troca. Não são testes de carga ou medições de pico.
- Segredos novos somente no ambiente do serviço backend e na cópia local privada do proprietário `~/.config/allberto/easypanel-backend.env` (0600). Nenhum segredo no projeto/web ou Git.
- Acesso administrativo: usar o e-mail informado pelo proprietário e a senha `IN_PASSWORD` dessa cópia privada. Ela também contém `APP_KEY`; guardar ambas fora do repositório. Não regenerar a chave com dados existentes.
- Backup externo, retenção e restauração continuam pendentes. Antes de dados reais, configurar e testar esse procedimento.

## Build e publicação do frontend

Usar Node.js 22 ou superior e instalar versões do lockfile com `npm ci`. Copiar apenas as opções necessárias de `.env.example` para um arquivo de ambiente local ao build. Para self-hosted, manter `VITE_IS_HOSTED=false`; definir `VITE_API_URL` como a origem correta da API, sem duplicar `/api/v1`. Se não houver URL explícita, o helper usa a origem do navegador.

`VITE_*` é incorporado ao JavaScript público durante o build. Não colocar senhas, chaves secretas de gateway ou tokens administrativos nessas variáveis. Manter telemetria hosted vazia, e configurar explicitamente `VITE_IS_TEST=false` para produção. O arquivo de exemplo upstream inclui opções de teste; não copiá-lo sem revisão.

Executar os checks documentados no [README](../README.md), depois `npm run build`. O servidor web deve servir `dist/`, entregar os assets estáticos e fazer fallback das rotas do SPA para `index.html` quando `VITE_ROUTER=browser`. Se a API estiver na mesma origem, sua rota deve ser encaminhada ao backend antes desse fallback. Não publicar `tests/`, `design/`, relatórios, arquivos `.env` ou o checkout inteiro como raiz web.

Os dois serviços usam Git `allber-to/web`, branch `main` e Build Path `/deploy/easypanel`. Backend usa `compose.yml`; web usa o `Dockerfile` leve padrão. Deploy manual, sem webhook configurado. **Não compilar Node/Vite na VPS de 3,8 GB:** `frontend.Dockerfile` gera o pacote fora dela; o Dockerfile leve baixa uma release pública, verifica SHA-256 e extrai sobre nginx. URL e hash são versionados, sem argumentos ou segredos obrigatórios no web.

Pacote para o domínio próprio: [web-d8a873829cbb-1](https://github.com/allber-to/web/releases/tag/web-d8a873829cbb-1), compilado do commit `d8a873829cbbc2ba1f71df71b0022829e2568443` com `VITE_API_URL=https://api.allber.to`; SHA-256 `7a893ca6a434f7f4344ba816b619009ada06b6519b9abce288bfac21033812f6`. O pacote anterior [web-f5cb28edb112-1](https://github.com/allber-to/web/releases/tag/web-f5cb28edb112-1), com a correção numérica e API temporária, permanece disponível para rollback. A [primeira release](https://github.com/allber-to/web/releases/tag/web-52db1b5423ea-1) foi preservada para rastreabilidade; contém a falha de debounce conhecida e não é uma versão indicada para operação. `/version.json` identifica a revisão de compilação, que pode diferir do commit posterior que fixa URL/hash e mescla a PR. Para atualizar, repetir os checks, compilar novo pacote, conferir checksum público, versionar URL/hash, revisar/mesclar e implantar manualmente. Preservar releases anteriores e avaliar seus defeitos conhecidos antes de um rollback.

## Validação de homologação e rollback

Validar login/logout, troca de empresa, permissões, listagem/paginação/filtros, criação/edição, overview com valores persistidos, PDF, exportação, envio de e-mail e integrações de cobrança em modo de teste. A suíte E2E upstream reseta contas: usar somente contas/ambiente descartáveis explicitamente identificados.

Publicar cada build em uma versão separada e manter o anterior acessível para reversão. Mudanças de backend ou banco exigem plano próprio de migração/backup; trocar arquivos estáticos não reverte alterações financeiras ou de dados.

Para reverter a migração de domínio, primeiro fixar a release anterior do frontend e seu hash e reimplantar web. Se necessário, restaurar APP_URL anterior e reimplantar backend; atualizar também `company.portal_domain` por PUT parcial contendo somente esse campo e `portal_mode=domain`. Não enviar `settings`. A cópia privada pré-migração do ambiente foi preservada com modo 0600. Enquanto portal_domain aponta à nova origem, o login do portal pelo host temporário pode não localizar a empresa, embora esse host continue respondendo. Não trocar a delegação DNS nem apagar hosts/volumes como primeira tentativa.

`MAIL_MAILER=log` impede envio real por configuração; a rede não é mais a barreira de saída do app. Alterar o transporte, cadastrar gateways ou webhooks habilita ações externas. Gateway, cobrança automática, integrações externas e usuários não administradores não foram homologados. Nunca executar os smokes locais ou resets upstream na VPS. Uma cópia consistente de banco/storage foi gerada e seus checksums sobreviveram ao redeploy, mas permanece na mesma VPS e não protege contra perda dela. O init da imagem torna os arquivos dessa cópia legíveis pelo PHP, embora fora de public. APP_KEY deve ser guardada separadamente; backup externo e restauração continuam necessários antes de dados reais. Não apagar serviços/volumes ou trocar credenciais como rollback.

Licença e avisos do upstream permanecem em [LICENSE](../LICENSE); arquivos e atribuições das fontes estão em `public/allberto/fonts/OFL.txt`.
