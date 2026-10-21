import "server-only";
import { getDb, type DB } from "./connection";

/**
 * Opened on first use, not at import. `next build` imports route modules while
 * collecting page data, and on hosts like Render the data disk isn't mounted
 * until the app starts.
 */
export const db: DB = new Proxy({} as DB, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
export * as t from "./schema";
