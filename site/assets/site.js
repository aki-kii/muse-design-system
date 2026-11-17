// サイトの外枠の動き: 表示モードの切り替えと、狭い画面の目次（どちらもアイコンボタン）。
(function () {
  var root = document.documentElement;
  var btn = document.querySelector('[data-theme-toggle]');
  var order = ['auto', 'light', 'dark'];
  var names = { auto: '自動', light: 'ライト', dark: 'ダーク' };
  function current() { return root.dataset.theme || 'auto'; }
  function show() {
    var now = current();
    var next = order[(order.indexOf(now) + 1) % order.length];
    var text = '表示モード: ' + names[now] + '（押すと' + names[next] + 'にする）';
    btn.setAttribute('aria-label', text);
    btn.setAttribute('title', text);
    Array.prototype.forEach.call(btn.querySelectorAll('[data-theme-icon]'), function (el) {
      el.hidden = el.getAttribute('data-theme-icon') !== now;
    });
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
      var text = open ? '目次を閉じる' : '目次を開く';
      menu.setAttribute('aria-label', text);
      menu.setAttribute('title', text);
      menu.querySelector('[data-menu-icon="open"]').hidden = open;
      menu.querySelector('[data-menu-icon="close"]').hidden = !open;
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && side.classList.contains('is-open')) { menu.click(); menu.focus(); }
    });
  }
})();
