(() => {
  const systemDark = matchMedia('(prefers-color-scheme: dark)');

  document.documentElement.dataset.theme = 'auto';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', systemDark.matches ? '#121416' : '#f3f3f0');
  try {
    localStorage.removeItem('portfolio-theme');
  } catch {
    // Automatic theming does not depend on storage availability.
  }
})();
