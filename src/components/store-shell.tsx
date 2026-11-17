import Link from 'next/link';
import type {Category,StoreSettings} from '@/lib/models';
import {Instagram,MessageCircle} from '@/components/icons';
import {HeaderNav} from './store-shell-client';
export function Header({settings,categories}:{settings:StoreSettings|null;categories:Category[]}){
 const name=settings?.name||'NOVA LOJA';
 return <><div className="announcement">{settings?.announcement||'Descubra nossa seleção de produtos'}</div><header className="site-header"><div className="header-inner"><HeaderNav categories={categories} name={name} logo={settings?.logo_url||''}/></div></header></>;
}
export function Footer({settings,categories}:{settings:StoreSettings|null;categories:Category[]}){
 return <footer className="footer"><div className="footer-grid content-wrap"><div><div className="footer-title">{settings?.name||'Nova Loja'}</div><p className="footer-note">{settings?.tagline||'Uma seleção feita para você.'}</p></div><div><h4>NAVEGUE</h4><Link href="/catalogo">Todos os produtos</Link>{categories.slice(0,4).map(x=><Link key={x.id} href={'/categoria/'+x.slug}>{x.name}</Link>)}</div><div><h4>INFORMAÇÕES</h4><Link href="/sobre">Sobre nós</Link><Link href="/contato">Contato</Link><Link href="/privacidade">Privacidade</Link></div><div><h4>ATENDIMENTO</h4>{settings?.whatsapp&&<a target="_blank" rel="noopener noreferrer" href={'https://wa.me/'+settings.whatsapp.replace(/\D/g,'')}> <MessageCircle size={16}/> WhatsApp</a>}{settings?.instagram_url&&<a target="_blank" rel="noopener noreferrer" href={settings.instagram_url}><Instagram size={16}/> Instagram</a>}{settings?.contact_email&&<a href={'mailto:'+settings.contact_email}>{settings.contact_email}</a>}</div></div><div className="footer-base content-wrap"><span>© {new Date().getFullYear()} {settings?.name||'Nova Loja'}. Todos os direitos reservados.</span><span>Catálogo com atendimento via WhatsApp</span></div></footer>
}
