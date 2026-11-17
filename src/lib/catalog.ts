import { getServerClient } from './supabase-server';
import type {Category,HomeSection,Product,StoreSettings} from './models';
export async function storeData(){
 const db=await getServerClient();
 const [{data:settings},{data:categories},{data:sections}]=await Promise.all([
  db.from('store_settings').select('*').eq('id',1).maybeSingle(),
  db.from('categories').select('*').eq('visible',true).order('sort_order'),
  db.from('home_sections').select('*').eq('enabled',true).order('sort_order')]);
 return {settings:settings as StoreSettings|null,categories:(categories||[]) as Category[],sections:(sections||[]) as HomeSection[]};
}
export async function publicProducts(limit=60):Promise<Product[]>{
 const db=await getServerClient();
 const {data,error}=await db.from('products').select('*,product_variants(*),product_images(*),product_categories(category_id)')
 .eq('status','published').order('created_at',{ascending:false}).limit(limit);
 if(error){console.error('publicProducts',error.message);return []}return (data||[]) as Product[];
}
export async function publicProduct(slug:string):Promise<Product|null>{
 const db=await getServerClient();const {data}=await db.from('products')
 .select('*,product_variants(*),product_images(*),product_categories(category_id)').eq('slug',slug).eq('status','published').maybeSingle();
 return data as Product|null;
}
