# 検索と絞り込み（Search and Filter）

**よくある型である理由:** 項目が増えた一覧から目当てのものを探すために、ことばで探す検索と、分類で減らす絞り込みを一覧の上に置く型は、一覧を持つ製品の多くにあります（[Carbon の Search pattern](https://carbondesignsystem.com/patterns/search-pattern/)、[Carbon の Filtering](https://carbondesignsystem.com/patterns/filtering/)、[Polaris の Resource index layout](https://polaris-react.shopify.com/patterns/resource-index-layout)）。

**使っているところ:** 筋トレ記録（種目の一覧を部位のチップで絞り込む）、日々のレポートのスペース（絵文字を名前で探す）。

## 概要

一覧の上に[検索フィールド](../components/search-field.md)か絞り込みの[チップ](../components/chip-and-tag.md)を置き、打つ・選ぶたびにその場で一覧を減らす型です。結果が0件のときは、条件を外す操作を添えて知らせます。

## 組み合わせ

- 検索: [検索フィールド](../components/search-field.md)（打つたびに絞り込む）
- 絞り込み: [チップ](../components/chip-and-tag.md)の選択中（「すべて」を先頭に置く）
- 一覧: [リスト行](../components/list-rows.md)などの中身の部品
- 0件: [空の状態](../components/empty-state.md)の「見つからない」＋「条件を外す」

## 状態の移り方

| 状態 | 見た目 | 次へ |
| --- | --- | --- |
| 条件なし | 一覧のすべて。チップは「すべて」が選択中 | 打つ・チップを選ぶ |
| 絞り込み中 | 条件に合う項目だけ。件数を読み上げで伝える | 条件を変える・外す |
| 0件 | 一覧の場所に「見つかりませんでした」と「条件を外す」 | 外したら条件なしへ |

- 確定のボタンを置かない。打つ・選ぶたびに結果を変える（端末の中で済む件数のとき）。
- 検索と絞り込みを両方置くときは、両方の条件を重ねて効かせ、「条件を外す」で両方を戻す。
- 条件は一覧を閉じたら消す。

## 使うとき

- 10件を超える一覧から目当てを探す（検索）、分類のはっきりした一覧を分けて見る（絞り込み）

## 使わないとき

- 数件しかない一覧（全部見えるので要らない）
- サーバーに問い合わせて時間がかかる検索 → 確定してから探し、[読み込み・空・失敗の状態](loading-states.md)を出す

## アクセシビリティ

- 検索は `<search>`（または `role="search"`）で包み、欄に `aria-label` を付ける。
- 絞り込みのチップは `role="group"` と `aria-label`（「分類で絞り込む」）で包み、各チップに `aria-pressed` を付ける。
- 件数は `role="status"` の領域で、少し待ってから伝える。

## 関連

- [検索フィールド](../components/search-field.md)
- [チップとタグ](../components/chip-and-tag.md)
- [空の状態](../components/empty-state.md)
