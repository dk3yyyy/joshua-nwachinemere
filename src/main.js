import './styles.css';
import './motion.js';
import './bench/ui.js';
import { answerQuestion, normaliseAssistantResult } from './assistant/core.js';

const root = document.documentElement;
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('#primary-nav');
const desktop = window.matchMedia('(min-width: 901px)');
const themeColor = document.querySelector('meta[name="theme-color"]');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function syncSystemTheme() {
  root.dataset.theme = 'auto';
  if (themeColor) themeColor.content = systemDark.matches ? '#0c0f0e' : '#f1efe9';
}

syncSystemTheme();
if (typeof systemDark.addEventListener === 'function') systemDark.addEventListener('change', syncSystemTheme);
else systemDark.addListener(syncSystemTheme);

function setMenu(open, { restoreFocus = false } = {}) {
  if (!menuButton || !nav) return;
  menuButton.setAttribute('aria-expanded', String(open));
  nav.dataset.open = String(open);
  const visibleLabel = menuButton.querySelector('[aria-hidden="true"]');
  const accessibleLabel = menuButton.querySelector('.sr-only');
  if (visibleLabel) visibleLabel.textContent = open ? 'Close' : 'Menu';
  if (accessibleLabel) accessibleLabel.textContent = open ? 'Menu, close navigation' : 'Menu, open navigation';
  if (restoreFocus) menuButton.focus();
}

menuButton?.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

nav?.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});

desktop.addEventListener('change', () => setMenu(false));
root.dataset.enhanced = 'true';

// Mark the section currently in view so the navigation reports where you are.
const navLinks = [...document.querySelectorAll('.primary-nav a[href^="#"]')];
const navSections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if (navSections.length && typeof IntersectionObserver === 'function') {
  const setCurrentSection = (id) => {
    for (const link of navLinks) {
      if (link.getAttribute('href') === `#${id}`) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
  };
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting);
    if (!visible.length) {
      for (const link of navLinks) link.removeAttribute('aria-current');
      return;
    }
    visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    setCurrentSection(visible[0].target.id);
  }, { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.25, 0.5] });
  for (const section of navSections) observer.observe(section);
}

const assistant = document.querySelector('[data-assistant]');
const assistantLauncher = assistant?.querySelector('.assistant-launcher');
const assistantPanel = assistant?.querySelector('.assistant-panel');
const assistantClose = assistant?.querySelector('.assistant-close');
const assistantForm = document.querySelector('#assistant-form');
const assistantInput = document.querySelector('#assistant-question');
const assistantConversation = document.querySelector('#assistant-conversation');
const assistantSubmit = assistantForm?.querySelector('button[type="submit"]');

function setAssistantOpen(open, { restoreFocus = false } = {}) {
  if (!assistantLauncher || !assistantPanel) return;
  assistantLauncher.setAttribute('aria-expanded', String(open));
  assistantPanel.hidden = !open;
  if (open) {
    window.requestAnimationFrame(() => assistantInput?.focus());
  } else if (restoreFocus) {
    assistantLauncher.focus();
  }
}

assistantLauncher?.addEventListener('click', () => {
  setAssistantOpen(assistantLauncher.getAttribute('aria-expanded') !== 'true');
});
assistantClose?.addEventListener('click', () => setAssistantOpen(false, { restoreFocus: true }));

function createMessage(className, speaker, text) {
  const message = document.createElement('article');
  message.className = `assistant-message ${className}`;
  const label = document.createElement('p');
  label.className = 'assistant-speaker';
  label.textContent = speaker;
  const copy = document.createElement('div');
  copy.className = 'assistant-copy';
  const paragraph = document.createElement('p');
  paragraph.textContent = text;
  copy.append(paragraph);
  message.append(label, copy);
  return message;
}

function addSuggestions(message, questions) {
  if (!questions?.length) return;
  const suggestions = document.createElement('div');
  suggestions.className = 'assistant-suggestions';
  suggestions.setAttribute('role', 'group');
  suggestions.setAttribute('aria-label', 'Follow-up questions');
  for (const question of questions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.question = question;
    button.textContent = question;
    suggestions.append(button);
  }
  message.append(suggestions);
}

function addCitations(message, citations) {
  if (!citations?.length) return;
  const sources = document.createElement('div');
  sources.className = 'assistant-citations';
  const label = document.createElement('span');
  label.textContent = 'Sources';
  sources.append(label);
  for (const [index, citation] of citations.entries()) {
    const link = document.createElement('a');
    link.href = citation.href;
    link.textContent = `${index + 1}. ${citation.title}`;
    sources.append(link);
  }
  message.append(sources);
}

async function requestAnswer(question) {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (!isLocal) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6_000);
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });
      if (response.ok) {
        const payload = normaliseAssistantResult(await response.json());
        if (payload) return payload;
      }
    } catch {
      // The local evidence path keeps the portfolio useful if the Pages Function is unavailable.
    } finally {
      window.clearTimeout(timeout);
    }
  }
  return answerQuestion(question);
}

function setAssistantBusy(busy) {
  if (assistantForm) assistantForm.dataset.busy = String(busy);
  if (assistantSubmit) {
    assistantSubmit.disabled = busy;
    assistantSubmit.textContent = busy ? 'Checking…' : 'Send';
  }
}

function appendMessage(message) {
  if (!assistantConversation) return;
  assistantConversation.append(message);
  assistantConversation.scrollTop = assistantConversation.scrollHeight;
}

async function askAssistant(question) {
  const value = question.trim();
  if (!value || assistantForm?.dataset.busy === 'true') return;
  appendMessage(createMessage('assistant-message--question', 'You', value));
  setAssistantBusy(true);

  try {
    const response = await requestAnswer(value);
    if (!response?.answer) throw new Error('Empty assistant response');
    const answerMessage = createMessage('assistant-message--answer', 'Portfolio assistant', response.answer);
    addCitations(answerMessage, response.citations);
    addSuggestions(answerMessage, response.suggestedQuestions?.slice(0, 2));
    appendMessage(answerMessage);
    if (assistantInput) assistantInput.value = '';
  } catch {
    const failure = createMessage(
      'assistant-message--error',
      'Portfolio assistant',
      'That answer did not come back. Try again, or email Joshua directly.',
    );
    addSuggestions(failure, ['Who is Joshua?', 'Which project best demonstrates RAG and evaluation?']);
    appendMessage(failure);
  } finally {
    setAssistantBusy(false);
    assistantInput?.focus();
  }
}

assistantForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  askAssistant(assistantInput.value);
});

assistantInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    assistantForm.requestSubmit();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const menuOpen = menuButton?.getAttribute('aria-expanded') === 'true';
  const assistantOpen = assistantLauncher?.getAttribute('aria-expanded') === 'true';
  if (!menuOpen && !assistantOpen) return;
  event.preventDefault();
  if (menuOpen) setMenu(false, { restoreFocus: true });
  if (assistantOpen) setAssistantOpen(false, { restoreFocus: true });
});

assistant?.addEventListener('click', (event) => {
  const citation = event.target.closest('.assistant-citations a');
  if (citation) setAssistantOpen(false);
  const suggestion = event.target.closest('[data-question]');
  if (!suggestion) return;
  askAssistant(suggestion.dataset.question);
});
