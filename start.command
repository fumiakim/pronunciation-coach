#!/bin/bash
# Pronunciation Coach — ローカルサーバ起動スクリプト
# Safari でマイクを使うには http(s)/localhost が必要なため、このスクリプトを
# ダブルクリックして起動してください。

set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

PORT=8765

# 起動中の同ポートを軽くチェック
if lsof -iTCP:$PORT -sTCP:LISTEN -P -n >/dev/null 2>&1; then
  echo "ポート $PORT は既に使用中です。既存のサーバを使うか、別ポートを指定してください。"
else
  # Python3 でローカルサーバ起動 (バックグラウンド)
  python3 -m http.server $PORT >/dev/null 2>&1 &
  SERVER_PID=$!
  echo "サーバ起動: http://localhost:$PORT  (PID: $SERVER_PID)"
  # Ctrl-C で停止できるようトラップ
  trap "echo '停止します...'; kill $SERVER_PID 2>/dev/null; exit 0" INT TERM
fi

URL="http://localhost:$PORT/index.html"
echo "ブラウザで開きます: $URL"
sleep 1
open "$URL"

echo ""
echo "このウィンドウを閉じるとサーバが停止します。停止するには Ctrl-C。"
# サーバが終わるまで待機
wait
