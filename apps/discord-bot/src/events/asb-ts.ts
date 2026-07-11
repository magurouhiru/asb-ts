import {
  calculateLevel,
  createSettings,
  createSpeciesList,
  extractTexts,
  OcrQueueManager,
  searchSpecies,
} from "@asb-ts/core";
import { type Client, EmbedBuilder, Events, MessageFlags } from "discord.js";
import * as R from "remeda";

const targetChannelName = "ark-レベル算出";
const targetContentTypes = ["image/png", "image/jpeg"];
const manager = new OcrQueueManager();
const targetUrl = process.env.TARGET_URL?.replaceAll('"', "");
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
      const link = `${targetUrl}?${queryParams}`;
      message.reply({
        content: link,
        flags: [MessageFlags.SuppressNotifications],
      });

      const species = searchSpecies(speciesList, normalized.ip.name, settings);

      const calcResult = calculateLevel({
        ...normalized.ip,
        species,
        settings,
      });

      if (calcResult.isSuccess) {
        const embed = new EmbedBuilder({
          title: species.name,
          url: link,
          fields: [
            { name: "variants", value: JSON.stringify(species.variants) },
            { name: "mod", value: species.mod ?? "" },
            ...R.pipe(
              R.pickBy(calcResult.result.levels, R.isDefined),
              R.entries(),
              R.map(([name, { wild, mut, dom }]) => ({
                name,
                value: `wild: ${wild}, mut: ${mut}, dom: ${dom}`,
              })),
            ),
          ],
        });
        message.reply({
          embeds: [embed],
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
