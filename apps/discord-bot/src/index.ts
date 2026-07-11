import { Client, GatewayIntentBits } from "discord.js";
import { setEvents } from "./events";

const token = process.env.DISCORD_TOKEN;

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
setEvents(client);
client.login(token);
