'use client';
import {createContext,useContext,useEffect,useState} from 'react';
import type {CartItem} from '@/lib/models';
type Context={items:CartItem[];count:number;add:(item:CartItem)=>void;setQuantity:(id:string,n:number)=>void;remove:(id:string)=>void;clear:()=>void};
const CartContext=createContext<Context|null>(null);
const KEY='loja_independente_cart_v1';
export function CartProvider({children}:{children:React.ReactNode}){
 const [items,setItems]=useState<CartItem[]>([]);const [loaded,setLoaded]=useState(false);
 useEffect(()=>{try{const raw=localStorage.getItem(KEY);if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed))setItems(parsed.filter(x=>typeof x.variantId==='string'&&Number.isInteger(x.quantity)&&x.quantity>0).slice(0,30))}}catch{}setLoaded(true)},[]);
 useEffect(()=>{if(loaded)localStorage.setItem(KEY,JSON.stringify(items))},[items,loaded]);
 const add=(item:CartItem)=>setItems(p=>{const has=p.find(x=>x.variantId===item.variantId);return has?p.map(x=>x.variantId===item.variantId?{...x,quantity:Math.min(20,x.quantity+item.quantity)}:x):[...p,item].slice(0,30)});
 const setQuantity=(id:string,n:number)=>setItems(p=>p.map(x=>x.variantId===id?{...x,quantity:Math.max(1,Math.min(20,n))}:x));
 const remove=(id:string)=>setItems(p=>p.filter(x=>x.variantId!==id));
 return <CartContext.Provider value={{items,count:items.reduce((n,x)=>n+x.quantity,0),add,setQuantity,remove,clear:()=>setItems([])}}>{children}</CartContext.Provider>
}
export function useCart(){const x=useContext(CartContext);if(!x)throw new Error('CartProvider ausente');return x}
