import { OcrQueueManager, type OcrQueueManagerStatus } from "asb-ts";
import { createContext, useContext, useEffect, useRef, useState } from "react";

const OcrContext = createContext<
  [OcrQueueManager, OcrQueueManagerStatus, number, number] | null
>(null);

export function OcrProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] =
    useState<OcrQueueManagerStatus>("Not initialized");
  const [requestCnt, setRequestCnt] = useState<number>(0);
  const [completeCnt, setCompleteCnt] = useState<number>(0);
  // useRef を使って、Reactの再描画でもインスタンスが絶対に1つに保たれるようにする
  const ocrQueueRef = useRef(
    new OcrQueueManager(["jpn"], undefined, undefined, 4, (s, rCnt, cCnt) => {
      setStatus(s);
      setRequestCnt(rCnt);
      setCompleteCnt(cCnt);
    }),
  );

  useEffect(() => {
    return () => {
      ocrQueueRef.current.terminate();
    }; // 終了時にクリーンアップ
  }, []);

  return (
    <OcrContext.Provider
      value={[ocrQueueRef.current, status, requestCnt, completeCnt]}
    >
      {children}
    </OcrContext.Provider>
  );
}

// 呼び出しを簡単にするカスタムHook
export const useOcrQueue = () => {
  const context = useContext(OcrContext);
  if (!context) throw new Error("OcrProvider の中で使用してください");
  return context;
};
