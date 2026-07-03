import {
  Label,
  NumberField,
  Separator,
  Switch,
  Table,
  toast,
} from "@heroui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  type ASBTSErrorObject,
  type CropRect,
  DEFAULT_CROP_RECT_OPTION,
  type ExtractTextsOutputBrowser,
  extractTexts,
  IMAGE_LABELS,
  type ImageLabel,
  OCR_LABELS,
  type OcrLabel,
} from "asb-ts";
import {
  type ReactNode,
  Suspense,
  use,
  useEffect,
  useRef,
  useState,
} from "react";
import * as R from "remeda";
import { useOcrQueue } from "@/contexts";

export const Route = createFileRoute("/ocr")({
  component: OcrComponent,
});

const allowedFileTypes = ["image/png", "image/jpeg"];

function OcrComponent() {
  const [_fileName, setFileName] = useState<string>("");
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [canvas, setCanvas] = useState<OffscreenCanvas | null>(null);
  const canvasReff = useRef<HTMLCanvasElement | null>(null);

  const [ymNL, setYmNL] = useState<number>(DEFAULT_CROP_RECT_OPTION.ymNL);
  const [dlmNL, setDlmNL] = useState<number>(DEFAULT_CROP_RECT_OPTION.dlmNL);
  const [drmNL, setDrmNL] = useState<number>(DEFAULT_CROP_RECT_OPTION.drmNL);
  const [dhmNL, setDhmNL] = useState<number>(DEFAULT_CROP_RECT_OPTION.dhmNL);
  const [ymS, setYmS] = useState<number>(DEFAULT_CROP_RECT_OPTION.ymS);
  const [dlmS, setDlmS] = useState<number>(DEFAULT_CROP_RECT_OPTION.dlmS);
  const [drmS, setDrmS] = useState<number>(DEFAULT_CROP_RECT_OPTION.drmS);
  const [dhmS, setDhmS] = useState<number>(DEFAULT_CROP_RECT_OPTION.dhmS);

  const [ocrResult, setOcrResult] = useState<ExtractTextsOutputBrowser | null>(
    null,
  );
  const [_error, setError] = useState<ASBTSErrorObject | null>(null);

  const [showLog, setShowLog] = useState<boolean>(false);

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
      ocrQueue.cansel().then(() => {
        if (allowedFileTypes.includes(file.type)) {
          createImageBitmap(file).then((imageBitmap) => {
            const canvas = new OffscreenCanvas(
              imageBitmap.width,
              imageBitmap.height,
            );
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              toast.danger("Canvas要素のコンテキスト取得に失敗しました。");
              return;
            }
            ctx.drawImage(imageBitmap, 0, 0);
            setCanvas(canvas);
          });
          const image = new Image();
          image.onload = () => {
            setImg(image);
          };
          image.src = URL.createObjectURL(files[0]);
          setFileName(files[0].name);
        } else {
          toast.danger("画像ファイルを指定してください");
        }
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    ImageSetter(files);
  };

  useEffect(() => {
    if (img && canvas && canvasReff.current) {
      const result = extractTexts(
        ocrQueue,
        canvas,
        ymNL,
        dlmNL,
        drmNL,
        dhmNL,
        ymS,
        dlmS,
        drmS,
        dhmS,
      );
      if (result.isSuccess) {
        setOcrResult(result.result);
        result.result.cropRects.then((cropRects) => {
          const canvas = canvasReff.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          // 切り取り範囲
          const strokeRect = ({ x, y, width, height }: CropRect) => {
            ctx.strokeStyle = "red";
            ctx.lineWidth = 5;
            ctx.strokeRect(x, y, width, height);
          };
          Object.entries(cropRects).forEach(([_, cropRect]) => {
            strokeRect(cropRect);
          });
        });
      } else {
        setError(result.error);
      }
    }
  }, [ocrQueue, img, canvas, ymNL, dlmNL, drmNL, dhmNL, ymS, dlmS, drmS, dhmS]);

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
        <h3>結果</h3>
        <p>{`OCRステータス: ${status}, 残タスク: ${requestCnt - completeCnt}`}</p>
        <div className="flex gap-2">
          <Switch isSelected={showLog} onChange={setShowLog}>
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb>
                  <Switch.Icon /> {/* Optional */}
                </Switch.Thumb>
              </Switch.Control>
            </Switch.Content>
          </Switch>
          <span>logを表示する</span>
        </div>
        {ocrResult !== null && (
          <>
            <div className="flex gap-2">
              <span>リンク:</span>
              <CustomSuspense>
                <ShowLink ocrResult={ocrResult} />
              </CustomSuspense>
            </div>
            <div className="flex gap-2">
              <span>type:</span>
            </div>
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Example table">
                  <Table.Header>
                    <Table.Column isRowHeader>label</Table.Column>
                    <Table.Column>original</Table.Column>
                    <Table.Column>grayscale</Table.Column>
                    <Table.Column>binary</Table.Column>
                    <Table.Column>normarized</Table.Column>
                    {showLog && <Table.Column>log</Table.Column>}
                  </Table.Header>
                  <Table.Body>
                    {OCR_LABELS.map((ol) => (
                      <Table.Row key={ol}>
                        <Table.Cell>{ol}</Table.Cell>
                        {IMAGE_LABELS.map((il) => (
                          <Table.Cell key={il}>
                            <div>
                              <CustomSuspense>
                                <ShowCroppedImage
                                  ocrResult={ocrResult}
                                  ol={ol}
                                  il={il}
                                />
                              </CustomSuspense>
                            </div>
                            <CustomSuspense>
                              <ShowExtractedText
                                ocrResult={ocrResult}
                                ol={ol}
                                il={il}
                              />
                            </CustomSuspense>
                          </Table.Cell>
                        ))}
                        <Table.Cell>
                          <CustomSuspense>
                            <ShowNormalizedText ocrResult={ocrResult} ol={ol} />
                          </CustomSuspense>
                        </Table.Cell>
                        {showLog && (
                          <Table.Cell>
                            <CustomSuspense>
                              <ShowLog ocrResult={ocrResult} ol={ol} />
                            </CustomSuspense>
                          </Table.Cell>
                        )}
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
              <Table.Footer>{/* Optional footer content */}</Table.Footer>
            </Table>
          </>
        )}
      </section>
    </div>
  );
}

function CustomSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div>待機中...</div>}>{children}</Suspense>;
}

function ShowCroppedImage({
  ocrResult,
  ol,
  il,
}: {
  ocrResult: ExtractTextsOutputBrowser;
  ol: OcrLabel;
  il: ImageLabel;
}) {
  const data = use(ocrResult.croppedImages);
  const d = data[ol][il];
  return <img src={URL.createObjectURL(d)} aria-label="cropped image" />;
}

function ShowExtractedText({
  ocrResult,
  ol,
  il,
}: {
  ocrResult: ExtractTextsOutputBrowser;
  ol: OcrLabel;
  il: ImageLabel;
}) {
  const data = use(ocrResult.extractedTexs);
  const d = data[ol];
  return (
    <div>
      {R.entries(d).map(([et, ev]) => (
        <div key={et}>{`${et}: ${ev[il]}`}</div>
      ))}
    </div>
  );
}

function ShowNormalizedText({
  ocrResult,
  ol,
}: {
  ocrResult: ExtractTextsOutputBrowser;
  ol: OcrLabel;
}) {
  const data = use(ocrResult.normalized);
  const d = data.normalizedTexts[ol];
  return (
    <div>
      <div>{d.type}</div>
      <div>{JSON.stringify(d.text)}</div>
    </div>
  );
}

function ShowLog({
  ocrResult,
  ol,
}: {
  ocrResult: ExtractTextsOutputBrowser;
  ol: OcrLabel;
}) {
  const data = use(ocrResult.normalized);
  const d = data.logs[ol];
  return (
    <ol>
      {d.map((log) => (
        <li key={JSON.stringify(log)}>
          {log.isValibotError
            ? `action: ${log.action}, flatError: ${JSON.stringify(log.flatError, null, 2)},`
            : `action: ${log.action}, output: ${log.output}${log.param !== undefined ? "" : `, param: ${log.param}`}}`}
        </li>
      ))}
    </ol>
  );
}

function ShowLink({ ocrResult }: { ocrResult: ExtractTextsOutputBrowser }) {
  const data = use(ocrResult.normalized);
  const d = data.ip;
  return (
    <Link
      to="/calc"
      search={{
        mode: "value->level",
        type: d.type,
        n: data.normalizedTexts.name.text ?? "",

        h: d.values.health ?? 0,
        s: d.values.stamina ?? 0,
        o: d.values.oxygen ?? 0,
        f: d.values.food ?? 0,

        wtr: d.values.water ?? 0,
        temp: d.values.temperature ?? 0,
        w: d.values.weight ?? 0,
        m: d.values.meleeDamageMultiplier ?? 0,

        spd: d.values.speedMultiplier ?? 0,
        tempf: d.values.temperatureFortitude ?? 0,
        crft: d.values.craftingSpeedMultiplier ?? 0,
        t: d.values.torpidity ?? 0,

        i: d.imprinting,
        level: d.totalLevel,
        withDom: String(d.withDom),
      }}
    >
      レベル算出
    </Link>
  );
}
