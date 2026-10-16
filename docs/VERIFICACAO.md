# Verificação da publicação

A publicação inicial no GitHub Pages foi concluída pelo [workflow de build e deploy](https://github.com/soladoporpatri-spec/floricultura-demo/actions/runs/38829146577).

| Verificação | Resultado |
| --- | --- |
| Geração estática | 53 documentos HTML e sitemap com 42 páginas públicas |
| Sintaxe e consistência | Sem falhas nos módulos, traduções, catálogo, recursos e metadados |
| Testes automatizados | 30 aprovados |
| Páginas no endereço público | 48 respostas HTTP 200 com título e idioma correspondentes |
| Rotas inexistentes | Duas respostas HTTP 404 com a página personalizada |
| Recursos publicados | 20 respostas válidas para código, estilos, imagens e fontes |
| GitHub Actions | Jobs de build e deploy concluídos com sucesso |

Os testes cobrem regras da sacola, preços em centavos, entrega, variantes, dados inválidos, validação do checkout, traduções e rotas. Dois testes específicos verificam o prefixo do GitHub Pages e a independência dos links e recursos em relação à hospedagem anterior.

A inspeção visual no navegador não foi repetida nesta publicação. A verificação HTTP comprova disponibilidade e conteúdo dos arquivos, mas não equivale a um teste de interação no navegador. Lighthouse, Core Web Vitals, acessibilidade completa e desempenho sob carga não foram medidos.

O projeto continua sendo uma demonstração. Não há processamento real de pedidos, pagamentos ou envio de mensagens.

## Atualização de apresentação

O aviso de demonstração foi concentrado na faixa superior, com revisão dos textos em português, inglês e espanhol. A revisão do presente mantém a sacola e mostra o total conforme a entrega selecionada. O formulário de contato mantém os campos preenchidos e exibe uma prévia local da mensagem. As páginas de privacidade e termos descrevem os limites dos formulários.
