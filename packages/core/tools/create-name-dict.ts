/*
    このファイルは、検索に使用する名前一覧を生成するためのツールです。
    create-values で生成したSpecies と辞書から日本語名の紐づけを行います。
*/

import fs from "node:fs";
import type { NameDict } from "../src/asb/migration/name-dict/types.js";
import { AllModSpecies } from "../src/asb/migration/values/index.js";

function deleteDuplicate(list: NameDict) {
  const tmpList1 = Array.from(
    new Map(list.map((obj) => [obj.source, obj])).values(),
  );
  const tmpList2 = Array.from(
    new Map(tmpList1.map((obj) => [obj.translation, obj])).values(),
  );
  return tmpList2;
}

function getNames(dict: NameDict, lang: string) {
  const valuesNames = AllModSpecies.flatMap((s) => s.species)
    .map((species) => species.name)
    .filter((s) => s !== null && s !== undefined);
  const safeDict = dict.filter((d) => valuesNames.includes(d.source));
  return deleteDuplicate(safeDict).sort((a, b) =>
    a.translation.localeCompare(b.translation, lang),
  );
}

/**
 * この関数は、いきものの名前の一覧を出力します。
 * @param outputPath 出力ファイルのパス
 */
function createConstTs(dict: NameDict, lang: string) {
  // values.ts の内容を作成
  const content = `
// このファイルは機械的に出力されました。

  import type { NameDict } from "./types.js";

  export const NAME_DICT: NameDict = [\n  ${dict
    .map((d) => `{source:"${d.source}",translation:"${d.translation}"},`)
    .join("\n")
    .trim()}\n] as const;
    `;

  // ファイルを出力
  fs.writeFileSync(
    `./src/asb/migration/name-dict/${lang}.ts`,
    content,
    "utf-8",
  );
}

function main() {
  const dict = getNames(DICT_JA, "ja");
  createConstTs(dict, "ja");
}

const DICT_JA: NameDict = [
  { source: "MEK", translation: "MEK" },
  { source: "Rock Elemental", translation: "アイスエレメンタル" },
  { source: "Ice Wyvern", translation: "アイスワイバーン" },
  { source: "Acrocanthosaurus", translation: "アクロカントサウルス" },
  { source: "Archelon", translation: "アーケロン" },
  { source: "Astrocetus", translation: "アストロセタス" },
  { source: "Arthropluera", translation: "アースロプレウラ" },
  { source: "Achatina", translation: "アフリカマイマイ" },
  { source: "Araneo", translation: "アラネオモーフス" },
  { source: "Argentavis", translation: "アルゲンタヴィス" },
  { source: "Armadoggo", translation: "アルマドッゴ" },
  { source: "Allosaurus", translation: "アロサウルス" },
  { source: "Ankylosaurus", translation: "アンキロサウルス" },
  { source: "Angler", translation: "アンコウ" },
  { source: "Giant Bee", translation: "イキオオミツバチ" },
  { source: "Iguanodon", translation: "イグアノドン" },
  { source: "Ichthyosaurus", translation: "イクチオサウルス" },
  { source: "Ichthyornis", translation: "イクチオルニス" },
  { source: "Yi-Ling", translation: "イーリン" },
  { source: "Drakeling (Winter)", translation: "ウィンター・ドレイクリング" },
  { source: "Equus", translation: "エクウス" },
  { source: "Unicorn", translation: "ユニコーン" },
  { source: "Elderclaw", translation: "エルダークロー" },
  { source: "Enforcer", translation: "エンフォーサー" },
  { source: "Oasisaur", translation: "オアシサウルス" },
  { source: "Oviraptor", translation: "オヴィラプトル" },
  { source: "Ossidon", translation: "オシドン" },
  { source: "Drakeling (Autumn)", translation: "オータム・ドレイクリング" },
  { source: "Onyc", translation: "オニコニクテリス" },
  { source: "Aureliax", translation: "オーレリアックス" },
  { source: "Kairuku", translation: "カイルクペンギン" },
  { source: "Castoroides", translation: "カストロイデス" },
  { source: "Gasbags", translation: "ガスバッグ" },
  { source: "Gacha", translation: "ガチャ" },
  { source: "Kaprosuchus", translation: "カプロスクス" },
  { source: "Mantis", translation: "カマキリ" },
  { source: "Chalicotherium", translation: "カリコテリウム" },
  { source: "Gallimimus", translation: "ガリミムス" },
  { source: "Carcharodontosaurus", translation: "カルカロドントサウルス" },
  { source: "Karkinos", translation: "カルキノス" },
  { source: "Carnotaurus", translation: "カルノタウルス" },
  { source: "Carbonemys", translation: "カルボネミス" },
  { source: "Otter", translation: "カワウソ" },
  { source: "Gigadesmodus", translation: "ギガデスモダス" },
  { source: "Giganotosaurus", translation: "ギガノトサウルス" },
  { source: "Gigantopithecus", translation: "ギガントピテクス" },
  { source: "Gigantoraptor", translation: "ギガントラプトル" },
  { source: "Cryolophosaurus", translation: "クライオロフォサウルス" },
  { source: "Grand Tortugar", translation: "グランド・トルトゥガー" },
  { source: "Griffin", translation: "グリフィン" },
  { source: "Gloon", translation: "グルーン" },
  { source: "Glowtail", translation: "グローテール" },
  { source: "Quetzal", translation: "ケツァルコアトルス" },
  { source: "Woolly Rhino", translation: "ケブカサイ" },
  { source: "Ceratosaurus", translation: "ケラトサウルス" },
  { source: "Kentrosaurus", translation: "ケントロサウルス" },
  { source: "Cosmo", translation: "コスモ" },
  { source: "Compy", translation: "コンプソグナトゥス" },
  { source: "Sabertooth", translation: "サーベルタイガー" },
  { source: "Drakeling (Summer)", translation: "サマー・ドレイクリング" },
  { source: "Sarco", translation: "サルコスクス" },
  { source: "Trilobite", translation: "三葉虫" },
  { source: "Archaeopteryx", translation: "始祖鳥" },
  { source: "Xiphactinus", translation: "シファクティヌス" },
  { source: "Shinehorn", translation: "シャインホーン" },
  { source: "Shastasaurus", translation: "シャスタサウルス" },
  { source: "Dire Bear", translation: "ショートフェイスベア" },
  { source: "Coelacanth", translation: "シーラカンス" },
  { source: "Scout", translation: "スカウト" },
  { source: "Stegosaurus", translation: "ステゴサウルス" },
  { source: "Spino", translation: "スピノサウルス" },
  { source: "Drakeling (Spring)", translation: "スプリング・ドレイクリング" },
  { source: "Thrall", translation: "スロール" },
  { source: "Sabertooth Salmon", translation: "セイバートゥース・サーモン" },
  { source: "Solwyn", translation: "ソルウィン" },
  { source: "Direwolf", translation: "ダイアウルフ" },
  { source: "Dire Polar Bear", translation: "ダイアホッキョクグマ" },
  { source: "Daeodon", translation: "ダエオドン" },
  { source: "Tapejara", translation: "タペヤラ" },
  { source: "Dunkleosteus", translation: "ダンクルオステウス" },
  { source: "Chalk Elemental", translation: "チョークエレメンタル" },
  { source: "Titanosaur", translation: "ティタノサウルス" },
  { source: "Titanoboa", translation: "ティタノボア" },
  { source: "Deinosuchus", translation: "デイノスクス" },
  { source: "Deinotherium", translation: "ディノテリウム" },
  { source: "Deinonychus", translation: "デイノニクス" },
  { source: "Diplocaulus", translation: "ディプロカウルス" },
  { source: "Diplodocus", translation: "ディプロドクス" },
  { source: "Dimetrodon", translation: "ディメトロドン" },
  { source: "Dimorphodon", translation: "ディモルフォドン" },
  { source: "Thylacoleo", translation: "ティラコレオ" },
  { source: "Rex", translation: "ティラノサウルス" },
  { source: "Dilophosaur", translation: "ディロフォサウルス" },
  { source: "Desmodus", translation: "デスモダス" },
  { source: "Terror Bird", translation: "テラーバード" },
  { source: "Therizinosaur", translation: "テリジノサウルス" },
  { source: "Electrophorus", translation: "デンキウナギ" },
  { source: "Tusoteuthis", translation: "トゥソテウティス" },
  { source: "Doedicurus", translation: "ドエディクルス" },
  { source: "Dodo", translation: "ドードー" },
  { source: "Jerboa", translation: "トビネズミ" },
  { source: "Triceratops", translation: "トリケラトプス" },
  { source: "Dreadnoughtus", translation: "ドレッドノータス" },
  { source: "Dreadmare", translation: "ドレッドメア" },
  { source: "Dreadstallion", translation: "ドレッドスタリオン" },
  { source: "Troodon", translation: "トロオドン" },
  { source: "Cat", translation: "猫" },
  { source: "Bison", translation: "バイソン" },
  { source: "Pyromane", translation: "パイロメイン" },
  { source: "Pachycephalosaurus", translation: "パキケファロサウルス" },
  { source: "Pachyrhinosaurus", translation: "パキリノサウルス" },
  { source: "Vulture", translation: "ハゲワシ" },
  { source: "Basilisk", translation: "バジリスク" },
  { source: "Basilosaurus", translation: "バシロサウルス" },
  { source: "Paracer", translation: "パラケラテリウム" },
  { source: "Parasaur", translation: "パラサウロロフス" },
  { source: "Baryonyx", translation: "バリオニクス" },
  { source: "Bulbdog", translation: "バルブドッグ" },
  { source: "Hyaenodon", translation: "ヒエノドン" },
  { source: "Ovis", translation: "ヒツジ" },
  { source: "Leech", translation: "ヒル" },
  { source: "Fire Wyvern", translation: "ファイアワイバーン" },
  { source: "Fasolasuchus", translation: "ファソラスクス" },
  { source: "Phiomia", translation: "フィオミア" },
  { source: "Featherlight", translation: "フェザーライト" },
  { source: "Phoenix", translation: "フェニックス" },
  { source: "Ferox", translation: "フェロクス" },
  { source: "Pteranodon", translation: "プテラノドン" },
  { source: "Bloodstalker", translation: "ブラッドストーカー" },
  { source: "Pulmonoscorpius", translation: "プルモノスコルピウス" },
  { source: "Purlovia", translation: "プルロヴィア" },
  { source: "Plesiosaur", translation: "プレシオサウルス" },
  { source: "Procoptodon", translation: "プロコプトドン" },
  { source: "Burrowbuck", translation: "ブローバック" },
  { source: "Bronto", translation: "ブロントサウルス" },
  { source: "Dung Beetle", translation: "フンコロガシ" },
  { source: "Pegomastax", translation: "ペゴマスタクス" },
  { source: "Hesperornis", translation: "ヘスペロルニス" },
  { source: "Pelagornis", translation: "ペラゴルニス" },
  { source: "Helicoprion", translation: "ヘリコプリオン" },
  { source: "Veilwyn", translation: "ベールウィン" },
  { source: "Beelzebufo", translation: "ベールゼブフォ" },
  { source: "Velonasaur", translation: "ベロナサウルス" },
  { source: "Poison Wyvern", translation: "ポイズンワイバーン" },
  { source: "Magmasaur", translation: "マグマサウルス" },
  { source: "Managarmr", translation: "マナガルム" },
  { source: "Malwyn", translation: "マルウィン" },
  { source: "Manta", translation: "マンタ" },
  { source: "Mammoth", translation: "マンモス" },
  { source: "Microraptor", translation: "ミクロラプトル" },
  { source: "Maeguana", translation: "メイグアナ" },
  { source: "Megachelon", translation: "メガケロン" },
  { source: "Megatherium", translation: "メガテリウム" },
  { source: "Piranha", translation: "メガピラニア" },
  { source: "Megalania", translation: "メガラニア" },
  { source: "Megaraptor", translation: "メガラプトル" },
  { source: "Megaloceros", translation: "メガロケロス" },
  { source: "Megalosaurus", translation: "メガロサウルス" },
  { source: "Megalodon", translation: "メガロドン" },
  { source: "Mesopithecus", translation: "メソピテクス" },
  { source: "Mosasaurus", translation: "モササウルス" },
  { source: "Moschops", translation: "モスコプス" },
  { source: "Morellatops", translation: "モレラトプス" },
  { source: "Thorny Dragon", translation: "モロクトカゲ" },
  { source: "Lamprey", translation: "ヤツメウナギ" },
  { source: "Yutyrannus", translation: "ユウティラヌス" },
  { source: "Snow Owl", translation: "雪フクロウ" },
  { source: "Raptor", translation: "ユタラプトル" },
  { source: "Lightning Wyvern", translation: "ライトニングワイバーン" },
  { source: "Ravager", translation: "ラベジャー" },
  { source: "Liopleurodon", translation: "リオプレウロドン" },
  { source: "Lystrosaurus", translation: "リストロサウルス" },
  { source: "Rhyniognatha", translation: "リニオグナタ" },
  { source: "Reaper King", translation: "リーパーキング" },
  { source: "Lymantria", translation: "リマントリア" },
  { source: "Rock Elemental", translation: "ロックエレメンタル" },
  { source: "Rock Drake", translation: "ロックドレイク" },
  { source: "Roll Rat", translation: "ロールラット" },
];

main();
