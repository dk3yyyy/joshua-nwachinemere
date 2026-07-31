import './styles.css';

const root = document.documentElement;
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('#primary-nav');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function setMenu(open) {
  if (!menuButton || !nav) return;
  menuButton.setAttribute('aria-expanded', String(open));
  nav.dataset.open = String(open);
  const visibleLabel = menuButton.querySelector('[aria-hidden="true"]');
  const accessibleLabel = menuButton.querySelector('.sr-only');
  if (visibleLabel) visibleLabel.textContent = open ? 'Close' : 'Menu';
  if (accessibleLabel) accessibleLabel.textContent = open ? 'Close navigation' : 'Open navigation';
}

menuButton?.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

nav?.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    const wasOpen = menuButton?.getAttribute('aria-expanded') === 'true';
    setMenu(false);
    if (wasOpen) menuButton?.focus();
  }
});

const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];

function activateTab(tab, { focus = false } = {}) {
  if (!tab) return;
  for (const candidate of tabs) {
    const selected = candidate === tab;
    candidate.setAttribute('aria-selected', String(selected));
    candidate.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(candidate.getAttribute('aria-controls'));
    if (panel) panel.hidden = !selected;
  }
  if (focus) tab.focus();
}

for (const tab of tabs) {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', (event) => {
    const index = tabs.indexOf(tab);
    let nextIndex;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    activateTab(tabs[nextIndex], { focus: true });
    tabs[nextIndex].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  });
}

if (tabs.length && panels.length) activateTab(tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0]);

const progress = document.querySelector('[data-progress]');
let progressFrame = 0;
function updateProgress() {
  progressFrame = 0;
  if (!progress) return;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
  progress.style.transform = `scaleX(${ratio})`;
}
function requestProgress() {
  if (!progressFrame) progressFrame = window.requestAnimationFrame(updateProgress);
}
if (!reducedMotion.matches) {
  addEventListener('scroll', requestProgress, { passive: true });
  addEventListener('resize', requestProgress, { passive: true });
  requestProgress();
}

const desktopMedia = window.matchMedia('(min-width: 901px)');
desktopMedia.addEventListener('change', () => setMenu(false));

root.dataset.enhanced = 'true';
