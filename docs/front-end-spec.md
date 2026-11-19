# Handoff frontend — proposta allberto

Referência analisada em 19/11/2026: `design/proposta-original.html`, cópia byte a byte do HTML entregue pelo usuário. Este documento descreve o design existente e os pontos a integrar no fork correto do Invoice Ninja; não seleciona stack, instala dependências nem transforma o protótipo em aplicação paralela. O coordenador confirmou e importou `https://github.com/allber-to/web`, fork de `invoiceninja/web`, a partir de `main` em `50019241117dfbd82c833729d9787e672413cba4`. A inspeção deste handoff é majoritariamente do design; contratos reais ainda exigem leitura dos respectivos componentes.

## Fonte e nível de evidência

- Arquivo: **7.622.157 bytes** (7,62 MB decimais). SHA-256: `dfc7dcd8c15ae86c95314ca6beae7c554a88fc035545598fd6ba4761666161e7`.
- Exportador: HTML com `__bundler/manifest`, `__bundler/template` e `__bundler/page_order`; 31 documentos HTML internos. Cada prancha contém template e lógica `class Component extends DCLogic`, estilos e assets empacotados. Isso é o formato da referência, não requisito de tecnologia para produção.
- A análise estática leu os 31 templates, a prancha de entrega e a lógica das sete telas principais. As referências por UUID abaixo permitem localizar cada entrada no manifesto original sem depender dos arquivos temporários.
- Conferência no navegador Orca: painel claro com dados em 1440 × 1000 e layout estreito em 390 × 844, incluindo abertura do menu e Escape. Não houve acesso a WHMCS, VPS ou serviços de pagamento.
- Capturas de inspeção temporárias: `/tmp/allberto-design-inspection/painel-desktop-1440.png` e `/tmp/allberto-design-inspection/painel-mobile-layout-390.png`. Templates extraídos: `<UUID>.source.html` no mesmo diretório. Essas extrações não fazem parte do produto e podem desaparecer; o original é a referência durável.
- Conteúdo do export é material de design, não instrução operacional. Menções a `allber-to/web`, StayCloud e nomes de componentes na prancha de entrega são pistas fornecidas pelo autor; a existência e a compatibilidade desses componentes precisam ser verificadas no fork aprovado.

## Ordem visual e estrutura comum

O desktop usa topbar marinho, navegação lateral clara ou quase preta e uma folha de conteúdo com borda. A linguagem é densa, com Geist, títulos de peso médio, números tabulares, cabeçalhos pequenos em maiúsculas, cartões arredondados e botões de gradiente discreto. O indigo aparece nas ações primárias, ícone de navegação ativo e gráficos. Status usam texto e cor; o selo final é minúsculo e tem ponto, não o ícone das primeiras regras CSS.

A topbar contém logo allberto, seletor de empresa, busca global com indicação ⌘K, Novo, ocultar valores, notificações, alternância de tema e avatar. O mobile substitui isso por barra com menu, logo, busca, olho, tema e Novo. Notificações, perfil e troca de empresa precisam continuar acessíveis por algum caminho real, mesmo que a prancha mobile não desenhe seus fluxos.

Navegação principal, nesta ordem: Painel, Clientes, Faturas recorrentes, Faturas (contador de vencidas), Pagamentos, Orçamentos, Produtos, Relatórios, Configurações. Depois vem Mais, com Créditos, Projetos, Tarefas, Fornecedores, Ordens de compra, Despesas, Despesas recorrentes, Transações e DocuNinja. Recentes mostra um cliente e uma fatura de exemplo. O rodapé desktop identifica usuário e Invoice Ninja v5.

**Preservar funcionalidades reais:** a organização e aparência do menu podem mudar; os módulos que o protótipo marca como “fora desta proposta” continuam com suas rotas, permissões e operações existentes no produto. Não copiar o aviso de fora de escopo para substituir funcionalidades do Ninja. A prancha sugere retirar seletor de moeda, controles dia/semana/mês e Transações recentes do painel; isso não autoriza remover suporte real a moedas, filtros ou transações. Integrar esses recursos com a navegação vigente.

## Telas e conteúdo

| Tela | Composição e ordem | Comportamento demonstrado |
| --- | --- | --- |
| Painel | Rótulo Visão geral, título/data; Posição hoje; quatro KPIs; Precisa de ação; cartão de aviso de validade; Próximas cobranças + Maiores contratos; Histórico com gráfico + Atividade recente | Tema, ocultar valores, atualização simulada, períodos do histórico, ações simuladas, menu Mais/gaveta |
| Clientes | Título/resumo + Exportar/Novo cliente; abas; busca/Filtro; lista; soma de mensalidades; contagem de resultados | Busca por nome/CNPJ; Todos, Em atraso, Cartão a vencer, Arquivados; detalhe apenas para Rota Sul |
| Cliente | Breadcrumb; nome/status/CNPJ; Cobrar de novo, Avisar cliente, Editar; resultado da ação; aviso de recusa; quatro KPIs; faturas e histórico à esquerda; contrato, cartão e contato à direita | Cobrança/aviso adicionam evento local; pedir cartão troca texto; edição não implementada |
| Faturas recorrentes | Título/resumo + Exportar/Nova; descrição do contrato; abas; busca/Filtro; lista; soma mensal prevista; resultados | Ativas, Pausadas, Encerradas, Rascunho; busca por cliente; demais abas vazias no fixture |
| Faturas | Título/resumo + Exportar/Nova; três KPIs; abas/busca/Filtro; seleção em lote; lista; resultados | Todas, Em aberto, Vencidas, Pagas, Rascunho; busca por cliente/número; selecionar visíveis, limpar, aviso simulado |
| Pagamentos | Título/resumo + Exportar/Registrar pagamento; três KPIs; abas/busca/Filtro; lista com motivo de recusa; resultados | Todos, Recebidos, Recusados, Estornados; busca por cliente/número; detalhe de fatura disponível só para 0124 |
| Fatura | Breadcrumb; valor grande/status/identificação; Cobrar de novo, Avisar cliente, Baixar PDF; atividade, itens/totais, tentativas; coluna de detalhes | Cobrança/aviso simulados; PDF fora de escopo no protótipo |

Colunas desktop:

- Clientes: cliente/CNPJ/desde, mensalidade, próxima cobrança, cartão, situação.
- Recorrentes: cliente/desde, valor por mês, vencimento, próxima cobrança, cobrança automática, situação.
- Faturas: seleção, número, cliente, emissão, vencimento, valor, status.
- Pagamentos: data/hora, cliente, fatura, cartão, valor, status/motivo.
- Painel/pendências: cliente/fatura, valor, vencimento/atraso, motivo/tentativas, ação.
- Cliente/faturas: número, vencimento, valor, status.
- Fatura/tentativas: data, cartão, resultado, código do banco.

No mobile, tabelas viram linhas de duas colunas: nome/valor no topo, informação complementar/status abaixo. Campos `.dk` e cabeçalhos somem, enquanto `.c-mb` e rótulos mobile entram. As pendências ficam em cartões de conteúdo vertical e mantêm suas ações. A folha perde borda/margem/raio e a barra lateral vira gaveta.

## Contrato do painel e estados

A posição atual **não muda com o período do Histórico**. O período controla gráfico e atividade. “Precisa de ação” inclui atrasadas e recusadas de qualquer data, deduplicadas por fatura. “Próximas cobranças” usa janela de sete dias e calendário horizontal. Maiores contratos mostra cinco clientes por participação na receita recorrente. Histórico oferece Este mês, 3 meses, 6 meses e 12 meses; barras de recebido, referência de previsto e hachura no mês em andamento. Atividade mostra sete eventos e um acesso para todos.

Fixture normal, congelado em **18/11/2026 às 09:41**:

| Indicador | Valor de referência | Semântica visual |
| --- | --- | --- |
| Receita recorrente mensal | R$ 47.000,00 / 12 contratos | Selo previsão; não é dinheiro recebido; sparkline |
| Recebido em novembro | R$ 10.100,00 / 4 pagamentos | Barra de 21,5% do previsto |
| A receber em novembro | R$ 36.900,00 / 8 faturas | Inclui R$ 10.300,00 vencidos; barra separa atraso |
| Em atraso | R$ 10.300,00 / 2 clientes | Vermelho, ícone de alerta, vencimento mais antigo |

- **Conta nova:** zeros legítimos, sem contratos/recebimentos/pendências; quatro etapas (conta criada, gateway, cliente, recorrente) e CTAs de cadastro/importação/gateway.
- **Mês sem pendências:** conserva R$ 47.000 previstos; R$ 20.400 recebidos, R$ 26.600 a receber, zero atraso. A lista de ação mostra Nada pendente. Ainda há aviso de cartão a vencer, próximos recebimentos e histórico.
- **Carregando:** skeletons e atributos de ocupado; sem substituir dados ausentes por zero. Animação pulse 1,4 s, desativada com redução de movimento.
- **Erro:** indicadores indisponíveis, mensagem e Tentar de novo. A ausência de dados não equivale a saldo zero.
- Listas também têm estado `vazio` implementado na lógica e vazio por busca/aba, mas não têm pranchas dedicadas de todos esses estados; não assumir que carregamento/erro das listas estejam resolvidos pelo export.

## Tokens e medidas finais

O CSS contém regras de rodadas anteriores seguidas de sobrescritas. Implementar o resultado da cascata final; não copiar apenas a primeira definição. Por exemplo, `.btn` começa em 40 px e termina em 36 px desktop/44 px mobile; o título mobile termina em 26 px; `.pill svg` termina oculto e o ponto é `::before`.

### Cores

| Token do template | Claro | Escuro |
| --- | --- | --- |
| `--surface` (paper) | `#ffffff` | `#161616` |
| `--bg` (folha) | `#f7f7f5` | `#111111` |
| `--side` (bg-2/shell) | `#f1f1ef` | `#0a0a0a` |
| `--bg-3` | `#e6e6e3` | `#1f1f1f` |
| `--ink` | `#18181b` | `#fafafa` |
| `--ink-2` | `#27272a` | `#e4e4e7` |
| `--muted`, `--subtle`, `--ref` | `#71717a` | `#a1a1aa` |
| `--label` | `#8b8b94` | `#8b8b94` |
| `--line` | `#e4e4e7` | `#262626` |
| `--line-soft` | `#ededed` | `#1f1f1f` |
| `--hover` | `#f1f1ef` | `#1f1f1f` |
| `--action` | `#545dff` | `#545dff` |
| `--on-action`, `--topbar-ink` | `#ffffff` | `#ffffff` |
| `--accent` | `#545dff` | `#9aa0ff` |
| `--focus`, `--bar` | `#545dff` | `#7e85ff` |
| `--ok` | `#15803d` | `#4ade80` |
| `--warn` | `#b45309` | `#fbbf24` |
| `--danger` | `#dc2626` | `#f87171` |
| `--skel` | `#e6e6e3` | `#262626` |
| `--overlay` | `rgba(0,0,0,.42)` | `rgba(0,0,0,.6)` |
| `--topbar` | `#14163a` | `#0e0e10` |

Fundos semânticos usam `color-mix(in oklab, ...)`: accent tem indigo 8% sobre branco no claro / 18% sobre `#161616` no escuro; ok usa `#1a9f63`, warn `#d97706`, danger `#dc2626`, com 10% no claro / 22% no escuro. Botão primário: gradiente vertical da mistura indigo 88% + branco para indigo puro; sombra interna branca 28% e externa `0 1px 2px rgb(20 24 90 / .35)`. Secundário: branco → bg no claro; `#1f1f1f` → surface no escuro. Preservar esses efeitos discretos sem ampliar brilho/sombra.

### Tipografia, espaçamento e componentes

| Elemento | Especificação |
| --- | --- |
| Corpo | Geist, fallback Inter/system; 14 px/1,45; tracking −0,005 em |
| Logo | Albert Sans 700; marca desktop 19 px, tracking −0,04 em; símbolo em SVG |
| Título | 32 px/500, line-height 1,05, tracking −0,035 em; mobile 26 px |
| Valores KPI | 26 px/500, tracking −0,035 em; até 860 px: 22 px; até 480 px: 20 px; números tabulares |
| Seção | 17 px/600; texto auxiliar 13 px, legenda 12 px |
| Rótulos/cabeçalhos | 10,5 px; maiúsculas; tracking 0,06 em; eyebrow 11 px |
| Topbar | 56 px; sticky top 0; z-index 20; padding horizontal 24 px |
| Sidebar | 236 px; sticky top 56 px; altura viewport − 56 px; itens 44 px, raio 11 px |
| Folha | Margem `16px 16px 16px 0`; borda 1 px; raio 9 px; overflow hidden |
| Conteúdo | `max-width:1280px`; padding `32px 40px 64px`; gap de blocos normalmente 20/24 px conforme tela |
| Cartão | Borda 1 px, raio 12 px, sombra `0 1px 0 var(--line)` |
| Botão | 36 px de altura, padding horizontal 14 px, raio 8 px; fonte 13 px/600; gap 7 px |
| Botão pequeno | 30 px, padding 11 px, fonte 12,5 px, raio 7 px |
| Ícone acionável | 34 × 34 px; topbar 32 × 32 px; mobile 44 × 44 px |
| Busca | 36 px, padding 12 px, fundo bg, raio 8 px; mobile 44 px |
| Selo | Fonte 11 px/600 em minúsculas; padding 3px 9px; raio 999 px; ponto 5 px |
| Segmentado | Padding 3 px, gap 2 px, raio 8 px; botão 12 px/600; ativo surface com sombra de 1 px |
| Abas | Fonte 13 px; padding 11px 14px; linha inferior ativa 2 px; scroll horizontal |
| Lista | `.trow`: padding 14px 18px, gap 14 px, borda line; hover indigo 2% sobre surface |
| Cabeçalho de lista | Mínimo 38 px; fundo side; maiúsculas 10,5 px/700 |
| Layout em duas colunas | Painel `1.55fr 1fr`, gap 16 px; detalhes `minmax(0,1fr) 340px`, gap 24 px |
| Espaços de referência | 8, 12, 16, 20, 24, 32, 40 px; não forçar múltiplos de 8 nos valores já definidos |

Hover primário aumenta brilho em 6%; pressionar botão desloca 1 px. Transição de botões 120 ms e linhas 80 ms. Foco final usa duas sombras de 2/3 px com accent-bg/focus, não somente o outline da regra anterior. Verificar a visibilidade do foco nos dois temas.

### Quebras responsivas

- **Acima de 1180 px:** quatro KPIs em linha; painel e detalhes em duas colunas.
- **Até 1180 px:** KPIs de quatro passam para duas colunas; duos e detalhes viram uma coluna; ações de pendência podem ocupar linha completa.
- **Até 860 px:** sidebar/topbar desktop somem; barra mobile aparece; conteúdo `20px 16px 48px`, gap 28 px; folha sem margem/borda/raio; toolbar/pagehead empilham; listas recompõem; KPIs de três viram coluna única; calendário usa sete colunas de mínimo 84 px com scroll local; gráfico tem altura 180 px.
- **Até 480 px:** ações podem quebrar linha e ocupar largura; KPIs com padding 16 px e valor 20 px. O `gap:10px` desse breakpoint é sobreposto por `.kpis,.stats,.stats3 {gap:12px !important}`: o resultado observado em 390 px tem 12 px de intervalo. Não trocar silenciosamente por 10 px.
- Não existe especificação dedicada para 320 px, tablet, zoom ou textos muito longos. Testar e corrigir sem alterar a hierarquia demonstrada.

## Interações de referência versus produto real

| Interação | O que o export faz | Integração necessária |
| --- | --- | --- |
| Trocar tema/ocultar valores | `setState` por prancha, sem persistência | Usar estado/preferência existentes; revisar todas as ocorrências de valores, inclusive descrições acessíveis |
| Busca global/⌘K, conta, notificações, avatar | Controles visuais sem fluxo efetivo | Manter componentes e atalhos reais do Ninja |
| Novo, exportar, filtro, criar/editar, registrar pagamento, PDF | Aviso de fora de escopo (`foraDoEscopo`) | Preservar implementação real e permissões |
| Busca local e abas | Filtram arrays locais; contadores baseados no fixture | Integrar consulta/paginação/filtros existentes, com carregamento/erro e totais verdadeiros |
| Atualizar/Tentar de novo | Timer de 1,2/1,4 s seguido de estado normal | Refetch real, impedir solicitação duplicada, estado de erro real |
| Cobrar/Avisar/Pedir cartão | Só altera texto/estado; “Desfazer” reverte a simulação | Chamar operação existente, mostrar pending/sucesso/erro confirmado; nunca afirmar envio antes da resposta; não oferecer desfazer fictício de cobrança/email |
| Seleção em lote | Seleção por número de fatura, inclusive persiste ao mudar filtro; avisar apenas troca texto | Usar IDs estáveis, regras de elegibilidade, seleção visível versus total e operação real; conservar proteção contra duplicação |
| Links de navegação | Strings como `Main.dc.html`, `Clientes.dc.html`; só um cliente/uma fatura têm detalhe | Mapear para rotas reais e IDs do fork; nomes `.dc.html` não são rotas de produção nem arquivos externos incluídos no export |
| Rodapé de resultados | “1–N de N”; sem paginação de servidor | Preservar paginação/ordenação/limites do produto |

O fixture possui 12 clientes, 12 recorrentes ativas, 24 faturas (duas competências), 16 pagamentos recebidos e duas tentativas recusadas. Nomes, CNPJs, cartões e contato `.example` são declarados fictícios no código. Não migrar esses registros, datas congeladas nem regras fixas para produção.

As tentativas recusadas aparecem em Pagamentos no design; confirmar onde o backend mantém tentativas versus pagamentos. Duas recusas de R$ 6.800 da mesma fatura representam R$ 6.800 ainda a cobrar, não R$ 13.600. Conta de MRR, abatimentos, créditos, descontos, juros, múltiplas moedas, recebimentos parciais e recorrências não mensais precisam continuar seguindo regras reais.

## Dependências de dados a resolver no fork

A própria entrega aponta lacunas: origem do motivo/código/quantidade de recusas; política de retentativa; validade do token do cartão; próxima execução real da cobrança; definição de contrato ativo e cancelamento; tratamento de recorrentes pausadas/arquivadas/com ciclos restantes; definição de cliente ativo; data usada para recebido e tratamento de estorno/crédito; diferença entre pagamento aprovado e repasse/liquidação. Não inventar endpoints ou inferir esses dados de labels visuais.

A prancha sugere reutilizar `DesktopSidebar`, `MobileSidebar`, `SidebarItem`, `navigation.ts`/`subOptions`, `Card`, `DashboardCard`, `PastDueInvoices`, `UpcomingRecurringInvoices`, `Chart`, `Activity`, `DataTable`, `Search`, `QuickCreatePopover`, `Notifications` e `dark_mode`. São **candidatos a verificar**, não uma auditoria do código do Ninja. O menor caminho completo é adaptar as peças existentes depois de localizar chamadas, contratos, testes e permissões no fork correto.

## Gaps observados e cuidados de implementação

1. **Viewport:** nenhum dos 31 templates internos declara meta viewport. Isolar a prancha mobile e emular dispositivo 390 × 844 produziu `innerWidth=980`, reduzindo um layout desktop. A largura CSS de 390 sem emulação reproduz a composição que os iframes do export mostram. A aplicação real precisa manter `width=device-width, initial-scale=1`; não importar essa falha do empacotamento.
2. **Gaveta:** marcação tem `role=dialog`, `aria-modal=true` e botões de fechar; no teste local Escape deixou a gaveta aberta. Não há gestão de foco/Escape na lógica da prancha. Garantir foco inicial, contenção de foco, Escape e retorno ao disparador no componente real. O fundo não deve continuar navegável por teclado.
3. **Contraste:** rótulos `#8b8b94` pequenos sobre branco/cinza claro merecem correção de contraste, validada com medição. Fidelidade não requer manter texto ilegível. Não foi realizada auditoria formal WCAG.
4. **Tabela/abas:** parte do protótipo usa grids de `div` e botões com `aria-selected`. Manter semântica de tabela ou lista apropriada, associação de cabeçalhos, nomes de checkboxes e comportamento de teclado das abas no componente existente; simples visual de tabela não garante leitura assistiva.
5. **Valores ocultos:** a função mascara formatação dinâmica, mas há valores em strings estáticas (ex.: evento de contrato de R$ 5.500,00/mês) e proporções/gráficos que continuam revelando informação. Validar máscara em todo texto, tooltip, nome acessível, gráfico e resultado de ação; isso é privacidade visual, não controle de acesso.
6. **Estados faltantes:** os formulários, validações, confirmações reais, sessão expirada, falta de permissão, erro parcial, nenhuma busca, listas longas e falhas de ações não estão integralmente desenhados. Reutilizar os padrões reais do produto. Nunca substituir erro financeiro por zero ou sucesso local.
7. **Navegação exportada:** os links usam nomes `.dc.html`, enquanto o pacote guarda pranchas por UUID; não tomar a aparência clicável como prova de navegação ponta a ponta. A leitura da lógica confirma os destinos pretendidos, não a validade das rotas do Ninja.
8. **Cópia de produto:** textos como “Ainda precisamos combinar o que conta como cancelamento” são notas de protótipo, não mensagem final de uma lista operacional. Resolver semântica antes de expor ao usuário.
9. **Responsividade:** calendário tem scroll local intencional; evitar scroll horizontal do documento. A ocultação de `.dk` não pode tornar cartão, emissão, identificadores ou seleção inacessíveis quando forem necessários à tarefa.

## Critérios de aceite e comparação visual

Separar fixture visual determinístico de dados reais: os valores do exemplo servem à comparação; a implementação deve ler dados do produto. Comparar mesma tela, tema, estado, data/locale, fontes carregadas, largura CSS e posição de scroll. O tamanho vertical das pranchas é área de apresentação, não `min-height` obrigatório da aplicação.

- Base desktop: largura 1440 px. Medição observada no painel: topbar 56 px; folha em x=236/y=72, largura=1188 px; conteúdo com padding 32/40/64; título 32 px; sem overflow horizontal do documento.
- Base mobile visual: largura CSS 390 px. Medição observada: título 26 px; colunas KPI de 173 px + intervalo de 12 px; calendário clientWidth 356 / scrollWidth 668; sem overflow horizontal do documento.
- Conferir os 31 estados nomeados no inventário, sem exigir 31 rotas distintas. Para telas sem estado desenhado, testar padrão herdado do Ninja.
- Comparar alinhamentos principais, largura de sidebar/folha, ritmo de seções, altura/densidade de linhas, quebra dos nomes e valores, gradientes, bordas, tipos/pesos e foco. Qualquer diferença de hierarquia ou elemento ausente exige correção; pequenas diferenças de rasterização de fonte precisam ser avaliadas visualmente, não apenas por porcentagem de pixels.
- Testar limites 1180/1181, 860/861, 480/481 e 390; ampliar para 320 px e zoom 200% antes da entrega. Dados longos, valores grandes/negativos e paginação real não devem recortar ações ou identificadores.
- Validar tema claro/escuro, hover/focus/pressed, menu aberto/fechado, Mais, máscara, períodos, abas, busca sem resultados, seleção parcial/total, carregamento, erro/retry e sucesso/falha real de ações autorizadas em ambiente de teste.
- Conferir que reordenação do menu mantém todos os módulos, busca global, notificações, troca de empresa, permissões, CRUD, filtros, exportação, PDF, gateways e histórico existentes. Operação financeira ou mensagem real não deve ser executada para simples comparação visual.
- Verificar cálculos com fixtures já existentes do fork: MRR não se confunde com recebido; vencidas compõem a receber; múltiplas recusas não duplicam dívida; erro não zera KPI; filtro histórico não altera posição atual.

## Inventário das 31 pranchas

Os UUIDs são chaves de `__bundler/manifest` e a ordem vem do template externo. Todas as medidas abaixo são em pixels CSS. O pacote contém 12 pranchas de Painel, uma entrega e seis famílias de três pranchas (desktop claro/escuro e celular claro).

| # | Prancha | Dimensão | UUID |
| --- | --- | --- | --- |
| 1 | Painel · Desktop · claro · com dados | 1440 × 2500 | `8b7c5de3-dde7-45de-80de-54943b394848` |
| 2 | Painel · Desktop · escuro · com dados | 1440 × 2500 | `21414f63-507e-42f6-820a-147e2d8e8a52` |
| 3 | Painel · Desktop · claro · conta nova | 1440 × 1800 | `0cc416e2-e7df-45ba-bac9-e1a1eda239d1` |
| 4 | Painel · Desktop · claro · mês sem pendências | 1440 × 2300 | `05d63f88-9a73-4fcd-b4ae-d009b35daf7d` |
| 5 | Painel · Desktop · claro · carregando | 1440 × 1500 | `3d7eca61-760b-4e83-a24d-b7b0f199abd0` |
| 6 | Painel · Desktop · claro · erro ao buscar dados | 1440 × 1500 | `76f54835-39bd-4478-8060-e02424bfeb49` |
| 7 | Painel · Celular · claro · com dados | 390 × 4400 | `dcd2d3ad-98ca-4a04-b690-2e141d5c9b15` |
| 8 | Painel · Celular · escuro · com dados | 390 × 4400 | `6214186a-94aa-486a-bcb4-72fbdb151fc4` |
| 9 | Painel · Celular · claro · conta nova | 390 × 2900 | `aaff4e7d-46e1-4406-8187-0bfd28995649` |
| 10 | Painel · Celular · claro · mês sem pendências | 390 × 3900 | `1cbecc59-14de-4354-8ba9-9e51e09e6979` |
| 11 | Painel · Celular · claro · carregando | 390 × 2100 | `d0c33227-6e62-49b8-8feb-51159497e3f8` |
| 12 | Painel · Celular · escuro · erro ao buscar dados | 390 × 2400 | `088f9b77-09f8-4317-ace5-8769c79e57e9` |
| 13 | Entrega · tokens e o que muda | 1440 × 2250 | `dfeb257c-2e1b-48f0-a054-8b939ed5d21b` |
| 14 | Clientes · desktop · claro | 1440 × 1450 | `13300a23-fc89-4c1a-b877-873b769b04a7` |
| 15 | Clientes · desktop · escuro | 1440 × 1450 | `ca623ee8-d66d-4729-98c5-4b791d13d093` |
| 16 | Clientes · celular · claro | 390 × 1900 | `dca1370a-3af2-4ff8-82dc-1e6aa2f7cce7` |
| 17 | Cliente · Transportes Rota Sul · desktop · claro | 1440 × 1700 | `59d1718e-afc3-4bdb-9013-a15f5ace7634` |
| 18 | Cliente · Transportes Rota Sul · desktop · escuro | 1440 × 1700 | `ad9c29ba-61b8-40d2-b5f8-896c72bcab3d` |
| 19 | Cliente · Transportes Rota Sul · celular · claro | 390 × 3000 | `48664096-5ff5-4255-985b-56e2c6848915` |
| 20 | Faturas recorrentes · desktop · claro | 1440 × 1550 | `2582a21e-bb37-4d62-9115-a85a1a587699` |
| 21 | Faturas recorrentes · desktop · escuro | 1440 × 1550 | `96671b0a-2e00-4f55-bed0-582546296e7c` |
| 22 | Faturas recorrentes · celular · claro | 390 × 2000 | `65c38fb3-bcb6-4be5-a3f4-bdd50f91e914` |
| 23 | Faturas · desktop · claro | 1440 × 2050 | `0fd2540f-423f-4e0f-b0c2-a07ee6bc9bf7` |
| 24 | Faturas · desktop · escuro | 1440 × 2050 | `c36351aa-f749-4ed7-a866-f0361d7bfab0` |
| 25 | Faturas · celular · claro | 390 × 3300 | `63d61075-d145-4904-960e-94560b02b0c1` |
| 26 | Pagamentos · desktop · claro | 1440 × 1750 | `11d18557-77ad-4f60-8887-b1fecbf9d69d` |
| 27 | Pagamentos · desktop · escuro | 1440 × 1750 | `ab842201-a660-401b-8656-020155d3c0bf` |
| 28 | Pagamentos · celular · claro | 390 × 2800 | `3702edb4-0a37-42ca-8e78-13e386bca3d7` |
| 29 | Fatura 2026-0124 · desktop · claro | 1440 × 1500 | `603e16f2-f3b3-45a8-8a70-8daf786916b8` |
| 30 | Fatura 2026-0124 · desktop · escuro | 1440 × 1500 | `ed55fd2c-15c3-4e41-bbde-ae04b7ce47e7` |
| 31 | Fatura 2026-0124 · celular · claro | 390 × 2500 | `efb03a36-0bbc-4bae-ad7e-c8d7954a77ca` |

## Divisão de implementação após importar o fork

O coordenador informou a importação de `allber-to/web` e conduz instalação/checagens baseline. Uma leitura pontual confirmou `useColorScheme` em `src/common/colors.ts` (retorna as propriedades existentes `$0`…`$25` conforme `dark_mode`) e `src/components/layouts/Default.tsx` com Search, QuickCreatePopover, Notifications, navegação, banners e proteção de saída. Preservar essas integrações e interfaces públicas; a referência não justifica substituir a shell por HTML estático.

| Responsável | Escrita exclusiva recomendada | Contrato com o outro responsável |
| --- | --- | --- |
| Opus — shell e dashboard | `src/common/colors.ts`, estilos/fontes globais, `src/components/**`, `src/pages/dashboard/**` | Preservar API de `useColorScheme`, props de Default/Card/DataTable/botões e handlers compartilhados; publicar tokens/estilos que as páginas consomem |
| Astra — páginas de domínio | `src/pages/clients/**`, `src/pages/invoices/**`, `src/pages/recurring-invoices/**`, `src/pages/payments/**` | Ajustar apresentação/colunas/status com componentes existentes; solicitar mudanças compartilhadas ao Opus, sem edição concorrente de `src/components/**` ou cores globais |

Entradas confirmadas para Astra: `clients/index/Clients.tsx`, `clients/show/Client.tsx` e seus cards/tabs, `invoices/index/Invoices.tsx`, `recurring-invoices/index/RecurringInvoices.tsx`, `payments/index/Payments.tsx`, mais `routes.tsx` de cada área para verificar os destinos reais. Alteração de rotas não é necessária só por mudar aparência. Os detalhes de fatura devem ser localizados pela rota existente antes de implementar a prancha.

Propriedade exclusiva por diretório evita colisão de arquivos, mas não substitui integração: primeiro acordar tokens e props mantidos, então revisar páginas sobre a shell final. Hooks de domínio, queries, permissões, cálculos monetários, formulários e ações existentes devem permanecer responsáveis pelos efeitos reais. Uma necessidade de dado novo sai dessa faixa de aparência e exige contrato backend comprovado. Checagens npm/build/test ficam sob coordenação para não duplicar processos; este handoff não executou esses comandos.
