# アクセシビリティ

すべての部品が守る基準です。部品ごとの文書の「アクセシビリティ」には、ここに足すことだけを書きます。目標は WCAG 2.2 の AA です。

## 基準

- **タップ範囲は 44px 以上。** 見た目が小さい部品（タグ以外の押せるもの）も、押せる範囲は `--size-tap-target` を確保する。
- **フォーカスは常に見える。** キーボードで移動したとき、フォーカスの位置が分かる形を必ず出す（`:focus-visible`）。`outline: none` だけで消さない。
- **本文と背景のコントラストは 4.5:1 以上。** 18px 以上の太字や 24px 以上の文字、アイコンや枠などの UI 部品は 3:1 以上。
- **色だけで状態を伝えない。** 完了はチェックと打ち消し線、選択は面の色と文字色、エラーは文も添える、のように色以外の形も変える。
- **動きは止められる。** `prefers-reduced-motion: reduce` のときはアニメーションを止める。
- **アイコンだけの操作には名前を付ける。** タブバーなど文字のない操作は `aria-label` で読み上げの名前を付ける。

## コントラスト比

semantic の色の組み合わせごとの比です（WCAG 2.x の計算式）。v0.7.0 で、本文に使う組み合わせはすべて 4.5:1 以上になりました（[決定記録 0003](../decisions/0003-color-and-contrast.md)）。

### ライト

| 文字・部品 | 面 | 比 | 判定 |
| --- | --- | --- | --- |
| `--text` | `--surface` | 19.5 | 本文 OK |
| `--text` | `--bg` | 16.8 | 本文 OK |
| `--dim` | `--surface` | 8.6 | 本文 OK |
| `--dim` | `--bg` | 7.4 | 本文 OK |
| `--faint` | `--surface` | 5.4 | 本文 OK |
| `--faint` | `--bg` | 4.7 | 本文 OK |
| `--faint` | `--fill` | 4.8 | 本文 OK |
| `--accent-ink` | `--accent` | 4.6 | 本文 OK |
| `--accent` | `--surface` | 4.6 | 本文 OK |
| `--accent` | `--bg` | 3.9 | UI 部品・大きい文字だけ OK（小さい文字には使わない） |
| `--accent-strong` | `--surface` | 5.6 | 本文 OK |
| `--accent-strong` | `--bg` | 4.8 | 本文 OK |
| `--accent-strong` | `--accent-soft` | 5.0 | 本文 OK |
| `--danger` | `--surface` | 4.8 | 本文 OK |
| `--danger` | `--bg` | 4.2 | UI 部品・大きい文字だけ OK（小さい文字には使わない） |
| `--danger-ink` | `--danger` | 4.8 | 本文 OK |
| `--ok` | `--surface` | 4.9 | 本文 OK |
| `--ok-ink` | `--ok` | 4.9 | 本文 OK |
| `--text` | `--ok-soft` | 16.8 | 本文 OK |
| `--ok` | `--ok-soft` | 4.3 | 大きい文字（18px 以上の太字）OK |
| `--text` | `--danger-soft` | 17.0 | 本文 OK |
| `--danger` | `--danger-soft` | 4.2 | 大きい文字（18px 以上の太字）OK |
| `--gold-ink` | `--gold` | 6.5 | 本文 OK |
| `--bubble-user-ink` | `--bubble-user` | 4.6 | 本文 OK |
| `--accent`（フォーカスの輪） | `--bg` | 3.9 | フォーカスの輪 OK |
| `--accent`（フォーカスの輪） | `--surface` | 4.6 | フォーカスの輪 OK |

### ダーク

| 文字・部品 | 面 | 比 | 判定 |
| --- | --- | --- | --- |
| `--text` | `--surface` | 17.8 | 本文 OK |
| `--text` | `--bg` | 21.0 | 本文 OK |
| `--dim` | `--surface` | 10.4 | 本文 OK |
| `--dim` | `--bg` | 12.3 | 本文 OK |
| `--faint` | `--surface` | 5.7 | 本文 OK |
| `--faint` | `--bg` | 6.8 | 本文 OK |
| `--faint` | `--fill` | 5.0 | 本文 OK |
| `--accent-ink` | `--accent` | 7.9 | 本文 OK |
| `--accent` | `--surface` | 7.2 | 本文 OK |
| `--accent` | `--bg` | 8.5 | 本文 OK |
| `--accent-strong` | `--surface` | 9.6 | 本文 OK |
| `--accent-strong` | `--bg` | 11.3 | 本文 OK |
| `--accent-strong` | `--accent-soft` | 8.0 | 本文 OK |
| `--danger` | `--surface` | 6.4 | 本文 OK |
| `--danger` | `--bg` | 7.5 | 本文 OK |
| `--danger-ink` | `--danger` | 7.0 | 本文 OK |
| `--ok` | `--surface` | 8.9 | 本文 OK |
| `--ok-ink` | `--ok` | 9.8 | 本文 OK |
| `--text` | `--ok-soft` | 15.4 | 本文 OK |
| `--ok` | `--ok-soft` | 7.7 | 大きい文字（18px 以上の太字）OK |
| `--text` | `--danger-soft` | 15.3 | 本文 OK |
| `--danger` | `--danger-soft` | 5.5 | 大きい文字（18px 以上の太字）OK |
| `--gold-ink` | `--gold` | 10.6 | 本文 OK |
| `--bubble-user-ink` | `--bubble-user` | 7.9 | 本文 OK |
| `--accent`（フォーカスの輪） | `--bg` | 8.5 | フォーカスの輪 OK |
| `--accent`（フォーカスの輪） | `--surface` | 7.2 | フォーカスの輪 OK |

3:1 台の組み合わせの使い方:

- `--accent` と `--danger` は、`--bg` の上では小さい文字に使わない。ブルーの文字は `--accent-strong`、赤の小さい文字は `--surface` の上（カードやシートの中）に置く。
- `--ok`・`--danger` を `--ok-soft`・`--danger-soft` の上に置くのは、18px 以上の太字（結果バナーの判定の文など）と枠だけ。小さい文字は `--text` にする。
- `--gold` は文字に使わない（白の面の上で 1.8:1）。金色の面の上は `--gold-ink`。

## 状態の見せ方

- **完了は色と形で。** 題を `--faint` にし、打ち消し線とチェックの印を付ける。行全体を不透明度で薄くしない（0.7 にすると `--dim` の題でも 4.0:1 に落ちる）。
- **無効は不透明度 0.4。** 押せない部品は WCAG のコントラストの対象外だが、DS では値を 0.4 にそろえる。押せない理由は文で添える。
- **正誤は印でも。** 選択肢の正解・不正解は、枠と面の色に加えて ✓ ✗ を付ける。

## タップ範囲

見た目が小さい部品（32px の丸ボタン、36px の四角のアイコンボタンなど）は、見た目を変えずに押せる範囲を外側に広げて 44px 四方にします（`::after` を外側に広げるなど）。リンクやメニューの項目も同じで、押せる範囲の高さは 44px 以上にします。

## フォーカスの見せ方

フォーカスは `--accent` の 2px の輪で示します。部品から 2px 離して描きます。

```css
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

輪と、その外側の面（`--bg` または `--surface`）との比は、ライトで 3.9〜4.6:1、ダークで 7.2〜8.5:1 で、WCAG 2.2 のフォーカスの見え方の基準（3:1）を満たします。入力欄は、輪に加えて枠も `--accent` に変えます。`--accent-soft` はフォーカスの輪に使いません（面に対して 1.1〜1.2:1 で見えないため）。
