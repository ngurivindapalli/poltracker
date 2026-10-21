function validClient(value?: string | null): string | null {
  const id = value?.trim() || "";
  if (!/^ca-pub-\d+$/.test(id)) return null;
  return id;
}

function validSlot(value?: string | null): string | null {
  const id = value?.trim() || "";
  if (!/^\d{6,}$/.test(id)) return null;
  return id;
}

export function getAdsenseClient(): string | null {
  return validClient(process.env.NEXT_PUBLIC_ADSENSE_CLIENT);
}

export function getAdsenseSlot(slot: "HOME" | "CONTENT"): string | null {
  if (slot === "HOME") {
    return validSlot(process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME);
  }
  return validSlot(process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT);
}

export function adsTxtBody(client = getAdsenseClient()): string | null {
  if (!client) return null;
  const publisher = client.replace(/^ca-/, "");
  return `google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`;
}
