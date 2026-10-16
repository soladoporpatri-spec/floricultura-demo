const MAX_QUANTITY = 20;
const MAX_MESSAGE = 240;
const LOCAL_SHIPPING = 2500;
const FREE_SHIPPING_FROM = 50000;

function ownValue(object, key) {
  if (!object || typeof object !== 'object') return undefined;
  return Object.getOwnPropertyDescriptor(object, key)?.value;
}

function numericQuantity(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function quantityWithinLimits(value) {
  return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(numericQuantity(value) ?? 1)));
}

function catalog(products) {
  // ASVS 15.3.6: IDs são chaves de Map, sem acesso ao protótipo de objetos.
  const result = new Map();
  if (!Array.isArray(products)) return result;
  for (const product of products) {
    const id = ownValue(product, 'id');
    const price = ownValue(product, 'price');
    if (typeof id === 'string' && id && ownValue(product, 'available') === true
      && Number.isSafeInteger(price) && price >= 0
      && Number.isSafeInteger(Math.round(price * 1.5))) result.set(id, product);
  }
  return result;
}

function identity(item) {
  return JSON.stringify([item.id, item.size, item.variant ? 'variant' : 'message', item.variant || item.message]);
}

/** Restaura somente campos previstos. Valores monetários vêm do catálogo. */
export function sanitizeCart(raw, products) {
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { return []; }
  }
  if (!Array.isArray(raw)) return [];
  const available = catalog(products);
  const result = [];
  const variants = new Map();
  for (const row of raw) {
    const id = ownValue(row, 'id');
    if (typeof id !== 'string' || !available.has(id)) continue;
    const message = ownValue(row, 'message');
    // ASVS 1.5.2, 2.2.1 e 15.3.3: estrutura, tipos e limites explícitos.
    const item = {
      id,
      size: ownValue(row, 'size') === 'grand' ? 'grand' : 'classic',
      quantity: quantityWithinLimits(ownValue(row, 'quantity')),
      // ASVS 1.1.2: texto permanece texto; a interface deve usar textContent.
      message: typeof message === 'string' ? message.slice(0, MAX_MESSAGE) : '',
    };
    const variant = ownValue(row, 'variant');
    if (typeof variant === 'string' && /^[a-zA-Z0-9-]{1,50}$/.test(variant)) item.variant = variant;
    const key = identity(item);
    if (variants.has(key)) {
      const existing = result[variants.get(key)];
      existing.quantity = Math.min(MAX_QUANTITY, existing.quantity + item.quantity);
    } else {
      variants.set(key, result.length);
      result.push(item);
    }
  }
  return result;
}

/** Preço unitário em centavos de real. */
export function unitPrice(product, size = 'classic') {
  const price = ownValue(product, 'price');
  if (!Number.isSafeInteger(price) || price < 0) return 0;
  const result = size === 'grand' ? Math.round(price * 1.5) : price;
  return Number.isSafeInteger(result) ? result : 0;
}

export function cartTotals(cart, products, delivery = 'pickup') {
  const available = catalog(products);
  let subtotal = 0;
  let count = 0;
  for (const item of sanitizeCart(cart, products)) {
    subtotal += unitPrice(available.get(item.id), item.size) * item.quantity;
    count += item.quantity;
  }
  const shipping = delivery === 'local' && count > 0 && subtotal < FREE_SHIPPING_FROM
    ? LOCAL_SHIPPING : 0;
  return { subtotal, shipping, total: subtotal + shipping, count };
}

export function addItem(cart, item, products) {
  const current = sanitizeCart(cart, products);
  const incoming = sanitizeCart([item], products);
  return incoming.length ? sanitizeCart([...current, incoming[0]], products) : current;
}

export function updateQuantity(cart, index, quantity, products) {
  const current = sanitizeCart(cart, products);
  const parsed = numericQuantity(quantity);
  if (!Number.isInteger(index) || index < 0 || index >= current.length || parsed === null) return current;
  if (parsed <= 0) return current.filter((_, position) => position !== index);
  current[index].quantity = quantityWithinLimits(parsed);
  return current;
}

function field(values, key) {
  const value = ownValue(values, key);
  return typeof value === 'string' ? value.trim() : '';
}

/** Validação de usabilidade para a demonstração; compras reais exigem servidor. */
export function validateCheckout(values) {
  // ASVS 2.2.1 e 2.2.2: allowlist local; não substitui validação no servidor.
  const errors = {};
  for (const key of ['name', 'email', 'phone']) {
    if (!field(values, key)) errors[key] = 'required';
  }
  const email = field(values, 'email');
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) errors.email = 'email';
  const phone = field(values, 'phone');
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    const national = digits.length >= 12 && digits.startsWith('55') ? digits.slice(2) : digits;
    if (!/^[+\d()\s.-]+$/.test(phone) || !/^[1-9]\d{9,10}$/.test(national)) errors.phone = 'phone';
  }
  if (field(values, 'delivery') === 'local') {
    for (const key of ['address', 'number', 'city', 'postal']) {
      if (!field(values, key)) errors[key] = 'required';
    }
    const postal = field(values, 'postal');
    if (postal && !/^\d{5}-?\d{3}$/.test(postal)) errors.postal = 'postal';
  }
  return errors;
}
