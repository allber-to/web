# Validação da entrega Allberto

Data: 19/11/2026. Branch de trabalho: `luizstay/luiz-feat-link-github`. Base funcional: `allber-to/web@50019241117dfbd82c833729d9787e672413cba4`. Histórico importado por merge, sem reescrita da branch `main`.

## Escopo implementado

- Shell com topbar, menu completo organizado em grupos, gaveta mobile, temas claro/escuro e fontes locais da proposta.
- Painel com posição atual, histórico independente, pendências, próximas cobranças, valores por emissão, atividades e primeiros passos verificados por dados/permissões.
- Listas de clientes, faturas, recorrentes e pagamentos; cartões no mobile preservam colunas configuradas, seleção, ações e ordenação.
- Detalhe de cliente e visão geral de fatura, com os valores persistidos separados do rascunho editável.
- Traduções pt_BR/en, estados de carregamento/erro/vazio e máscara de valores no Painel, incluindo estornos e notas.

Os fluxos existentes, guards e handlers foram reutilizados. A fase inicial abaixo usou fixtures; os resultados da integração com backend real são registrados separadamente ao fim deste documento.

## Checks do coordenador

| Verificação | Resultado |
| --- | --- |
| `npm test` | 47 arquivos, **343 testes passaram** |
| `npm run lint` | **Passou**, 1.786 arquivos, sem correções automáticas |
| `npm run build` | **Passou**, TypeScript e Vite com exit 0; saída `dist/` |
| Separação do harness | Bundle sem marcadores de fixture; quatro fontes locais presentes, sem chunks nomeados Sentry |
| Regressões após acabamento final | 3 arquivos, **22 testes passaram**; lint de `MobileSidebar.tsx` passou |
| Playwright local | **13/13 passaram em 1,9 min, exit 0 e encerramento natural**, Chrome instalado |
| Revisão Fable 5.2 | **Aprovado no escopo de leitura**, achados financeiros e três médias do Painel corrigidos |

A primeira tentativa de build detectou dois acessos sem estreitamento do tipo `CurrentPosition | 'missing'` em um teste novo. O teste passou a verificar explicitamente o resultado antes de acessar as propriedades; o build seguinte passou. Não foram suprimidos diagnósticos nem usados casts para ocultar a falha.

A matriz de navegador também encontrou overflow desktop causado pelo rótulo acessível do cabeçalho de Ações sem ancestral posicionado; o `th` passou a usar `relative`. As datas inválidas vistas no gráfico eram da fixture incompleta: ela foi alinhada ao formato consumido por `Totals/Chart`, com datas e séries por moeda. A expectativa do título português passou a incluir explicitamente o contador acessível. Os testes não foram afrouxados para tolerar overflow, datas inválidas ou chaves de tradução cruas.

A execução definitiva gerou 13 auditorias de rede e 33 capturas: **418 leituras locais, nenhuma chamada externa/não mapeada e nenhum erro JavaScript não tratado**. Cobriu sete superfícies em 1440/390px, claro/escuro, pt_BR/plurais, filtros, loading/erro/retry, navegação por abas, teclado e proteção de rascunho. Uma execução anterior de 12 casos exigiu encerramento manual do worker e não foi aceita como limpa; seu log foi preservado. A rodada definitiva encerrou o Chrome com exit 0, sem sinal/intervenção, e finalizou o runner naturalmente.

O build emite avisos de bundles grandes (incluindo editores) e da base `caniuse-lite` desatualizada. Não houve atualização indiscriminada de dependências nem mudança de lockfile. Logs locais: `/tmp/allberto-final-unit.log`, `/tmp/allberto-final-lint.log`, `/tmp/allberto-final-build.log` e `/tmp/allberto-final-followup.log`.

## Revisão e evidências

- [Revisão integrada Fable](reviews/fable-integrated.md): resolução de moeda, privacidade, invalidação de cache, dados persistidos, navegação e contratos conferidos na fonte upstream.
- [Revisão inicial de entidades](reviews/fable-entities.md): reprodução e correção da leitura indevida do rascunho da fatura.
- [Handoff do painel](handoffs/opus-shell-dashboard.md): implementação Opus 5.5, testes e limitações por fase.
- [Handoff de entidades](handoffs/astra-entities.md) e [validação local Astra](handoffs/astra-local-validation.md): execução, capturas e auditoria de rede isolada.
- [Capturas selecionadas](evidence/allberto/README.md): Painel desktop/mobile em português, cartões de clientes e fatura no tema escuro, inspecionadas pelo coordenador.

Fable também revalidou os quatro ajustes finais compartilhados e os aceitou sem achados, em suplemento no mesmo relatório. Em `MobileSidebar`, a navegação desmonta a gaveta imediatamente para liberar o foco antes da confirmação de alterações não salvas; Escape mantém a transição. O teste com componentes reais verifica continuar editando/descartar e a navegação normal.

A inspeção da captura mobile revelou outro problema existente: `Tabs` usava o nome da aba como valor inicial, mas as opções usam URLs. A seleção agora acompanha o `href` da aba ativa. Abrir o seletor expôs também filhos condicionais inválidos chegando como `false` às opções de `react-select`; `SelectField` passou a retornar `null` nesses casos, corrigindo a causa compartilhada. O suplemento de navegador passou com abertura por teclado e navegação Visão geral → Atividade → Visão geral, com encerramento natural. Suíte unitária, lint global e build foram repetidos com essas mudanças e passaram.

## Limites de aceite

As fixtures locais não validam login, ACL do servidor, persistência, PDF/exportação, envio de mensagens, cobrança, estorno ou integrações reais. A fase posterior com backend local cobre apenas os resultados explicitamente registrados abaixo. A suíte E2E upstream que reseta contas não foi executada. O [roteiro StayCloud](staycloud.md) mantém os requisitos restantes para implantação.

Alguns dados exibidos pelo protótipo não possuem contrato confirmado na base: recusas/validade de cartão, sparkline de MRR, recebido versus previsto, participação no ranking e contadores do menu. Eles não foram preenchidos com dados inventados. O seletor de períodos e filtros reais do Ninja permanece; a barra de ferramentas pode ocupar mais espaço que a proposta.

A máscara é visual e limitada ao Painel; outras telas não exibem o controle. Datas relativas usam o relógio do navegador. KPIs mantêm duas casas decimais, inclusive em moedas sem centavos. Não houve auditoria WCAG completa, leitor de tela ou validação Safari/Firefox. O recorte de Combobox pela folha foi investigado em caso local e não foi reproduzido; isso não cobre todos os formulários.

Não houve acesso ao WHMCS, implantação, contratação de VPS ou alteração em produção.

## Integração com backend local — fase 002

O backend 5.13.49 foi iniciado em Docker local com imagem oficial fixada por digest, equivalente ao fork `allber-to/invoiceninja`. O frontend real usa `127.0.0.1:3100`, separado da prévia com fixtures. A [arquitetura aprovada pelo CTO](architecture-local-backend.md) define os critérios A1–A10; a [story 002](stories/002-local-backend.md) registra execução e ressalvas.

A API real confirmou login/precheck/refresh, criação e leitura de clientes, faturas, recorrente e pagamento manual. A massa conhecida produziu MRR de R$ 75,00, a receber de R$ 300,00, vencido de R$ 200,00 e recebido de R$ 23,45. A fatura de R$ 123,45 ficou com saldo de R$ 100,00 após pagamento de R$ 23,45. Empresa, IDs e saldos foram preservados após `stop`/`up -d`; os recursos Docker alheios permaneceram iguais.

A execução revelou que a API retorna `next_send_date` com horário. O contador por dia em próximas cobranças comparava a string completa e exibia zero; agora normaliza a data com o `dayjs` já usado pela lista. A regressão renderiza o componente real com data simples e timestamp. Após essa correção, o coordenador executou **345 testes em 48 arquivos**, lint global de 1.786 arquivos e build TypeScript/Vite: todos passaram. Logs locais: `/tmp/allberto-backend-unit.log`, `/tmp/allberto-backend-lint.log`, `/tmp/allberto-backend-build.log`.

PDF real gerado na rede interna, incluindo valor, cliente e acentuação conferidos. O e-mail foi gravado em log local e a fatura recebeu data de envio; o endpoint de histórico de e-mails retornou vazio. O CTO aceitou essa ressalva: o histórico depende de eventos de provedor, ausentes no transporte log.

O navegador terminou naturalmente com exit 0: **150 respostas da API, zero erros JavaScript, falhas de requisição ou HTTP >=400**. Conferiu login, quatro listas, detalhes, total/pago/saldo da fatura, KPIs exatos, calendário, edição de cliente pela UI confirmada por GET e recarga autenticada. Empresa e clientes usam Brasil/BRL/pt_BR; o país original do bootstrap causava separadores americanos, resolvido por configuração. [Handoff da execução](handoffs/astra-backend-local.md), [captura selecionada](evidence/backend-local/README.md) e [aceite final Fable](reviews/fable-local-backend.md), sem bloqueios.

Esta fase usa um administrador e pagamento manual. Não cobre permissões de usuários restritos, gateways, cobrança automática, entrega externa de e-mail, exportações, produção ou VPS. Os dados têm datas conhecidas: após a próxima emissão ou mudança de mês, o smoke pode detectar valores diferentes e falhar; ele não apaga ou reseta a conta para esconder isso.
