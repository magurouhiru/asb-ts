import type { Client } from "discord.js";
import { setReady } from "./ready";
import { setAsbTs } from "./asb-ts";

export function setEvents(client: Client) {
  setReady(client);
  setAsbTs(client);
}
