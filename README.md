# 音刺激評価Webアプリケーション

## 概要

このアプリケーションは、音刺激（WAVファイル）のパリパリ感を評価するための実験用Webアプリです。Python FlaskバックエンドとモダンなHTML5フロントエンドで構成されており、参加者が順次音声を聴いて評価し、結果をExcelで出力できます。

## 主な機能

- **参加者名の入力**: 実験開始時に参加者の氏名を登録
- **ランダムプレイリスト**: WAVファイルがランダムな順序で提示される
- **9段階評価**: 1（非常に弱い）～ 9（非常に強い）の9段階で評価
- **リピート機能**: 必要に応じて何度でも音声を再生可能
- **進捗表示**: 現在の進捗状況をリアルタイム表示
- **Excel出力**: 評価結果を自動的にExcelファイルに出力
- **大規模データ対応**: 最大1000個程度のWAVファイルに対応可能な設計

## ファイル構成

```
ExSystem04/
├── app/
│   ├── app.py                    # Flaskアプリケーション（メインサーバー）
│   ├── templates/
│   │   └── index.html            # HTML テンプレート
│   └── static/
│       ├── style.css             # スタイルシート
│       └── script.js             # フロントエンド JavaScript
├── 5_potechi_renamed/            # WAVファイル保存フォルダ（gitignore対象）
├── results/                      # 評価結果Excel ファイル出力先
├── requirements.txt              # Python依存パッケージ
├── test_api.py                   # API テストスクリプト
├── test_e2e.py                   # エンドツーエンドテストスクリプト
├── plan.md                       # 実装計画
└── README.md                     # このファイル
```

## セットアップ方法

### 前提条件

- Python 3.7以上
- pip (Python パッケージマネージャー)

### インストール手順

1. **リポジトリのクローン**

   ```bash
   git clone https://github.com/YSKplus/ExSystem04.git
   cd ExSystem04
   ```

2. **Python依存パッケージのインストール**

   ```bash
   pip install -r requirements.txt
   ```

3. **WAVファイルの配置**
   - `5_potechi_renamed/` フォルダにWAVファイルを配置してください
   - ファイル名は拡張子なしで使用されます（例：`1.wav` → `1`として表示）

## 使用方法

### サーバーの起動

```bash
cd app
python app.py
```

サーバーが起動すると、以下のメッセージが表示されます：

```
 * Running on http://localhost:5000
```

### 実験の実施

1. **ブラウザで `http://localhost:5000` にアクセス**

2. **参加者名を入力**
   - 氏名を入力して「開始」ボタンをクリック

3. **音声の再生と評価**
   - 「再生」ボタンをクリックして音声を再生
   - 再生終了後、評価を選択（1～9の数字ボタン）
   - または「リピート」ボタンを押すと同じ音声を再度再生

4. **結果の自動出力**
   - すべての音声を評価すると自動的にExcelファイルが生成されます
   - ファイルは `results/` フォルダに保存されます

### Excel出力フォーマット

生成されるExcelファイルのフォーマット：

| 列番号 | 項目         | 説明                                        |
| ------ | ------------ | ------------------------------------------- |
| 1      | ファイル名   | WAVファイル名（拡張子なし）                 |
| 2      | 評価値       | 1～9の評価スコア                            |
| 3      | 再生順       | ランダム順での再生順序                      |
| 4      | リピート回数 | その音声が再生された回数（評価決定まで）    |
| 5      | 回答時刻     | 評価が送信された日時（YYYY-MM-DD HH:MM:SS） |

## API エンドポイント

### `GET /`

ホームページを返す

### `GET /api/wav-count`

WAVファイル数と一覧を取得

### `POST /api/init`

新しいセッションを初期化

### `GET /api/get-current-file/<session_id>`

現在のファイル情報を取得

### `GET /api/audio/<session_id>/<filename>`

音声ファイルをストリーミング（WAVフォーマット）

### `POST /api/submit-evaluation/<session_id>`

評価を送信（リピートの場合は rating: null）

### `POST /api/export-results/<session_id>`

結果をExcelファイルに出力

## テストの実行

### API テスト

```bash
python test_api.py
```

### エンドツーエンドテスト（Excel出力含む）

```bash
python test_e2e.py
```

## トラブルシューティング

### "No WAV files found"エラー

- `5_potechi_renamed/` フォルダが存在し、WAVファイルが含まれていることを確認してください

### ポート 5000 が既に使用中の場合

- `app.py` を編集して別のポート番号に変更してください

## セキュリティに関する注意

- このアプリケーションは開発用です
- 本番環境では WSGI サーバー（gunicorn など）の使用をお勧めします
- debug モードを無効化してください

---

**最終更新**: 2026-07-21
