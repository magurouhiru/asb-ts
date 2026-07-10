import type { Client } from "discord.js";
import { setAsbTs } from "./asb-ts";
import { setReady } from "./ready";

export function setEvents(client: Client) {
  setReady(client);
  setAsbTs(client);
}
