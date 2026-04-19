# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

開発用途で OAuth2 Authorization Code Flow のアクセストークン取得を簡単にする Chrome 拡張機能 (Manifest V3)。DevTools にパネルを追加し、認可 URL の組み立て・リダイレクト・コード→トークン交換までを一気通貫で行う。

## コマンド

パッケージマネージャは npm (`package-lock.json` を使用)。Node.js のバージョンは `.node-version` および `package.json` の `engines` で `24.15.0` を指定。

- `npm run watch` — webpack 開発ビルドを監視モードで起動 (`webpack/webpack.dev.js`)
- `npm run build` — 本番ビルド (`webpack/webpack.prod.js` → `dist/`)
- `npm run zip` — ビルド後、Chrome Web Store にアップロードするための zip を生成

ビルド出力 (`dist/`) を確認する系の操作は AI が実行してよい。サーバー起動を伴う動作確認 (拡張機能のリロード・実 OAuth フローでの動作チェック等) はユーザー側で行う。

## アーキテクチャ

3 つの webpack エントリーポイントが Chrome 拡張の異なるコンテキストで動作する。

- **`src/devtools.ts`** — DevTools 拡張ポイントから "Simple OAuth2 Client" パネルを登録するだけの薄い層 (`devtools.html` がロード)。
- **`src/panel.tsx` → `src/components/Panel.tsx` / `AuthForm.tsx`** — DevTools パネル本体 (React)。フォームの状態管理と background との `chrome.runtime` メッセージ通信、結果表示を担当する。`panel.html` がロード。
- **`src/background.ts`** — Service Worker。`chrome.identity.launchWebAuthFlow` で認可リダイレクトを受け取り、`code` を取り出してトークンエンドポイントに POST する。**`fetch` などブラウザ API を使う OAuth 通信処理はすべてここに集約**されている。

### メッセージプロトコル (panel ↔ background)

`chrome.runtime.sendMessage` を介した非同期メッセージで連携:

- panel → background: `{ action: "submit", value: AuthInputParams }`
- background → panel: `{ action: "log", value: string }` (進捗ログを追記表示) / `{ action: "result", value: string }` (トークンレスポンスの JSON 文字列)

`AuthInputParams` などの型は `src/types.d.ts` で `declare type` としてグローバル宣言されているため import 不要。

### Provider 設定の仕組み

`src/components/Panel.tsx` 起動時に GitHub 上の `api/platform_metadata.json` を fetch し、各エントリの `metadata` URL (OIDC discovery 文書 or `api/unofficial/*.json` の自前定義) を取得して provider セレクトに展開する。新しいプロバイダ対応は基本的に `api/` 配下の JSON 編集だけで完結する設計。fetch 失敗時は `defaultConfig` (CustomProvider) のみが選択肢として残る。

`AuthFormConfig` で各フィールドが `null` の場合はユーザー入力可、値がある場合は readOnly になる (= プロバイダ固定値)。

### redirect_uri について

`https://<chrome.runtime.id>.chromiumapp.org/` を使う (`chrome.identity` API の仕様)。ユーザーは表示された redirect_uri を OAuth プロバイダ側のアプリ設定にコピペして登録する必要がある。

### PKCE / Token Endpoint Auth Method

- PKCE は `S256` / `plain` / `no` を `src/utils.ts` の `generateCodeVerifier` / `generateCodeChallenge` で実装
- Confidential client のトークンリクエスト認証は `client_secret_basic` (Authorization ヘッダ) と `client_secret_post` (ボディパラメータ) の両方をサポート

## 実装上の注意

- `src/types.d.ts` は `declare type` のグローバル宣言。import せずに使う。
- `manifest.json` の `version` と Chrome Web Store のリリースは別管理 (リリース時に手動で更新)。
- `dist/` は gitignore 対象。`zip` タスク実行前に `npm run build` でビルド成果物を生成する (`zip` スクリプトが内部で `npm run build` を呼ぶため通常は意識不要)。
