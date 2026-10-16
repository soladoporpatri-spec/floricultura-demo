# Publicação no GitHub Pages

Repositório: `soladoporpatri-spec/floricultura-demo`. Endereço: `https://soladoporpatri-spec.github.io/floricultura-demo/`.

O workflow `.github/workflows/pages.yml` roda quando a aplicação muda em `main` ou quando é iniciado manualmente na aba Actions. Ele prepara Node.js 24, gera o site, confere a consistência, executa os testes e envia somente `dist/` para a hospedagem.

Em **Settings → Pages → Build and deployment**, a fonte deve ser **GitHub Actions**. Não são necessárias credenciais dentro do código. As permissões de publicação ficam no job de deploy; o build tem acesso de leitura ao código.

## Alterar o endereço

`dist/js/site.js` concentra domínio e prefixo. Esses valores são usados nas rotas, imagens, canonical, links alternativos e sitemap. Depois de alterá-los, gere o site e execute checker e testes. Atualize também os links do README.

O HTML fica diretamente em `dist/`, sem uma pasta adicional com o nome do repositório. O GitHub Pages acrescenta o prefixo no endereço. `.nojekyll` evita processamento Jekyll; `404.html` carrega os recursos corretos mesmo em caminhos desconhecidos.

## Verificar

Confira os jobs na aba Actions. Abra o início e um produto por acesso direto, teste idiomas e sacola e confira imagens e fontes. O script `scripts/http-check.mjs` pode verificar o site publicado com `CHECK_ORIGIN=https://soladoporpatri-spec.github.io`.

A demonstração pública continua sem processar pedidos, pagamentos ou mensagens.

Referências: [workflows do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) e [fonte de publicação](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
