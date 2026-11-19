# Imagens quebradas no PDF — diagnóstico do CTO

Data: 19/11/2026. Revisor: Claude Fable 5.2. Somente leitura: fonte do backend 5.13.49 dentro do container local da story 002 e as evidências do coordenador. Não alterei PHP, VPS, dados nem rede.

## Conclusão

As duas imagens quebradas têm a mesma origem: **o PDF referencia imagens por URL, e o container que gera o PDF não tem saída de rede.** Não é `src` vazio nem defeito do modelo de fatura. São dois casos diferentes, com soluções diferentes:

| Imagem | O que é | Resolve sem abrir rede? |
| --- | --- | --- |
| Topo, com o texto "Allberto logo" | Logotipo da empresa, que não foi cadastrado | **Sim:** cadastrar um logotipo |
| Ícone abaixo da tabela | Marca "Invoice Ninja" que o upstream coloca nas faturas de quem não tem licença white-label | **Não**, por meio legítimo. Ver seção 3 |

O conteúdo financeiro do PDF está correto (item, total e saldo de R$ 10,00). O defeito é só visual.

## 1. O que a fonte mostra

**Logotipo do topo.** O modelo tem `<img class="company-logo" src="$company.logo" alt="$company.name logo">` (`resources/views/pdf-designs/clean.html:369`). O valor vem de `CompanyPresenter::logo_base64()`, que com `IS_DOCKER=true` chama `logoDocker()`:
- se existe arquivo de logotipo no armazenamento da empresa, devolve a imagem **embutida** em base64, sem rede;
- se não existe, cai em `logo()`, que para logotipo vazio devolve `asset('images/blank.png')`, isto é, **`APP_URL` + `/images/blank.png`** (`CompanyPresenter.php:36-66`).

No ambiente publicado, `company_logo` está vazio. O PDF então pede `https://<host da API>/images/blank.png`. O Chromium roda dentro do container `app`, que está só na rede interna e não alcança o endereço público. A imagem falha e aparece o texto alternativo.

Num ambiente com saída, esse arquivo é uma imagem em branco de 555 bytes e nada apareceria. Por isso o upstream não trata o caso.

**Ícone abaixo da tabela.** `PdfBuilder.php:1441` e `:1516` inserem `<img id="invoiceninja-whitelabel-logo" src="$invoiceninja.whitelabel">`, e `HtmlEngine.php:816` fixa esse valor em `https://invoicing.co/images/new_logo.png`. O elemento só fica oculto quando `account->isPaid()`, que em instalação própria significa ter o recurso de white-label (`Account.php:309-312`). Sem licença, o PDF pede a imagem a um servidor externo, que o container não alcança.

**O que é prova e o que é inferência.** As URLs e as condições estão na fonte, lidas diretamente. O isolamento de rede foi verificado na story 002 e é o mesmo desenho na VPS. Não observei a requisição falhando dentro do Chromium; a conclusão junta as duas coisas com o sintoma. Reforça o diagnóstico o fato de o PDF do ambiente local, gerado na story 002, já trazer o mesmo texto "… logo" no topo: eu li aquele texto extraído na época e não reconheci como imagem quebrada. Foi falha minha de revisão.

## 2. Logotipo do topo — correção por configuração

**Cadastrar um logotipo da empresa** em Configurações → Detalhes da empresa → Logotipo.

Por que resolve: o envio grava o arquivo no disco padrão (`debian_docker`, pasta da empresa), que é exatamente onde `logoDocker()` procura (`UploadAvatar.php`, `config/filesystems.php:69-72`). Achando o arquivo, o PDF leva a imagem embutida e não faz requisição.

- Não exige mudança de código, de rede nem de variável de ambiente.
- Precisa ser feito uma vez por empresa cadastrada.
- **A confirmar na prática:** enviar o logotipo e gerar o PDF de novo. A leitura da fonte indica que funciona; ninguém testou.
- Qual imagem usar é decisão do proprietário. A identidade allberto ainda não tem símbolo final. Para a homologação serve qualquer arquivo de teste; não estou propondo aparência.

Não existe, nesta versão, opção para simplesmente omitir o logotipo: o modelo sempre inclui a imagem. Sem logotipo cadastrado, o texto alternativo continuará aparecendo neste desenho de rede.

## 3. Marca do Invoice Ninja — não há correção legítima sem custo ou sem rede

A imagem é a atribuição que o upstream exige de quem usa o produto sem licença white-label. As saídas possíveis:

| Caminho | Avaliação |
| --- | --- |
| Comprar a licença white-label | Oculta o elemento, pela regra do próprio código. **É pago**, então fora do que está autorizado; decisão do proprietário. Ativar a licença provavelmente exige que o servidor fale com o serviço de licenças do upstream, o que esbarra no isolamento — não conferi esse fluxo. |
| Permitir saída do `app` para buscar a imagem | Funciona, mas desfaz o isolamento que garante hoje que nenhum e-mail ou chamada externa sai. Contraria a restrição desta tarefa. |
| Esconder o elemento por CSS ou modelo personalizado | **Não recomendo.** É contornar a exigência de atribuição sem ter a licença. |
| Fazer `invoicing.co` resolver para dentro da rede | Não funciona de forma limpa: a URL é HTTPS e exigiria certificado para um domínio de terceiro. Descartado. |
| Aceitar como limite da homologação | **É o que recomendo agora.** |

**Limite legítimo, dito sem rodeio:** nesta configuração, toda fatura em PDF sai com um ícone de imagem quebrada no rodapé. Para homologação com dados fictícios, é aceitável e fica registrado. Para enviar fatura a cliente real, não é: antes disso o proprietário precisa escolher entre a licença white-label e uma saída de rede controlada.

A segunda opção, se escolhida, é mudança de arquitetura e volta para mim: teria de ser desenhada junto com a liberação de e-mail real, que também depende de saída.

## 4. Ordem sugerida

1. Operador envia um logotipo de teste e gera o PDF novamente. Esperado: logotipo no topo; ícone quebrado continua no rodapé.
2. Registrar o ícone do rodapé como limite conhecido na story 003.
3. Levar ao proprietário a decisão da seção 3, junto com as outras condições para dados reais (backup com restauração, e-mail real).

## 5. Outras observações da evidência

- O PDF tem 37.343 bytes, uma página, e os valores batem com a API.
- Memória: o `app` chegou a cerca de 1 GB depois de gerar PDF, com os demais containers somando cerca de 560 MiB, sem reinício. Cabe na VPS, mas a margem é de uns 1,7 GB sem swap. Vários PDFs simultâneos são o cenário a observar.
- O portal do cliente mostrou o valor correto.

## 6. Não verificado

- O envio do logotipo e o PDF resultante.
- O fluxo de ativação da licença white-label e se ele funciona sem saída de rede.
- Outros modelos de fatura além do `clean`: a marca do rodapé vem do `PdfBuilder` e vale para todos; o logotipo do topo eu só conferi neste modelo.
- E-mails enviados com imagens: não fazem parte desta análise, e o transporte está em log.
