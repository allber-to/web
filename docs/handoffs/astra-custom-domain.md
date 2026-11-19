# Astra — pacote local para domínio próprio

19/11/2026. Preparação conforme `docs/architecture-custom-domain.md`, sem publicação/deploy. Fonte exata: `d8a873829cbbc2ba1f71df71b0022829e2568443`; origem compilada da API: `https://api.allber.to`; origem prevista do frontend: `https://allber.to`.

## Execução

O contexto veio de `git archive` do SHA acima extraído em diretório temporário exclusivo, registrado em `/tmp/allberto-custom-domain-release/source-context.txt`. Nenhuma mistura com documentos em edição, ambientes reais ou dist anteriores. O Dockerfile aprovado foi usado sem alteração; npm ci/Vite rodam no builder Node local, nunca na VPS.

Comando do build (SOURCE_CONTEXT é o diretório exclusivo registrado acima):

```sh
docker --context desktop-linux build --target build \
  -f "$SOURCE_CONTEXT/deploy/easypanel/frontend.Dockerfile" \
  --build-arg VITE_API_URL=https://api.allber.to \
  --build-arg GIT_SHA=d8a873829cbbc2ba1f71df71b0022829e2568443 \
  -t allberto-web-release:d8a873829cbb "$SOURCE_CONTEXT"
```

O builder executa os self-checks e o verificador E5. A extração usa um container temporário criado, sem iniciar processo, seguido de `docker cp <id>:/app/dist` e remoção somente desse container. Todas as operações usam explicitamente `--context desktop-linux`.

Verificação/empacotamento: `/tmp/allberto-custom-domain-release/package-check.py`. O script executa novamente o verificador sobre o dist extraído com a origem esperada, confere version.json/revisão, origem no JavaScript servido, ausência de DocuNinja desabilitado e index.html; empacota com `COPYFILE_DISABLE=1 tar -czf <arquivo> -C <dist> .`. Confere os caminhos do tar, ausência de links e arquivos .env, versão dentro do próprio pacote e SHA256. O tar contém dist diretamente na raiz, sem diretório envoltório.

## Limites e próximos passos

Este pacote é preparação. Nome do domínio comprado, conta Cloudflare StayCloud, DNS/delegação, certificados, API real, preservação da conta e redirect www não foram verificados por Astra. Não foram feitos requests ao domínio/API/VPS, operações de navegador/DNS/GitHub, commits, publicação ou deploy. `deploy/easypanel/Dockerfile`, frontend.conf e fontes da aplicação permanecem intactos; os defaults só poderão mudar após o coordenador fornecer URL/checksum públicos reais.

As releases anteriores, seus dist/evidências e os containers locais foram preservados. Não houve repetição de suíte completa: nenhuma fonte da aplicação mudou. Após confirmação do domínio e execução da arquitetura pelo operador, o coordenador deve publicar o asset, conferir download anônimo/hash, versionar o pin e validar D1–D11. O sucesso local não comprova TLS, autenticação/CORS ou disponibilidade do domínio e não torna o ambiente apto a dados reais.

## Resultado local — fonte e pacote congelados

- Arquivo: `/tmp/allberto-custom-domain-release/allberto-web-d8a873829cbb.tar.gz`
- Tamanho: **15.271.381 bytes**.
- SHA256: `7a893ca6a434f7f4344ba816b619009ada06b6519b9abce288bfac21033812f6`.
- version.revision: `d8a873829cbbc2ba1f71df71b0022829e2568443`.
- version.builtAt: `2026-11-19T17:27:33.877Z`.
- API compilada no JavaScript servido: `https://api.allber.to`.

Build e verificação/empacotamento terminaram com **exit 0**. E5 passou com zero endereços de serviços locais e zero assinaturas de segredos; 11 contextos localhost revistos nas mesmas categorias inertes aprovadas anteriormente pelo CTO (validação de file URL, tokens/regex de parser, fallbacks fora do navegador e comentários de código TinyMCE). W2 passou: revisão exata, origem esperada, builder DocuNinja desabilitado ausente, index/version na raiz do pacote, caminhos seguros e nenhum link/arquivo .env. `shasum -a 256 -c allberto-web-d8a873829cbb.tar.gz.sha256`: **OK**.

Evidências no mesmo diretório: `build.log`, `build-exit.txt`, `bundle-package-check.log`, `w2-check.json`, `release-summary.json`, `.tar.gz.sha256`, `dist/` e contexto isolado. O container temporário usado para copiar dist foi removido sem ser iniciado. Imagem local do builder permanece disponível. Não houve publicação nem teste do serviço real; DNS/TLS/conta/API continuam explicitamente não verificados por esta entrega.

## Pin da release pública — validação leve pendente

O coordenador confirmou pela UI domínio `allber.to` adquirido/ACTIVE e conta Cloudflare StayCloud. Publicou a prerelease `web-d8a873829cbb-1` e confirmou W1 anônimo: 15.271.381 bytes e checksum exato; evidência `/tmp/allberto-custom-domain-release/public-download-check.json`. Esses resultados foram informados pelo coordenador, não obtidos por acesso de Astra ao painel.

Alterados somente os dois defaults de `deploy/easypanel/Dockerfile`:

- DIST_URL=`https://github.com/allber-to/web/releases/download/web-d8a873829cbb-1/allberto-web-d8a873829cbb.tar.gz`
- DIST_SHA256=`7a893ca6a434f7f4344ba816b619009ada06b6519b9abce288bfac21033812f6`

Tentativa de `docker --context desktop-linux build -t allberto-web-lightweight:d8a873829cbb deploy/easypanel` interrompida **antes do build**, exit 1: socket local `/Users/luizgustavoavila/.docker/run/docker.sock` ausente. Log `/tmp/allberto-custom-domain-release/lightweight-build.log`. Nenhuma mudança de container ou início do Docker Desktop foi realizado. Build leve sem args, `nginx -t` e revisão dentro da imagem precisam ser retomados quando o daemon local estiver disponível; os passes de preparação anteriores não substituem essa validação.

frontend.conf intacto; redirect www depende do inventário UI. Runtime/DNS/TLS ainda pendentes. Nenhum merge/deploy está validado por este pin; PR draft fica sob coordenação, sem mutações GitHub/VPS/DNS ou commits por Astra.

Nota posterior do coordenador: o CTO revisou o pacote e o delta em `docs/reviews/fable-custom-domain-artifacts.md` e aceitou deixar o build leve para o deploy, devido à receita inalterada e às provas independentes de URL/hash/extração. O bloqueio local acima permanece registrado como não executado; não é mais condição prévia, e o deploy web segue condicionado à nova API com TLS válido.
