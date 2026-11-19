# Allberto — orientações de trabalho

## Escopo e referência

- Origem confirmada: `origin` = `https://github.com/allber-to/web.git`; `upstream` = `https://github.com/invoiceninja/web.git`. A base é o frontend React do Invoice Ninja.
- Seguir fielmente `design/proposta-original.html` quando disponível; o arquivo original foi fornecido em `~/Downloads/Painel allberto · proposta.html`.
- Preservar as funcionalidades, contratos de API, autenticação e persistência existentes ao substituir o frontend.
- Documentar alterações, decisões, testes e pendências em `docs/`. Nunca registrar credenciais.
- A validação local foi concluída. O proprietário autorizou configurar e publicar o Allberto no EasyPanel existente em `http://192.102.140.18:3000/`. Limitar alterações aos serviços e dados deste projeto; não criar recursos pagos nem modificar aplicações alheias. Registrar configuração, domínio, validações e limites sem credenciais.
- Reaproveitar stack, componentes e padrões do fork antes de adicionar dependências.

## WHMCS: ritmo de acesso obrigatório

Regra do usuário: aguarde cada requisição ao WHMCS terminar antes de iniciar outra.

- Mantenha apenas uma requisição ou navegação ao WHMCS em andamento, contando API, navegador, scripts e agentes. Nunca consulte API e navegador em paralelo.
- Aguarde pelo menos 3 segundos entre o fim de uma operação e o início da próxima. Reutilize respostas existentes e consulte somente os registros necessários, sem varreduras em lote, recargas rápidas ou polling frequente.
- Em `ERR_CONNECTION_RESET`, HTTP 429, HTTP 503 ou timeout, pare os acessos. Respeite `Retry-After`; quando ausente, aguarde pelo menos 60 segundos antes de uma única nova tentativa. Se falhar novamente, pare e informe o bloqueio ao usuário.
- Não troque de navegador para API ou para outro endereço como tentativa imediata de contornar a falha. Aguarde a página terminar de carregar antes de navegar.
- A regra limita as ações iniciadas pelo agente; os recursos automáticos da página são carregados pelo navegador. Não afirme que um reset foi causado por excesso de requisições sem evidência.
