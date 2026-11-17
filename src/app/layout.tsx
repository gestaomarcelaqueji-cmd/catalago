import type { Metadata } from 'next';
import './globals.css';
import {CartProvider} from '@/components/cart-context';
export const metadata:Metadata={title:{default:'Nova Loja',template:'%s | Nova Loja'},description:'Catálogo de produtos e atendimento via WhatsApp'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><CartProvider>{children}</CartProvider></body></html>}
