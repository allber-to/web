# Allberto

Substituição do frontend de um fork do Ninja pelo design fornecido pelo proprietário, preservando as funcionalidades existentes. A implantação na StayCloud será feita em uma etapa posterior.

## Estado atual

Em 19/11/2026, este checkout tinha somente o commit vazio `947088e`, sem remoto GitHub, código, testes ou configuração de execução. A origem foi identificada e confirmada pelo proprietário: `allber-to/web`, fork de `invoiceninja/web`. Os remotos `origin` e `upstream` estão configurados; o merge `70ec097c0` importou a aplicação preservando o histórico.

A implementação local inclui shell responsivo, temas claro/escuro, painel com consultas existentes, listas de clientes/faturas/recorrentes/pagamentos, detalhe de cliente e visão geral de fatura. Opus 5.5 e Astra concluíram a implementação principal. A revisão inicial Fable 5.2 identificou um problema de valores persistidos da fatura; Astra corrigiu a separação entre resposta do servidor e rascunho editável e adicionou regressão com o cálculo real.

**Implementação e validação local concluídas**, na branch `luizstay/luiz-feat-link-github`, para revisão em PR de rascunho. Código aprovado por Fable 5.2, incluindo o suplemento dos últimos ajustes compartilhados. Passaram 343 testes unitários, lint global, build TypeScript/Vite e 13 testes de navegador com encerramento natural. Resultados, capturas e limites estão em [validação da entrega](validation.md). A branch `main` não recebeu merge deste trabalho.

O proprietário confirmou que não há backend de homologação: a validação usa dados fictícios e rede local interceptada. Autenticação, permissões do servidor, persistência e operações financeiras completas dependem de uma etapa posterior com backend descartável. Nenhuma implantação ou acesso ao WHMCS foi realizado.

## Documentação

- [Plano e registro de execução](stories/001-github-frontend.md)
- [Briefing e critérios de aceite](project-brief.md)
- [Decisões de integração](architecture.md)
- [Regras de trabalho](../AGENTS.md)
- [Implementação do shell e painel](handoffs/opus-shell-dashboard.md)
- [Implementação de entidades](handoffs/astra-entities.md)
- [Validação local isolada](handoffs/astra-local-validation.md)
- [Revisão inicial Fable](reviews/fable-entities.md)
- [Revisão integrada e suplemento final](reviews/fable-integrated.md)

O [handoff do design](front-end-spec.md) cobre as 31 pranchas. As instruções locais estão no [README](../README.md); a implantação ainda depende da definição do ambiente StayCloud e do backend.
