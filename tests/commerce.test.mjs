import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeCart, unitPrice, cartTotals, addItem, updateQuantity, validateCheckout,
} from '../dist/js/commerce.js';

const products = Object.freeze([
  Object.freeze({ id: 'aurora', price: 18900, available: true }),
  Object.freeze({ id: 'jardim', price: 24900, available: true }),
  Object.freeze({ id: 'odd', price: 101, available: true }),
  Object.freeze({ id: 'threshold', price: 25000, available: true }),
  Object.freeze({ id: 'sold', price: 9900, available: false }),
  Object.freeze({ id: 'negative', price: -100, available: true }),
]);

const customer = Object.freeze({
  name: 'Maria Oliveira', email: 'maria@example.com', phone: '(11) 99999-1234',
  delivery: 'pickup',
});

test('persistência corrompida ou com estrutura incorreta retorna carrinho vazio', () => {
  for (const raw of [null, undefined, '{}', '{bad', 'null', 42, {}, true]) {
    assert.deepEqual(sanitizeCart(raw, products), []);
  }
});

test('restaura JSON e aceita somente produtos disponíveis do catálogo', () => {
  const raw = JSON.stringify([
    { id: 'aurora', size: 'grand', quantity: 2, message: 'Com carinho', price: 1 },
    { id: 'missing', quantity: 1 },
    { id: 'sold', quantity: 1 },
    { id: 'negative', quantity: 1 },
    { id: '__proto__', quantity: 1 },
    null,
  ]);
  assert.deepEqual(sanitizeCart(raw, products), [
    { id: 'aurora', size: 'grand', quantity: 2, message: 'Com carinho' },
  ]);
});

test('normaliza tamanhos, quantidades e mensagens persistidos fora dos limites', () => {
  const raw = [
    { id: 'aurora', size: 'other', quantity: 999, message: 'x'.repeat(300) },
    { id: 'odd', quantity: -2, message: { text: 'injetado' } },
    { id: 'jardim', size: 'grand', quantity: 2.9 },
    { id: 'threshold', quantity: '3', message: 'Olá' },
  ];
  assert.deepEqual(sanitizeCart(raw, products), [
    { id: 'aurora', size: 'classic', quantity: 20, message: 'x'.repeat(240) },
    { id: 'odd', size: 'classic', quantity: 1, message: '' },
    { id: 'jardim', size: 'grand', quantity: 2, message: '' },
    { id: 'threshold', size: 'classic', quantity: 3, message: 'Olá' },
  ]);
});

test('não aceita campos herdados nem copia propriedades de poluição de protótipo', () => {
  const inherited = Object.create({ id: 'aurora', quantity: 1 });
  const pollution = JSON.parse('{"id":"odd","quantity":1,"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}}');
  assert.deepEqual(sanitizeCart([inherited, pollution], products), [
    { id: 'odd', size: 'classic', quantity: 1, message: '' },
  ]);
  assert.equal({}.polluted, undefined);
});

test('restaurar linhas duplicadas preserva o limite da variante', () => {
  assert.deepEqual(sanitizeCart([
    { id: 'aurora', size: 'classic', quantity: 15, message: 'Olá' },
    { id: 'aurora', size: 'classic', quantity: 15, message: 'Olá' },
  ], products), [{ id: 'aurora', size: 'classic', quantity: 20, message: 'Olá' }]);
});

test('identidades opacas preservam quantidades ao restaurar variantes sem bilhetes', () => {
  const cart = [
    { id: 'aurora', size: 'classic', quantity: 15, message: 'Para Maria', variant: 'variant-a' },
    { id: 'aurora', size: 'classic', quantity: 15, message: 'Para Joana', variant: 'variant-b' },
  ];
  const snapshot = JSON.stringify(cart.map(({ id, size, quantity, variant }) => ({ id, size, quantity, variant })));
  assert.equal(snapshot.includes('Maria'), false);
  assert.equal(snapshot.includes('Joana'), false);
  assert.deepEqual(sanitizeCart(snapshot, products), [
    { id: 'aurora', size: 'classic', quantity: 15, message: '', variant: 'variant-a' },
    { id: 'aurora', size: 'classic', quantity: 15, message: '', variant: 'variant-b' },
  ]);
  assert.deepEqual(cartTotals(sanitizeCart(snapshot, products), products), {
    subtotal: 567000, shipping: 0, total: 567000, count: 30,
  });
  assert.deepEqual(cartTotals(cart, products), {
    subtotal: 567000, shipping: 0, total: 567000, count: 30,
  });
});

test('variant aceita somente a estrutura opaca prevista e conserva compatibilidade', () => {
  const base = { id: 'aurora', size: 'classic', quantity: 1, message: '' };
  for (const variant of ['', 'a'.repeat(51), 'opaque_id', 'opaque\n', '<script>', '__proto__', 42, {}]) {
    assert.deepEqual(sanitizeCart([{ ...base, variant }], products), [base]);
  }
  assert.deepEqual(sanitizeCart([{ ...base, variant: 'Az09-a' }], products), [{ ...base, variant: 'Az09-a' }]);
  assert.deepEqual(sanitizeCart([{ ...base, id: 'missing', variant: 'valid' }], products), []);
});

test('mesma identidade opaca une linhas e continua separada por produto e tamanho', () => {
  const cart = [
    { id: 'aurora', size: 'classic', quantity: 5, message: 'Original', variant: 'same-id' },
    { id: 'aurora', size: 'classic', quantity: 2, variant: 'same-id' },
    { id: 'aurora', size: 'grand', quantity: 1, variant: 'same-id' },
    { id: 'odd', size: 'classic', quantity: 1, variant: 'same-id' },
  ];
  assert.deepEqual(sanitizeCart(cart, products), [
    { id: 'aurora', size: 'classic', quantity: 7, message: 'Original', variant: 'same-id' },
    { id: 'aurora', size: 'grand', quantity: 1, message: '', variant: 'same-id' },
    { id: 'odd', size: 'classic', quantity: 1, message: '', variant: 'same-id' },
  ]);
});

test('preço em centavos arredonda o tamanho grand e ignora preços inválidos', () => {
  assert.equal(unitPrice(products[0], 'classic'), 18900);
  assert.equal(unitPrice(products[2], 'grand'), 152);
  assert.equal(unitPrice(products[0], 'grand'), 28350);
  assert.equal(unitPrice({ price: -1 }, 'classic'), 0);
  assert.equal(unitPrice({ price: 1.2 }, 'grand'), 0);
  assert.equal(unitPrice({ price: '100' }, 'classic'), 0);
  assert.equal(unitPrice(null, 'grand'), 0);
});

test('subtotal usa preços do catálogo, quantidade e tamanho, sem confiar no persistido', () => {
  assert.deepEqual(cartTotals([
    { id: 'aurora', size: 'grand', quantity: 1, price: 1 },
    { id: 'odd', size: 'classic', quantity: 2 },
    { id: 'sold', quantity: 10 },
  ], products, 'local'), {
    subtotal: 28552, shipping: 2500, total: 31052, count: 3,
  });
});

test('retirada e carrinho vazio têm frete zero; entrega local é gratuita desde R$ 500', () => {
  assert.deepEqual(cartTotals([], products, 'local'), { subtotal: 0, shipping: 0, total: 0, count: 0 });
  assert.deepEqual(cartTotals([{ id: 'aurora', quantity: 1 }], products), {
    subtotal: 18900, shipping: 0, total: 18900, count: 1,
  });
  assert.deepEqual(cartTotals([{ id: 'threshold', quantity: 2 }], products, 'local'), {
    subtotal: 50000, shipping: 0, total: 50000, count: 2,
  });
});

test('adicionar une somente linhas com mesmo produto, tamanho e mensagem', () => {
  const start = [{ id: 'aurora', size: 'classic', quantity: 1, message: 'Parabéns' }];
  const merged = addItem(start, { id: 'aurora', size: 'classic', quantity: 2, message: 'Parabéns' }, products);
  assert.deepEqual(merged, [{ id: 'aurora', size: 'classic', quantity: 3, message: 'Parabéns' }]);
  const variant = addItem(merged, { id: 'aurora', size: 'grand', quantity: 1, message: 'Parabéns' }, products);
  const differentMessage = addItem(variant, { id: 'aurora', size: 'classic', quantity: 1, message: 'Obrigada' }, products);
  assert.deepEqual(differentMessage, [
    { id: 'aurora', size: 'classic', quantity: 3, message: 'Parabéns' },
    { id: 'aurora', size: 'grand', quantity: 1, message: 'Parabéns' },
    { id: 'aurora', size: 'classic', quantity: 1, message: 'Obrigada' },
  ]);
  assert.equal(start[0].quantity, 1);
});

test('adicionar limita quantidades acumuladas e recusa produto desconhecido ou indisponível', () => {
  const start = [{ id: 'aurora', size: 'classic', quantity: 19, message: '' }];
  assert.deepEqual(addItem(start, { id: 'aurora', quantity: 5 }, products), [
    { id: 'aurora', size: 'classic', quantity: 20, message: '' },
  ]);
  for (const id of ['missing', 'sold', '__proto__']) {
    assert.deepEqual(addItem([], { id }, products), []);
  }
});

test('alteração de quantidade limita valores, remove zero e preserva o carrinho original', () => {
  const start = [{ id: 'aurora', size: 'classic', quantity: 2, message: 'Olá' }];
  assert.deepEqual(updateQuantity(start, 0, 25, products), [
    { id: 'aurora', size: 'classic', quantity: 20, message: 'Olá' },
  ]);
  assert.deepEqual(updateQuantity(start, 0, 0, products), []);
  assert.deepEqual(updateQuantity(start, 0, -1, products), []);
  assert.deepEqual(updateQuantity(start, -1, 3, products), start);
  assert.deepEqual(updateQuantity(start, 12, 3, products), start);
  assert.deepEqual(updateQuantity(start, 0, 'oops', products), start);
  assert.equal(start[0].quantity, 2);
});

test('retirada válida aceita telefone brasileiro com ou sem código do país', () => {
  assert.deepEqual(validateCheckout(customer), {});
  assert.deepEqual(validateCheckout({ ...customer, phone: '+55 (11) 99999-1234' }), {});
  assert.deepEqual(validateCheckout({ ...customer, phone: '1133334444' }), {});
});

test('checkout exige identificação, email e telefone em ambos os modos', () => {
  assert.deepEqual(validateCheckout({ delivery: 'pickup' }), {
    name: 'required', email: 'required', phone: 'required',
  });
  assert.deepEqual(validateCheckout({ ...customer, name: '   ', email: 'a@', phone: '123' }), {
    name: 'required', email: 'email', phone: 'phone',
  });
});

test('entrega local exige endereço completo e CEP com oito dígitos', () => {
  assert.deepEqual(validateCheckout({ ...customer, delivery: 'local' }), {
    address: 'required', number: 'required', city: 'required', postal: 'required',
  });
  const local = { ...customer, delivery: 'local', address: 'Rua das Flores', number: '20', city: 'São Paulo', postal: '01310-100' };
  assert.deepEqual(validateCheckout(local), {});
  assert.deepEqual(validateCheckout({ ...local, postal: '01310100' }), {});
  assert.deepEqual(validateCheckout({ ...local, postal: '01310-10' }), { postal: 'postal' });
});

test('checkout rejeita email e telefone malformados sem executar coerção de objetos', () => {
  for (const email of ['maria example.com', 'a@@example.com', 'a@host', 'a\n@example.com']) {
    assert.equal(validateCheckout({ ...customer, email }).email, 'email');
  }
  for (const phone of ['telefone11999991234', '11999', '0011999991234']) {
    assert.equal(validateCheckout({ ...customer, phone }).phone, 'phone');
  }
  assert.deepEqual(validateCheckout(Object.create(customer)), {
    name: 'required', email: 'required', phone: 'required',
  });
  assert.equal(validateCheckout({ ...customer, name: { toString() { throw new Error('não executar'); } } }).name, 'required');
});
