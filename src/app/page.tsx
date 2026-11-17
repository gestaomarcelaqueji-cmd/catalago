import {Header,Footer} from '@/components/store-shell';import{HomeSections}from '@/components/home-sections';import{storeData,publicProducts}from '@/lib/catalog';
export const dynamic='force-dynamic';
export default async function Home(){const[{settings,categories,sections},products]=await Promise.all([storeData(),publicProducts(24)]);return <><Header settings={settings} categories={categories}/><main><HomeSections sections={sections} products={products} categories={categories}/></main><Footer settings={settings} categories={categories}/></>}
