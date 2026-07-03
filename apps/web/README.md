**Acknowledgments**  
このプロジェクトは、素晴らしいデスクトップアプリケーションである [ARK Smart Breeding](https://github.com/cadon/ARKStatsExtractor)（作者: cadon様）のWebベースのリライト版です。

# asb-web

[ARK Smart Breeding](https://github.com/cadon/ARKStatsExtractor) の一部機能をweb で実行できるように移植したものです。

## 開発

### 前提

vscode とdevcontainer の使用を前提としています。  
下記をインストールし、devcontainer に接続してください。  
**初回はこけることがあります。その時はRebuildしてください。**
- [vscode](https://code.visualstudio.com/)
  - 拡張機能: [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- Docker環境
  - [Docker Desktop](https://www.docker.com/ja-jp/products/docker-desktop/) など

もしくは、[Bun](https://bun.com/) をインストールしてください。

### 手順

1. `bun ci` でライブラリをインストール(devcontainerの場合は自動で実行)
1. `bun dev` で開発サーバー起動
1. `bun biome:fix` で整形(devcontainerの場合は保存時に自動で実行)
1. `bun run build` でビルド

### 主要ライブラリ

- [React](https://react.dev/)
  - コンポーネントベースのuiを提供します。
  - あんまり触ったことはないけど、超有名かつ他のライブラリも影響を受けていることが多いため、勉強のために採用。あと早そう。
- [TanStack Router](https://tanstack.com/router/latest)
  - 型安全なルーティングを提供します。
  - 型安全かつ下記ファイルベースのルーティングを使いたかったので採用。
  - [File-Based Routing](https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing)
    - ファイルベースのルーティングを提供します。
    - `./src/routes`配下にコンポーネントを作成してください。
    - 作成時は`createFileRoute`でコンパイルエラーになりますが、`bun dev`コマンドで`./src/routeTree.gen.ts`が自動生成・更新されたら解消します。
    - **`./src/routeTree.gen.ts`は触らないでください**
- [MediaPipe ソリューション](https://ai.google.dev/edge/mediapipe/solutions/guide)
  - アプリケーションで人工知能（AI）と機械学習（ML）の手法を迅速に適用するためのライブラリとツールのスイートを提供します。
  - これが使いたかった。
  - [MediaPipe Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker)
    - 画像から手のランドマーク(関節部)の座標を提供します。
- [lingui](https://lingui.dev/)
  - 国際化(i18n)を簡単に行えるようにします。
  - よさそうな雰囲気があったので採用。あと早そう。
  - **`./src/locales`配下は日本語以外を追加するときだけ触ってください**
- [VITE](https://vite.dev/)
  - フロントエンドのビルドツール。
  - 爆速なので採用。
- [Biome](https://biomejs.dev/)
  - TypeScriptなどの静的解析・整形ツール。
  - 爆速かつimportもソートしてくれるので採用。
- [tailwindcss](https://tailwindcss.com/)
  - ユーティリティクラス(.flex{display:flex;}のような小さいクラス)ベースでのstyle指定を提供します。
  - 慣れているかつReactと相性がいい？らしいので採用。
