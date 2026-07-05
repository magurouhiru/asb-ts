**Acknowledgments**  
このプロジェクトは、素晴らしいデスクトップアプリケーションである [ARK Smart Breeding](https://github.com/cadon/ARKStatsExtractor)（作者: cadon様）の一部機能をTypescript で作り直し、web アプリとかで公開するために作成されました。

# @asb-ts/workspace

このリポジトリは[ARK Smart Breeding](https://github.com/cadon/ARKStatsExtractor) の一部機能をTypescript で作り直し、web アプリとかで公開するために作成されました。
[ARK Smart Breeding](https://github.com/cadon/ARKStatsExtractor)の方が機能が非常に多く、実績もあるため、興味を持った方は本家を使用することをお勧めします。

[asb-ts をweb で試してみる(GitHub Pages)](https://magurouhiru.github.io/asb-ts/)

このリポジトリはモノレポで、複数のパッケージが含まれています。
- apps
  - [web: web で公開するためのパッケージです。](./apps/web/README.md)
  - [discord-bot: discord のbot として公開するためのパッケージです。](./apps/discord-bot//README.md)
- packages
  - [core: TypeScript で作り直したパッケージです。](./packages/core/README.md)

## 機能
- [x] レベル→個体値
  - [x] UIから値を入力
  - [x] 野生
  - [x] テイム後(変異なし　かつ　プレイヤーによるレベル振りなし)
  - [x] ブリーディング(変異なし　かつ　プレイヤーによるレベル振りなし)
  - [x] プレイヤーによるレベル振りあり
  - [x] 変異あり
- [x] 個体値→レベル
  - [x] UIから値を入力
  - [x] 野生
  - [x] テイム後(変異なし　かつ　プレイヤーによるレベル振りなし)
  - [x] ブリーディング(変異なし　かつ　プレイヤーによるレベル振りなし)
  - [x] プレイヤーによるレベル振りあり
  - [x] 変異あり
  - [x] クエリパラメータから値を入力
  - [x] OCRで値を入力

## このアプリについて

- プライバシー: 本アプリは、入力されたデータや個人情報をサーバーに送信したり、保存したりすることはありません。
- アクセス解析: GitHub Pages 標準の統計機能（誰がアクセスしたか特定できない数値データ）のみを参照しています。
- 免責事項: 本アプリの利用により生じた損害について、作者は一切の責任を負いません。

## 開発

### 前提

vscode とdevcontainer の使用を前提としています。  
下記をインストールし、devcontainer に接続してください。  
- [vscode](https://code.visualstudio.com/)
  - 拡張機能: [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- Docker環境
  - [Docker Desktop](https://www.docker.com/ja-jp/products/docker-desktop/) など
