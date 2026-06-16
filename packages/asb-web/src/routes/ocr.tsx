import {
  Label,
  NumberField,
  Separator,
  Switch,
  Table,
  toast,
} from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import {
  type CropRect,
  DEFAULT_CROP_RECT_OPTION,
  type ExtractTextsOutput,
  extractTexts,
  type OcrLabel,
} from "asb-ts";
import { Suspense, use, useEffect, useRef, useState } from "react";
import * as R from "remeda";
import { useOcrQueue } from "@/contexts";

export const Route = createFileRoute("/ocr")({
  component: OcrComponent,
});

const allowedFileTypes = ["image/png", "image/jpeg"];

function OcrComponent() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const canvasReff = useRef<HTMLCanvasElement | null>(null);

  const [ymNL, setYmNL] = useState<number>(DEFAULT_CROP_RECT_OPTION.ymNL);
  const [dlmNL, setDlmNL] = useState<number>(DEFAULT_CROP_RECT_OPTION.dlmNL);
  const [drmNL, setDrmNL] = useState<number>(DEFAULT_CROP_RECT_OPTION.drmNL);
  const [dhmNL, setDhmNL] = useState<number>(DEFAULT_CROP_RECT_OPTION.dhmNL);
  const [ymS, setYmS] = useState<number>(DEFAULT_CROP_RECT_OPTION.ymS);
  const [dlmS, setDlmS] = useState<number>(DEFAULT_CROP_RECT_OPTION.dlmS);
  const [drmS, setDrmS] = useState<number>(DEFAULT_CROP_RECT_OPTION.drmS);
  const [dhmS, setDhmS] = useState<number>(DEFAULT_CROP_RECT_OPTION.dhmS);

  const [ocrResult, setOcrResult] = useState<ExtractTextsOutput | null>(null);

  const [showLog, setShowLog] = useState<boolean>(true);

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
        const result = extractTexts(
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
        const strokeRect = ({ x, y, width, height }: CropRect) => {
          ctx.strokeStyle = "red";
          ctx.lineWidth = 5;
          ctx.strokeRect(x, y, width, height);
        };
        Object.entries(result.result).forEach(([_, { cropRects }]) => {
          strokeRect(cropRects);
        });

        setOcrResult(result);
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
        <p>{`OCRステータス: ${status}, 完了/全量 ${completeCnt}/${requestCnt}`}</p>
        <Switch isSelected={showLog} onChange={setShowLog}>
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb>
                <Switch.Icon /> {/* Optional */}
              </Switch.Thumb>
            </Switch.Control>
            logを表示する
          </Switch.Content>
        </Switch>
        {ocrResult && (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Example table">
                <Table.Header>
                  <Table.Column>label</Table.Column>
                  <Table.Column>original</Table.Column>
                  <Table.Column>grayscale</Table.Column>
                  <Table.Column>binary</Table.Column>
                  <Table.Column>normarized</Table.Column>
                  {showLog && <Table.Column>log</Table.Column>}
                </Table.Header>
                <Table.Body>
                  {R.entries(ocrResult.result).map(([ol, ov]) => (
                    <Table.Row key={ol}>
                      <Table.Cell>{ol}</Table.Cell>
                      {R.entries(ov.croppedImages).map(([il, iv]) => (
                        <Table.Cell key={il}>
                          <div>
                            <img
                              src={iv.toDataURL()}
                              aria-label="cropped image"
                            />
                            <span>
                              <Suspense fallback={<div>抽出中...</div>}>
                                <ShowExtractedText
                                  textPromise={ov.extractedPromiseTexs[il]}
                                ></ShowExtractedText>
                              </Suspense>
                            </span>
                          </div>
                        </Table.Cell>
                      ))}
                      <Table.Cell>
                        <span>
                          <Suspense fallback={<div>待機中...</div>}>
                            <ShowNormalizedText
                              resultPromise={ocrResult.resultPromise}
                              ol={ol}
                            ></ShowNormalizedText>
                          </Suspense>
                        </span>
                      </Table.Cell>
                      {showLog && (
                        <Table.Cell>
                          <span>
                            <Suspense fallback={<div>待機中...</div>}>
                              <ShowLog
                                resultPromise={ocrResult.resultPromise}
                                ol={ol}
                              ></ShowLog>
                            </Suspense>
                          </span>
                        </Table.Cell>
                      )}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
            <Table.Footer>{/* Optional footer content */}</Table.Footer>
          </Table>
        )}
      </section>
    </div>
  );
}

function ShowExtractedText({ textPromise }: { textPromise: Promise<string> }) {
  const text = use(textPromise);
  return <span>{text}</span>;
}

function ShowNormalizedText({
  resultPromise,
  ol,
}: {
  resultPromise: ExtractTextsOutput["resultPromise"];
  ol: OcrLabel;
}) {
  const text = use(resultPromise)[ol].normalizedTexts;
  return <span>{text}</span>;
}

function ShowLog({
  resultPromise,
  ol,
}: {
  resultPromise: ExtractTextsOutput["resultPromise"];
  ol: OcrLabel;
}) {
  const logList = use(resultPromise)[ol].log;
  return (
    <div>
      {logList.map((log, i) => {
        return (
          <p
            key={log.action}
          >{`${i}| ${log.isValibotError ? `error: ${JSON.stringify(log.flatError, null, 2)}` : `action: ${log.action}, output: ${log.output}`}`}</p>
        );
      })}
    </div>
  );
}
