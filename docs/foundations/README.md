# ファウンデーション

色・文字・余白・角丸・影のトークンと、アイコンの組、アクセシビリティの基準です。すべての部品はここの値だけを使います。

- [色](color.md)
- [タイポグラフィ](typography.md)
- [余白・角丸・影](spacing-radius-elevation.md)
- [アイコン](icons.md)
- [アクセシビリティ](accessibility.md)

## トークンの階層

トークンは2層で持ちます。

```
primitive（値）            semantic（役割）              部品
color.blue.600  #0073E6 ─▶ color.accent      ─▶ プライマリボタンの面
color.neutral.0 #FFFFFF ─▶ color.surface     ─▶ セクションカードの面
radius.20       20px    ─▶ radius.card       ─▶ セクションカードの角丸
```

| 層 | 役割 | 名前の付け方 | 部品から使うか |
| --- | --- | --- | --- |
| primitive | 使える値の一覧。値そのもの | 色相と明るさ（`blue.600`）、または値（`space.14`） | 使わない |
| semantic | 値に役割を与える。ライトとダークで値が変わる | 役割（`accent`、`surface`、`card-gap`） | 使う |

決め事:

- **部品は semantic だけを参照する。** `#0073E6` や `blue.600` を部品の CSS に直接書かない。ダークモードの切り替えは semantic で起きるので、primitive を直接使うとダークで壊れる。
- **新しい値は primitive に足してから、semantic で役割を付ける。** 役割の決まっていない値は semantic に出さない。
- **ダークモードは名前を変えずに値だけを切り替える。** `tokens.json` では `$extensions.com.muse.modes.dark` に primitive の参照を書く。
- **CSS に出すのは semantic だけ。** `tokens.css` には primitive の変数がない。使えない値を最初から選べないようにするため。

部品ごとのトークン（`button.primary.bg` のような第3層）は、v0.3 では持ちません。部品の実装ライブラリを作るときに検討します。

## ファイル形式

`tokens/tokens.json` は [Design Tokens Community Group](https://www.designtokens.org/) の形式です。

- 各トークンは `$value` を持ち、`$type`（`color`、`dimension`、`fontFamily`、`fontWeight`、`shadow`）はグループに付けて下に継承させる。
- 別のトークンを参照するときは `{primitive.color.blue.600}` と書く。
- 説明は `$description` に書く。`tokens.css` にはコメントとして出る。

同じ形式は Style Dictionary や Figma の Tokens Studio でも読めます。

## CSS 変数の一覧

| グループ | 変数 |
| --- | --- |
| 色 | `--bg` `--surface` `--fill` `--text` `--dim` `--faint` `--border` `--accent` `--accent-ink` `--accent-strong` `--accent-soft` `--danger` `--danger-ink` `--danger-soft` `--ok` `--ok-ink` `--ok-soft` `--bubble-user` `--bubble-user-ink` `--gold` `--gold-ink` `--scrim` `--scrim-strong` `--cal-common` `--cal-self` `--cal-partner` |
| 影 | `--shadow-card` `--shadow-float` |
| 角丸 | `--radius-small` `--radius-row` `--radius-card` `--radius-pill` |
| 余白 | `--space-inner` `--space-row` `--space-card-gap` `--space-card-padding` `--space-section` |
| 大きさ | `--size-tap-target` |
| 書体 | `--font-sans` `--font-mono` |
| 文字サイズ | `--text-2xs` 〜 `--text-5xl` と、それぞれの `--line-height` |

## Tailwind CSS との対応

適用済みのアプリ（jin-toreji-lu）は Tailwind CSS v4 で、`@theme` に次の値を入れています。

| Tailwind | 値 | Muse DS |
| --- | --- | --- |
| `rounded-sm` / `rounded-md` | 6px | `--radius-small` |
| `rounded-lg` / `rounded-xl` | 12px | `--radius-row` |
| `rounded-2xl` | 20px | `--radius-card` |
| `rounded-full` | 9999px | `--radius-pill`（999px） |
| `text-xs` 〜 `text-5xl` | 12px 〜 48px | `--text-xs` 〜 `--text-5xl`（同じ値） |
| `text-[11px]` | 11px | `--text-2xs` |
| `bg-black/40`・`bg-black/70` | 黒の 40%・70% | `--scrim`・`--scrim-strong` |
| `disabled:opacity-40` | 0.4 | 無効の不透明度（トークンなし。[アクセシビリティ](accessibility.md#状態の見せ方)） |
| `font-sans` | Figtree, Noto Sans JP | `--font-sans` |

Muse DS の角丸の変数名（`small`／`row`／`card`／`pill`）は、Tailwind の `--radius-sm` などと重ならないように付けています。同じアプリで両方を読み込んでも上書きし合いません。
