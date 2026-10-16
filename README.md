# Floricultura | Vitrine de desenvolvimento web

**Uma demonstração criada por [Patricio Paulo](https://github.com/soladoporpatri-spec) para apresentar seu trabalho a futuros clientes.**

[Abrir o site](https://soladoporpatri-spec.github.io/floricultura-demo/) · [Conhecer o desenvolvedor](https://github.com/soladoporpatri-spec)

[![Publicação e testes](https://github.com/soladoporpatri-spec/floricultura-demo/actions/workflows/pages.yml/badge.svg)](https://github.com/soladoporpatri-spec/floricultura-demo/actions/workflows/pages.yml)

![Composição floral que inspira a identidade visual](dist/assets/hero.webp)

## A ideia

Este projeto mostra como uma floricultura pode apresentar suas composições, ajudar o visitante a escolher um presente e conduzi-lo até uma simulação de compra. A identidade combina bordô, marfim, verde profundo e fotografia botânica, com títulos grandes e uma composição editorial.

O objetivo é servir como vitrine de design e desenvolvimento. **A loja é fictícia: não recebe pedidos, não cobra valores e não envia mensagens.** Produtos, preços e condições de entrega são exemplos para demonstrar a experiência.

Quer uma versão adaptada à sua empresa? [Conheça o trabalho de Patricio Paulo no GitHub](https://github.com/soladoporpatri-spec).

## O que você pode experimentar

| Área | Funcionalidades |
| --- | --- |
| Início | Destaque floral, coleção, categorias, sugestões por ocasião e conceito do ateliê |
| Catálogo | Seis produtos, busca por nome e descrição e filtros de categoria, cor, ocasião e preço |
| Ordenação | Seleção do catálogo, menor preço, maior preço e produtos recentes |
| Produto | Foto ampliável, composição, descrição, tamanho, quantidade e mensagem para cartão |
| Sacola | Adicionar e remover itens, alterar quantidades, atualizar valores e continuar a simulação |
| Checkout | Identificação, endereço, escolha entre retirada e entrega, validação e resumo |
| Contato | Formulário validado com confirmação local, sem envio |
| Institucional | Ateliê, dúvidas, entregas e cuidados, privacidade, termos e erro 404 |
| Idiomas | Português brasileiro, inglês e espanhol em toda a interface |

### Regras da demonstração

Os preços são em reais brasileiros nos três idiomas. A troca de idioma altera os textos e a formatação, sem simular operações comerciais em outros países.

Os produtos têm tamanhos clássico e generoso. O generoso custa 50% a mais; os cálculos usam centavos inteiros. Cada variante permite até 20 unidades. A entrega ilustrativa custa R$ 25, com gratuidade a partir de R$ 500. A retirada simulada é gratuita.

O cartão aceita até 180 caracteres. A mensagem fica na memória durante a visita e desaparece ao recarregar a página. A sacola guarda no navegador somente produto, tamanho, quantidade e um identificador de variante. Nome, e-mail, telefone, endereço e observações dos formulários não são armazenados nem enviados.

## Design e experiência

- Identidade própria em bordô e marfim, com detalhes em verde e rosa.
- Títulos em Cormorant Garamond e interface em Manrope.
- Oito imagens originais geradas por IA, exportadas em WebP.
- Fontes locais e nenhuma dependência externa para carregar a interface.
- Layout para celular, tablet e desktop, com menu móvel.
- Labels de formulário, foco visível, navegação por teclado e movimento reduzido.
- Estados de busca sem resultado, sacola vazia, erros e conclusão demonstrativa.

Cada produto tem uma fotografia própria e permite ampliá-la. A galeria usa a mesma foto, sem inventar outros ângulos. Não há depoimentos, endereço ou histórico empresarial fictício apresentados como reais.

## Tecnologias e arquitetura

O projeto usa **HTML, CSS e JavaScript em módulos nativos**, sem framework e sem dependências de produção. Node.js gera o HTML das rotas e executa os testes. GitHub Actions publica os arquivos estáticos no GitHub Pages.

A navegação usa a History API. As rotas também têm arquivos HTML próprios, permitindo acesso direto e recarregamento. Catálogo, traduções, rotas, hospedagem, sacola, componentes e eventos ficam em módulos separados.

## Páginas e idiomas

O endereço do projeto começa com `/floricultura-demo`. Os caminhos abaixo são relativos a ele.

| Página | Português | Inglês | Espanhol |
| --- | --- | --- | --- |
| Início | `/pt-br/` | `/en/` | `/es/` |
| Coleção | `/pt-br/colecao/` | `/en/collection/` | `/es/coleccion/` |
| Produto | `/pt-br/produto/:id/` | `/en/product/:id/` | `/es/producto/:id/` |
| Sacola | `/pt-br/carrinho/` | `/en/bag/` | `/es/bolsa/` |
| Checkout | `/pt-br/checkout/` | `/en/checkout/` | `/es/checkout/` |
| Ateliê | `/pt-br/nossa-historia/` | `/en/our-story/` | `/es/nuestra-historia/` |
| Contato | `/pt-br/contato/` | `/en/contact/` | `/es/contacto/` |
| Dúvidas | `/pt-br/perguntas-frequentes/` | `/en/faq/` | `/es/preguntas-frecuentes/` |
| Entregas e cuidados | `/pt-br/entregas-e-politicas/` | `/en/delivery-and-policies/` | `/es/entregas-y-politicas/` |
| Privacidade | `/pt-br/privacidade/` | `/en/privacy/` | `/es/privacidad/` |
| Termos | `/pt-br/termos/` | `/en/terms/` | `/es/terminos/` |

A preferência de idioma é preservada. Nomes próprios dos produtos permanecem iguais. O documento atualiza `lang`, título, descrição, canonical, `hreflang` e metadados de compartilhamento. A demo usa `noindex` para não aparecer nos buscadores como uma loja em operação.

## Executar localmente

Use Node.js 24. Não é necessário instalar pacotes.

```sh
git clone https://github.com/soladoporpatri-spec/floricultura-demo.git
cd floricultura-demo
node scripts/build.mjs
node scripts/serve.mjs
```

Abra [a prévia local](http://127.0.0.1:4276/floricultura-demo/).

Para verificar:

```sh
node scripts/build.mjs
node scripts/check.mjs
node --test tests/*.test.mjs
```

Com a prévia rodando, outro terminal pode executar `node scripts/http-check.mjs` para conferir as respostas das páginas e dos recursos.

O checker verifica sintaxe e consistência; ele não é ESLint. Os testes cobrem cálculos, frete, quantidades, variantes, entradas inválidas, checkout, traduções, rotas e caminhos do GitHub Pages. Lighthouse, Core Web Vitals e desempenho sob carga não foram medidos.

A migração para o GitHub Pages passou em 27 testes. A verificação do site público conferiu 48 páginas, duas rotas de erro e 20 recursos. Consulte [o registro de verificação](docs/VERIFICACAO.md).

## Arquivos principais

```text
.github/workflows/pages.yml    testes e publicação automática
dist/
  assets/                     imagens, ícones, fontes e licenças
  js/
    app.js                    eventos, navegação e estado da interface
    views.js                  páginas e componentes
    commerce.js               regras da sacola e validação
    products.js               catálogo demonstrativo
    i18n.js                   traduções
    routes.js                 rotas localizadas
    site.js                   domínio e prefixo da hospedagem
    ui.js                     ícones e escape de texto
  pt-br/, en/, es/             HTML gerado por idioma
  index.html, 404.html         entrada e erro personalizado
  styles.css                  sistema visual e responsividade
  sitemap.xml, robots.txt      arquivos para rastreadores
scripts/
  build.mjs                   geração do HTML e metadados
  check.mjs                   sintaxe e consistência
  serve.mjs                   servidor local
  http-check.mjs              verificação HTTP
tests/                        testes com o runner nativo do Node.js
docs/                         publicação e procedência das imagens
```

## Personalização e publicação

Catálogo e preços ficam em `dist/js/products.js`; textos em `dist/js/i18n.js`; cores e layout em `dist/styles.css`. O domínio e o prefixo são configurados em `dist/js/site.js`.

Mudanças da aplicação em `main` passam pela geração do site, pelo checker e pelos testes antes da publicação. O workflow usa Actions oficiais fixadas por commit, com permissão de publicação somente no job de deploy. Não há token pessoal dentro do código.

Consulte [o guia de publicação](docs/PUBLICACAO.md) para mudar o endereço ou repetir a configuração.

## Uma versão para um cliente

Uma adaptação pode receber a marca da empresa, catálogo real, área de entrega, WhatsApp, formulários com envio, gestão de pedidos, estoque e pagamentos. Essas integrações dependem da operação e precisam ser implementadas e testadas antes de abrir vendas.

Este repositório demonstra a interface e os fluxos locais. O checkout não cria pedidos nem solicita dados de cartão.

## Autor e imagens

**Patricio Paulo** · [GitHub](https://github.com/soladoporpatri-spec)

As imagens foram geradas por IA para este conceito e não representam estoque ou instalações reais. As fontes Cormorant Garamond e Manrope acompanham suas licenças OFL. Veja [Imagens e fontes](docs/IMAGENS.md).
