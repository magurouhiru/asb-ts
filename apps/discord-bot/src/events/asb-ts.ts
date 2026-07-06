// import { extractTexts } from "@asb-ts/core";
import { type Client, Events, MessageFlags } from "discord.js";

const targetChannelName = "ark-レベル算出";
const targetContentTypes = ["image/png", "image/jpeg"];

export function setAsbTs(client: Client) {
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    const channel = message.channel;
    if (
      !channel.isTextBased() ||
      channel.isDMBased() ||
      !channel.isSendable()
    ) {
      return;
    }
    if (channel.name !== targetChannelName) return;
    const imgSttachments = message.attachments.filter(
      (attachment) =>
        attachment.contentType !== null &&
        targetContentTypes.includes(attachment.contentType),
    );
    const firstImgSttachment = imgSttachments.at(0);
    if (firstImgSttachment === undefined) {
      message.reply({
        content: "画像がないよー",
        flags: [MessageFlags.SuppressNotifications],
      });
      return;
    }
    message.reply({
      content: "画像解析リクエストを受け取りました。",
      flags: [MessageFlags.SuppressNotifications],
    });
    if (imgSttachments.size > 1) {
      message.reply({
        content: "最初の画像だけ処理しますよー",
        flags: [MessageFlags.SuppressNotifications],
      });
    }
    const resp = await fetch(firstImgSttachment.url);
    const arrayBuffer = await resp.arrayBuffer();
    // extractTexts;
  });
}
