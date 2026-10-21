/**
 * Runs once when the server starts. Research jobs run inside this process, so a
 * stray rejected promise must be logged, not allowed to take the whole site down.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  process.on("unhandledRejection", (reason) => {
    console.error("[unhandledRejection] kept the server running:", reason);
  });
  console.log(`[startup] Sales Scout ${process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? "dev"} on Node ${process.version}`);
}
