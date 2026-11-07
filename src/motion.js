const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;

const progress = document.querySelector('[data-progress]');
const header = document.querySelector('[data-header]');

function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  if (progress) progress.style.transform = `scaleX(${ratio})`;
  if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
}

let frame = 0;
function scheduleScroll() {
  if (frame) return;
  frame = window.requestAnimationFrame(() => {
    frame = 0;
    onScroll();
    updateParallax();
  });
}

const parallaxItems = [...document.querySelectorAll('[data-parallax]')].map((figure) => ({
  figure,
  image: figure.querySelector('img'),
}));

function updateParallax() {
  if (reduceMotion.matches) return;
  const middle = window.innerHeight / 2;
  for (const { figure, image } of parallaxItems) {
    if (!image) continue;
    const rect = figure.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
    const distance = (rect.top + rect.height / 2 - middle) / window.innerHeight;
    const shift = Math.max(-14, Math.min(14, distance * -22));
    image.style.setProperty('--shift', `${shift.toFixed(2)}px`);
  }
}

function startMotion() {
  if (reduceMotion.matches || typeof IntersectionObserver !== 'function') return;

  const targets = [...document.querySelectorAll('[data-reveal]')];
  if (!targets.length) return;

  // Stagger siblings so a group reads as one drawn sequence, not scattered fades.
  const groups = new Map();
  for (const element of targets) {
    const parent = element.parentElement;
    if (!parent) continue;
    const index = groups.get(parent) ?? 0;
    element.style.setProperty('--stagger', String(Math.min(index, 5)));
    groups.set(parent, index + 1);
  }

  root.classList.add('js-motion');

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  for (const element of targets) observer.observe(element);

  // Any element already on screen is marked immediately so the first viewport never waits.
  window.requestAnimationFrame(() => {
    for (const element of targets) {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        element.classList.add('is-in');
        observer.unobserve(element);
      }
    }
  });
}

onScroll();
updateParallax();
startMotion();

reduceMotion.addEventListener?.('change', () => {
  if (reduceMotion.matches) {
    root.classList.remove('js-motion');
    for (const element of document.querySelectorAll('[data-reveal]')) element.classList.add('is-in');
  } else {
    startMotion();
  }
});

window.addEventListener('scroll', scheduleScroll, { passive: true });
window.addEventListener('resize', scheduleScroll, { passive: true });
window.addEventListener('load', scheduleScroll, { once: true });
