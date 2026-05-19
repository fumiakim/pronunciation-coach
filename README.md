# Pronunciation Coach

日本語話者のための英語発音矯正アプリ。ブラウザだけで動作します。

## 機能

- 🎯 レベル別フレーズ（初級 / 中級 / 上級 / ミニマルペア）
- 🔊 お手本読み上げ（速度調整つき）
- 🎤 音声録音と自動採点
- 📊 単語ごとの正誤フィードバック
- 💡 日本語話者向けの発音ヒント（L↔R / θ / V↔B など）
- 📝 自由入力フレーズ対応
- 🗂 練習履歴（localStorage 保存）

## 使い方

### オンライン版

GitHub Pages: <https://fumiakim.github.io/pronunciation-coach/>

ブラウザでアクセスしてマイク許可を出すだけ。

### ローカルで実行

Safari でマイクを使うには `http://localhost` 配信が必要です。

```bash
# このリポジトリをクローン
git clone https://github.com/fumiakim/pronunciation-coach.git
cd pronunciation-coach

# 同梱の起動スクリプト
./start.command
```

または直接 `index.html` をブラウザで開いてください（Chrome は `file://` でも動作）。

## ブラウザ別の動作

| ブラウザ | ネイティブ音声認識 | Whisper フォールバック |
|---|---|---|
| Chrome / Edge | ✅ そのまま動作 | 不要 |
| Safari | ❌ 実装が機能しない | ✅ 約 40MB のモデルを読み込めば動作 |
| Firefox | ❌ 未対応 | ✅ Whisper で動作 |

Safari/Firefox 利用時は画面上部のバナーから「音声認識を有効化」を押すと、ブラウザ内で動く Whisper-tiny.en (transformers.js) が読み込まれ、自動採点が使えるようになります。

## 技術スタック

- 素の HTML / CSS / JavaScript（ビルドツール不要）
- [Web Speech API](https://developer.mozilla.org/docs/Web/API/Web_Speech_API)
- [MediaRecorder API](https://developer.mozilla.org/docs/Web/API/MediaRecorder)
- [transformers.js](https://github.com/xenova/transformers.js) + [Xenova/whisper-tiny.en](https://huggingface.co/Xenova/whisper-tiny.en)
- スコアリングは Needleman-Wunsch 単語アライメント + Levenshtein 距離

## キーボードショートカット

| キー | 動作 |
|---|---|
| Space | 録音開始 / 停止 |
| L | お手本を再生 |
| ← / → | 前後のフレーズへ移動 |

## ライセンス

MIT
