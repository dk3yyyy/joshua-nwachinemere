import './styles.css';

const root = document.documentElement;
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('#primary-nav');
const desktop = window.matchMedia('(min-width: 901px)');

function setMenu(open, { restoreFocus = false } = {}) {
  if (!menuButton || !nav) return;
  menuButton.setAttribute('aria-expanded', String(open));
  nav.dataset.open = String(open);
  const visibleLabel = menuButton.querySelector('[aria-hidden="true"]');
  const accessibleLabel = menuButton.querySelector('.sr-only');
  if (visibleLabel) visibleLabel.textContent = open ? 'Close' : 'Menu';
  if (accessibleLabel) accessibleLabel.textContent = open ? 'Close navigation' : 'Open navigation';
  if (restoreFocus) menuButton.focus();
}

menuButton?.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

nav?.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || menuButton?.getAttribute('aria-expanded') !== 'true') return;
  event.preventDefault();
  setMenu(false, { restoreFocus: true });
});

desktop.addEventListener('change', () => setMenu(false));
root.dataset.enhanced = 'true';
