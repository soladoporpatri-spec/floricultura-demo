import test from 'node:test';
import assert from 'node:assert/strict';
import {translate,localeInfo} from '../dist/js/i18n.js';
import {products} from '../dist/js/products.js';
import {routeFor} from '../dist/js/routes.js';
import {escapeHtml} from '../dist/js/ui.js';
import {renderHome,renderProduct,renderCart,renderCheckout,renderSuccess,renderInstitutional} from '../dist/js/views.js';

function context(locale) {
  return {locale,cart:[{id:products[0].id,size:'classic',quantity:1,message:'<script>gift</script>'}],
    t:(key,vars)=>escapeHtml(translate(locale,key,vars)),url:(key,id)=>routeFor(locale,key,id),
    money:value=>new Intl.NumberFormat(localeInfo[locale].locale,{style:'currency',currency:'BRL'}).format(value/100),header:()=>''};
}

test('store sections use shopping copy without repeated demonstration notices in all languages',()=>{
  for(const locale of Object.keys(localeInfo)) {
    const c=context(locale);
    const sections=[renderHome(c),renderProduct(products[0],c),renderCart(c),renderCheckout(c),
      ...['story','faq','policies','privacy','terms','contact'].map(key=>renderInstitutional(key,c))];
    for(const html of sections) {
      assert.doesNotMatch(html,/demo-notice|footer-demo/i);
      assert.doesNotMatch(html.replace(/<[^>]*>/g,''),/\b(?:demo|demonstrativ\w*|demonstration|simulação|simulaci[oó]n)\b/i);
      assert.doesNotMatch(html,/<script>gift<\/script>/);
    }
    assert.ok(translate(locale,'common.demoShort').length>30);
  }
});

test('gift review includes the selected delivery total and a route back to the preserved bag',()=>{
  for(const locale of Object.keys(localeInfo)) {
    const c=context(locale);
    const local=renderSuccess(c,'local');
    const pickup=renderSuccess(c,'pickup');
    assert.ok(local.includes(c.money(27400)));
    assert.ok(pickup.includes(c.money(24900)));
    assert.ok(local.includes(c.url('cart')));
    assert.ok(local.includes(escapeHtml(translate(locale,'checkout.successText'))));
    assert.equal(c.cart.length,1);
  }
});

test('contact review has an accessible preview without an external form destination',()=>{
  for(const locale of Object.keys(localeInfo)) {
    const html=renderInstitutional('contact',context(locale));
    assert.match(html,/id="contact-success" role="status" tabindex="-1" hidden/);
    assert.match(html,/id="contact-preview"/);
    assert.doesNotMatch(html,/<form[^>]*\saction=/);
    assert.ok(html.includes(escapeHtml(translate(locale,'contact.success'))));
  }
});
