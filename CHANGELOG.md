# Changelog

この文書には Muse DS の変更を版ごとに記録します。書き方は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/)、版の付け方は [Semantic Versioning](https://semver.org/lang/ja/) に従います。詳しくは [docs/versioning.md](docs/versioning.md)。

## [Unreleased]

## [0.4.0] - 2026-11-17

学習ノートを Muse DS で作り直すときに足りなかった部品を足した版。

### Added

- 学習ノートの部品12件の文書: コースパス、今ここストリップ、プレイヤートップバー、単語カード、クイズ選択肢、結果バナー、模範解答ボックス、質問ボックス、読み上げボタン、章完了パネル、本棚カバーカード、コース切替パネル。
- パターン「D. 時間で区切るセッションの型」（単語 → 復習 → 講義の段階の切り替え）。
- 判断待ちの点に「学習ノート由来の部品」の7件（11〜17）。金色、正解・不正解の薄い面、コースの色、紙吹雪の色、正誤の印、段にない寸法、アイコン。トークンは足していない。

## [0.3.0] - 2026-11-17

静的ページのドキュメントとして作った v0.3 を、このリポジトリに移した最初の版。

### Added

- 4層のドキュメント構成（原則／ファウンデーション／コンポーネント／パターン）を Markdown に移した。
- `tokens/tokens.json`: Design Tokens 形式で、primitive（値）と semantic（役割）の2層に分けた。ダークモードの値も持つ。
- `tokens/tokens.css`: `tokens.json` から生成する CSS 変数。`data-theme` でライト／ダークを固定できる。
- `scripts/build-tokens.mjs`: `tokens.css` の生成と一致確認。
- 部品ドキュメントのテンプレート（概要／使うとき／使わないとき／バリアント／状態／仕様／アクセシビリティ）と、9部品の文書。
- ファウンデーションに、トークンの階層、Tailwind との対応、アクセシビリティの基準とコントラスト比の表を足した。
- 決定記録（`docs/decisions/`）と判断待ちの一覧（`docs/open-questions.md`）。

### Changed

- 色の値を、Muse DS を適用済みのアプリ（jin-toreji-lu）の実値に合わせた。静的ページ版 v0.3 の値との違いは [ADR 0001](docs/decisions/0001-tokens-follow-app-theme.md) に記録した。
- CSS 変数の名前を、適用済みアプリの名前（`--text`、`--dim`、`--border`、`--accent`）に揃えた。v0.3 の名前との対応は [foundations/color.md](docs/foundations/color.md#名前の対応) にある。
