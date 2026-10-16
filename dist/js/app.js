import {products,market} from './products.js';
import {translate,localeInfo} from './i18n.js';
import {paths,routeFor,parseRoute} from './routes.js';
import {assetUrl,stripBase,siteUrl} from './site.js';
import {sanitizeCart,unitPrice,addItem,updateQuantity,cartTotals,validateCheckout} from './commerce.js';
import {escapeHtml as e,icon} from './ui.js';
import {renderHome,renderShop,renderProduct,renderCart,renderCheckout,renderSuccess,renderInstitutional,productCard,summary} from './views.js';

const CART_KEY='floreva.cart.v1', LOCALE_KEY='floreva.locale';
let cart=[],route=parseRoute(location.pathname),productSize='classic',productQuantity=1,productMessage='',toastTimer;
const app=document.getElementById('app');
function storageRead(key){try{return localStorage.getItem(key);}catch{return null;}}
try {cart=sanitizeCart(storageRead(CART_KEY),products);} catch {cart=[];}
if(stripBase(location.pathname)==='/') {
  const saved=storageRead(LOCALE_KEY);
  const locale=Object.hasOwn(paths,saved)?saved:'pt-br';
  history.replaceState({},'',routeFor(locale));route=parseRoute(location.pathname);
}
function t(key,vars={}) {return e(translate(route.locale,key,vars));}
function url(key,id=''){return routeFor(route.locale,key,id);}
function money(cents){return new Intl.NumberFormat(localeInfo[route.locale].locale,{style:'currency',currency:market.currency}).format(cents/100);}
function context(){return {locale:route.locale,t,url,money,cart,header};}
function persistCart(){
  // ASVS 14.3.3: persist only product choices; gift notes and personal details stay in memory.
  try {localStorage.setItem(CART_KEY,JSON.stringify(cart.map(({id,size,quantity,variant})=>({id,size,quantity,variant}))));}
  catch {showToast(translate(route.locale,'common.storageError'));}
}
function header(){
  const count=cartTotals(cart,products).count;
  return `<header class="site-header"><button class="icon-button mobile-toggle" aria-label="${t('nav.menu')}" aria-expanded="false" aria-controls="mobile-menu" id="menu-toggle">${icon('menu')}</button><nav class="nav-left" aria-label="${t('nav.menu')}"><a href="${url('shop')}">${t('nav.shop')}</a><a href="${url('home')}#occasions">${t('nav.occasions')}</a><a href="${url('story')}">${t('nav.story')}</a></nav><a class="wordmark" href="${url('home')}" aria-label="Floricultura · ${t('common.home')}">${icon('flower')}<span>Floricultura</span></a><div class="nav-right"><select class="locale-select" id="locale-select" aria-label="${t('nav.language')}">${Object.keys(localeInfo).map(l=>`<option value="${l}" ${l===route.locale?'selected':''} lang="${localeInfo[l].lang}" title="${localeInfo[l].label}">${l==='pt-br'?'PT':l.toUpperCase()}</option>`).join('')}</select><a class="icon-button search-link" href="${url('shop')}?search=" aria-label="${t('nav.search')}">${icon('search')}</a><a class="icon-button cart-link" href="${url('cart')}" aria-label="${t('nav.cart')} (${count})">${icon('bag')}<span class="cart-label">${t('nav.cart')}</span><span class="cart-count" aria-hidden="true">${count}</span></a></div><nav class="mobile-menu" id="mobile-menu" hidden aria-label="${t('nav.menu')}">${['shop','story','contact','faq'].map(k=>`<a href="${url(k)}">${t(`nav.${k}`)}</a>`).join('')}<a href="${url('home')}#occasions">${t('nav.occasions')}</a></nav></header>`;
}
function footer(){return `<footer class="site-footer"><div class="footer-main"><div class="footer-brand"><a class="wordmark" href="${url('home')}">${icon('flower')}Floricultura</a><p>${t('footer.tagline')}</p></div><div class="footer-col"><h3>${t('footer.explore')}</h3><a href="${url('shop')}">${t('nav.shop')}</a><a href="${url('shop')}?category=bouquets">${t('category.bouquets')}</a><a href="${url('shop')}?category=arrangements">${t('category.arrangements')}</a><a href="${url('shop')}?category=gifts">${t('category.gifts')}</a><a href="${url('story')}">${t('nav.story')}</a></div><div class="footer-col"><h3>${t('footer.help')}</h3><a href="${url('contact')}">${t('nav.contact')}</a><a href="${url('faq')}">${t('nav.faq')}</a><a href="${url('policies')}">${t('footer.deliveries')}</a><a href="${url('privacy')}">${t('footer.privacy')}</a><a href="${url('terms')}">${t('footer.terms')}</a></div></div><p class="footer-credit">${t('footer.credit')} <a href="https://github.com/soladoporpatri-spec" target="_blank" rel="noopener noreferrer" aria-label="GitHub · Patricio Paulo">GitHub ${icon('arrow')}</a></p><div class="footer-bottom"><p>© ${new Intl.DateTimeFormat(localeInfo[route.locale].locale,{year:'numeric',timeZone:'America/Sao_Paulo'}).format(new Date())} Floricultura. ${t('footer.rights')}</p><p>BRL</p></div></footer>`;}
function updateMetadata(){
  document.documentElement.lang=localeInfo[route.locale].lang;
  const p=products.find(p=>p.id===route.id);
  const titleKey={home:'seo.homeTitle',shop:'shop.title',cart:'cart.title',checkout:'checkout.title',story:'story.title',contact:'contact.title',faq:'faq.title',policies:'policies.title',privacy:'privacy.title',terms:'terms.title',notFound:'notFound.title'}[route.key]||'notFound.title';
  const title=route.key==='product'&&p?`${p.name} | Floricultura`:translate(route.locale,titleKey)+(route.key==='home'?'':' | Floricultura');
  const description=route.key==='product'&&p?p.description[route.locale]:translate(route.locale,route.key==='home'?'seo.homeDescription':route.key==='shop'?'seo.shopDescription':'seo.defaultDescription');
  document.title=title;
  document.querySelector('meta[name="description"]')?.setAttribute('content',description);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content',title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content',description);
  document.querySelector('meta[property="og:locale"]')?.setAttribute('content',localeInfo[route.locale].locale.replace('-','_'));
  const origin=document.querySelector('meta[name="site-origin"]')?.content||location.origin;
  const canonical=origin+routeFor(route.locale,route.key,route.id);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href',canonical);
  document.querySelector('meta[property="og:url"]')?.setAttribute('content',canonical);
  const shareImage=origin+assetUrl(route.key==='product'&&p?p.image:'/assets/hero.webp');
  document.querySelector('meta[property="og:type"]')?.setAttribute('content',route.key==='product'&&p?'product':'website');
  document.querySelector('meta[property="og:image"]')?.setAttribute('content',shareImage);
  for(const [key,value] of Object.entries({title,description,image:shareImage}))document.querySelector(`meta[name="twitter:${key}"]`)?.setAttribute('content',value);
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link=>{const l=link.hreflang==='x-default'?'pt-br':Object.keys(localeInfo).find(k=>localeInfo[k].lang===link.hreflang);if(l)link.href=origin+routeFor(l,route.key,route.id);});
  const structured=document.querySelector('script[type="application/ld+json"]');
  document.querySelectorAll('script[type="application/ld+json"]').forEach((script,index)=>{if(index>0)script.remove();});
  if(structured)structured.textContent=JSON.stringify(route.key==='product'&&p?{'@context':'https://schema.org','@type':'Product',name:p.name,description:p.description[route.locale],image:origin+assetUrl(p.image),sku:p.id,brand:{'@type':'Brand',name:'Floricultura'}}:{'@context':'https://schema.org','@type':'Organization',name:'Floricultura',url:siteUrl});
}
function render({focus=false,success=false,delivery='pickup'}={}){
  try {
    const c=context();
    let content;
    if(success)content=renderSuccess(c,delivery);
    else if(route.key==='home')content=renderHome(c);
    else if(route.key==='shop')content=renderShop(c);
    else if(route.key==='product'){
      const p=products.find(p=>p.id===route.id);
      content=p?renderProduct(p,c,productSize,productQuantity):renderInstitutional('notFound',c);
    }else if(route.key==='cart')content=renderCart(c);
    else if(route.key==='checkout')content=renderCheckout(c);
    else content=renderInstitutional(route.key,c);
    app.innerHTML=`<a href="#main-content" class="skip-link">${t('common.skip')}</a><div class="site-announcement">${t('common.demoShort')}</div>${route.key==='home'&&!success?'':`<div class="header-wrap">${header()}</div>`}<main id="main-content">${content}</main>${footer()}<div id="toast" class="toast" role="status" aria-live="polite"></div>`;
    updateMetadata();
    if(route.key==='shop'){hydrateFilters();updateCatalog();}
    if(route.key==='product'&&document.getElementById('gift-message')){document.getElementById('gift-message').value=productMessage;document.getElementById('message-count').textContent=`${productMessage.length} / 180`;}
    if(focus){const heading=app.querySelector('main h1');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});}
    if(location.hash){requestAnimationFrame(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView());}
  } catch(error){
    console.error('Floricultura render failed',error);
    app.innerHTML=`<main class="error-boundary"><h1>${t('common.error')}</h1><p><a href="${url('home')}" class="button">${t('common.retry')}</a></p></main>`;
  }
}
function navigate(href,{replace=false}={}){
  const next=new URL(href,location.origin);
  const nextRoute=parseRoute(next.pathname);
  if(nextRoute.id!==route.id||nextRoute.key!==route.key){productSize='classic';productQuantity=1;productMessage='';}
  if(replace)history.replaceState({},'',next.pathname+next.search+next.hash);else history.pushState({},'',next.pathname+next.search+next.hash);
  route=nextRoute;
  try{localStorage.setItem(LOCALE_KEY,route.locale);}catch{/* Language remains usable without storage. */}
  render({focus:true});if(!next.hash)window.scrollTo({top:0,behavior:'instant'});
}
function showToast(message){
  const el=document.getElementById('toast');if(!el)return;
  clearTimeout(toastTimer);el.innerHTML=icon('check');el.append(document.createTextNode(message));el.classList.add('visible');
  toastTimer=setTimeout(()=>el.classList.remove('visible'),3500);
}
function refreshCartCount(){
  const count=cartTotals(cart,products).count;
  document.querySelectorAll('.cart-count').forEach(el=>el.textContent=String(count));
  document.querySelectorAll('.cart-link').forEach(el=>el.setAttribute('aria-label',`${translate(route.locale,'nav.cart')} (${count})`));
}
function addToCart(id,detailed=false){
  const size=detailed?productSize:'classic',message=detailed?productMessage:'';
  const existing=cart.find(item=>item.id===id&&item.size===size&&item.message===message);
  const variant=existing?.variant||crypto.randomUUID();
  cart=addItem(cart,{id,size,variant,quantity:detailed?productQuantity:1,message},products);
  persistCart();refreshCartCount();showToast(translate(route.locale,'product.added'));
}
function hydrateFilters(){
  const q=new URLSearchParams(location.search);
  const input=document.getElementById('catalog-search');if(input)input.value=(q.get('search')||'').slice(0,100);
  document.querySelectorAll('[data-filter]').forEach(el=>{if([...el.options].some(o=>o.value===q.get(el.name)))el.value=q.get(el.name);});
  const sort=document.getElementById('sort');if(sort&&[...sort.options].some(o=>o.value===q.get('sort')))sort.value=q.get('sort');
}
const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
function updateCatalog(syncUrl=false){
  const target=document.getElementById('shop-results');if(!target)return;
  const query=document.getElementById('catalog-search').value;
  const filters=Object.fromEntries([...document.querySelectorAll('[data-filter]')].map(el=>[el.name,el.value]));
  const sort=document.getElementById('sort').value;
  const result=products.filter(p=>(!query||normalize(`${p.name} ${p.description[route.locale]} ${p.composition[route.locale]}`).includes(normalize(query)))&&(!filters.category||p.category===filters.category)&&(!filters.color||p.color===filters.color)&&(!filters.occasion||p.occasions.includes(filters.occasion))&&(!filters.price||(filters.price==='low'?p.price<20000:filters.price==='mid'?p.price>=20000&&p.price<30000:p.price>=30000))).sort((a,b)=>sort==='priceAsc'?a.price-b.price:sort==='priceDesc'?b.price-a.price:sort==='newest'?b.created-a.created:a.featured-b.featured);
  target.innerHTML=`<p class="results-count">${t(result.length===1?'shop.result':'shop.results',{count:result.length})}</p>${result.length?`<div class="product-grid">${result.map(p=>productCard(p,context())).join('')}</div>`:`<div class="empty-state">${icon('flower')}<h2>${t('shop.empty')}</h2><p><button class="button outline" data-reset-filters>${t('shop.reset')}</button></p></div>`}`;
  if(syncUrl){const q=new URLSearchParams();if(query)q.set('search',query);for(const [key,value]of Object.entries(filters))if(value)q.set(key,value);if(sort!=='featured')q.set('sort',sort);history.replaceState({},'',location.pathname+(q.size?'?'+q.toString():''));}
}
function setCartQuantity(index,value){
  const active=document.activeElement;
  const focusAttribute=['data-quantity-minus','data-quantity-plus','data-quantity','data-remove'].find(key=>active?.hasAttribute(key));
  cart=updateQuantity(cart,index,value,products);persistCart();render();
  if(focusAttribute){const next=document.querySelector(`[${focusAttribute}="${Math.min(index,cart.length-1)}"]`);if(next)next.focus({preventScroll:true});else document.querySelector('main h1')?.focus();}
}
function showErrors(form,errors){
  form.querySelectorAll('.field-error').forEach(el=>el.textContent='');
  form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
  form.querySelectorAll('.invalid').forEach(el=>el.classList.remove('invalid'));
  for(const[name,key]of Object.entries(errors)){
    const input=form.elements.namedItem(name);const message=form.querySelector(`#error-${name}`);
    if(message)message.textContent=translate(route.locale,`validation.${key}`);
    input?.setAttribute('aria-invalid','true');input?.closest('.field')?.classList.add('invalid');
  }
  form.querySelector('[aria-invalid="true"]')?.focus();
}
app.addEventListener('click',event=>{
  const target=event.target.closest('button,a');if(!target)return;
  if(target.matches('a[href]')){
    const href=new URL(target.href,location.origin);
    if(href.origin===location.origin&&!target.hasAttribute('download')&&!target.target&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&event.button===0){
      if(href.pathname===location.pathname&&href.search===location.search&&href.hash){const menu=document.getElementById('mobile-menu');if(menu)menu.hidden=true;document.getElementById('menu-toggle')?.setAttribute('aria-expanded','false');document.getElementById(href.hash.slice(1))?.scrollIntoView();return;}
      event.preventDefault();navigate(href.href);
    }return;
  }
  if(target.id==='menu-toggle'){
    const open=target.getAttribute('aria-expanded')==='true';target.setAttribute('aria-expanded',String(!open));target.setAttribute('aria-label',translate(route.locale,open?'nav.menu':'nav.close'));document.getElementById('mobile-menu').hidden=open;return;
  }
  if(target.hasAttribute('data-add'))return addToCart(target.dataset.add);
  if(target.hasAttribute('data-add-product'))return addToCart(target.dataset.addProduct,true);
  if(target.hasAttribute('data-size')){
    productSize=target.dataset.size;document.querySelectorAll('[data-size]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.size===productSize)));
    document.getElementById('product-price').textContent=money(unitPrice(products.find(p=>p.id===route.id),productSize));return;
  }
  if(target.hasAttribute('data-quantity-minus')||target.hasAttribute('data-quantity-plus')){
    const id=target.dataset.quantityMinus??target.dataset.quantityPlus;const delta=target.hasAttribute('data-quantity-plus')?1:-1;
    if(id==='product'){productQuantity=Math.min(20,Math.max(1,productQuantity+delta));document.querySelector('[data-quantity="product"]').value=productQuantity;}
    else{const index=Number(id);setCartQuantity(index,(cart[index]?.quantity||0)+delta);}return;
  }
  if(target.hasAttribute('data-remove'))return setCartQuantity(Number(target.dataset.remove),0);
  if(target.hasAttribute('data-reset-filters')){document.querySelectorAll('[data-filter]').forEach(el=>el.value='');document.getElementById('catalog-search').value='';document.getElementById('sort').value='featured';updateCatalog(true);return;}
  if(target.hasAttribute('data-gallery')){document.getElementById('gallery-dialog')?.showModal();return;}
  if(target.hasAttribute('data-close-gallery'))document.getElementById('gallery-dialog')?.close();
});
app.addEventListener('input',event=>{
  if(event.target.id==='catalog-search')updateCatalog(true);
  if(event.target.id==='gift-message'){productMessage=event.target.value.slice(0,180);document.getElementById('message-count').textContent=`${productMessage.length} / 180`;}
});
app.addEventListener('change',event=>{
  const el=event.target;
  if(el.id==='locale-select'){navigate(routeFor(el.value,route.key,route.id)+location.search+location.hash);return;}
  if(el.matches('[data-filter],#sort')){updateCatalog(true);return;}
  if(el.matches('[data-quantity]')){
    if(el.dataset.quantity==='product'){productQuantity=Math.min(20,Math.max(1,Math.floor(Number(el.value)||1)));el.value=productQuantity;}
    else setCartQuantity(Number(el.dataset.quantity),el.value);return;
  }
  if(el.name==='delivery'){
    const isLocal=el.value==='local';document.getElementById('delivery-fields').hidden=!isLocal;
    document.querySelectorAll('#delivery-fields input').forEach(input=>input.required=isLocal);
    document.getElementById('checkout-summary').innerHTML=summary(context(),el.value,true);
  }
});
app.addEventListener('submit',event=>{
  event.preventDefault();const form=event.target;const values=Object.fromEntries(new FormData(form));
  if(form.id==='checkout-form'){
    const errors=validateCheckout(values);if(!values.consent)errors.consent='consent';
    showErrors(form,errors);if(Object.keys(errors).length)return;
    render({success:true,focus:true,delivery:values.delivery});window.scrollTo({top:0,behavior:'instant'});
  }
  if(form.id==='contact-form'){
    const errors={};if(!values.name.trim())errors.name='required';if(!values.email.trim())errors.email='required';else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))errors.email='email';if(!values.message.trim())errors.message='required';
    showErrors(form,errors);if(Object.keys(errors).length)return;
    const preview=document.getElementById('contact-success');
    document.getElementById('contact-preview').textContent=[values.name,values.email,values.subject,values.message].filter(Boolean).join('\n\n');
    preview.hidden=false;preview.focus();
  }
});
app.addEventListener('error',event=>{
  if(event.target.tagName==='IMG'&&!event.target.src.endsWith('/assets/fallback.svg')){event.target.classList.add('image-failed');event.target.alt=translate(route.locale,'common.imageError');event.target.src=assetUrl('/assets/fallback.svg');}
},true);
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){const menu=document.getElementById('mobile-menu');if(menu&&!menu.hidden){menu.hidden=true;const button=document.getElementById('menu-toggle');button.setAttribute('aria-expanded','false');button.focus();}}
});
window.addEventListener('popstate',()=>{route=parseRoute(location.pathname);productSize='classic';productQuantity=1;productMessage='';render({focus:true});});
window.addEventListener('storage',event=>{
  if(event.key!==CART_KEY)return;
  cart=sanitizeCart(event.newValue,products);
  if(route.key==='cart'||(route.key==='checkout'&&!cart.length))render();
  else if(route.key==='checkout'){const delivery=document.querySelector('[name="delivery"]:checked')?.value||document.getElementById('checkout-summary')?.dataset.delivery||'pickup';document.getElementById('checkout-summary').innerHTML=summary(context(),delivery,true);refreshCartCount();}
  else refreshCartCount();
  showToast(translate(route.locale,'common.storageSync'));
});
render();
