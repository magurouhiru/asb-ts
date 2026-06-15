import { Label, NumberField, Separator, toast } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import {
  DEFAULT_REGIONS_OPTION,
  NORMALIZED_TEXTS_LABELS,
  OCR_LABELS,
  type ReadOutput,
  type Region,
  read,
} from "asb-ts";
import { IMG_PACK_LABELS } from "asb-ts/src/asb/types/ocr";
import { useEffect, useRef, useState } from "react";
import { useOcrQueue } from "@/contexts";
export const Route = createFileRoute("/ocr")({
  component: OcrComponent,
});

const allowedFileTypes = ["image/png", "image/jpeg"];

function OcrComponent() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const canvasReff = useRef<HTMLCanvasElement | null>(null);

  const [ymNL, setYmNL] = useState<number>(DEFAULT_REGIONS_OPTION.ymNL);
  const [dlmNL, setDlmNL] = useState<number>(DEFAULT_REGIONS_OPTION.dlmNL);
  const [drmNL, setDrmNL] = useState<number>(DEFAULT_REGIONS_OPTION.drmNL);
  const [dhmNL, setDhmNL] = useState<number>(DEFAULT_REGIONS_OPTION.dhmNL);
  const [ymS, setYmS] = useState<number>(DEFAULT_REGIONS_OPTION.ymS);
  const [dlmS, setDlmS] = useState<number>(DEFAULT_REGIONS_OPTION.dlmS);
  const [drmS, setDrmS] = useState<number>(DEFAULT_REGIONS_OPTION.drmS);
  const [dhmS, setDhmS] = useState<number>(DEFAULT_REGIONS_OPTION.dhmS);

  const [readOutput, setReadOutput] = useState<ReadOutput | null>(null);

  const regionsOptions: [
    string,
    number,
    React.Dispatch<React.SetStateAction<number>>,
  ][] = [
    ["ymNL", ymNL, setYmNL],
    ["dlmNL", dlmNL, setDlmNL],
    ["drmNL", drmNL, setDrmNL],
    ["dhmNL", dhmNL, setDhmNL],
    ["ymS", ymS, setYmS],
    ["dlmS", dlmS, setDlmS],
    ["drmS", drmS, setDrmS],
    ["dhmS", dhmS, setDhmS],
  ];

  const [ocrQueue, status, requestCnt, completeCnt] = useOcrQueue();

  const ImageSetter = (files: FileList | null) => {
    const file = files?.[0];
    if (file) {
      if (allowedFileTypes.includes(file.type)) {
        const image = new Image();
        image.onload = () => {
          setImg(image);
        };
        image.src = URL.createObjectURL(files[0]);
      } else {
        toast.danger("画像ファイルを指定してください");
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    ImageSetter(files);
  };

  useEffect(() => {
    if (img && canvasReff.current) {
      const execute = async () => {
        const result = await read(
          ocrQueue,
          img,
          ymNL,
          dlmNL,
          drmNL,
          dhmNL,
          ymS,
          dlmS,
          drmS,
          dhmS,
        );
        const canvas = canvasReff.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // 切り取り範囲
        const strokeRect = ({ x, y, width, height }: Region) => {
          ctx.strokeStyle = "red";
          ctx.lineWidth = 5;
          ctx.strokeRect(x, y, width, height);
        };
        Object.entries(result.regions).forEach(([_label, region]) => {
          strokeRect(region);
        });

        setReadOutput(result);
      };
      execute();
    }
  }, [ocrQueue, img, ymNL, dlmNL, drmNL, dhmNL, ymS, dlmS, drmS, dhmS]);

  return (
    <div className="grid grid-cols-1 gap-2">
      <section>
        <h3>ファイル設定</h3>
        <input
          id="file_input"
          type="file"
          accept={allowedFileTypes.join(",")}
          onChange={handleFileChange}
        />
        <div className="relative">
          <canvas ref={canvasReff} className="w-full"></canvas>
          <label
            htmlFor="file_input"
            className="absolute top-0 left-0 grid h-full w-full cursor-pointer items-center justify-center border-2 text-2xl"
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              ImageSetter(e.dataTransfer.files);
            }}
          >
            <div hidden={!!img}>
              <p>画像ファイルを選択してください。</p>
              <p>または、ドラッグアンドドロップしてください。</p>
            </div>
          </label>
        </div>
      </section>

      <Separator />

      <section>
        <h3>切り抜き位置調整</h3>
        <div className="grid grid-cols-4 gap-2">
          {regionsOptions.map(([name, value, settter]) => (
            <div key={name}>
              <NumberField
                value={value}
                onChange={(e) => settter(e)}
                step={name === "dhmNL" || name === "dhmS" ? 0.00001 : 0.001}
                formatOptions={{
                  maximumFractionDigits: 5,
                  minimumFractionDigits: 3,
                }}
              >
                <Label>{name}</Label>
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input />
                  <NumberField.IncrementButton />
                </NumberField.Group>
              </NumberField>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      <section>
        <h3>切り抜き結果と生の結果</h3>
        <span>{`OCRステータス: ${status}, 完了/全量 ${completeCnt}/${requestCnt}`}</span>
        <div className="grid grid-cols-[auto_auto_auto_auto] gap-2">
          <span></span>
          {IMG_PACK_LABELS.map((ipl) => (
            <span key={ipl}>{ipl}</span>
          ))}
          {readOutput &&
            OCR_LABELS.map((ol) => (
              <div key={ol} className="col-span-full grid grid-cols-subgrid">
                <span>{ol}</span>
                {IMG_PACK_LABELS.map((ipl) => (
                  <div key={ipl} className="">
                    <img
                      src={readOutput.imgPacks[ol][ipl].toDataURL()}
                      aria-label={`${ol} ${ipl}`}
                    />
                    <span>{readOutput.ocrTexts[ol][ipl]}</span>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </section>

      <Separator />

      <section>
        <h3>補正結果と補正内容</h3>
        <div className="grid grid-cols-[auto_auto_auto] gap-2">
          <span></span>
          <span>補正結果</span>
          <span>補正内容</span>
          {readOutput &&
            NORMALIZED_TEXTS_LABELS.map((ntl) => (
              <div
                key={ntl}
                hidden={ntl === "stats_controller"}
                className="col-span-full grid max-w-full grid-cols-subgrid"
              >
                <span>{ntl}</span>
                <span>{JSON.stringify(readOutput.normalizedTexts[ntl])}</span>
                <div>
                  {Object.entries(readOutput.logs[ntl]).map(([ml, v]) => (
                    <div key={ml} className="break-all">
                      {`${ml}| action: ${v.action}, `}
                      {v.isValibotError
                        ? `flatError: ${JSON.stringify(v.flatError)}`
                        : `output: ${JSON.stringify(v.output)}${v.param !== undefined ? ` param: ${JSON.stringify(v.param)}` : ""}`}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
