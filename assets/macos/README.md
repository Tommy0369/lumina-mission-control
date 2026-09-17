# macOS デスクトップアプリ

`LUMINA.app` はローカルの伴走 UI（http://localhost:3000）を開くランチャー。

- 3000 が応答しないときだけ `pnpm dev` をバックグラウンド起動
- ログ: `$TMPDIR/lumina-dev.log`
- ウィンドウ: Chrome のアプリモード（なければ通常ブラウザ）

## ビルド

```bash
# アイコン（icon-1024.png がある前提）
iconutil -c icns assets/macos/AppIcon.iconset -o assets/macos/AppIcon.icns

# .app 生成 + デスクトップへ
bash scripts/build-macos-app.sh --desktop
```

`dist/macos/LUMINA.app` も残る。デスクトップは上書きコピー。
