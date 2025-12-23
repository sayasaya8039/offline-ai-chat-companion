---
paths: "**/*"
---

# プロジェクト言語選択ガイド

## 概要

プロジェクト開始時に適切な開発言語とフレームワークを選択するためのガイドラインです。
プロジェクト種類に応じて、以下のルールに従って言語を選択してください。

## クイックリファレンス

| プロジェクト種類 | 言語 | フレームワーク |
|------------------|------|----------------|
| Chrome拡張機能 | TypeScript | React + Vite |
| Firefox拡張機能 | TypeScript | React + Vite |
| VSCode拡張機能 | TypeScript | VSCode API |
| Webアプリ（SPA） | TypeScript | React + Vite |
| Webアプリ（SSR） | TypeScript | Next.js |
| Windowsアプリ | Rust | Tauri / egui |
| CLIツール | Rust | clap |
| 簡易スクリプト | Python | - |
| AI/ML連携 | Python | PyQt + PyTorch |
| ゲーム | C++ | Unreal Engine |

## 詳細な選択基準

### ブラウザ拡張機能

**必須: TypeScript + React + Vite**

理由:
- ブラウザ拡張はJavaScript/TypeScriptのみサポート
- TypeScriptで型安全な開発
- Reactで効率的なUI構築
- Viteで高速ビルド

```text
対象:
✓ Chrome拡張機能
✓ Firefox拡張機能
✓ Edge拡張機能
✓ Brave拡張機能
```

### Webアプリケーション

**推奨: TypeScript**

| 種類 | 推奨構成 |
|------|----------|
| SPA（単一ページ） | TypeScript + React + Vite |
| SSR/SSG | TypeScript + Next.js |
| 静的サイト | TypeScript + Astro |
| API | TypeScript + Hono / Node.js |

理由:
- 型安全による品質向上
- エコシステムの充実
- 開発効率の高さ

### Windowsデスクトップアプリケーション

**優先順位: Rust > C++ > Python**

#### Rust（第1選択）
```text
使用ケース:
✓ 新規プロジェクト全般
✓ パフォーマンス重視
✓ メモリ安全性重視
✓ クロスプラットフォーム
✓ モダンなGUIアプリ

フレームワーク:
- Tauri（Webフロントエンド）
- egui（純Rust GUI）
- iced（Elm風GUI）
```

#### C++（第2選択）
```text
使用ケース:
✓ 既存C++ライブラリの活用必須
✓ Unreal Engine等のゲーム開発
✓ DirectX/Vulkanの直接使用
✓ レガシーシステムとの統合
✓ 組み込みシステム

フレームワーク:
- Qt（推奨）
- wxWidgets
- Dear ImGui
- Win32 API（低レベル）
```

#### Python（第3選択）
```text
使用ケース:
✓ 簡易ツール・ユーティリティ
✓ プロトタイプ作成
✓ AI/機械学習連携アプリ
✓ データ処理ツール
✓ 自動化スクリプトのGUI化

フレームワーク:
- PyQt6 / PySide6（推奨）
- Tkinter（シンプルなもの）
- customtkinter（モダンTkinter）
```

### CLIツール

**推奨: Rust**

```text
理由:
- シングルバイナリ配布
- 高速な実行速度
- クロスコンパイル可能
- clapによる優れたCLI構築

代替:
- Python（配布が容易でない場合を除く）
- Go（Rustが難しい場合）
```

### AI/機械学習連携

**推奨: Python**

```text
理由:
- PyTorch/TensorFlowのネイティブサポート
- 豊富なML/AIライブラリ
- データサイエンス向けエコシステム

GUI必要時:
- PyQt6 + PyTorch
- Gradio（Webインターフェース）
- Streamlit（データアプリ）
```

## 選択フローチャート

```
プロジェクト開始
    │
    ├─ ブラウザ拡張機能? → TypeScript + React
    │
    ├─ Webアプリ? → TypeScript + React/Next.js
    │
    ├─ デスクトップアプリ?
    │   │
    │   ├─ 既存C++ライブラリ必須? → C++
    │   │
    │   ├─ ゲーム開発? → C++ (Unreal) / Rust (Bevy)
    │   │
    │   ├─ AI/ML連携? → Python
    │   │
    │   └─ その他 → Rust
    │
    ├─ CLIツール? → Rust
    │
    └─ スクリプト/自動化? → Python
```

## 言語別 推奨ツールチェーン

### TypeScript
```text
パッケージマネージャ: npm / pnpm
ビルドツール: Vite / esbuild
リンター: ESLint
フォーマッター: Prettier
テスト: Vitest / Jest
```

### Rust
```text
パッケージマネージャ: Cargo
リンター: clippy
フォーマッター: rustfmt
テスト: cargo test
```

### C++
```text
ビルドシステム: CMake
パッケージマネージャ: vcpkg / conan
リンター: clang-tidy
フォーマッター: clang-format
テスト: Google Test / Catch2
```

### Python
```text
パッケージマネージャ: pip / poetry
リンター: ruff / flake8
フォーマッター: black / ruff
型チェック: mypy / pyright
テスト: pytest
ビルド: PyInstaller
```

## 禁止・非推奨

### 禁止
- JavaScript（TypeScriptを使用すること）
- Java（特別な理由がない限り）
- C#（Windows専用になるため）

### 非推奨
- Go（Rustで代替可能な場合）
- Electron（Tauriで代替可能な場合）
- jQuery（React/Vueを使用すること）

## 例外ケース

以下の場合は上記ルールの例外として認められます:

1. **既存プロジェクトの継続開発**
   - 既存の言語・フレームワークを維持

2. **特定ライブラリの依存**
   - その言語でしか利用できないライブラリが必須

3. **チーム/組織の制約**
   - 特定言語のスキルセットしかない場合

4. **明示的なユーザー指定**
   - ユーザーが特定言語を指定した場合

例外の場合は、その理由をドキュメントに記載すること。
