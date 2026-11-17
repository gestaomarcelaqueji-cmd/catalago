# Matriz de migração do ZIP personalizado da Ducks

O ZIP foi inspecionado como **referência de estrutura e de ergonomia**, não como fonte de imagens ou identidade da nova marca. Sem portar componentes do checkout nem clientes.

| Origem no ZIP | Destino novo | Reaproveitado | Reimplementado |
|---|---|---|---|
| `templates/pages/home.json` | `home_sections` + `HomeSections` | Tipos e ordem inicial das dez seções | Dados da nova marca e conteúdo editável em JSON |
| `sections/header.tpl`, `blocks/header-*`, `templates/layout/header.json` | `store-shell`, `store-shell-client` | Hierarquia da navegação, logo centralizado e barra superior | Menu mobile, busca, carrinho React |
| `sections/footer.tpl`, `static/css/ducks-footer.css` | `Footer` + CSS | Organização editorial e respiros | Conteúdo editável sem referências à Ducks |
| `sections/slideshow.tpl`, `blocks/slide.tpl` | `HeroSlider` | Hero de grandes proporções e controles | Carrossel com slides configuráveis |
| `sections/featured-categories.tpl`, `sections/banners.tpl` | `HomeSections` | Grades de duas/três entradas e banners | Editor limitado de URL, títulos, imagens e links |
| `sections/product-list.tpl`, `blocks/products.tpl` | `ProductCard`, `ProductGrid` | Cards 4:5, grid, hover discreto | React/Next e dados Supabase |
| `sections/main-products-grid.tpl`, `static/css/ducks-catalog.css` | `Listing` | Colunas, filtros lateral, toolbar, tipografia | Filtros reais de preço e categoria sem formulários da Nuvemshop |
| `sections/main-product.tpl`, `static/css/ducks-product.css` | `ProductActions`, página produto | Galeria, card, seleção e espaçamento | Variantes/estoque e botão de carrinho próprios |
| `sections/cart-drawer.tpl`, `static/js/store.js` | `cart-context`, `/carrinho`, `/api/solicitacoes` | Conceito de carrinho com itens e subtotal | Validação no servidor, solicitações e WhatsApp |
| `static/js/ducks-catalog.js`, `ducks-product.js` | Componentes React | Ideias de interação úteis | Sem JS/CSS nativos da plataforma |
| `static/css/ducks-service-pages.css` | `/admin` | Somente referência de layout limpo | Login e módulos administrativos novos |
| `.nuvem`, `manifest.json`, integrações Nuvemshop | *Sem migração* | Nada | Tudo independente |

**Aproveitamento prioritário:** reaproveitar a arquitetura de seções e componentes do tema com CSS próprio e o esquema de dados novo, sem copiar banners e mídias e sem depender de endpoints da Nuvemshop.
