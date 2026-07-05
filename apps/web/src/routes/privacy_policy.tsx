import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy_policy")({
  component: PrivacyPolicyComponent,
});

function PrivacyPolicyComponent() {
  return (
    <div>
      <h2 className="font-medium">このアプリについて</h2>
      <ul className="list-inside list-disc">
        <li>
          <span className="font-medium">プライバシー:</span>
          本アプリは、入力されたデータや個人情報をサーバーに送信したり、保存したりすることはありません。
        </li>
        <li>
          <span className="font-medium">アクセス解析:</span>
          GitHub Pages
          標準の統計機能（誰がアクセスしたか特定できない数値データ）のみを参照しています。
        </li>
        <li>
          <span className="font-medium">免責事項:</span>
          本アプリの利用により生じた損害について、作者は一切の責任を負いません。
        </li>
      </ul>
    </div>
  );
}
