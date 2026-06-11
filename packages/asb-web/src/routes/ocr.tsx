import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createWorker, PSM, type RecognizeOptions } from "tesseract.js";

export const Route = createFileRoute("/ocr")({
  component: OcrComponent,
});

interface Region {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RegionWithSrc extends Region {
  imageSrc: string;
}

interface RegionWithSrcText extends RegionWithSrc {
  text: string;
}

function OcrComponent() {
  const workerRef = useRef<Tesseract.Worker | null>(null);
  const [status, setStatus] = useState<string>("初期化中...");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const canvasReff = useRef<HTMLCanvasElement | null>(null);
  const [regionWithSrc, setRegionWithSrc] = useState<RegionWithSrc[]>([]);
  const [regionWithSrcText, setRegionWithSrcText] = useState<
    RegionWithSrcText[]
  >([]);

  const [nameLevelYM, setNameLevelYM] = useState<number>(0.17);
  const [nameLevelDwM, setNameLevelDwM] = useState<number>(0.2);
  const [nameLevelDhM, setNameLevelDhM] = useState<number>(0.024);

  const [statYM, setStatYM] = useState<number>(0.42);
  const [statDwM, setStatDwM] = useState<number>(0.27);
  const [statDhM, setStatDhM] = useState<number>(0.0317);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setImageSrc(URL.createObjectURL(files[0]));
    }
  };

  useEffect(() => {
    async function loadWorker() {
      try {
        // 💡 ポイント: オプションオブジェクトに logger を指定する
        const worker = await createWorker("jpn", 1, {
          logger: (m) => {
            // m.status には 'loading tesseract core' や 'recognizing text' などが入ります
            if (m.status === "recognizing text") {
              // m.progress は 0.0 〜 1.0 の小数点なので、100倍して丸める
              setProgress(Math.round(m.progress * 100));
            }
          },
        });
        workerRef.current = worker;
        setStatus("準備完了");
      } catch (error) {
        console.error(error);
        setStatus("初期化失敗");
      }
    }
    loadWorker();

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  useEffect(() => {
    if (imageSrc && canvasReff.current) {
      const canvas = canvasReff.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          getRegions(
            img.width,
            img.height,
            nameLevelYM,
            nameLevelDwM,
            nameLevelDhM,
            statYM,
            statDwM,
            statDhM,
          ).forEach((region) => {
            // 切り取り範囲
            ctx.strokeStyle = "red";
            ctx.lineWidth = 5;
            ctx.strokeRect(region.x, region.y, region.width, region.height);

            // 切り取り
            const tmpCanvas = document.createElement("canvas");
            const tmpCtx = tmpCanvas.getContext("2d");
            if (tmpCtx) {
              tmpCanvas.width = region.width;
              tmpCanvas.height = region.height;
              tmpCtx.drawImage(
                img,
                region.x,
                region.y,
                region.width,
                region.height,
                0,
                0,
                region.width,
                region.height,
              );

              // 全ピクセルの色データを取得
              const imageData = tmpCtx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height,
              );
              const data = imageData.data;

              const threshold = 128;
              // ピクセルをループ（4要素で1ピクセル: R, G, B, A）
              for (let i = 0; i < data.length; i += 4) {
                // 1. 人間の目に合わせた正確な明るさ（輝度）を計算
                const brightness =
                  0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

                // 2. 「しきい値」より明るければ白、暗ければ黒にする
                // 💡 ARKのUIが「明るい文字＋暗い背景」なら、文字を黒(0)・背景を白(255)に反転させるとTesseractの精度が上がります
                const color = brightness > threshold ? 0 : 255;

                data[i] = color; // Red
                data[i + 1] = color; // Green
                data[i + 2] = color; // Blue
                // data[i+3] (Alpha) はそのまま触らない
              }
              // 変換したデータをCanvasに書き戻す
              tmpCtx.putImageData(imageData, 0, 0);
            }
            setRegionWithSrc((v) => [
              { ...region, imageSrc: tmpCanvas.toDataURL("image/png") },
              ...v,
            ]);
          });
        };
        img.src = imageSrc;
      }
    }
  }, [
    imageSrc,
    nameLevelYM,
    nameLevelDwM,
    nameLevelDhM,
    statYM,
    statDwM,
    statDhM,
  ]);

  useEffect(() => {
    const read = async (region: RegionWithSrc) => {
      if (workerRef.current) {
        await workerRef.current.setParameters({
          tessedit_pageseg_mode: PSM.SINGLE_LINE,
          tessedit_char_whitelist: "0123456789/.%",
        });
        const {
          data: { text },
        } = await workerRef.current.recognize(region.imageSrc, {});
        return text;
      } else {
        return "";
      }
    };
    const setRegion = async () => {
      for (const region of regionWithSrc) {
        const text = await read(region);
        setRegionWithSrcText((v) => [{ ...region, text }, ...v]);
      }
    };
    setRegion();
  }, [regionWithSrc]);

  return (
    <div className="grid grid-cols-1 gap-2">
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <canvas ref={canvasReff} className="w-full"></canvas>
      <div>
        <input
          type="number"
          value={nameLevelYM}
          onChange={(e) => setNameLevelYM(Number(e.target.value))}
        />
        <input
          type="number"
          value={nameLevelDwM}
          onChange={(e) => setNameLevelDwM(Number(e.target.value))}
        />
        <input
          type="number"
          value={nameLevelDhM}
          onChange={(e) => setNameLevelDhM(Number(e.target.value))}
        />

        <input
          type="number"
          value={statYM}
          onChange={(e) => setStatYM(Number(e.target.value))}
        />
        <input
          type="number"
          value={statDwM}
          onChange={(e) => setStatDwM(Number(e.target.value))}
        />
        <input
          type="number"
          value={statDhM}
          onChange={(e) => setStatDhM(Number(e.target.value))}
        />
      </div>
      <div className="grid grid-cols-1 gap-2">
        {regionWithSrcText.map((r) => (
          <div key={r.name}>
            <span>{r.name}</span>
            <img alt={r.name} src={r.imageSrc}></img>
            <span>{r.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const getRegions = (
  width: number,
  height: number,
  nameLevelYM: number,
  nameLevelDwM: number,
  nameLevelDhM: number,
  statYM: number,
  statDwM: number,
  statDhM: number,
): Region[] => {
  const regions: Region[] = [];

  const nameLevelY = height * nameLevelYM;
  const nameLevelDw = height * nameLevelDwM;
  const nameLevelDh = height * nameLevelDhM;
  regions.push({
    name: "name",
    x: (width - nameLevelDw) / 2,
    y: nameLevelY,
    width: nameLevelDw,
    height: nameLevelDh,
  });
  regions.push({
    name: "level",
    x: (width - nameLevelDw) / 2,
    y: nameLevelY + nameLevelDh,
    width: nameLevelDw,
    height: nameLevelDh,
  });

  const statY = height * statYM;
  const statDw = height * statDwM;
  const statDh = height * statDhM;
  Array.from({ length: 8 }, (_, i) => i).forEach((i) => {
    regions.push({
      name: `stat_value_${i}`,
      x: width / 2,
      y: statY + statDh * i,
      width: statDw / 2,
      height: statDh,
    });
  });
  return regions;
};
