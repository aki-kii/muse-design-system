// 部品のデモの動き。各デモは data-demo="部品名" の要素の中だけを触る。
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (root, sel) { return root.querySelector(sel); };
  var $$ = function (root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var now = function () { var d = new Date(); return d.getHours() + ':' + pad(d.getMinutes()); };

  // トースト（画面下の中央。約 2.2 秒）
  var toastTimer;
  function toast(text) {
    var region = document.querySelector('.m-toast-region');
    if (!region) return;
    region.innerHTML = '';
    var t = document.createElement('div');
    t.className = 'm-toast';
    t.textContent = text;
    region.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { region.innerHTML = ''; }, 2200);
  }
  window.museToast = toast;

  // 紙吹雪（飾りの色。学習ノートの現行の4色で、DS のトークンにしない）
  function confetti(host) {
    if (reduce) return;
    var box = document.createElement('div');
    box.className = 'm-confetti';
    box.setAttribute('aria-hidden', 'true');
    var colors = ['#EC4561', '#2F7CF6', '#F5B301', '#2E9E5B'];
    for (var i = 0; i < 18; i++) {
      var p = document.createElement('i');
      p.style.left = (5 + Math.random() * 90) + '%';
      p.style.background = colors[i % 4];
      p.style.animationDelay = (Math.random() * 0.25) + 's';
      box.appendChild(p);
    }
    host.appendChild(box);
    setTimeout(function () { box.remove(); }, 1500);
  }

  // 読み上げ（en-US、速さ 0.95）
  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text.replace(/[（(][^）)]*[）)]/g, ''));
    u.lang = 'en-US';
    u.rate = 0.95;
    speechSynthesis.speak(u);
  }

  // 共通: 押すと aria-pressed が切り替わるもの
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-toggle-pressed]');
    if (t) {
      var on = t.getAttribute('aria-pressed') !== 'true';
      t.setAttribute('aria-pressed', String(on));
      var labels = t.getAttribute('data-labels');
      if (labels) t.setAttribute('aria-label', labels.split('|')[on ? 1 : 0]);
    }
    var tt = e.target.closest('[data-toast]');
    if (tt) toast(tt.getAttribute('data-toast'));
    var sp = e.target.closest('[data-speak]');
    if (sp) speak(sp.getAttribute('data-speak'));
  });
  document.addEventListener('keydown', function (e) {
    var sp = e.target.closest && e.target.closest('[data-speak][role="button"]');
    if (sp && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); speak(sp.getAttribute('data-speak')); }
  });

  var init = {};

  // ---------------------------------------------------------- 入力欄とスイッチ
  init['input-and-switch'] = function (root) {
    $$(root, '[data-validate]').forEach(function (field) {
      var input = $(field, 'input, textarea');
      var hint = $(field, '.m-hint');
      var normal = hint.textContent;
      input.addEventListener('blur', function () {
        var bad = !input.value.trim();
        field.classList.toggle('is-error', bad);
        input.setAttribute('aria-invalid', String(bad));
        hint.textContent = bad ? field.getAttribute('data-validate') : normal;
      });
    });
    $$(root, '.m-switch-row').forEach(function (row) {
      var sw = $(row, '.m-switch');
      row.addEventListener('click', function (e) {
        if (e.target !== sw && sw.contains(e.target)) return;
        var on = sw.getAttribute('aria-checked') !== 'true';
        sw.setAttribute('aria-checked', String(on));
        toast((row.getAttribute('data-name') || '設定') + 'を' + (on ? 'オン' : 'オフ') + 'にしました');
      });
    });
  };

  // ---------------------------------------------------------- ナビゲーション
  init['navigation'] = function (root) {
    $$(root, '[data-nav]').forEach(function (nav) {
      nav.addEventListener('click', function (e) {
        var item = e.target.closest('a, button');
        if (!item) return;
        e.preventDefault();
        $$(nav, '[aria-current]').forEach(function (x) { x.removeAttribute('aria-current'); });
        item.setAttribute('aria-current', 'page');
      });
    });
  };

  // ---------------------------------------------------------- 承認カード
  function approval(card, onDone) {
    var row = $(card, '.m-btn-row');
    var original = row.outerHTML;
    card.addEventListener('click', function (e) {
      var b = e.target.closest('[data-approve]');
      if (!b) return;
      var kind = b.getAttribute('data-approve');
      var text = kind === 'deny' ? '拒否した ' + now() : '許可した（' + kind + '）' + now();
      var p = document.createElement('p');
      p.className = 'm-approval-result';
      p.textContent = text;
      $(card, '.m-btn-row').replaceWith(p);
      if (onDone) onDone(kind);
    });
    return function reset() {
      var r = $(card, '.m-approval-result');
      if (r) r.outerHTML = original;
    };
  }
  init['approval-card'] = function (root) {
    var reset = approval($(root, '.m-approval'), function (kind) { toast(kind === 'deny' ? '送信を取りやめました' : 'メールを送りました'); });
    $(root, '[data-reset]').addEventListener('click', reset);
  };
  init['approval-flow'] = function (root) {
    var results = $(root, '[data-results]');
    var reset = approval($(root, '.m-approval'), function (kind) {
      results.hidden = false;
      $(results, '[data-result-text]').textContent = kind === 'deny' ? '送信しませんでした' : '会場への返信を送りました（' + now() + '）';
      toast(kind === 'deny' ? '送信を取りやめました' : 'メールを送りました');
    });
    $(root, '[data-reset]').addEventListener('click', function () { reset(); results.hidden = true; });
  };

  // ---------------------------------------------------------- スケルトン
  init['skeleton'] = function (root) {
    var area = $(root, '[data-skel-area]');
    var btn = $(root, '[data-skel-load]');
    var skel = area.innerHTML;
    var loaded = '<div class="m-skel-rows">' + ['朝のストレッチ', '買い物リストを見直す', '本を30分読む'].map(function (t, i) {
      return '<div class="m-skel-row"><span class="th-dot" style="width:24px;height:24px"></span><span class="m-skel-lines"><span style="font-weight:600">' + t + '</span><span style="font-size:13px;color:var(--dim)">' + (7 + i * 3) + ':00</span></span></div>';
    }).join('') + '</div>';
    var done = false;
    btn.addEventListener('click', function () {
      done = !done;
      area.innerHTML = done ? loaded : skel;
      area.setAttribute('aria-busy', String(!done));
      btn.textContent = done ? 'もう一度読み込む' : '読み込みを終える';
    });
  };

  // ---------------------------------------------------------- 空の状態
  init['empty-state'] = function (root) {
    $$(root, '[data-show-toast]').forEach(function (b) {
      b.addEventListener('click', function () { toast(b.getAttribute('data-show-toast')); });
    });
  };

  // ---------------------------------------------------------- 検索フィールド
  init['search-field'] = function (root) {
    var kata = function (s) { return s.replace(/[ァ-ヶ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); }).toLowerCase(); };
    var list = $(root, '[data-search-list]');
    var empty = $(root, '[data-search-empty]');
    var count = $(root, '[data-search-count]');
    var timer;
    $$(root, '.m-search').forEach(function (box) {
      var input = $(box, '.m-search-input');
      var clear = $(box, '.m-search-clear');
      var update = function () {
        clear.hidden = !input.value;
        if (!list || !box.parentNode.contains(list)) return;
        var q = kata(input.value.trim());
        var n = 0;
        $$(list, 'li').forEach(function (li) {
          var hit = !q || kata(li.textContent).indexOf(q) !== -1;
          li.hidden = !hit;
          if (hit) n++;
        });
        list.hidden = n === 0;
        empty.hidden = n !== 0;
        clearTimeout(timer);
        timer = setTimeout(function () { count.textContent = n + '件'; }, 500);
      };
      input.addEventListener('input', update);
      clear.addEventListener('click', function () { input.value = ''; update(); input.focus(); });
    });
  };

  // ---------------------------------------------------------- トースト
  init['toast'] = function (root) {
    $$(root, '[data-show-toast]').forEach(function (b) {
      b.addEventListener('click', function () { toast(b.getAttribute('data-show-toast')); });
    });
  };

  // ---------------------------------------------------------- コースパス
  init['course-path'] = function (root) {
    root.addEventListener('click', function (e) {
      var n = e.target.closest('button.m-node');
      if (n) toast('「' + $(n, '.m-node-title').textContent + '」を開きます');
    });
  };

  // ---------------------------------------------------------- プレイヤートップバー
  init['player-top-bar'] = function (root) {
    var total = 7, page = 3, combo = 1, xp = 120;
    var track = $(root, '[role="progressbar"]');
    var bar = $(track, 'span');
    var comboEl = $(root, '.m-combo');
    var xpEl = $(root, '.m-xp');
    var pos = $(root, '.m-player-pos');
    function draw() {
      bar.style.width = (page / total * 100) + '%';
      track.setAttribute('aria-valuenow', page);
      comboEl.textContent = '×' + combo;
      comboEl.classList.toggle('is-on', combo >= 2);
      comboEl.setAttribute('aria-label', 'コンボ ' + combo);
      xpEl.textContent = 'XP ' + xp;
      xpEl.setAttribute('aria-label', xp + ' XP');
      pos.textContent = '英文法の基礎 · 疑問文と否定文 · ' + page + '/' + total;
    }
    $(root, '[data-right]').addEventListener('click', function () { if (page < total) { page++; combo++; xp += 10; draw(); } });
    $(root, '[data-wrong]').addEventListener('click', function () { if (page < total) { page++; combo = 0; draw(); } });
    $(root, '[data-reset]').addEventListener('click', function () { page = 3; combo = 1; xp = 120; draw(); });
    draw();
  };

  // ---------------------------------------------------------- 単語カード
  init['word-card'] = function (root) {
    var words = [
      { w: 'reluctant', ex: 'She was reluctant to leave the party.', ja: '彼女はパーティーを去るのに気が進まなかった。', m: '気が進まない' },
      { w: 'abundant', ex: 'Water is abundant in this region.', ja: 'この地域では水が豊富だ。', m: '豊富な' },
      { w: 'fragile', ex: 'Be careful, the glass is fragile.', ja: '気をつけて、そのグラスは壊れやすい。', m: '壊れやすい' }
    ];
    var host = $(root, '[data-new]');
    var i = 0;
    function drawNew() {
      if (i >= words.length) {
        host.innerHTML = '<p class="m-kicker">新しい単語</p><div class="m-complete" style="max-width:none"><div class="m-complete-star" aria-hidden="true">★</div><h3>今日の分はおしまい</h3></div><button type="button" class="demo-reset" data-again>最初から</button>';
        $(host, '[data-again]').addEventListener('click', function () { i = 0; drawNew(); });
        return;
      }
      var w = words[i];
      host.innerHTML =
        '<article class="m-word">' +
        '<p class="m-kicker">新しい単語 ' + (i + 1) + ' / ' + words.length + '</p>' +
        '<div class="m-word-card"><span class="m-word-term" lang="en">' + w.w + '</span><button type="button" class="m-speak" aria-label="読み上げる" data-speak="' + w.w + '">🔊</button></div>' +
        '<div><p class="m-example"><span lang="en">' + w.ex + '</span><button type="button" class="m-speak" aria-label="読み上げる" data-speak="' + w.ex + '">🔊</button></p><p class="m-example-ja" hidden>' + w.ja + '</p></div>' +
        '<div data-reveal-area><button type="button" class="m-reveal" aria-label="意味を見せる">タップして意味を見る</button><p class="m-reveal-hint" style="margin-top:8px">意味を思い浮かべてから、タップして確かめよう</p></div>' +
        '</article>';
      $(host, '.m-reveal').addEventListener('click', function () {
        $(host, '.m-example-ja').hidden = false;
        var area = $(host, '[data-reveal-area]');
        area.innerHTML = '<div class="m-meaning">' + w.m + '</div><div class="m-judge" style="margin-top:12px"><button type="button" class="m-btn m-btn--secondary">もう知ってた</button><button type="button" class="m-btn m-btn--primary">覚える</button></div>';
        $$(area, '.m-judge button').forEach(function (b) { b.addEventListener('click', function () { i++; drawNew(); }); });
        $(area, '.m-meaning').setAttribute('tabindex', '-1');
        $(area, '.m-meaning').focus();
      });
    }
    drawNew();

    // 単語の復習（意味の4択）
    var rv = $(root, '[data-review]');
    var reviews = [
      { ex: 'He gave a <span class="m-blank">＿＿＿</span> answer to the question.', w: 'vague', choices: ['あいまいな', '正確な', '短い', '丁寧な'], a: 0 },
      { ex: 'The museum has a <span class="m-blank">＿＿＿</span> collection of art.', w: 'vast', choices: ['小さな', '古い', '膨大な', '有名な'], a: 2 }
    ];
    var j = 0;
    function drawReview() {
      if (j >= reviews.length) {
        rv.innerHTML = '<p class="m-kicker">単語の復習</p><div class="m-complete" style="max-width:none"><div class="m-complete-star" aria-hidden="true">★</div><h3>今日の分はおしまい</h3></div><button type="button" class="demo-reset" data-again>最初から</button>';
        $(rv, '[data-again]').addEventListener('click', function () { j = 0; drawReview(); });
        return;
      }
      var r = reviews[j];
      rv.innerHTML =
        '<article class="m-word">' +
        '<p class="m-kicker">単語の復習 ' + (j + 1) + ' / ' + reviews.length + '</p>' +
        '<div class="m-word-card"><span class="m-word-term" lang="en">' + r.w + '</span><button type="button" class="m-speak" aria-label="読み上げる" data-speak="' + r.w + '">🔊</button></div>' +
        '<p class="m-example"><span lang="en">' + r.ex + '</span></p>' +
        '<div class="m-options">' + r.choices.map(function (c, k) { return '<button type="button" class="m-option" data-k="' + k + '" aria-label="意味の選択肢: ' + c + '">' + c + '</button>'; }).join('') +
        '<button type="button" class="m-option" data-k="-1" aria-label="意味の選択肢: 分からない">分からない</button></div>' +
        '<p role="status" class="m-reveal-hint" data-msg></p>' +
        '</article>';
      $$(rv, '.m-option').forEach(function (b) {
        b.addEventListener('click', function () {
          var k = +b.getAttribute('data-k');
          $$(rv, '.m-option').forEach(function (o) {
            o.disabled = true;
            var ok = +o.getAttribute('data-k') === r.a;
            if (ok) o.classList.add('is-correct');
            else if (o === b) o.classList.add('is-wrong');
          });
          var msg = k === r.a ? '覚えてた！' : (k === -1 ? '答えはこれだよ' : 'ちがうよ');
          if (k !== r.a) msg += ' 明日の復習でもう一度出すね。';
          $(rv, '[data-msg]').textContent = msg;
          setTimeout(function () { j++; drawReview(); }, 1100);
        });
      });
    }
    drawReview();
  };

  // ---------------------------------------------------------- クイズ選択肢＋結果バナー
  function quiz(root) {
    var opts = $$(root, '.m-option');
    var check = $(root, '[data-check]');
    var out = $(root, '[data-out]');
    var answer = +root.getAttribute('data-answer');
    function reset() {
      opts.forEach(function (o) { o.disabled = false; o.classList.remove('is-correct', 'is-wrong'); o.setAttribute('aria-pressed', 'false'); });
      check.disabled = true;
      check.hidden = false;
      out.innerHTML = '';
    }
    opts.forEach(function (o) {
      o.addEventListener('click', function () {
        opts.forEach(function (x) { x.setAttribute('aria-pressed', String(x === o)); });
        check.disabled = false;
      });
    });
    check.addEventListener('click', function () {
      var picked = opts.findIndex(function (o) { return o.getAttribute('aria-pressed') === 'true'; });
      opts.forEach(function (o, k) {
        o.disabled = true;
        if (k === answer) o.classList.add('is-correct');
        else if (k === picked) o.classList.add('is-wrong');
      });
      check.hidden = true;
      var ok = picked === answer;
      out.innerHTML = '<div class="m-result ' + (ok ? 'm-result--ok' : 'm-result--ng') + '" role="status"><p class="m-result-title">' + (ok ? '正解！その調子だよ' : '惜しい！ここがポイントだよ') + '</p><p class="m-result-body">' + root.getAttribute('data-explain') + '</p></div>' +
        (ok ? '' : '<div class="m-btn-row" style="margin-top:10px"><button type="button" class="m-btn m-btn--secondary" data-toast="解説ページを開きます">解説を見返す</button><button type="button" class="m-btn m-btn--ghost" data-toast="章の解説全体を開きます">章の解説全体</button></div>') +
        '<p style="margin:10px 0 0"><button type="button" class="demo-reset" data-again>もう一度解く</button></p>';
      if (ok) confetti($(out, '.m-result'));
      $(out, '[data-again]').addEventListener('click', reset);
    });
    reset();
  }
  init['quiz-option'] = function (root) { $$(root, '[data-quiz]').forEach(quiz); };
  init['result-banner'] = function (root) {
    $$(root, '[data-replay]').forEach(function (b) {
      b.addEventListener('click', function () {
        var target = $(root, b.getAttribute('data-replay'));
        target.classList.remove('is-static');
        target.style.animation = 'none';
        void target.offsetWidth;
        target.style.animation = '';
        if (target.classList.contains('m-result--ok')) confetti(target);
      });
    });
  };

  // ---------------------------------------------------------- 模範解答ボックス
  init['model-answer-box'] = function (root) {
    var input = $(root, 'textarea');
    var btn = $(root, '[data-check]');
    var box = $(root, '.m-model');
    input.addEventListener('input', function () { btn.disabled = !input.value.trim(); });
    btn.addEventListener('click', function () { box.hidden = false; btn.hidden = true; input.readOnly = true; });
    $(root, '[data-reset]').addEventListener('click', function () { box.hidden = true; btn.hidden = false; btn.disabled = true; input.readOnly = false; input.value = ''; });
  };

  // ---------------------------------------------------------- 質問ボックス
  init['ask-box'] = function (root) {
    var input = $(root, 'textarea');
    var btn = $(root, '[data-ask]');
    var list = $(root, '.m-qa');
    input.addEventListener('input', function () { btn.disabled = !input.value.trim(); });
    btn.addEventListener('click', function () {
      var q = input.value.trim();
      btn.disabled = true;
      btn.textContent = '聞いてる…';
      input.readOnly = true;
      setTimeout(function () {
        var item = document.createElement('div');
        item.innerHTML = '<p class="q"></p><p class="a">A. （サイトのデモなので、答えは固定の文です）受動態は「何をされたか」を言いたいときに使います。する側が大事な文では能動態のほうが自然です。</p>';
        item.firstChild.textContent = 'Q. ' + q;
        list.appendChild(item);
        input.value = '';
        input.readOnly = false;
        btn.textContent = '聞く';
        input.focus();
      }, 1200);
    });
  };

  // ---------------------------------------------------------- 章完了パネル
  init['chapter-complete-panel'] = function (root) {
    var p = $(root, '[data-celebrate]');
    confettiOnView(p);
    $(root, '[data-replay]').addEventListener('click', function () { confetti(p); });
  };
  function confettiOnView(el) {
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { confetti(el); io.disconnect(); } }, { threshold: 0.6 });
    io.observe(el);
  }

  // ---------------------------------------------------------- コース切替パネル
  init['course-switcher'] = function (root) {
    var open = $(root, '[data-open]');
    var layer = $(root, '[data-layer]');
    var panel = $(root, '[role="dialog"]');
    var name = $(root, '[data-current-name]');
    function show() { layer.hidden = false; open.setAttribute('aria-expanded', 'true'); $(panel, '[aria-current="true"]').focus(); }
    function hide() { layer.hidden = true; open.setAttribute('aria-expanded', 'false'); open.focus(); }
    open.addEventListener('click', show);
    $(root, '[data-close]').addEventListener('click', hide);
    $(root, '.m-scrim').addEventListener('click', hide);
    layer.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
    $$(root, '.m-course').forEach(function (c) {
      c.addEventListener('click', function () {
        $$(root, '.m-course').forEach(function (x) { x.removeAttribute('aria-current'); });
        c.setAttribute('aria-current', 'true');
        var icon = $(c, '.m-course-icon');
        var btnIcon = $(open, '.m-course-icon');
        btnIcon.textContent = icon.textContent;
        btnIcon.style.background = icon.style.background;
        var label = c.getAttribute('data-name');
        $(open, '.vh').textContent = label + '・コースを切り替える';
        name.textContent = label;
        hide();
      });
    });
  };

  // ---------------------------------------------------------- スピードダイヤル FAB ＋ 送信完了メッセージ
  function fab(root) {
    var main = $(root, '.m-fab-main');
    var items = $(root, '.m-fab-items');
    var badge = $(root, '.m-count-badge');
    var submitItem = $(root, '[data-submit]');
    var msgHost = $(root, '[data-msg]');
    var drafts = +root.getAttribute('data-drafts') || 0;
    var timer;
    function drawBadge() {
      badge.textContent = drafts;
      badge.hidden = !drafts;
      submitItem.disabled = !drafts;
      submitItem.setAttribute('aria-label', '修正依頼（下書き' + drafts + '件）');
    }
    function toggle(open) {
      items.hidden = !open;
      main.textContent = open ? '×' : '＋';
      main.setAttribute('aria-expanded', String(open));
      main.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
      $$(items, '.m-fab-item').forEach(function (b, k) { b.style.animationDelay = (k * 40) + 'ms'; });
    }
    main.addEventListener('click', function () {
      var opening = items.hidden;
      toggle(opening);
      if (opening) { var first = $$(items, '.m-fab-item').filter(function (b) { return !b.disabled; })[0]; if (first) first.focus(); }
    });
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !items.hidden) { toggle(false); main.focus(); } });
    items.addEventListener('click', function (e) {
      var b = e.target.closest('.m-fab-item');
      if (!b || b.disabled) return;
      toggle(false);
      if (b === submitItem) {
        var n = drafts;
        drafts = 0;
        drawBadge();
        clearTimeout(timer);
        var pages = n > 1 ? 1 : 0;
        msgHost.innerHTML = '<div class="m-submit" role="status">修正依頼を ' + n + ' 件出しました（メモ' + (n - pages) + '件・ページ依頼' + pages + '件）</div>';
        timer = setTimeout(function () { msgHost.innerHTML = ''; }, 4000);
      } else {
        drafts++;
        drawBadge();
        toast('「' + $(b, '.m-fab-label').textContent + '」を下書きに積みました');
        main.focus();
      }
    });
    toggle(false);
    drawBadge();
  }
  init['speed-dial-fab'] = function (root) { fab($(root, '[data-fab]')); };
  init['submit-message'] = function (root) { fab($(root, '[data-fab]')); };

  // ---------------------------------------------------------- メモ入力バー
  function memo(bar) {
    var input = $(bar, 'textarea');
    var send = $(bar, '.m-send');
    var mic = $(bar, '.m-mic');
    var err = $(bar, '.m-memo-error');
    function fit() {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 152 - 10) + 'px';
      send.hidden = !input.value.trim();
    }
    input.addEventListener('input', fit);
    mic.addEventListener('click', function () {
      var on = mic.getAttribute('aria-pressed') !== 'true';
      mic.setAttribute('aria-pressed', String(on));
      mic.setAttribute('aria-label', on ? '音声入力を終了' : '音声入力');
      if (err) err.hidden = true;
    });
    send.addEventListener('click', function () {
      toast('メモを下書きに積みました');
      input.value = '';
      fit();
      input.focus();
    });
    var errBtn = bar.parentNode.querySelector('[data-show-error]');
    if (errBtn) errBtn.addEventListener('click', function () { err.hidden = !err.hidden; mic.setAttribute('aria-pressed', 'false'); });
    fit();
    return { input: input, fit: fit };
  }
  init['memo-input-bar'] = function (root) { $$(root, '[data-memo]').forEach(memo); };

  // ---------------------------------------------------------- 長押しメニュー
  init['long-press-menu'] = function (root) {
    var area = $(root, '.m-lp-area');
    var menu = $(root, '.m-menu');
    var strip = $(root, '[data-strip]');
    var bar = memo($(root, '[data-memo]'));
    var target = null, timer = null, start = null, openedAt = 0;
    function open(b) {
      target = b;
      var mine = b.classList.contains('m-bubble--user');
      $(menu, '[data-act="delete"]').parentNode.hidden = !mine;
      menu.hidden = false;
      var ar = area.getBoundingClientRect(), br = b.getBoundingClientRect();
      var left = Math.min(Math.max(br.left - ar.left, 8), ar.width - 176 - 8);
      var top = br.bottom - ar.top + 6;
      if (top + menu.offsetHeight > ar.height - 8) top = br.top - ar.top - 6 - menu.offsetHeight;
      menu.style.left = left + 'px';
      menu.style.top = Math.max(8, top) + 'px';
      openedAt = Date.now();
      $(menu, 'button').focus();
    }
    function close(refocus) { menu.hidden = true; if (refocus && target) target.focus(); }
    area.addEventListener('pointerdown', function (e) {
      var b = e.target.closest('.m-bubble');
      if (!b || b.classList.contains('is-selectable')) return;
      start = { x: e.clientX, y: e.clientY };
      timer = setTimeout(function () { open(b); }, 450);
    });
    area.addEventListener('pointermove', function (e) {
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) >= 10) { clearTimeout(timer); start = null; }
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { area.addEventListener(t, function () { clearTimeout(timer); start = null; }); });
    area.addEventListener('contextmenu', function (e) { if (e.target.closest('.m-bubble')) e.preventDefault(); });
    area.addEventListener('keydown', function (e) {
      var b = e.target.closest('.m-bubble');
      if (b && (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10'))) { e.preventDefault(); open(b); }
      if (e.key === 'Escape' && !menu.hidden) close(true);
    });
    document.addEventListener('pointerdown', function (e) {
      if (menu.hidden || menu.contains(e.target) || Date.now() - openedAt < 350) return;
      close(false);
    });
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var act = b.getAttribute('data-act');
      var text = $(target, '[data-text]').textContent;
      close(false);
      if (act === 'reply') {
        bar.input.value = '> ' + text + '\n';
        bar.fit();
        bar.input.focus();
      } else if (act === 'copy') {
        try { navigator.clipboard.writeText(text); } catch (x) {}
        strip.textContent = 'コピーしました';
        setTimeout(function () { strip.textContent = ''; }, 2000);
        target.focus();
      } else if (act === 'select') {
        target.classList.add('is-selectable');
        var range = document.createRange();
        range.selectNodeContents($(target, '[data-text]'));
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
      } else if (act === 'delete') {
        target.closest('li').remove();
      }
    });
    var chat = $(area, '.m-chat');
    var original = chat.innerHTML;
    $(root, '[data-reset]').addEventListener('click', function () {
      chat.innerHTML = original;
      close(false);
      bar.input.value = '';
      bar.fit();
      strip.textContent = '';
    });
  };

  // ---------------------------------------------------------- シートモーダル
  init['sheet-modal'] = function (root) {
    var area = $(root, '.m-modal-area');
    var layer = $(root, '[data-layer]');
    var opener = null;
    function close() { layer.hidden = true; $$(layer, '[data-sheet]').forEach(function (s) { s.hidden = true; }); if (opener) opener.focus(); }
    $$(root, '[data-open-sheet]').forEach(function (b) {
      b.addEventListener('click', function () {
        opener = b;
        layer.hidden = false;
        var s = $(layer, '[data-sheet="' + b.getAttribute('data-open-sheet') + '"]');
        s.hidden = false;
        var f = $(s, 'textarea') || $(s, 'button');
        f.focus();
      });
    });
    $(layer, '.m-backdrop').addEventListener('click', close);
    $$(layer, '[data-close]').forEach(function (b) { b.addEventListener('click', close); });
    layer.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var sheet = $$(layer, '[data-sheet]').filter(function (x) { return !x.hidden; })[0];
      var f = $$(sheet, 'button, textarea').filter(function (x) { return !x.disabled && !x.hidden && x.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
    $$(layer, '[data-memo]').forEach(function (m) {
      var bar = memo(m);
      var sheet = m.closest('[data-sheet]');
      var submit = $(sheet, '[data-submit-sheet]');
      if (submit && submit.hasAttribute('data-needs-text')) {
        bar.input.addEventListener('input', function () { submit.disabled = !bar.input.value.trim(); });
        submit.disabled = true;
      }
    });
    $$(layer, '[data-submit-sheet]').forEach(function (b) {
      b.addEventListener('click', function () { toast(b.getAttribute('data-submit-sheet')); close(); });
    });
    radios(root);
    void area;
  };

  // ---------------------------------------------------------- 位置ラジオ
  function radios(root) {
    $$(root, '[role="radiogroup"]').forEach(function (g) {
      var rs = $$(g, '[role="radio"]');
      function pick(r, focus) {
        rs.forEach(function (x) { x.setAttribute('aria-checked', String(x === r)); x.tabIndex = x === r ? 0 : -1; });
        if (focus) r.focus();
      }
      rs.forEach(function (r, k) {
        r.addEventListener('click', function () { pick(r); });
        r.addEventListener('keydown', function (e) {
          if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].indexOf(e.key) < 0) return;
          e.preventDefault();
          var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
          pick(rs[(k + d + rs.length) % rs.length], true);
        });
      });
    });
  }
  init['position-radio'] = radios;

  // ---------------------------------------------------------- 確認ダイアログ
  init['confirm-dialog'] = function (root) {
    var layer = $(root, '[data-layer]');
    var opener = $(root, '[data-open]');
    var dialog = $(root, '[role="alertdialog"]');
    var list = $(root, '[data-list]');
    function close() { layer.hidden = true; opener.focus(); }
    opener.addEventListener('click', function () { layer.hidden = false; $(dialog, '.m-dialog-cancel').focus(); });
    $(root, '.m-dialog-cancel').addEventListener('click', close);
    $(root, '.m-dialog-ok').addEventListener('click', function () { layer.hidden = true; list.hidden = false; opener.hidden = true; $(root, '[data-reset]').focus(); toast('スレッドを削除しました'); });
    layer.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        var f = $$(dialog, 'button'); var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    $(root, '[data-reset]').addEventListener('click', function () { list.hidden = true; opener.hidden = false; opener.focus(); });
  };

  // ---------------------------------------------------------- 汎用部品（v0.6.0）
  init['progress-path'] = init['course-path'];
  init['choice-button'] = radios;
  init['icon-button'] = function (root) {
    var r = $(root, '[data-refresh]');
    r.addEventListener('click', function () {
      r.disabled = true;
      r.classList.add('is-spinning');
      r.setAttribute('aria-busy', 'true');
      setTimeout(function () { r.disabled = false; r.classList.remove('is-spinning'); r.removeAttribute('aria-busy'); r.focus(); toast('再読み込みしました'); }, 1600);
    });
  };
  init['flashcard'] = function (root) {
    var cards = [
      { q: 'API', a: 'ソフトウェア同士がやり取りするための決まり' },
      { q: 'キャッシュ', a: 'よく使うデータを、速く取り出せる場所に一時的に置いておくこと' },
      { q: 'ログ', a: '起きたことを時刻とともに書き残した記録' }
    ];
    var host = $(root, '[data-cards]');
    var i = 0;
    function draw() {
      if (i >= cards.length) {
        host.innerHTML = '<p class="m-kicker">用語</p><div class="m-complete" style="max-width:none"><div class="m-complete-star" aria-hidden="true">★</div><h3>今日の分はおしまい</h3></div><button type="button" class="demo-reset" data-again>最初から</button>';
        $(host, '[data-again]').addEventListener('click', function () { i = 0; draw(); });
        return;
      }
      var c = cards[i];
      host.innerHTML =
        '<article class="m-word">' +
        '<p class="m-kicker">用語 ' + (i + 1) + ' / ' + cards.length + '</p>' +
        '<div class="m-word-card"><span style="font-size:28px;font-weight:800">' + c.q + '</span></div>' +
        '<div data-reveal-area><button type="button" class="m-reveal" aria-label="答えを見せる">タップして答えを見る</button><p class="m-reveal-hint" style="margin-top:8px">答えを思い浮かべてから、タップして確かめよう</p></div>' +
        '</article>';
      $(host, '.m-reveal').addEventListener('click', function () {
        var area = $(host, '[data-reveal-area]');
        area.innerHTML = '<div class="m-meaning">' + c.a + '</div><div class="m-judge" style="margin-top:12px"><button type="button" class="m-btn m-btn--secondary">もう知ってた</button><button type="button" class="m-btn m-btn--primary">覚える</button></div>';
        $$(area, '.m-judge button').forEach(function (b) { b.addEventListener('click', function () { i++; draw(); }); });
        $(area, '.m-meaning').setAttribute('tabindex', '-1');
        $(area, '.m-meaning').focus();
      });
    }
    draw();
  };


  $$(document, '[data-demo]').forEach(function (root) {
    var f = init[root.getAttribute('data-demo')];
    if (f) f(root);
  });
})();
