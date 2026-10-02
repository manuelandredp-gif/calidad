// Restore the saved theme before styles paint, including the sign-in screen.
(() => {
  let theme = 'dark';
  try { theme = localStorage.getItem('testgenai_theme') === 'light' ? 'light' : 'dark'; } catch { /* Storage may be unavailable. */ }
  document.documentElement.dataset.theme = theme;
})();
