// Header menus (language, get the app) are <details class="menu">: one open at a time, and a
// click elsewhere or Escape closes them. Loaded on every page.
(() => {
  const menus = () => [...document.querySelectorAll('details.menu')];
  document.addEventListener('click', event => {
    for (const menu of menus()) if (menu.open && !(event.target instanceof Node && menu.contains(event.target))) menu.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    for (const menu of menus()) if (menu.open) { menu.open = false; menu.querySelector('summary')?.focus(); }
  });
  document.addEventListener('toggle', event => {
    const opened = event.target;
    if (!(opened instanceof HTMLDetailsElement) || !opened.matches('details.menu') || !opened.open) return;
    for (const menu of menus()) if (menu !== opened) menu.open = false;
  }, true);
})();
