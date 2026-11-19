# Allberto

Substituição do frontend de um fork do Ninja pelo design fornecido pelo proprietário, preservando as funcionalidades existentes. A implantação na StayCloud será feita em uma etapa posterior.

## Estado atual

Em 19/11/2026, este checkout tinha somente o commit vazio `947088e`, sem remoto GitHub, código, testes ou configuração de execução. A origem foi identificada e confirmada pelo proprietário: `allber-to/web`, fork de `invoiceninja/web`. Os remotos `origin` e `upstream` estão configurados; o merge `70ec097c0` importou a aplicação preservando o histórico.

A implementação local inclui shell responsivo, temas claro/escuro, painel com consultas existentes, listas de clientes/faturas/recorrentes/pagamentos, detalhe de cliente e visão geral de fatura. Opus 5.5 e Astra concluíram a implementação principal. A revisão inicial Fable 5.2 identificou um problema de valores persistidos da fatura; Astra corrigiu a separação entre resposta do servidor e rascunho editável e adicionou regressão com o cálculo real.

**Implementação e validação local concluídas**, na branch `luizstay/luiz-feat-link-github`, para revisão em PR de rascunho. Código aprovado por Fable 5.2, incluindo o suplemento dos últimos ajustes compartilhados. Passaram 343 testes unitários, lint global, build TypeScript/Vite e 13 testes de navegador com encerramento natural. Resultados, capturas e limites estão em [validação da entrega](validation.md). A branch `main` não recebeu merge deste trabalho.

Publicação: implementação em `089ede817`, branch enviada ao fork e [PR #1 em rascunho](https://github.com/allber-to/web/pull/1). O hook pre-push executou lint e build com sucesso. A prévia local pode ser executada pelo comando do README; seus dados são sintéticos e não representam uma instalação do backend.

**Integração real local concluída e aprovada pelo CTO**, com Astra implementando. Invoice Ninja 5.13.49, equivalente ao fork backend, roda em Docker com imagem fixada por digest e acesso por loopback; o frontend real está em `127.0.0.1:3100`. Foram validados login, leitura/escrita, clientes, faturas, recorrente, pagamento manual, KPIs, PDF e persistência após reinício. O navegador registrou 150 respostas API sem erros e encerrou naturalmente. A integração revelou e corrigiu o contador de próximas cobranças para datas com horário; após a correção passaram **345 testes, lint e build**.

O [parecer Fable](reviews/fable-local-backend.md) aceita A1–A10, com ressalva prevista: e-mails são gravados em log, mas o histórico de eventos exige provedor real em homologação. Credenciais e logs brutos ficam fora do Git. Não foram validados ACL de usuários restritos, gateways ou produção. Nenhuma implantação ou acesso ao WHMCS foi realizado.

## Documentação

- [Plano e registro de execução](stories/001-github-frontend.md)
- [Integração real com backend local](stories/002-local-backend.md)
- [Briefing e critérios de aceite](project-brief.md)
- [Decisões de integração](architecture.md)
- [Regras de trabalho](../AGENTS.md)
- [Implementação do shell e painel](handoffs/opus-shell-dashboard.md)
- [Implementação de entidades](handoffs/astra-entities.md)
- [Validação local isolada](handoffs/astra-local-validation.md)
- [Revisão inicial Fable](reviews/fable-entities.md)
- [Revisão integrada e suplemento final](reviews/fable-integrated.md)
- [Execução do backend local](handoffs/astra-backend-local.md)
- [Aceite CTO do backend local](reviews/fable-local-backend.md)

O [handoff do design](front-end-spec.md) cobre as 31 pranchas. As instruções locais estão no [README](../README.md); a implantação ainda depende da definição do ambiente StayCloud e da configuração de produção do backend.
