# 一覧から詳細へ（List to Detail）

**よくある型である理由:** 項目を一覧で見せ、1件を選ぶとその詳細を開き、戻ると一覧の同じ場所に帰る流れは、メール・記録・商品など一覧を持つ製品の基本の型です（[Android の List-detail layout](https://developer.android.com/develop/ui/compose/layouts/adaptive/list-detail)、[Polaris の Resource index layout](https://polaris-react.shopify.com/patterns/resource-index-layout) と [Resource details layout](https://polaris-react.shopify.com/patterns/resource-details-layout)）。

**使っているところ:** 筋トレ記録（履歴の一覧 → その日の記録）、学習ノート（本棚 → ノート）、スライドエディタ（デッキの一覧 → デッキ）。

## 概要

一覧の1件を押すと詳細の画面を開き、左上の戻る操作で一覧に帰る型です。狭い画面では一覧と詳細を入れ替え、広い画面では左右に並べてよいものとします。

## 組み合わせ

- 一覧: [リスト行](../components/list-rows.md)、[メディアカード](../components/media-card.md)、[状態付きリスト項目](../components/status-list-item.md)（1件全体が押せる）
- 詳細の上端: 戻るの[アイコンボタン](../components/icon-button.md)＋題（Heading 段）＋メタ情報
- 詳細の中身: [セクションカード](../components/section-card.md)など
- 詳細の読み込み: [読み込み・空・失敗の状態](loading-states.md)

## 流れ

| 段階 | 見た目 | 次へ |
| --- | --- | --- |
| 一覧 | 1件ずつ、押せる範囲を行全体にする | 1件を押した |
| 詳細 | 上端に戻る ← と題。中身を読み込む間はスケルトン | 戻るを押した |
| 一覧に戻る | 開く前のスクロール位置と絞り込みのまま。開いていた項目にフォーカスを戻す | |

- 詳細の題は、一覧で押した項目の題と同じことばにする（どこに来たかが分かるように）。
- 詳細で変えたこと（完了・削除など）は、戻った一覧にすぐ反映する。
- 戻る操作は詳細の左上の1か所にまとめる。ブラウザや端末の「戻る」でも同じ動きにする。

## 使うとき

- 1件ごとに中身が多く、一覧の中では見せきれないもの

## 使わないとき

- 1件の中身が短い → 一覧の行の中で開閉する
- 一時的な入力や選択 → [ボトムシート](../components/bottom-sheet.md)

## アクセシビリティ

- 一覧の1件は `<a>`（詳細に URL があるとき）か `<button>` にし、`aria-label` に「〇〇を開く」を入れる。
- 詳細を開いたら題の見出しにフォーカスを移す。戻ったら開いた項目にフォーカスを戻す。
- 戻るのアイコンボタンは `aria-label="一覧に戻る"` にする。

## 関連

- [リスト行](../components/list-rows.md)
- [メディアカード](../components/media-card.md)
- [アイコンボタン](../components/icon-button.md)
- [読み込み・空・失敗の状態](loading-states.md)
