import {
  Label,
  NumberField,
  Separator,
  Switch,
  Table,
  toast,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  type ASBTSErrorObject,
  type CropRect,
  DEFAULT_CROP_RECT_OPTION,
  type ExtractTextsOutput,
  type ExtractType,
  extractTexts,
  type ImageLabel,
  type OcrLabel,
} from "asb-ts";
import { useEffect, useRef, useState } from "react";
import * as R from "remeda";
import { useOcrQueue } from "@/contexts";

export const Route = createFileRoute("/ocr")({
  component: OcrComponent,
});

const allowedFileTypes = ["image/png", "image/jpeg"];

function OcrComponent() {
  const [fileName, setFileName] = useState<string>("");
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
    if (img && canvasReff.current) {
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
      if (result.isSuccess) {
        setOcrResult(result.result);
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
        Object.entries(result.result.result.cropRects).forEach(
          ([_, cropRect]) => {
            strokeRect(cropRect);
          },
        );
      } else {
        setError(result.error);
      }
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
                  {R.entries(ocrResult.result.croppedImages).map(
                    ([ol, images]) => (
                      <Table.Row key={ol}>
                        <Table.Cell>{ol}</Table.Cell>
                        {R.entries(images).map(([il, img]) => (
                          <Table.Cell key={il}>
                            <div>
                              <img
                                src={img.toDataURL()}
                                aria-label="cropped image"
                              />
                            </div>
                            {R.keys(
                              ocrResult.result.extractedPromiseTexs[ol],
                            ).map((et, i, array) => (
                              <>
                                <div className="flex gap-2">
                                  <span>{et}:</span>
                                  <ShowExtractedText
                                    key={et}
                                    fileName={fileName}
                                    ocrResult={ocrResult}
                                    ol={ol}
                                    et={et}
                                    il={il}
                                  />
                                </div>
                                {i + 1 !== array.length && <Separator />}
                              </>
                            ))}
                          </Table.Cell>
                        ))}
                        <Table.Cell>
                          <ShowNormalizedText
                            fileName={fileName}
                            ocrResult={ocrResult}
                            ol={ol}
                          />
                          {ol === "stat_name_0" && (
                            <>
                              <Separator />
                              <ShowNormalizedTextWithDom
                                fileName={fileName}
                                ocrResult={ocrResult}
                              />
                            </>
                          )}
                        </Table.Cell>
                        {showLog && (
                          <Table.Cell>
                            <ShowLog
                              fileName={fileName}
                              ocrResult={ocrResult}
                              ol={ol}
                            />
                            {ol === "stat_name_0" && (
                              <>
                                <Separator />
                                <ShowLogWithDom
                                  fileName={fileName}
                                  ocrResult={ocrResult}
                                />
                              </>
                            )}
                          </Table.Cell>
                        )}
                      </Table.Row>
                    ),
                  )}
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

function ShowExtractedText({
  fileName,
  ocrResult,
  ol,
  et,
  il,
}: {
  fileName: string;
  ocrResult: ExtractTextsOutput;
  ol: OcrLabel;
  et: ExtractType;
  il: ImageLabel;
}) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["ExtractedText", fileName, ol, et, il],
    queryFn: () =>
      ocrResult.result.extractedPromiseTexs[ol][et]?.[il] ??
      Promise.resolve(null),
  });
  if (isError) {
    return <div>エラーが発生しました。</div>;
  } else if (isPending) {
    return <div>待機中...</div>;
  } else {
    return <div>{data}</div>;
  }
}

function ShowNormalizedText({
  fileName,
  ocrResult,
  ol,
}: {
  fileName: string;
  ocrResult: ExtractTextsOutput;
  ol: OcrLabel;
}) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["normalizedTexts", fileName, ol],
    queryFn: () =>
      ocrResult.resultPromise.then((p) => p.normalizedTexts[ol] ?? null),
  });
  if (isError) {
    return <div>エラーが発生しました。</div>;
  } else if (isPending) {
    return <div>待機中...</div>;
  } else {
    return (
      <div>
        <div>{data.type}</div>
        <div>{JSON.stringify(data.text)}</div>
      </div>
    );
  }
}

function ShowLog({
  fileName,
  ocrResult,
  ol,
}: {
  fileName: string;
  ocrResult: ExtractTextsOutput;
  ol: OcrLabel;
}) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["logs", fileName, ol],
    queryFn: () => ocrResult.resultPromise.then((p) => p.logs[ol] ?? []),
  });
  if (isError) {
    return <div>エラーが発生しました。</div>;
  } else if (isPending) {
    return <div>待機中...</div>;
  } else {
    return (
      <ol>
        {data.map((log) => (
          <li key={JSON.stringify(log)}>
            {log.isValibotError
              ? `action: ${log.action}, flatError: ${JSON.stringify(log.flatError, null, 2)},`
              : `action: ${log.action}, output: ${log.output}${log.param !== undefined ? "" : `, param: ${log.param}`}}`}
          </li>
        ))}
      </ol>
    );
  }
}

function ShowNormalizedTextWithDom({
  fileName,
  ocrResult,
}: {
  fileName: string;
  ocrResult: ExtractTextsOutput;
}) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["normalizedTextsWithDom", fileName],
    queryFn: () => ocrResult.resultPromise.then((p) => p.withDom ?? null),
  });
  if (isError) {
    return <div>エラーが発生しました。</div>;
  } else if (isPending) {
    return <div>待機中...</div>;
  } else {
    return (
      <div>
        <div>{data.type}</div>
        <div>{JSON.stringify(data.text)}</div>
      </div>
    );
  }
}

function ShowLogWithDom({
  fileName,
  ocrResult,
}: {
  fileName: string;
  ocrResult: ExtractTextsOutput;
}) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["logsWithDom", fileName],
    queryFn: () => ocrResult.resultPromise.then((p) => p.withDomLog ?? []),
  });
  if (isError) {
    return <div>エラーが発生しました。</div>;
  } else if (isPending) {
    return <div>待機中...</div>;
  } else {
    return (
      <ol>
        {data.map((log) => (
          <li key={JSON.stringify(log)}>
            {log.isValibotError
              ? `action: ${log.action}, flatError: ${JSON.stringify(log.flatError, null, 2)},`
              : `action: ${log.action}, output: ${log.output}${log.param !== undefined ? "" : `, param: ${log.param}`}}`}
          </li>
        ))}
      </ol>
    );
  }
}
