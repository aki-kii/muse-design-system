# 失敗からのやり直し（Error Recovery）

**よくある型である理由:** 送信・保存・作成などの操作は、どの製品でも通信や処理の失敗で止まることがあります。そのときに入力を失わず、何が起きたかと次の一手をその場で示す流れは、エラー処理の基本の型です（[GOV.UK の Recover from validation errors](https://design-system.service.gov.uk/patterns/validation/)、[NN/g の Error-Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/)、[Primer の Degraded experiences](https://primer.style/ui-patterns/degraded-experiences)）。

**使っているところ:** 学習ノート（採点・作成・質問の送信が失敗したとき、入力を残して「もう一度」を出す）、入力バーの音声入力のエラー。

## 概要

本人が始めた操作が失敗したときに、入力をそのまま残し、失敗したことと理由を操作のすぐ近くに文で出し、同じ操作をもう一度できるようにする流れです。

## 組み合わせ

- 操作: [ボタン](../components/button.md)（送信中は無効にして文を変える）
- 入力: [入力欄](../components/input-and-switch.md)・[入力バー](../components/memo-input-bar.md)（失敗しても中身を消さない）
- 知らせ: 操作の近くに `--danger` の文（[入力欄](../components/input-and-switch.md)のエラーと同じ出し方）

## 流れ

| 段階 | 見た目 | 次へ |
| --- | --- | --- |
| 実行中 | ボタンを押せなくし、文を「送信中…」のように変える | 成功か失敗 |
| 成功 | 結果を出し、入力を空に戻す。必要なら[トースト](../components/toast.md) | |
| 失敗 | 入力を残したまま、ボタンを押せる状態に戻す。ボタンの近くに「送れませんでした。もう一度試してください」のように、何が起きたかと次の一手を1文で出す | もう一度押したら実行中へ |

- 失敗の文は操作のすぐ近くに出す。画面の上の帯やトーストだけで知らせない（消えると読めない）。
- 入力の中身が原因の失敗（形式の誤り）は、その欄のヒントの位置に出し、欄にフォーカスを戻す。
- ボタンの文を「もう一度送る」に変えてよい。
- 何度も失敗するときも、同じ流れのまま。勝手に繰り返し送らない。

## 使うとき

- 本人が押して始めた送信・保存・作成・採点などの操作が失敗したとき

## 使わないとき

- 画面を開いたときの読み込みの失敗 → [読み込み・空・失敗の状態](loading-states.md)
- 取り消せない操作の前の確認 → [確認をはさむ操作](approval-flow.md)

## アクセシビリティ

- 失敗の文は `role="alert"` で伝える（本人の操作の結果なので割り込んでよい）。
- 欄の誤りは `aria-invalid="true"` と `aria-describedby` で欄に結び付ける。
- 失敗は赤い色だけでなく文で伝える。

## 関連

- [ボタン](../components/button.md)
- [入力欄とスイッチ](../components/input-and-switch.md)
- [読み込み・空・失敗の状態](loading-states.md)
