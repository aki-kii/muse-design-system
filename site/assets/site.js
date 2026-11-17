// サイトの外枠の動き: 表示モードの切り替えと、狭い画面の目次。
(function () {
  var root = document.documentElement;
  var btn = document.querySelector('[data-theme-toggle]');
  var label = document.querySelector('[data-theme-label]');
  var order = ['auto', 'light', 'dark'];
  var names = { auto: '自動', light: 'ライト', dark: 'ダーク' };
  function current() { return root.dataset.theme || 'auto'; }
  function show() {
    if (!label) return;
    label.textContent = names[current()];
    btn.setAttribute('aria-label', '表示モード: ' + names[current()] + '（押すと切り替える）');
  }
  if (btn) {
    btn.addEventListener('click', function () {
      var next = order[(order.indexOf(current()) + 1) % order.length];
      if (next === 'auto') delete root.dataset.theme; else root.dataset.theme = next;
      try { if (next === 'auto') localStorage.removeItem('muse-theme'); else localStorage.setItem('muse-theme', next); } catch (e) {}
      show();
    });
    show();
  }

  var menu = document.querySelector('[data-menu-toggle]');
  var side = document.getElementById('side');
  if (menu && side) {
    menu.addEventListener('click', function () {
      var open = side.classList.toggle('is-open');
      menu.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && side.classList.contains('is-open')) { menu.click(); menu.focus(); }
    });
  }
})();
