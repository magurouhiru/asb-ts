**Acknowledgments**  
このプロジェクトは、素晴らしいデスクトップアプリケーションである [ARK Smart Breeding](https://github.com/cadon/ARKStatsExtractor)（作者: cadon様）のWebベースのリライト版です。

# asb-ts

このパッケージは、[ARK Smart Breeding](https://github.com/cadon/ARKStatsExtractor) の一部機能をTypeScriptで再実装したものです。

## 開発

### 計算式のメモ

[公式wiki](https://ark.fandom.com/ja/wiki/%E7%94%9F%E7%89%A9%E3%81%AE%E3%82%B9%E3%83%86%E3%83%BC%E3%82%BF%E3%82%B9%E8%A8%88%E7%AE%97)によると、各ステータスの個体値は以下の計算式で求められます。

`V = (B × ( 1 + Lw × Iw × IwM) × TBHM × (1 + IB × 0.2 × IBM) + Ta × TaM) × (1 + TE × Tm × TmM) × (1 + Ld × Id × IdM)`

この計算式は以下のように分割できます。

**1. 野生の個体値 (Wild)**  

野生生物の個体値は以下の式で求められます。

`Vw = B × ( 1 + Lw × Iw × IwM)`

*   **B**: 基礎値。生物・ステータスによって異なります。
    *   `asb`内での参照先: `values.json` > `species[n].fullStatsRaw[n][0]`
*   **Lw**: 野生のレベル。生まれた時の値にテイムボーナスを加算した値です。
    *   入力が必要です。
*   **Iw**: 野生レベルに対する増加率。生物・ステータスによって異なります。
    *   `asb`内での参照先: `values.json` > `species[n].fullStatsRaw[n][1]`
*   **IwM**: 野生レベルに対する調整値。サーバーやステータスごとに定義されるグローバルな値です。
    *   `asb`内での管理先: `values/ServerMultipliers.cs`（デフォルト値は1）

※ 公式wikiの計算式にはない？認識だが、変異のレベルは補正があれば補正をかけてLwと同じように計算する
ARKStatsExtractor/ARKBreedingStats/values/Values.cs:594行付近と
ARKStatsExtractor/ARKBreedingStats/Stats.cs:58行付近を参照
Dreadnoughtusくらい？

**2. テイムされた個体値 (Tamed)**

テイムされた生物をの個体値は以下の式で求められます。

`Vpt = (Vw × TBHM × (1 + IB × 0.2 × IBM) + Ta × TaM) × (1 + TE × Tm × TmM)`

*   **Vw**: 野生の個体値。上記 (1) を参照してください。
*   **TBHM**: テイムベースヘルス倍率 (TamedBaseHealthMultiplier)。基本値は1ですが、場合によって0.9などになることがあります。
    *   `asb`内での参照先: `values.json` > `species[n].TamedBaseHealthMultiplier`
*   **IB**: 刷り込みボーナス。野生生物をテイム時は0。
    *   入力が必要です。
*   **IBM**: 刷り込みボーナスの調整値。サーバーやステータスごとに定義されるグローバルな値です。
    *   `asb`内での管理先: `values/ServerMultipliers.cs`（デフォルト値は1）
*   **Ta**: テイムボーナス（加算）。生物・ステータスによって異なります。テイム効果に依存せず固定の値です。チタノなどではマイナスになる場合もあります。
    *   `asb`内での参照先: `values.json` > `species[n].fullStatsRaw[n][3]`
*   **TaM**: テイムボーナス（加算）の調整値。サーバーやステータスごとに定義されるグローバルな値です。
    *   `asb`内での管理先: `values/ServerMultipliers.cs`（デフォルト値は1）
*   **TE**: テイム効果。生物・ステータスによって異なります。テイム効果に依存せず固定の値です。
    *   入力が必要です。
*   **Tm**: テイムボーナス（乗算）。生物・ステータスによって異なります。テイム効果に依存せず固定の値です。
    *   `asb`内での参照先: `values.json` > `species[n].fullStatsRaw[n][4]`
*   **TmM**: テイムボーナス（乗算）の調整値。サーバーやステータスごとに定義されるグローバルな値です。
    *   `asb`内での管理先: `values/ServerMultipliers.cs`（デフォルト値は1）

※ 公式wikiの計算式にはない？認識だが、Ta、Tmが負の時はTaM、TmM(サーバーの設定値)は無視するらしい  
ARKStatsExtractor/ARKBreedingStats/values/Values.cs:576行付近を参照

**3. 最終個体値 (Final)**

最終的な個体値は以下の計算式で求められます。

`V = Vpt × (1 + Ld × Id × IdM)`

*   **Vpt**: ブリーディング初期個体値。上記 (2) を参照してください。
*   **Ld**: テイム後のレベル。プレイヤーが割り振った値です。
    *   入力が必要です。
*   **Id**: テイム後のレベルに対する増加率。生物・ステータスによって異なります。
    *   `asb`内での参照先: `values.json` > `species[n].fullStatsRaw[n][2]`
*   **IdM**: テイム後のレベルに対する調整値。サーバーやステータスごとに定義されるグローバルな値です。
    *   `asb`内での管理先: `values/ServerMultipliers.cs`（デフォルト値は1）

**備考**
公式資料には「変異」に関する記述はありません。