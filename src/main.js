import './styles.css';
import { answerQuestion, normaliseAssistantResult } from './assistant/core.js';

const root = document.documentElement;
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('#primary-nav');
const desktop = window.matchMedia('(min-width: 901px)');
const THEME_STORAGE_KEY = 'portfolio-theme';
const THEME_STATES = ['auto', 'light', 'dark'];
const themeToggle = document.querySelector('.theme-toggle');
const themeColor = document.querySelector('meta[name="theme-color"]');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function effectiveTheme(theme) {
  return theme === 'auto' ? (systemDark.matches ? 'dark' : 'light') : theme;
}

function setTheme(theme, { persist = true } = {}) {
  const nextTheme = THEME_STATES.includes(theme) ? theme : 'auto';
  const activeTheme = effectiveTheme(nextTheme);
  const targetTheme = activeTheme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = nextTheme;
  if (themeToggle) {
    themeToggle.dataset.themeState = nextTheme;
    themeToggle.dataset.themeEffective = activeTheme;
    themeToggle.setAttribute('aria-label', `Switch to ${targetTheme} mode`);
    themeToggle.title = `Switch to ${targetTheme} mode`;
  }
  if (themeColor) themeColor.content = activeTheme === 'dark' ? '#121416' : '#f3f3f0';
  if (!persist) return;
  try {
    if (nextTheme === 'auto') localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch {
    // Theme switching still works when storage is unavailable.
  }
}

setTheme(root.dataset.theme, { persist: false });
themeToggle?.addEventListener('click', () => {
  const nextTheme = effectiveTheme(root.dataset.theme) === 'dark' ? 'light' : 'dark';
  setTheme(nextTheme);
});
systemDark.addEventListener('change', () => {
  if (root.dataset.theme === 'auto') setTheme('auto', { persist: false });
});

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

async function askAssistant(question) {
  const value = question.trim();
  if (!value || assistantForm?.dataset.busy === 'true') return;
  const userMessage = createMessage('assistant-message--question', 'You', value);
  assistantConversation.append(userMessage);
  assistantConversation.scrollTop = assistantConversation.scrollHeight;
  assistantForm.dataset.busy = 'true';
  assistantSubmit.disabled = true;
  assistantSubmit.textContent = 'Checking…';

  const response = await requestAnswer(value);
  const answerMessage = createMessage('assistant-message--answer', 'Portfolio assistant', response.answer);
  addCitations(answerMessage, response.citations);
  addSuggestions(answerMessage, response.suggestedQuestions?.slice(0, 2));
  assistantConversation.append(answerMessage);
  assistantConversation.scrollTop = assistantConversation.scrollHeight;
  assistantForm.dataset.busy = 'false';
  assistantSubmit.disabled = false;
  assistantSubmit.textContent = 'Send';
  assistantInput.value = '';
  assistantInput.focus();
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
  if (event.key !== 'Escape' || assistantLauncher?.getAttribute('aria-expanded') !== 'true') return;
  event.preventDefault();
  setAssistantOpen(false, { restoreFocus: true });
});

assistant?.addEventListener('click', (event) => {
  const citation = event.target.closest('.assistant-citations a');
  if (citation) setAssistantOpen(false);
  const suggestion = event.target.closest('[data-question]');
  if (!suggestion) return;
  askAssistant(suggestion.dataset.question);
});
