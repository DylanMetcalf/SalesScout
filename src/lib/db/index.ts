import "server-only";
import { getDb } from "./connection";

export const db = getDb();
export * as t from "./schema";
