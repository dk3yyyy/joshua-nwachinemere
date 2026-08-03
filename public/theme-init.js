(() => {
  const key = 'portfolio-theme';
  const allowed = new Set(['light', 'dark']);

  try {
    const stored = localStorage.getItem(key);
    const choice = allowed.has(stored) ? stored : 'auto';
    const isDark = choice === 'dark' || (choice === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = choice;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#121416' : '#f3f3f0');
  } catch {
    document.documentElement.dataset.theme = 'auto';
  }
})();
