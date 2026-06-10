import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createWorker } from "tesseract.js";

export const Route = createFileRoute("/ocr")({
  component: OcrComponent,
});

// 🛠️ 1. 切り抜きたいエリア（ステータス項目）をここに定義します
// ゲームの解像度（1080pなど）に合わせて座標を書き換えてください
const GAME_UI_REGIONS = [
  { id: "health", name: "体力 (Health)", x: 500, y: 300, w: 120, h: 35 },
  { id: "stamina", name: "スタミナ (Stamina)", x: 500, y: 350, w: 120, h: 35 },
  { id: "weight", name: "重量 (Weight)", x: 500, y: 400, w: 120, h: 35 },
  { id: "melee", name: "近接攻撃力 (Melee)", x: 500, y: 450, w: 120, h: 35 },
];

interface CropRegion {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function spritImage(width: number, height: number): CropRegion[] {
  const result: CropRegion[] = [];
  const dw = 300;
  const dh = 50;
  // name
  result.push({
    id: "name",
    name: "名前",
    x: (width - dw) / 2,
    y: height / 0.1,
    w: dw,
    h: dh,
  });
  return result;
}

interface CroppedResult {
  id: string;
  name: string;
  dataUrl: string;
}

function OcrComponent() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [cropRegions, setCropRegions] = useState<CropRegion[]>([]);
  // 📸 切り抜いた複数の画像データを格納する配列
  const [croppedList, setCroppedList] = useState<CroppedResult[]>([]);

  // 🔄 複数エリアを順番に切り抜く処理
  const processMultiCrop = (imageSrc: string) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      // 複数の切り抜き結果を一時的に貯める配列
      const results: CroppedResult[] = [];

      const regions = spritImage(img.width, img.height);
      setCropRegions(regions);
      // 定義したエリアをループ処理
      regions.forEach((region) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Canvasのサイズを、各エリアの幅・高さに合わせる
        canvas.width = region.w;
        canvas.height = region.h;

        // 指定座標から元色のまま Canvas に切り出し描画（二値化は無し）
        ctx.drawImage(
          img,
          region.x,
          region.y,
          region.w,
          region.h,
          0,
          0,
          region.w,
          region.h,
        );

        // 結果を配列に追加
        results.push({
          id: region.id,
          name: region.name,
          dataUrl: canvas.toDataURL("image/png"),
        });
      });

      // すべての切り抜きが終わったらステートを一気に更新
      setCroppedList(results);
    };
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const blobUrl = URL.createObjectURL(files[0]);
      setOriginalImage(blobUrl);

      // 画像読み込みと同時に、複数切り抜きを実行
      processMultiCrop(blobUrl);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>ARK ステータス画面 複数切り抜きテスト</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} />

      <div style={{ display: "flex", gap: "40px", marginTop: "20px" }}>
        {/* 左側：元画像の表示 */}
        {originalImage && (
          <div style={{ flex: 2 }}>
            <h3>1. 元画像（全体）</h3>
            <div className="relative">
              <img
                src={originalImage}
                alt="Original"
                style={{ maxWidth: "100%", border: "1px solid #ccc" }}
              />
            </div>
          </div>
        )}

        {/* 右側：切り抜かれた複数ステータスの一覧表示 */}
        <div style={{ flex: 1, minWidth: "300px" }}>
          <h3>2. 切り抜かれたステータス項目</h3>
          {croppedList.length === 0 && (
            <p style={{ color: "#999" }}>
              画像を選択するとここに切り抜き一覧が出ます
            </p>
          )}

          <div
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            {croppedList.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid #ddd",
                  padding: "10px",
                  borderRadius: "5px",
                  background: "#fafafa",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontSize: "14px",
                  }}
                >
                  {item.name}
                </strong>
                <div
                  style={{
                    background: "#222",
                    padding: "8px",
                    display: "inline-block",
                    borderRadius: "3px",
                  }}
                >
                  <img
                    src={item.dataUrl}
                    alt={item.name}
                    style={{
                      display: "block",
                      imageRendering: "pixelated",
                      maxHeight: "50px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
