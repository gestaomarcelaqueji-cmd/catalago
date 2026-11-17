import{Header,Footer}from '@/components/store-shell';import{Listing}from '@/components/listing';import{storeData,publicProducts}from '@/lib/catalog';
export const dynamic='force-dynamic';export const metadata={title:'Produtos'};
export default async function Catalogo(){const[{settings,categories},products]=await Promise.all([storeData(),publicProducts(200)]);return <><Header settings={settings} categories={categories}/><main><Listing heading="Todos os produtos" initial={products} categories={categories}/></main><Footer settings={settings} categories={categories}/></>}
