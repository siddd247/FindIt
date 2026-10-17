// Run before the stylesheet to avoid a light flash for saved dark-mode preferences.
try {
 document.documentElement.dataset.theme = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
} catch {
 document.documentElement.dataset.theme = 'light';
}
