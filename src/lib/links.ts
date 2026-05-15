// Open external links in the OS default browser.
// In Tauri: uses the shell open API.
// In web: falls back to window.open.

export async function openExternalLink(url: string): Promise<void> {
  if (!url) return;
  // Ensure URL has a protocol
  const fullUrl = url.startsWith("http") ? url : `https://${url}`;
  try {
    // Try Tauri shell API
    const { open } = await import("@tauri-apps/plugin-shell");
    await open(fullUrl);
  } catch {
    // Fallback for web/browser
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  }
}
