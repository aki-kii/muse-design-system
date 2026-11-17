# コンポーネント

部品の見本帳です。新しい画面を作るときは、まずここにある部品で組めないかを見ます。

どの部品も同じ [テンプレート](_template.md) で書いています: 概要／使うとき／使わないとき／バリアント／状態／仕様／アクセシビリティ／関連。この部品集の中心は「使うとき／使わないとき」です。

ここに置くのは、**中身に依存しない汎用の部品だけ**です。特定のアプリでしか使わない部品の組み合わせ（複合体）は[パターン](../patterns.md#アプリ固有の複合体)に置きます。どちらに置くかの基準は下の「[収載の基準](#収載の基準)」にあります。

## 一覧

### 操作と入力

| 部品 | 一言 |
| --- | --- |
| [ボタン](button.md) | 操作を始める。強さは3段＋危険のゴースト |
| [アイコンボタン](icon-button.md) | アイコン1つで示す補助の操作。丸と四角 |
| [チップとタグ](chip-and-tag.md) | チップは押せる小さな情報、タグは押せない分類ラベル |
| [選択肢ボタン](choice-button.md) | 2〜4個から1つを選ぶ大きなボタンの組。判定の状態も持てる |
| [入力欄とスイッチ](input-and-switch.md) | ラベル＋欄＋ヒント。スイッチは即時に効く設定だけ |
| [入力バー](memo-input-bar.md) | 丸い欄にマイクと送信の丸ボタン。会話の入力 |
| [完了トグル・完了バッジ](done-toggle.md) | 緑のチェックの丸。トグルは付け外し、バッジは印 |
| [ナビゲーション](navigation.md) | 広い画面はサイドバー、狭い画面はタブバー |

### 内容を並べる

| 部品 | 一言 |
| --- | --- |
| [セクションカード](section-card.md) | 読み物ページの基本単位。1カード＝1つの話題 |
| [リスト行](list-rows.md) | 予定行・タスク行・数値タイル＋メーターの3種 |
| [状態付きリスト項目](status-list-item.md) | 1件ずつ「誰の番か・作業中か」の状態を持つ一覧の項目 |
| [メディアカード](media-card.md) | サムネイル＋タイトル＋メタ情報の押せるカード |
| [進捗パス](progress-path.md) | 順番のある段階をノードと線でつなぎ、現在地を見せる |
| [フラッシュカード](flashcard.md) | 表で問い、裏を開いて自己判定する |
| [吹き出し](message-bubble.md) | 会話のための部品。チャット画面だけで使う |

### 重ねて出す・知らせる

| 部品 | 一言 |
| --- | --- |
| [承認カード](approval-card.md) | 外部に触る操作の前に止まって確認を取る |
| [シートモーダル](sheet-modal.md) | 下からせり上がる板に1つの作業だけを入れる |
| [確認ダイアログ](confirm-dialog.md) | 取り消せない削除の前に中央で聞く |
| [長押しメニュー](long-press-menu.md) | 項目の長押しで、その項目への操作を出す |
| [スピードダイヤルFAB](speed-dial-fab.md) | 右下の ＋ から作る系の操作を開く。件数バッジ |
| [トースト](toast.md) | 操作の結果を短く知らせる |
| [作業中インジケータ](typing-indicator.md) | 3つの点が跳ねる。色付きとニュートラル |

## 移した部品

v0.4.0・v0.5.0 でアプリから足した部品のうち、そのアプリでしか使わない複合体は、v0.6.0 で[パターン](../patterns.md#アプリ固有の複合体)に移しました。元の場所には移行先への案内を残しています。

| 部品 | 移行先 | 汎用の核（このページの部品） |
| --- | --- | --- |
| [コースパス](../patterns/learning-note/course-path.md) | 学習ノート | [進捗パス](progress-path.md) |
| [今ここストリップ](../patterns/learning-note/now-strip.md) | 学習ノート | [進捗パス](progress-path.md)の現在地＋[セクションカード](section-card.md)の面 |
| [プレイヤートップバー](../patterns/learning-note/player-top-bar.md) | 学習ノート | [アイコンボタン](icon-button.md)＋[リスト行](list-rows.md)のメーター |
| [単語カード](../patterns/learning-note/word-card.md) | 学習ノート | [フラッシュカード](flashcard.md) |
| [クイズ選択肢](../patterns/learning-note/quiz-option.md) | 学習ノート | [選択肢ボタン](choice-button.md) |
| [結果バナー](../patterns/learning-note/result-banner.md) | 学習ノート | なし（保留） |
| [模範解答ボックス](../patterns/learning-note/model-answer-box.md) | 学習ノート | なし |
| [質問ボックス](../patterns/learning-note/ask-box.md) | 学習ノート | [入力欄](input-and-switch.md)＋[ボタン](button.md) |
| [読み上げボタン](../patterns/learning-note/speak-button.md) | 学習ノート | [アイコンボタン](icon-button.md) |
| [章完了パネル](../patterns/learning-note/chapter-complete-panel.md) | 学習ノート | なし（保留） |
| [本棚カバーカード](../patterns/learning-note/shelf-cover-card.md) | 学習ノート | [メディアカード](media-card.md) |
| [コース切替パネル](../patterns/learning-note/course-switcher.md) | 学習ノート | [シートモーダル](sheet-modal.md)＋[アイコンボタン](icon-button.md) |
| [デッキカード](../patterns/slide-editor/deck-card.md) | スライドエディタ | [メディアカード](media-card.md) |
| [デッキヘッダー](../patterns/slide-editor/deck-header.md) | スライドエディタ | [アイコンボタン](icon-button.md) |
| [スライドステージ](../patterns/slide-editor/slide-stage.md) | スライドエディタ | なし |
| [ページカウンタ行](../patterns/slide-editor/page-counter-row.md) | スライドエディタ | なし |
| [スレッドカード](../patterns/slide-editor/thread-card.md) | スライドエディタ | [状態付きリスト項目](status-list-item.md) |
| [確認待ちバッジ](../patterns/slide-editor/awaiting-badge.md) | スライドエディタ | [状態付きリスト項目](status-list-item.md)の先頭の印 |
| [タイピングストリップ](../patterns/slide-editor/typing-strip.md) | スライドエディタ | [作業中インジケータ](typing-indicator.md) |
| [依頼行](../patterns/slide-editor/request-row.md) | スライドエディタ | [状態付きリスト項目](status-list-item.md) |
| [ページプレビューカード](../patterns/slide-editor/page-preview-card.md) | スライドエディタ | なし |
| [位置ラジオ](../patterns/slide-editor/position-radio.md) | スライドエディタ | [選択肢ボタン](choice-button.md) |
| [送信完了メッセージ](../patterns/slide-editor/submit-message.md) | スライドエディタ | [トースト](toast.md) |

吹き出しに足していた「下書き」の状態とスライドエディタの値の違いは、[スレッドの会話](../patterns/slide-editor/thread-conversation.md)に移しました。

## 収載の基準

[GOV.UK Design System の収載基準](https://design-system.service.gov.uk/community/contribution-criteria/)と、[Carbon の Core と拡張の分け方](https://carbondesignsystem.com/contributing/overview/)にならい、次のように決めています。詳しくは[決定記録 0002](../decisions/0002-component-admission.md)。

1. **中身に依存しないものだけをここに置く。** 部品の名前・状態・文に、特定のアプリの言葉（デッキ・章・スレッドなど）が要るものは置かない。
2. **アプリ固有の複合体は、まずパターン側に置く。** `docs/patterns/<アプリ>/` に、どの部品の組み合わせかを書いて置く。
3. **2つ目のアプリで使われたら、昇格を検討する。** 2つのアプリで同じ形が要ると分かった時点で、アプリの言葉を外せるかを確かめる。
4. **汎用にできるものだけを昇格する。** 外せたら汎用の名前で部品を新設し、元の複合体はその部品を使う形に書き直す。外せないものはパターンに残す。

## 部品を足すとき

1. 既存の部品で組めないかを確かめる。組めるなら足さない。
2. 上の「収載の基準」に当てはめる。アプリ固有なら、部品ではなく `docs/patterns/<アプリ>/` に複合体として書く。
3. [テンプレート](_template.md) をコピーして、全部の見出しを埋める。状態と「使うとき／使わないとき」のない部品は登録しない（[原則3](../principles.md#3-部品には必ず状態と使い分けを付ける)）。
4. 新しい値が要るなら、先にトークンに登録する。
5. この一覧と CHANGELOG に足す（MINOR）。
