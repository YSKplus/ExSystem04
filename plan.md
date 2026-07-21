# 音刺激評価Webアプリ 実装計画

## 目標

- Pythonサーバー + HTMLフロントエンド の音刺激評価アプリ
- 1000個程度のwavファイルまでスケール可能な設計

## 実装項目

### フェーズ1: バックエンド構築

- [ ] Flask/FastAPIサーバー実装
- [ ] wavファイル一覧取得API
- [ ] セッション管理（氏名、進捗状況）
- [ ] 評価データ保存機能

### フェーズ2: フロントエンド構築

- [ ] 氏名入力画面
- [ ] 音声再生UI（再生ボタン）
- [ ] 1-9評価ボタン＋リピートボタン
- [ ] 進捗表示

### フェーズ3: Excel出力

- [ ] openpyxl を使用したExcel生成
- [ ] 必要列の実装（ファイル名、評価値、再生順、リピート回数、回答時刻）

### フェーズ4: ファイル管理

- [ ] .gitignore更新（5_potechi_renamed）
- [ ] 大規模ファイル対応テスト

## 技術スタック

- Backend: Flask (Python)
- Frontend: HTML5 + CSS + JavaScript
- Excel: openpyxl
- Audio: HTML5 Audio API
