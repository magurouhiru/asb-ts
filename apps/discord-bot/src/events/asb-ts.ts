import {
  calculateLevel,
  createSettings,
  createSpeciesList,
  extractTexts,
  OcrQueueManager,
  searchSpecies,
} from "@asb-ts/core";
import { type Client, Events, MessageFlags } from "discord.js";

const targetChannelName = "ark-レベル算出";
const targetContentTypes = ["image/png", "image/jpeg"];
const manager = new OcrQueueManager();
const targetUrl = process.env.TARGET_URL;
const settings = createSettings();
const speciesList = createSpeciesList(settings);

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
    const ocrResutl = extractTexts(manager, arrayBuffer);
    if (ocrResutl.isSuccess) {
      const normalized = await ocrResutl.result.normalized;
      const queryParams = [
        `type=${normalized.ip.type}`,
        `n=${normalized.ip.name}`,
        `level=${normalized.ip.totalLevel}`,
        `withDom=${normalized.ip.withDom}`,
        `h=${normalized.ip.values.health}`,
        `s=${normalized.ip.values.stamina}`,
        `o=${normalized.ip.values.oxygen}`,
        `f=${normalized.ip.values.food}`,
        `w=${normalized.ip.values.weight}`,
        `m=${normalized.ip.values.meleeDamageMultiplier}`,
        `t=${normalized.ip.values.torpidity}`,
        `i=${normalized.ip.imprinting}`,
      ].join("&");
      message.reply({
        content: `${targetUrl}?${queryParams}`,
        flags: [MessageFlags.SuppressNotifications],
      });

      const species = searchSpecies(speciesList, normalized.ip.name, settings);

      const calcResult = calculateLevel({
        ...normalized.ip,
        species,
        settings,
      });

      if (calcResult.isSuccess) {
        message.reply({
          content: JSON.stringify(calcResult.result.levels),
          flags: [MessageFlags.SuppressNotifications],
        });
      } else {
        message.reply({
          content: JSON.stringify(calcResult.error),
          flags: [MessageFlags.SuppressNotifications],
        });
      }
    } else {
      message.reply({
        content: JSON.stringify(ocrResutl.error),
        flags: [MessageFlags.SuppressNotifications],
      });
    }
  });
}
