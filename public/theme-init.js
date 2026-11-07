(() => {
  const systemDark = matchMedia('(prefers-color-scheme: dark)');

  document.documentElement.dataset.theme = 'auto';
  document.documentElement.classList.add('js');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', systemDark.matches ? '#000000' : '#ffffff');
  try {
    localStorage.removeItem('portfolio-theme');
  } catch {
    // Automatic theming does not depend on storage availability.
  }
})();
