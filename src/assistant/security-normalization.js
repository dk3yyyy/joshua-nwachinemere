const INVISIBLE_OR_DIRECTIONAL = /\p{Cf}/gu;
const LATIN_SCRIPT = /\p{Script=Latin}/u;
const CONFUSABLE_SCRIPT = /[\p{Script=Greek}\p{Script=Cyrillic}]/u;

export function normalizeSecurityText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .normalize('NFKC')
    .replace(INVISIBLE_OR_DIRECTIONAL, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasMixedLatinConfusableScripts(value) {
  const normalized = normalizeSecurityText(value);
  return LATIN_SCRIPT.test(normalized) && CONFUSABLE_SCRIPT.test(normalized);
}
