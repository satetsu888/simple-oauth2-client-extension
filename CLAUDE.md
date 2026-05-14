# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

開発用途で OAuth2 Authorization Code Flow のアクセストークン取得を簡単にする Chrome 拡張機能 (Manifest V3)。DevTools パネルおよび Side Panel の両方から利用でき、認可 URL の組み立て・リダイレクト・コード→トークン交換までを一気通貫で行う。Chrome の Prompt API (Gemini Nano) を使ったオンデバイス AI アシスト機能により、ページ上の OAuth 設定値の自動検出・フォームへの redirect_uri 注入にも対応。

## コマンド

パッケージマネージャは npm (`package-lock.json` を使用)。Node.js のバージョンは `.node-version` および `package.json` の `engines` で `24.15.0` を指定。

- `npm run watch` — webpack 開発ビルドを監視モードで起動 (`webpack/webpack.dev.js`)
- `npm run build` — 本番ビルド (`webpack/webpack.prod.js` → `dist/`)
- `npm run zip` — ビルド後、Chrome Web Store にアップロードするための zip を生成

ビルド出力 (`dist/`) を確認する系の操作は AI が実行してよい。サーバー起動を伴う動作確認 (拡張機能のリロード・実 OAuth フローでの動作チェック等) はユーザー側で行う。

## アーキテクチャ

3 つの webpack エントリーポイントが Chrome 拡張の異なるコンテキストで動作する。

- **`src/devtools.ts`** — DevTools 拡張ポイントから "Simple OAuth2 Client" パネルを登録するだけの薄い層 (`devtools.html` がロード)。
- **`src/panel.tsx` → `src/components/Panel.tsx`** — DevTools パネル / Side Panel の本体 (React)。フォームの状態管理、AI アシスト制御、background との `chrome.runtime` メッセージ通信、結果表示を担当する。`panel.html` がロード。
- **`src/background.ts`** — Service Worker。OAuth 通信処理 (`chrome.identity.launchWebAuthFlow` + トークン交換) と AI セッション管理を担当。**`fetch` などブラウザ API を使う処理と `LanguageModel` API の呼び出しはすべてここに集約**されている。

### コンポーネント構成

- **`Panel.tsx`** — トップレベル。AI アシストのステート管理、`SuggestableFieldValues` の状態をリフトアップして保持し、AuthForm に制御コンポーネントとして渡す。
- **`AuthForm.tsx`** — OAuth フォーム。`fieldValues` / `appliedFields` を props で受け取る制御コンポーネント。ローカル状態は clientType / codeChallengeMethod / tokenEndpointAuthMethod のみ。
- **`AiAssistDialog.tsx`** — AI アシストの進捗ダイアログ。4 ステップ (preparing → extracting → thinking → complete) を表示。complete ステップで検出フィールド一覧と Apply All / Close ボタンを提示。
- **`SuggestionTip.tsx`** — フォーム入力欄内に表示される sparkle アイコン。AI サジェストがある場合にクリックで値を適用。
- **`RedirectUriInjector.tsx`** — redirect_uri 入力欄内の sparkle。クリックでページ側のフォームに redirect_uri を注入。

### メッセージプロトコル (panel ↔ background)

`chrome.runtime.sendMessage` を介した非同期メッセージで連携。`ExtensionMessage` 型 (discriminated union) で型安全に定義。

**OAuth フロー:**
- panel → background: `{ action: "submit", value: AuthInputParams }`
- background → panel: `{ action: "log", value: string }` / `{ action: "result", value: string }`

**AI アシストフロー:**
1. panel → background: `{ action: "ai-prepare" }` — AI モデルの準備 (必要ならダウンロード)
2. background → panel: `{ action: "ai-download-progress", value: number }` — ダウンロード進捗 (0-100)
3. background → panel: `{ action: "ai-model-ready" }` — モデル準備完了
4. panel: `chrome.scripting.executeScript` でページのスナップショットを取得
5. panel → background: `{ action: "ai-analyze", value: PageFormSnapshot }` — ページ分析を依頼
6. background → panel: `{ action: "ai-result", value: AiSuggestions }` — 分析結果

型は `src/types.d.ts` で `declare type` としてグローバル宣言されているため import 不要。

### AI アシスト機能

Chrome の Prompt API (`LanguageModel`) を使ったオンデバイス AI 機能。

- **`src/aiAssist.ts`** — AI セッション管理。`checkAvailability()` / `prepareSession()` / `analyze()` の 3 関数。モデル準備とページ分析を分離し、background.ts が `currentAiSession` として準備済みセッションを保持。
- **`src/pageSnapshot.ts`** — ページのスナップショット収集。`collectPageSnapshot()` で URL・タイトル・本文テキスト・フォーム要素メタデータ (`FormFieldInfo[]`) を返す。`chrome.scripting.executeScript` で実行されるため、Promise.then パターンを使用 (async/await は es6 ターゲットでのシリアライズ制約のため不可)。
- AI はページ上の client ID / client secret / scope / エンドポイント URL / redirect_uri 入力欄のセレクタを検出する。明確にラベルされた値のみ抽出し、曖昧なものは拾わない方針。

### Provider 設定の仕組み

`src/components/Panel.tsx` 起動時に GitHub 上の `api/platform_metadata.json` を fetch し、各エントリの `metadata` URL (OIDC discovery 文書 or `api/unofficial/*.json` の自前定義) を取得して provider セレクトに展開する。新しいプロバイダ対応は基本的に `api/` 配下の JSON 編集だけで完結する設計。fetch 失敗時は `defaultConfig` (CustomProvider) のみが選択肢として残る。

`AuthFormConfig` で各フィールドが `null` の場合はユーザー入力可、値がある場合は readOnly になる (= プロバイダ固定値)。

### redirect_uri について

`https://<chrome.runtime.id>.chromiumapp.org/` を使う (`chrome.identity` API の仕様)。ユーザーは表示された redirect_uri を OAuth プロバイダ側のアプリ設定にコピペして登録する必要がある。AI アシスト機能により、ページ上の redirect_uri 入力欄を検出し、`chrome.scripting.executeScript` でワンクリック注入も可能。

### PKCE / Token Endpoint Auth Method

- PKCE は `S256` / `plain` / `no` を `src/utils.ts` の `generateCodeVerifier` / `generateCodeChallenge` で実装
- Confidential client のトークンリクエスト認証は `client_secret_basic` (Authorization ヘッダ) と `client_secret_post` (ボディパラメータ) の両方をサポート

## 実装上の注意

- `src/types.d.ts` は `declare type` のグローバル宣言。import せずに使う。
- `manifest.json` の `version` と Chrome Web Store のリリースは別管理 (リリース時に手動で更新)。
- `dist/` は gitignore 対象。`zip` タスク実行前に `npm run build` でビルド成果物を生成する (`zip` スクリプトが内部で `npm run build` を呼ぶため通常は意識不要)。
- `pageSnapshot.ts` は `chrome.scripting.executeScript` 経由で実行されるため、async/await を使わず Promise.then パターンで記述する。
