---
paths: "**/*.rs, **/*.cpp, **/*.py, **/Cargo.toml, **/CMakeLists.txt"
---

# Windowsアプリケーション開発ルール

## 言語選択

### 優先順位
| 優先度 | 言語 | 用途 |
|--------|------|------|
| **1位** | **Rust** | 新規プロジェクトのメイン言語 |
| **2位** | C++ | 既存ライブラリ活用、特殊要件 |
| **3位** | Python | 簡易ツール、AI連携、プロトタイプ |

### 選択基準フローチャート
```
新規プロジェクト?
├─ Yes → Rust
└─ No
    └─ 既存C++ライブラリ必須?
        ├─ Yes → C++
        └─ No
            └─ AI/ML連携必須?
                ├─ Yes → Python
                └─ No → Rust
```

## Rust + Tauri（推奨）

### プロジェクトセットアップ
```bash
# Tauri CLIインストール
cargo install create-tauri-app

# 新規プロジェクト作成
cargo create-tauri-app app-name
cd app-name

# 開発サーバー起動
cargo tauri dev

# リリースビルド
cargo tauri build
```

### プロジェクト構成
```text
app-name/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   ├── main.rs
│   │   └── commands.rs
│   └── icons/
├── src/                    # フロントエンド（React/Vue/Svelte）
│   ├── App.tsx
│   └── ...
├── public/
├── package.json
└── vite.config.ts
```

### tauri.conf.json
```json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "AppName",
    "version": "1.0.0"
  },
  "tauri": {
    "bundle": {
      "active": true,
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/icon.ico"
      ],
      "identifier": "com.example.appname",
      "targets": ["msi", "nsis"]
    },
    "windows": [
      {
        "title": "AppName",
        "width": 800,
        "height": 600,
        "resizable": true,
        "center": true
      }
    ]
  }
}
```

### Rustバックエンド（コマンド）
```rust
// src-tauri/src/commands.rs

use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Serialize, Deserialize)]
pub struct User {
    id: u32,
    name: String,
}

/// ユーザー情報を取得するコマンド
#[command]
pub async fn get_user(id: u32) -> Result<User, String> {
    // データベースやAPI呼び出し
    Ok(User {
        id,
        name: "Alice".to_string(),
    })
}

/// ファイルを読み込むコマンド
#[command]
pub async fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path)
        .map_err(|e| format!("ファイル読み込みエラー: {}", e))
}

/// ファイルを保存するコマンド
#[command]
pub async fn save_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, &content)
        .map_err(|e| format!("ファイル保存エラー: {}", e))
}
```

### main.rs
```rust
// src-tauri/src/main.rs

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use commands::{get_user, read_file, save_file};

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_user,
            read_file,
            save_file,
        ])
        .run(tauri::generate_context!())
        .expect("Tauriアプリケーションの起動に失敗しました");
}
```

### フロントエンドからの呼び出し
```typescript
// src/App.tsx
import { invoke } from '@tauri-apps/api/tauri';

interface User {
  id: number;
  name: string;
}

async function fetchUser(id: number): Promise<User> {
  return invoke('get_user', { id });
}

async function loadFile(path: string): Promise<string> {
  return invoke('read_file', { path });
}

async function saveFile(path: string, content: string): Promise<void> {
  return invoke('save_file', { path, content });
}
```

## Rust + egui（純Rust GUI）

### Cargo.toml
```toml
[package]
name = "app-name"
version = "1.0.0"
edition = "2021"

[dependencies]
eframe = "0.24"
egui = "0.24"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[profile.release]
opt-level = 3
lto = true
strip = true
```

### main.rs
```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use eframe::egui;

fn main() -> eframe::Result<()> {
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([400.0, 300.0])
            .with_min_inner_size([300.0, 200.0]),
        ..Default::default()
    };

    eframe::run_native(
        "AppName",
        options,
        Box::new(|cc| Box::new(MyApp::new(cc))),
    )
}

struct MyApp {
    name: String,
    age: u32,
}

impl MyApp {
    fn new(_cc: &eframe::CreationContext<'_>) -> Self {
        Self {
            name: String::new(),
            age: 0,
        }
    }
}

impl eframe::App for MyApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        egui::CentralPanel::default().show(ctx, |ui| {
            ui.heading("サンプルアプリ");

            ui.horizontal(|ui| {
                ui.label("名前:");
                ui.text_edit_singleline(&mut self.name);
            });

            ui.horizontal(|ui| {
                ui.label("年齢:");
                ui.add(egui::DragValue::new(&mut self.age).speed(1));
            });

            if ui.button("送信").clicked() {
                println!("名前: {}, 年齢: {}", self.name, self.age);
            }
        });
    }
}
```

## Python + PyQt6（簡易ツール向け）

### プロジェクト構成
```text
app-name/
├── src/
│   ├── __init__.py
│   ├── main.py
│   ├── ui/
│   │   ├── __init__.py
│   │   └── main_window.py
│   └── utils/
│       └── __init__.py
├── resources/
│   └── icons/
├── pyproject.toml
├── requirements.txt
└── build.py          # PyInstallerビルドスクリプト
```

### main.py
```python
"""アプリケーションエントリーポイント"""

import sys
from PyQt6.QtWidgets import QApplication
from ui.main_window import MainWindow

__version__ = "1.0.0"


def main() -> None:
    """アプリケーションを起動する"""
    app = QApplication(sys.argv)
    app.setApplicationName("AppName")
    app.setApplicationVersion(__version__)

    window = MainWindow()
    window.show()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
```

### main_window.py
```python
"""メインウィンドウ"""

from PyQt6.QtWidgets import (
    QMainWindow,
    QWidget,
    QVBoxLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QMessageBox,
)
from PyQt6.QtCore import Qt


class MainWindow(QMainWindow):
    """メインウィンドウクラス"""

    def __init__(self) -> None:
        super().__init__()
        self._setup_ui()

    def _setup_ui(self) -> None:
        """UIをセットアップする"""
        self.setWindowTitle("AppName v1.0.0")
        self.setMinimumSize(400, 300)

        # 中央ウィジェット
        central = QWidget()
        self.setCentralWidget(central)

        # レイアウト
        layout = QVBoxLayout(central)

        # 入力フィールド
        input_layout = QHBoxLayout()
        input_layout.addWidget(QLabel("名前:"))
        self.name_input = QLineEdit()
        input_layout.addWidget(self.name_input)
        layout.addLayout(input_layout)

        # ボタン
        self.submit_btn = QPushButton("送信")
        self.submit_btn.clicked.connect(self._on_submit)
        layout.addWidget(self.submit_btn)

        # スペーサー
        layout.addStretch()

    def _on_submit(self) -> None:
        """送信ボタンクリック時の処理"""
        name = self.name_input.text()
        if not name:
            QMessageBox.warning(self, "エラー", "名前を入力してください")
            return
        QMessageBox.information(self, "完了", f"こんにちは、{name}さん！")
```

### PyInstallerビルド
```python
# build.py
import PyInstaller.__main__

PyInstaller.__main__.run([
    'src/main.py',
    '--name=AppName',
    '--onefile',
    '--windowed',
    '--icon=resources/icons/icon.ico',
    '--add-data=resources;resources',
    '--distpath=AppName',  # アプリ名フォルダに出力
    '--clean',
])
```

## ビルド出力規則

### 出力先
```text
# dist/ や build/ は使用禁止
# アプリ名のフォルダに出力する

AppName/           # ← ビルド出力先
├── AppName.exe
├── README.md
└── (その他必要なファイル)
```

### README.md（ビルドフォルダ内）
```markdown
# AppName

## 動作環境
- Windows 10/11

## 使い方
1. `AppName.exe` をダブルクリックして起動
2. ...

## バージョン
- v1.0.0

## ライセンス
MIT License
```

## アイコン作成

### 必要なサイズ
```text
resources/icons/
├── icon.ico        # Windows用（256x256含むマルチサイズ）
├── icon.png        # 256x256
├── 32x32.png
└── 128x128.png
```

### ICOファイル作成（ImageMagick）
```bash
# PNGからICOを生成
magick convert icon-256.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

## リリース

### GitHub Releasesで配布
```bash
# タグ作成
git tag v1.0.0
git push origin v1.0.0

# リリース作成（GitHub CLI）
gh release create v1.0.0 ./AppName/AppName.exe \
  --title "v1.0.0" \
  --notes "初回リリース"

# 既存リリースにファイル追加
gh release upload v1.0.0 ./AppName/AppName.exe
```

## 禁止事項

- 管理者権限の不必要な要求
- ユーザーデータの無断収集
- 自動更新の強制（オプトアウト不可）
- スタートアップへの無断登録
- ハードコードされた認証情報
- 未署名バイナリの配布（可能なら署名する）

```rust
// Bad - ハードコードされた認証情報
const API_KEY: &str = "sk-xxxx";

// Good - 環境変数または設定ファイル
let api_key = std::env::var("API_KEY")
    .or_else(|_| config.api_key.clone())
    .map_err(|_| "APIキーが設定されていません")?;
```
