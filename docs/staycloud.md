# Preparação para a VPS StayCloud

Esta etapa **ainda não foi implantada**. Após concluir a validação local, o proprietário autorizou publicar no EasyPanel existente em `http://192.102.140.18:3000/`. O acesso inicial será pelo IP, com duas portas dedicadas, apenas para homologação HTTP. O domínio futuro é `allber.to`, ainda não adquirido.

A integração local foi concluída com Invoice Ninja 5.13.49: [aceite CTO](reviews/fable-local-backend.md). Ela cobre autenticação de administrador, dados persistidos, pagamento manual e PDF, com e-mails apenas em log. O histórico de e-mails do cliente/fatura depende de eventos de provedor e ainda deve ser validado em homologação com transporte real. A topologia local sem saída externa não é uma configuração de produção.

A [arquitetura EasyPanel](architecture-easypanel.md) define os serviços, volumes, pré-condições P1–P6 e testes E1–E10. O [handoff Astra](handoffs/astra-easypanel.md) registra os artefatos e checks locais; a [story 003](stories/003-easypanel-deploy.md) acompanha a publicação. Não usar `local-backend/compose.yml` na VPS nem executar os smokes locais contra o servidor.

## O que este repositório entrega

Este é o frontend React do Invoice Ninja, construído com Vite. `npm run build` executa TypeScript e gera arquivos estáticos em `dist/` (bundles em `dist/react/`). Ele não contém o backend PHP, banco, filas, agendador ou armazenamento de documentos do Invoice Ninja.

O novo painel também consulta `/api/v1/charts/analytics_totals`. Antes da implantação, confirmar que a versão do backend disponibiliza a rota e os formatos de dados documentados no [handoff do painel](handoffs/opus-shell-dashboard.md). A indisponibilidade de indicadores não deve ser apresentada como valor zero.

## Configuração que precisa ser definida

- VPS e sistema operacional, domínio do frontend e URL do backend.
- Versão/instalação do backend Invoice Ninja, banco, armazenamento persistente, filas e agendador.
- DNS, TLS, política de CORS se frontend e backend usarem origens distintas.
- Backup e restauração dos dados do backend, além da retenção do build anterior para rollback do frontend.
- Um ambiente descartável para testar autenticação, permissões e operações completas antes de usar dados reais.

## Build e publicação do frontend

Usar Node.js 22 ou superior e instalar versões do lockfile com `npm ci`. Copiar apenas as opções necessárias de `.env.example` para um arquivo de ambiente local ao build. Para self-hosted, manter `VITE_IS_HOSTED=false`; definir `VITE_API_URL` como a origem correta da API, sem duplicar `/api/v1`. Se não houver URL explícita, o helper usa a origem do navegador.

`VITE_*` é incorporado ao JavaScript público durante o build. Não colocar senhas, chaves secretas de gateway ou tokens administrativos nessas variáveis. Manter telemetria hosted vazia, e configurar explicitamente `VITE_IS_TEST=false` para produção. O arquivo de exemplo upstream inclui opções de teste; não copiá-lo sem revisão.

Executar os checks documentados no [README](../README.md), depois `npm run build`. O servidor web deve servir `dist/`, entregar os assets estáticos e fazer fallback das rotas do SPA para `index.html` quando `VITE_ROUTER=browser`. Se a API estiver na mesma origem, sua rota deve ser encaminhada ao backend antes desse fallback. Não publicar `tests/`, `design/`, relatórios, arquivos `.env` ou o checkout inteiro como raiz web.

Os artefatos para o EasyPanel ficam em `deploy/easypanel/`: serviço Compose do backend com Build Path `/deploy/easypanel` e serviço App do frontend com Build Path `/` e Dockerfile `deploy/easypanel/frontend.Dockerfile`. Portas e valores de ambiente dependem do inventário do painel; não há porta presumida como disponível. Builds de teste usam uma origem de documentação, que não deve ser copiada para a VPS.

## Validação de homologação e rollback

Validar login/logout, troca de empresa, permissões, listagem/paginação/filtros, criação/edição, overview com valores persistidos, PDF, exportação, envio de e-mail e integrações de cobrança em modo de teste. A suíte E2E upstream reseta contas: usar somente contas/ambiente descartáveis explicitamente identificados.

Publicar cada build em uma versão separada e manter o anterior acessível para reversão. Mudanças de backend ou banco exigem plano próprio de migração/backup; trocar arquivos estáticos não reverte alterações financeiras ou de dados.

Licença e avisos do upstream permanecem em [LICENSE](../LICENSE); arquivos e atribuições das fontes estão em `public/allberto/fonts/OFL.txt`.
