# Allberto

Substituição do frontend de um fork do Ninja pelo design fornecido pelo proprietário, preservando as funcionalidades existentes. A implantação na StayCloud será feita em uma etapa posterior.

## Estado atual

Em 19/11/2026, este checkout tinha somente o commit vazio `947088e`, sem remoto GitHub, código, testes ou configuração de execução. A origem foi depois identificada na aba já aberta no Chrome: `allber-to/web`, fork de `invoiceninja/web`; confirmada pela API GitHub. A importação e a inspeção dos contratos estão em andamento.

A aplicação React do fork já foi importada, com histórico completo. `npm ci` instalou 916 pacotes; a base passou em 39 arquivos de teste (295 testes) e na verificação TypeScript. O frontend Allberto ainda está em implementação. O protótipo visual não comprova integração com o backend.

## Documentação

- [Plano e registro de execução](stories/001-github-frontend.md)
- [Briefing e critérios de aceite](project-brief.md)
- [Decisões de integração](architecture.md)
- [Regras de trabalho](../AGENTS.md)

O [handoff do design](front-end-spec.md) cobre as 31 pranchas. As instruções locais estão no [README](../README.md); a implantação ainda depende da definição do ambiente StayCloud e do backend.
