import './styles.css';

const header = document.querySelector('[data-header]');
const navToggle = document.querySelector('.nav-toggle');
const navLabel = navToggle?.querySelector('.sr-only');
const nav = document.querySelector('.site-nav');
const main = document.querySelector('main');
const footer = document.querySelector('.site-footer');
const progress = document.querySelector('.scroll-progress span');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const sectionLinks = [...(nav?.querySelectorAll('a[href^="#"]') ?? [])]
  .map((link) => ({ link, section: document.querySelector(link.hash) }))
  .filter(({ section }) => section);

const setPageInert = (inert) => {
  if (main) main.inert = inert;
  if (footer) footer.inert = inert;
};

const closeNav = ({ restoreFocus = false } = {}) => {
  navToggle?.setAttribute('aria-expanded', 'false');
  if (navLabel) navLabel.textContent = 'Open navigation';
  nav?.classList.remove('is-open');
  document.body.classList.remove('nav-open');
  setPageInert(false);
  if (restoreFocus) navToggle?.focus();
};

const openNav = () => {
  navToggle?.setAttribute('aria-expanded', 'true');
  if (navLabel) navLabel.textContent = 'Close navigation';
  nav?.classList.add('is-open');
  document.body.classList.add('nav-open');
  setPageInert(true);
  nav?.getBoundingClientRect();
  nav?.querySelector('a')?.focus({ preventScroll: true });
};

const focusLinkTarget = (link) => {
  if (!link.hash) return;
  const target = document.querySelector(link.hash);
  if (!target) return;

  const hadTabIndex = target.hasAttribute('tabindex');
  if (!hadTabIndex) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  if (!hadTabIndex) target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
};

navToggle?.addEventListener('click', () => {
  const expanded = navToggle.getAttribute('aria-expanded') === 'true';
  if (expanded) closeNav({ restoreFocus: true });
  else openNav();
});

navToggle?.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  const expanded = navToggle.getAttribute('aria-expanded') === 'true';
  if (expanded) closeNav({ restoreFocus: true });
  else openNav();
});

nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  closeNav();
  window.requestAnimationFrame(() => focusLinkTarget(link));
}));

window.addEventListener('keydown', (event) => {
  if (navToggle?.getAttribute('aria-expanded') !== 'true') return;

  if (event.key === 'Escape') {
    event.preventDefault();
    closeNav({ restoreFocus: true });
    return;
  }

  if (event.key !== 'Tab') return;
  const focusTargets = [navToggle, ...nav.querySelectorAll('a')].filter(Boolean);
  const firstTarget = focusTargets[0];
  const lastTarget = focusTargets.at(-1);
  const activeTarget = document.activeElement;

  if (event.shiftKey && (activeTarget === firstTarget || !focusTargets.includes(activeTarget))) {
    event.preventDefault();
    lastTarget?.focus();
  } else if (!event.shiftKey && (activeTarget === lastTarget || !focusTargets.includes(activeTarget))) {
    event.preventDefault();
    firstTarget?.focus();
  }
});

const updateActiveSection = () => {
  if (!sectionLinks.length) return;
  const activationLine = (header?.getBoundingClientRect().height ?? 0) + 32;
  const atPageEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  let activeLink = null;

  for (const { link, section } of sectionLinks) {
    if (section.getBoundingClientRect().top <= activationLine) activeLink = link;
  }
  if (atPageEnd) activeLink = sectionLinks.at(-1).link;

  sectionLinks.forEach(({ link }) => {
    if (link === activeLink) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
};

const updateChrome = () => {
  const scrollY = window.scrollY;
  header?.classList.toggle('is-scrolled', scrollY > 24);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progress) progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  updateActiveSection();
};

updateChrome();
window.addEventListener('scroll', updateChrome, { passive: true });
window.addEventListener('resize', updateActiveSection, { passive: true });
window.addEventListener('hashchange', () => window.requestAnimationFrame(updateActiveSection));
window.addEventListener('load', () => window.requestAnimationFrame(updateActiveSection));

const mobileQuery = window.matchMedia('(max-width: 760px)');
mobileQuery.addEventListener('change', (event) => {
  if (!event.matches) closeNav();
});

const systemField = document.querySelector('[data-system-field]');
const fieldNodes = [...(systemField?.querySelectorAll('[data-field-node]') ?? [])];
const fieldDetail = systemField?.querySelector('[data-field-detail]');
const fieldStep = systemField?.querySelector('[data-field-step]');

const activateFieldNode = (node) => {
  fieldNodes.forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === node)));
  if (fieldDetail) fieldDetail.textContent = node.dataset.detail ?? '';
  if (fieldStep) fieldStep.textContent = node.dataset.step ?? '';
};

fieldNodes.forEach((node) => {
  node.addEventListener('click', () => activateFieldNode(node));
  node.addEventListener('focus', () => activateFieldNode(node));
});

const contributionRail = document.querySelector('[data-contribution-rail]');
const contributionCards = [...(contributionRail?.querySelectorAll('.contribution-card') ?? [])];
const contributionPrevious = document.querySelector('[data-contribution-prev]');
const contributionNext = document.querySelector('[data-contribution-next]');
const contributionStatus = document.querySelector('[data-contribution-status]');
const contributionControls = document.querySelector('.contribution-controls');

const contributionPosition = (card) => card.offsetLeft - contributionCards[0].offsetLeft;
const currentContributionIndex = () => {
  if (!contributionRail || !contributionCards.length) return 0;
  const currentScroll = contributionRail.scrollLeft;
  const maximumScroll = Math.max(0, contributionRail.scrollWidth - contributionRail.clientWidth);
  if (currentScroll <= 1) return 0;
  if (maximumScroll - contributionRail.scrollLeft <= 1) return contributionCards.length - 1;
  return contributionCards.reduce((nearest, card, index) => (
    Math.abs(currentScroll - contributionPosition(card))
      < Math.abs(currentScroll - contributionPosition(contributionCards[nearest]))
      ? index
      : nearest
  ), 0);
};

const updateContributionControls = () => {
  const index = currentContributionIndex();
  if (contributionStatus) contributionStatus.textContent = `Contribution ${index + 1} of ${contributionCards.length}`;
  if (contributionPrevious) contributionPrevious.disabled = index === 0;
  if (contributionNext) contributionNext.disabled = index === contributionCards.length - 1;
};

const showContribution = (index) => {
  if (!contributionRail || !contributionCards.length) return;
  const boundedIndex = Math.max(0, Math.min(index, contributionCards.length - 1));
  contributionRail.scrollTo({
    left: contributionPosition(contributionCards[boundedIndex]),
    behavior: reduceMotion.matches ? 'auto' : 'smooth',
  });
};

contributionPrevious?.addEventListener('click', () => showContribution(currentContributionIndex() - 1));
contributionNext?.addEventListener('click', () => showContribution(currentContributionIndex() + 1));
contributionRail?.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') return;
  event.preventDefault();
  const target = event.key === 'Home' ? 0 : event.key === 'End' ? contributionCards.length - 1 : currentContributionIndex() + (event.key === 'ArrowRight' ? 1 : -1);
  showContribution(target);
});

let contributionControlFrame = 0;
contributionRail?.addEventListener('scroll', () => {
  window.cancelAnimationFrame(contributionControlFrame);
  contributionControlFrame = window.requestAnimationFrame(updateContributionControls);
}, { passive: true });
window.addEventListener('resize', updateContributionControls, { passive: true });
updateContributionControls();

const roleRail = document.querySelector('.role-rail');
const roleRailTrack = document.querySelector('[data-role-rail-track]');
const roleRailMotionToggle = document.querySelector('[data-role-rail-motion]');
const roleRailMotionIcon = document.querySelector('[data-role-rail-motion-icon]');
const roleRailItems = [...(roleRailTrack?.children ?? [])];
const roleRailAutoQuery = window.matchMedia('(min-width: 861px)');
let roleRailFrame = 0;
let roleRailPreviousTime = 0;
let roleRailLoopWidth = 0;
let roleRailPosition = 0;
let roleRailVisible = false;
let roleRailUserPaused = false;
let roleRailViewportWidth = window.innerWidth;

const stopRoleRail = () => {
  window.cancelAnimationFrame(roleRailFrame);
  roleRailFrame = 0;
  roleRailPreviousTime = 0;
};

const removeRoleRailClones = () => {
  roleRailTrack?.querySelectorAll('[data-role-rail-clone]').forEach((clone) => clone.remove());
};

const roleRailCanRun = () => Boolean(
  roleRailTrack
  && roleRailLoopWidth
  && roleRailVisible
  && !roleRailUserPaused
  && document.visibilityState === 'visible'
);

const roleRailTick = (time) => {
  roleRailFrame = 0;
  if (!roleRailCanRun()) {
    roleRailPreviousTime = 0;
    return;
  }
  if (roleRailPreviousTime) {
    roleRailPosition += Math.min(time - roleRailPreviousTime, 64) * 0.06;
    if (roleRailPosition >= roleRailLoopWidth) roleRailPosition -= roleRailLoopWidth;
    roleRailTrack.style.transform = `translate3d(${-roleRailPosition}px, 0, 0)`;
  }
  roleRailPreviousTime = time;
  roleRailFrame = window.requestAnimationFrame(roleRailTick);
};

const startRoleRail = () => {
  if (roleRailFrame || !roleRailCanRun()) return;
  roleRailPreviousTime = performance.now();
  roleRailFrame = window.requestAnimationFrame(roleRailTick);
};

const syncRoleRail = () => {
  stopRoleRail();
  removeRoleRailClones();
  roleRailLoopWidth = 0;
  roleRailPosition = 0;
  if (roleRailTrack) roleRailTrack.style.transform = '';
  if (!roleRailTrack || !roleRailItems.length || !roleRailAutoQuery.matches || reduceMotion.matches) return;

  roleRailItems.forEach((item) => {
    const clone = item.cloneNode(true);
    clone.setAttribute('data-role-rail-clone', '');
    clone.setAttribute('aria-hidden', 'true');
    clone.setAttribute('inert', '');
    roleRailTrack.append(clone);
  });
  roleRailLoopWidth = roleRailTrack.querySelector('[data-role-rail-clone]').offsetLeft - roleRailItems[0].offsetLeft;
  startRoleRail();
};

if (roleRail && 'IntersectionObserver' in window) {
  const roleRailObserver = new IntersectionObserver(([entry]) => {
    roleRailVisible = entry.isIntersecting;
    if (roleRailVisible) startRoleRail();
    else stopRoleRail();
  }, { threshold: 0.1 });
  roleRailObserver.observe(roleRail);
} else {
  roleRailVisible = true;
}

roleRailMotionToggle?.addEventListener('click', () => {
  roleRailUserPaused = !roleRailUserPaused;
  roleRailMotionToggle.setAttribute('aria-pressed', String(roleRailUserPaused));
  roleRailMotionToggle.setAttribute('aria-label', roleRailUserPaused ? 'Play capability motion' : 'Pause capability motion');
  if (roleRailMotionIcon) roleRailMotionIcon.textContent = roleRailUserPaused ? '▶' : 'Ⅱ';
  if (roleRailUserPaused) stopRoleRail();
  else startRoleRail();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') startRoleRail();
  else stopRoleRail();
});
roleRailAutoQuery.addEventListener('change', syncRoleRail);
reduceMotion.addEventListener('change', syncRoleRail);
window.addEventListener('resize', () => {
  if (window.innerWidth === roleRailViewportWidth) return;
  roleRailViewportWidth = window.innerWidth;
  syncRoleRail();
}, { passive: true });
window.addEventListener('load', syncRoleRail, { once: true });
syncRoleRail();

const year = new Date().getFullYear();
document.querySelector('.site-footer p')?.setAttribute('title', `Portfolio updated ${year}`);
