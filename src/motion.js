/* Behaviour for the field report: word-rise headline, the check machine,
   receipts toggle, project steps and the contact card. No dependencies. */

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const calm = () => reduce.matches;
const live = document.getElementById('live');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const restart = (el, cls) => {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
};

/* Headline: every word rises from behind its own baseline. */
function splitHeadline() {
  const h1 = document.querySelector('h1');
  if (!h1 || h1.dataset.split === 'true') return Promise.resolve();

  if (calm()) {
    document.getElementById('top')?.classList.add('ready');
    return Promise.resolve();
  }

  const text = h1.textContent.trim().replace(/\s+/g, ' ');
  h1.setAttribute('aria-label', text);

  const frag = document.createDocumentFragment();
  text.split(' ').forEach((word, index) => {
    const outer = document.createElement('span');
    outer.className = 'w';
    outer.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span');
    inner.style.setProperty('--i', String(index));
    inner.textContent = word;
    outer.append(inner);
    frag.append(outer, document.createTextNode(' '));
  });

  h1.replaceChildren(frag);
  h1.dataset.split = 'true';
  h1.classList.add('split');
  requestAnimationFrame(() => requestAnimationFrame(() => h1.classList.add('in')));

  return wait(650).then(() => {
    document.getElementById('top')?.classList.add('ready');
    return wait(700);
  });
}

/* Receipts: every result can reveal its evidence link. */
function initReceipts() {
  document.querySelectorAll('.res').forEach((node, index) => {
    node.style.setProperty('--r', String(index % 3));
  });

  const toggle = document.getElementById('rcptToggle');
  if (!toggle) return;
  const label = toggle.querySelector('.lbl');
  toggle.addEventListener('click', () => {
    const on = toggle.getAttribute('aria-pressed') !== 'true';
    toggle.setAttribute('aria-pressed', String(on));
    toggle.setAttribute('aria-label', on ? 'Hide receipts' : 'Show receipts');
    if (label) label.textContent = on ? 'Hide receipts' : 'Show receipts';
    document.body.classList.toggle('receipts', on);
    if (live) {
      live.textContent = on
        ? 'Receipts shown. Each result now links to its evidence.'
        : 'Receipts hidden.';
    }
  });
}

/* Project steps draw in sequence when they reach the middle of the screen. */
function initSteps() {
  const lists = document.querySelectorAll('.steps');
  lists.forEach((list) => {
    list.querySelectorAll('li').forEach((li, index) => {
      li.style.setProperty('--s', String(index));
    });
  });

  if ('IntersectionObserver' in window && !calm()) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('drawn');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -25% 0px', threshold: 0.4 },
    );
    lists.forEach((list) => observer.observe(list));
  } else {
    lists.forEach((list) => list.classList.add('drawn'));
  }
}

/* Contact card: eased tilt and a light that follows the pointer. */
function initCard() {
  const card = document.getElementById('idcard');
  if (!card) return;
  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;
  let raf = null;

  const tick = () => {
    cx += (tx - cx) * 0.12;
    cy += (ty - cy) * 0.12;
    card.style.setProperty('--ry', `${cx * 16}deg`);
    card.style.setProperty('--rx', `${-cy * 16}deg`);
    raf = Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001 ? requestAnimationFrame(tick) : null;
  };

  card.addEventListener('pointermove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    card.style.setProperty('--mx', `${x * 100}%`);
    card.style.setProperty('--my', `${y * 100}%`);
    if (calm()) return;
    tx = x - 0.5;
    ty = y - 0.5;
    if (!raf) raf = requestAnimationFrame(tick);
  });

  card.addEventListener('pointerleave', () => {
    tx = 0;
    ty = 0;
    if (!raf && !calm()) raf = requestAnimationFrame(tick);
  });
}

function init() {
  initReceipts();
  initSteps();
  initCard();
  splitHeadline();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
