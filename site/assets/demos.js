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
  function speak(text, lang) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text.replace(/[（(][^）)]*[）)]/g, ''));
    u.lang = lang || 'ja-JP';
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
    if (sp) speak(sp.getAttribute('data-speak'), sp.getAttribute('data-lang'));
  });
  document.addEventListener('keydown', function (e) {
    var sp = e.target.closest && e.target.closest('[data-speak][role="button"]');
    if (sp && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); speak(sp.getAttribute('data-speak'), sp.getAttribute('data-lang')); }
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
    // メールの形: 空のうちはエラーにせず、形が合わないまま欄を離れたらエラー。直したら戻す
    $$(root, '[data-validate-email]').forEach(function (field) {
      var input = $(field, 'input');
      var hint = $(field, '.m-hint');
      var normal = hint.textContent;
      function check(onlyClear) {
        var v = input.value.trim();
        var bad = !!v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
        if (onlyClear && bad) return;
        field.classList.toggle('is-error', bad);
        input.setAttribute('aria-invalid', String(bad));
        hint.textContent = bad ? field.getAttribute('data-validate-email') : normal;
      }
      input.addEventListener('blur', function () { check(false); });
      input.addEventListener('input', function () { if (field.classList.contains('is-error')) check(true); });
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
    // 見本ごとに、その検索フィールドの下の一覧・空の状態・件数を連動させる
    $$(root, '.demo-item').forEach(function (item) {
      var box = $(item, '.m-search');
      if (!box) return;
      var input = $(box, '.m-search-input');
      var clear = $(box, '.m-search-clear');
      var list = $(item, '[data-search-list]');
      var empty = $(item, '[data-search-empty]');
      var count = $(item, '[data-search-count]');
      var timer;
      var update = function (quiet) {
        clear.hidden = !input.value;
        if (!list) return;
        var q = kata(input.value.trim());
        var n = 0;
        $$(list, 'li').forEach(function (li) {
          var hit = !q || kata(li.textContent).indexOf(q) !== -1;
          li.hidden = !hit;
          if (hit) n++;
        });
        // 空の状態は絞り込みの結果が0件のときだけ
        list.hidden = n === 0;
        if (empty) empty.hidden = n !== 0;
        clearTimeout(timer);
        if (count && quiet !== true) timer = setTimeout(function () { count.textContent = n + '件'; }, 500);
      };
      input.addEventListener('input', update);
      clear.addEventListener('click', function () { input.value = ''; update(); input.focus(); });
      update(true);
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
      out.innerHTML = '<p class="m-result-line ' + (ok ? 'is-ok' : 'is-ng') + '" role="status">' + (ok ? '正解です。' : 'ちがいます。') + root.getAttribute('data-explain') + '</p>' +
        '<p style="margin:10px 0 0"><button type="button" class="demo-reset" data-again>もう一度選ぶ</button></p>';
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
      submitItem.setAttribute('aria-label', 'まとめて送る（下書き' + drafts + '件）');
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
        msgHost.innerHTML = '<div class="m-submit" role="status">下書き ' + n + ' 件をまとめて送りました</div>';
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
    var box = input.parentNode;
    var tall = Number(input.getAttribute('rows')) > 1; // シートの中は最初から下段にボタン
    function fit() {
      send.hidden = !input.value.trim();
      // 1行に収まるかを、ボタンと同じ行に置いた幅で測る（収まらなければボタンを下段へ）
      box.classList.remove('is-stacked');
      input.style.height = 'auto';
      var cs = getComputedStyle(input);
      var pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      var oneLine = !tall && input.value.indexOf('\n') < 0 && input.scrollHeight <= (parseFloat(cs.lineHeight) || 24) * 1.5 + pad;
      box.classList.toggle('is-stacked', !oneLine);
      input.style.height = 'auto';
      input.style.height = input.scrollHeight + 'px';
    }
    input.addEventListener('input', fit);
    mic.addEventListener('click', function () {
      var on = mic.getAttribute('aria-pressed') !== 'true';
      mic.setAttribute('aria-pressed', String(on));
      mic.setAttribute('aria-label', on ? '音声入力を終了' : '音声入力');
      if (err) err.hidden = true;
    });
    send.addEventListener('click', function () {
      toast('送りました');
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

  // ---------------------------------------------------------- ボトムシート
  init['bottom-sheet'] = function (root) {
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
    $(root, '.m-dialog-ok').addEventListener('click', function () { layer.hidden = true; list.hidden = false; opener.hidden = true; $(root, '[data-reset]').focus(); toast('フォルダを削除しました'); });
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
  init['choice-button'] = function (root) { radios(root); $$(root, '[data-quiz]').forEach(quiz); };
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
    var stateCap = $(root, '[data-state]');
    var i = 0;
    function state(t) { if (stateCap) stateCap.textContent = '状態: ' + t; }
    function draw(moved) {
      if (i >= cards.length) {
        state('おしまい');
        host.innerHTML = '<p class="m-kicker">用語</p><div class="m-complete" style="max-width:none"><div class="m-complete-star" aria-hidden="true">★</div><h3>今日の分はおしまい</h3></div><button type="button" class="demo-reset" data-again>最初から</button>';
        $(host, '[data-again]').addEventListener('click', function () { i = 0; draw(true); });
        if (moved) { var done = $(host, 'h3'); done.setAttribute('tabindex', '-1'); done.focus(); }
        return;
      }
      var c = cards[i];
      state('裏を隠している');
      host.innerHTML =
        '<article class="m-word" aria-label="フラッシュカード">' +
        '<p class="m-kicker">用語 ' + (i + 1) + ' / ' + cards.length + '</p>' +
        '<div class="m-word-card"><span style="font-size:28px;font-weight:800">' + c.q + '</span></div>' +
        '<div data-reveal-area><button type="button" class="m-reveal" aria-label="答えを見せる">タップして答えを見る</button><p class="m-reveal-hint" style="margin-top:8px">答えを思い浮かべてから、タップして確かめよう</p></div>' +
        '</article>';
      if (moved) $(host, '.m-reveal').focus();
      $(host, '.m-reveal').addEventListener('click', function () {
        var area = $(host, '[data-reveal-area]');
        state('裏を開いた');
        area.innerHTML = '<div class="m-meaning">' + c.a + '</div><div class="m-judge" style="margin-top:12px"><button type="button" class="m-btn m-btn--secondary">もう知ってた</button><button type="button" class="m-btn m-btn--primary">覚える</button></div>';
        $$(area, '.m-judge button').forEach(function (b) { b.addEventListener('click', function () { i++; draw(true); }); });
        $(area, '.m-meaning').setAttribute('tabindex', '-1');
        $(area, '.m-meaning').focus();
      });
    }
    draw();
  };


  var ICON_INBOX = '<svg class="m-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/></svg>';
  var ICON_ALERT = '<svg class="m-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>';
  // ---------------------------------------------------------- パターン: 読み込み・空・失敗の状態
  var SKEL_ROWS = '<span class="vh">読み込み中</span><div class="m-skel-rows" aria-hidden="true">' +
    [0, 1, 2].map(function () {
      return '<div class="m-skel-row"><span class="m-skel-lines"><span class="m-skel m-skel--line"></span><span class="m-skel m-skel--line is-short"></span></span></div>';
    }).join('') + '</div>';
  init['loading-states'] = function (root) {
    var area = $(root, '[data-area]');
    var chips = $$(root, '[data-state]');
    var timer;
    var views = {
      loading: SKEL_ROWS,
      content: '<ul class="m-rows"><li><span class="m-row-main"><span class="m-row-title">電球を買い替える</span><span class="m-row-sub">きのう</span></span></li><li><span class="m-row-main"><span class="m-row-title">図書館の本を返す</span><span class="m-row-sub">3日前</span></span></li><li><span class="m-row-main"><span class="m-row-title">棚の位置を決める</span><span class="m-row-sub">先週</span></span></li></ul>',
      empty: '<div class="m-empty"><span class="m-empty-icon">' + ICON_INBOX + '</span><p class="m-empty-title">メモはまだありません</p><p class="m-empty-text">気づいたことを書くと、ここに並びます。</p><button type="button" class="m-btn m-btn--primary" data-toast="メモの入力を開きます">メモを書く</button></div>',
      error: '<div class="m-empty"><span class="m-empty-icon is-danger">' + ICON_ALERT + '</span><p class="m-empty-title">読み込めませんでした</p><p class="m-empty-text">通信が切れている可能性があります。</p><button type="button" class="m-btn m-btn--secondary" data-retry>もう一度読み込む</button></div>'
    };
    function show(state) {
      clearTimeout(timer);
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-state') === state)); });
      area.innerHTML = views[state];
      area.setAttribute('aria-busy', String(state === 'loading'));
      var retry = $(area, '[data-retry]');
      if (retry) retry.addEventListener('click', function () {
        show('loading');
        timer = setTimeout(function () { show('content'); }, 1400);
      });
    }
    chips.forEach(function (c) { c.addEventListener('click', function () { show(c.getAttribute('data-state')); }); });
    show('loading');
  };

  // ---------------------------------------------------------- パターン: 失敗からのやり直し
  init['error-recovery'] = function (root) {
    var input = $(root, 'textarea');
    var msg = $(root, '[data-msg]');
    var send = $(root, '[data-send]');
    var fail = $(root, '[data-fail]');
    send.addEventListener('click', function () {
      if (!input.value.trim()) {
        msg.textContent = '内容を入れてください。';
        msg.style.color = 'var(--danger)';
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      msg.textContent = '';
      msg.removeAttribute('role');
      send.disabled = true;
      send.textContent = '送信中…';
      setTimeout(function () {
        send.disabled = false;
        if (fail.checked) {
          send.textContent = 'もう一度送る';
          msg.setAttribute('role', 'alert');
          msg.style.color = 'var(--danger)';
          msg.textContent = '送れませんでした。通信を確かめて、もう一度送ってください。';
          fail.checked = false;
        } else {
          send.textContent = '送信する';
          msg.style.color = '';
          msg.textContent = '';
          input.value = '';
          toast('送信しました');
          fail.checked = true;
        }
      }, 1200);
    });
  };

  // ---------------------------------------------------------- パターン: 検索と絞り込み
  init['search-and-filter'] = function (root) {
    var q = $(root, '[data-q]');
    var clear = $(root, '[data-clear]');
    var chips = $$(root, '[data-cat]').filter(function (el) { return el.classList.contains('m-chip'); });
    var items = $$(root, '[data-list] > li');
    var empty = $(root, '[data-empty]');
    var list = $(root, '[data-list]');
    var count = $(root, '[data-count]');
    var shown = $(root, '[data-count-visible]');
    var cat = '';
    var timer;
    function norm(t) { return t.toLowerCase().replace(/[ァ-ヶ]/g, function (ch) { return String.fromCharCode(ch.charCodeAt(0) - 0x60); }); }
    function apply(quiet) {
      var t = norm(q.value.trim());
      var n = 0;
      items.forEach(function (li) {
        var hit = (!cat || li.getAttribute('data-cat') === cat) && (!t || norm(li.textContent).indexOf(t) >= 0);
        li.hidden = !hit;
        if (hit) n++;
      });
      list.hidden = n === 0;
      empty.hidden = n !== 0;
      clear.hidden = !q.value;
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-cat') === cat)); });
      // 件数の表示・一覧・空の状態を同じ結果から出す（読み上げは打ち終わるのを待って1回）
      if (shown) shown.textContent = n + '件';
      clearTimeout(timer);
      if (quiet !== true) timer = setTimeout(function () { count.textContent = n + '件'; }, 500);
    }
    q.addEventListener('input', apply);
    clear.addEventListener('click', function () { q.value = ''; apply(); q.focus(); });
    chips.forEach(function (c) { c.addEventListener('click', function () { cat = c.getAttribute('data-cat'); apply(); }); });
    $(root, '[data-reset]').addEventListener('click', function () { q.value = ''; cat = ''; apply(); q.focus(); });
    apply(true);
  };

  // 一覧に戻ったとき、開いた項目にフォーカスを戻し、輪を見せる（マウスで操作したときも）
  function returnFocus(el) {
    if (!el) return;
    el.focus();
    el.classList.add('is-focus-return');
    el.addEventListener('blur', function off() { el.classList.remove('is-focus-return'); el.removeEventListener('blur', off); });
  }

  // ---------------------------------------------------------- 状態付きリスト項目
  init['status-list-item'] = function (root) {
    var listView = $(root, '[data-thread-list]');
    var detail = $(root, '[data-thread-detail]');
    var title = $(root, '[data-thread-title]');
    var stateText = $(root, '[data-thread-state]');
    var opener = null;
    $$(root, '.m-thread').forEach(function (b) {
      b.addEventListener('click', function () {
        opener = b;
        var label = b.getAttribute('aria-label') || '';
        var m = label.match(/（(.+)）$/);
        title.textContent = $(b, '.m-thread-title').textContent;
        stateText.textContent = label.indexOf('完了: ') === 0 ? '完了' : (m ? m[1] : '');
        listView.hidden = true;
        detail.hidden = false;
        title.focus();
      });
    });
    $(root, '[data-thread-back]').addEventListener('click', function () {
      detail.hidden = true;
      listView.hidden = false;
      returnFocus(opener);
    });
  };

  // ---------------------------------------------------------- パターン: 一覧から詳細へ
  init['list-to-detail'] = function (root) {
    var listView = $(root, '[data-list-view]');
    var detail = $(root, '[data-detail-view]');
    var title = $(root, '[data-title]');
    var meta = $(root, '[data-meta]');
    var body = $(root, '[data-body]');
    var data = [
      { t: '11月15日 散歩', m: '32分 ・ 2.4km ・ 晴れ', b: '川沿いを往復しました。途中で少し休みました。' },
      { t: '11月13日 ストレッチ', m: '15分', b: '肩と背中を中心に。寝る前に行いました。' },
      { t: '11月10日 散歩', m: '45分 ・ 3.1km ・ くもり', b: '公園を2周しました。' }
    ];
    var opener = null;
    var timer;
    $$(root, '[data-open]').forEach(function (b) {
      b.addEventListener('click', function () {
        opener = b;
        var d = data[+b.getAttribute('data-open')];
        listView.hidden = true;
        detail.hidden = false;
        title.textContent = d.t;
        meta.textContent = d.m;
        body.innerHTML = SKEL_ROWS;
        body.setAttribute('aria-busy', 'true');
        title.focus();
        clearTimeout(timer);
        timer = setTimeout(function () {
          body.innerHTML = '<p class="m-card-body" style="margin:0">' + d.b + '</p>';
          body.setAttribute('aria-busy', 'false');
        }, 900);
      });
    });
    $(root, '[data-back]').addEventListener('click', function () {
      clearTimeout(timer);
      detail.hidden = true;
      listView.hidden = false;
      returnFocus(opener);
    });
  };

  $$(document, '[data-demo]').forEach(function (root) {
    var f = init[root.getAttribute('data-demo')];
    if (f) f(root);
  });
})();
