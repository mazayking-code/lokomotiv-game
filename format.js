// The simulation stores money in millions of tenge. Presentation uses full tenge.
export function number(value, digits = 0) {
  return Number(value ?? 0).toLocaleString('ru-RU', {maximumFractionDigits: digits});
}

export function money(value) {
  const tenge = Math.round(Number(value ?? 0) * 1_000_000);
  return `${number(Object.is(tenge, -0) ? 0 : tenge)} ₸`;
}

export function signedMoney(value) {
  const tenge = Math.round(Number(value ?? 0) * 1_000_000);
  return `${tenge < 0 ? '−' : '+'}${money(Math.abs(tenge) / 1_000_000)}`;
}
