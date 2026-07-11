import { type Client, Events } from "discord.js";

export function setReady(client: Client) {
  client.once(Events.ClientReady, () => {
    // biome-ignore lint/suspicious/noConsole: 一旦console.logで準備完了が分かるようにする
    console.log("Client Ready!");
  });
}
