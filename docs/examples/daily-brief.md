# 適用例: Daily Brief

Muse DS の部品だけで組んだ Daily Brief です。[読み物ページの型](../patterns.md#a-読み物ページの型)に当てはめています。画面の見本は静的ページ版 v0.3 の「適用例」にあります。

## 組み立て

| 順 | 中身 | 使った部品 |
| --- | --- | --- |
| 1 | 日付と更新時刻、「おはよう、サンプルユーザー」、天気と睡眠 | ページ見出し（Display）＋[チップ](../components/chip-and-tag.md) |
| 2 | まめだいふくからの要約 | 要約カード（[セクションカード](../components/section-card.md)の変形） |
| 3 | 今日の予定 | セクションカード＋[予定行](../components/list-rows.md)＋凡例、タグ「家族カレンダー」 |
| 4 | 体の数字 | セクションカード＋[数値タイル＋メーター](../components/list-rows.md)、タグ「サンプル」 |
| 5 | 今日のやること | セクションカード＋[タスク行](../components/list-rows.md) |
| 6 | 読みかけ | セクションカード（本文だけ） |
| 7 | 明日のリマインド | セクションカード（本文だけ） |

## 使っていない部品

[吹き出し](../components/message-bubble.md)と[入力欄](../components/input-and-switch.md)は使っていません。読み物なので会話の形にはしていません（パターン A の判断）。
