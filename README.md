# Muse Design System

アプリ「Muse」の見た目（近白の面、ブルー1色、ピル型、大きめの角丸）を、どのスペースやアプリでも同じように再現するためのデザインシステムです。値（トークン）、部品（コンポーネント）、使い分け（ガイド）をまとめています。

このリポジトリはドキュメントとトークンだけを持ちます。部品の実装ライブラリは含みません。

- 現在の版: **v0.4.0**（[CHANGELOG](CHANGELOG.md)）
- トークンの値は、Muse DS を適用済みのアプリ（jin-toreji-lu の `client/src/theme.css`）の実値と一致させています。

## 構成

ドキュメントは4層です。上の層ほど判断の基準になり、下の層ほど具体的になります。

| 層 | 中身 | 場所 |
| --- | --- | --- |
| 1. 原則 | 判断に迷ったときに戻る4つの決め事 | [docs/principles.md](docs/principles.md) |
| 2. ファウンデーション | 色・文字・余白・角丸・影のトークンと、アクセシビリティの基準 | [docs/foundations/](docs/foundations/README.md) |
| 3. コンポーネント | 再利用する部品。部品ごとに1ファイル | [docs/components/](docs/components/README.md) |
| 4. パターン | 部品の組み合わせの型 | [docs/patterns.md](docs/patterns.md) |

そのほか:

- 適用例: [docs/examples/daily-brief.md](docs/examples/daily-brief.md)
- 決めたことの記録: [docs/decisions/](docs/decisions/README.md)
- 判断待ちの点: [docs/open-questions.md](docs/open-questions.md)
- 版の付け方: [docs/versioning.md](docs/versioning.md)

```
.
├── README.md
├── CHANGELOG.md
├── package.json              版番号（semver）と npm scripts
├── tokens/
│   ├── tokens.json           正。Design Tokens 形式（primitive → semantic）
│   └── tokens.css            tokens.json から生成した CSS 変数
├── scripts/
│   └── build-tokens.mjs      tokens.css の生成と一致確認（依存なし）
└── docs/
    ├── principles.md
    ├── foundations/          トークンの考え方・色・書体・余白と角丸・アクセシビリティ
    ├── components/           部品ごとの文書（テンプレート統一）
    ├── patterns.md
    ├── examples/
    ├── decisions/            決定記録（ADR）
    ├── open-questions.md
    └── versioning.md
```

## 使い方

### 1. トークンを取り込む

CSS 変数として使うときは `tokens/tokens.css` を読み込みます。ライトとダークの両方が入っていて、OS の設定に従います。`<html data-theme="light">` または `data-theme="dark"` で固定もできます。

```css
@import url("./muse-design-system/tokens/tokens.css");

.card {
  background: var(--surface);
  border-radius: var(--radius-card);
  padding: var(--space-card-padding);
  box-shadow: var(--shadow-card);
}
```

ほかのリポジトリから取り込むときは、git の依存として入れられます（private のため、取り込む側にこのリポジトリの読み取り権限が要ります）。

```sh
npm install git+https://github.com/aki-kii/muse-design-system.git#v0.4.0
```

```css
@import "muse-design-system/tokens.css";
```

書体は Google Fonts から別に読み込みます。

```css
@import url("https://fonts.googleapis.com/css2?family=Figtree:wght@400..900&family=Noto+Sans+JP:wght@400..900&display=swap");
```

Tailwind CSS v4 のアプリで使うときの対応は [foundations/README.md](docs/foundations/README.md#tailwind-css-との対応) にあります。

### 2. 画面を作るときの手順

1. **トークンから選ぶ。** 色・余白・文字サイズはファウンデーションの値からだけ選ぶ。新しい値が要るときは、先に `tokens/tokens.json` に登録する。
2. **部品で組む。** 画面はコンポーネントの組み合わせで作る。似た部品があるときは、各部品の「使うとき／使わないとき」で選び分ける。
3. **型に当てはめる。** ページ全体の形はパターンから選ぶ。読み物には「読み物ページの型」、確認が要る操作には「承認をはさむ型」を当てる。

### 3. トークンを変えるとき

`tokens/tokens.json` を直してから、`tokens.css` を作り直します。`tokens.css` は直接編集しません。

```sh
npm run tokens         # tokens.css を作り直す
npm run tokens:check   # tokens.css が tokens.json と一致しているか確かめる
```

変更は [CHANGELOG.md](CHANGELOG.md) に書き、[版の付け方](docs/versioning.md) に従って版を上げます。

## 今後の課題

- **CI。** `npm run tokens:check` と Markdown のリンク確認を GitHub Actions で回す。ワークフローのファイルはこのリポジトリにまだ入れていない。
- **コントラストの自動確認。** semantic の色の組み合わせ（文字と面）について、4.5:1 以上かどうかを `tokens.json` から計算して確かめるスクリプト。
- **Style Dictionary への移行。** 出力先（Swift、Tailwind の `@theme` など）が増えたら、自作スクリプトから Style Dictionary に切り替える。`tokens.json` は同じ形式のまま使える。
