export type StoreSettings={id:number;name:string;tagline:string;announcement:string;whatsapp:string;logo_url:string;contact_email:string;instagram_url:string;about_text:string;privacy_text:string;accent_color:string};
export type Category={id:string;name:string;slug:string;description:string;parent_id:string|null;visible:boolean;sort_order:number};
export type Variant={id:string;product_id:string;name:string;sku:string|null;attributes:Record<string,string>;price_cents:number;compare_price_cents:number|null;stock:number;active:boolean};
export type Photo={id:string;product_id:string;url:string;alt:string;sort_order:number};
export type Product={id:string;name:string;slug:string;description:string;status:'draft'|'published'|'archived';featured:boolean;created_at:string;product_variants:Variant[];product_images:Photo[];product_categories?:{category_id:string}[]};
export type HomeSection={id:string;section_key:string;type:string;title:string;enabled:boolean;sort_order:number;config:Record<string,unknown>};
export type CartItem={variantId:string;productId:string;name:string;variant:string;slug:string;image:string;priceCents:number;quantity:number};
export type Quote={id:string;code:string;status:string;total_cents:number;created_at:string;quote_items?:{id:string;product_name:string;variant_name:string;unit_price_cents:number;quantity:number}[]};
export const formatBRL=(cents:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
export const slugify=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,110);
export function getCover(product:Product){return [...(product.product_images||[])].sort((a,b)=>a.sort_order-b.sort_order)[0]?.url||''}
export function getMinPrice(product:Product){const v=(product.product_variants||[]).filter(x=>x.active);return v.length?Math.min(...v.map(x=>x.price_cents)):null}
