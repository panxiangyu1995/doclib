export type Frontmatter = {
  data: Record<string, string | string[]>;
  body: string;
};

const FM_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function parseFrontmatter(raw: string): Frontmatter {
  const match = FM_PATTERN.exec(raw);
  if (!match) return { data: {}, body: raw };
  const data: Record<string, string | string[]> = {};
  let currentKey: string | null = null;
  for (const line of match[1]!.split(/\r?\n/)) {
    if (/^\s*-\s+/.test(line) && currentKey !== null) {
      const value = line
        .replace(/^\s*-\s+/, "")
        .trim()
        .replace(/^["']|["']$/g, "");
      const arr = data[currentKey];
      if (Array.isArray(arr)) arr.push(value);
      continue;
    }
    const kv = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
    if (kv) {
      const key = kv[1]!;
      const rawValue = kv[2]!.trim();
      currentKey = key;
      const inlineList = /^\[(.*)\]$/.exec(rawValue);
      if (inlineList) {
        data[key] = inlineList[1]!
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter((s) => s.length > 0);
      } else if (rawValue === "") {
        data[key] = [];
      } else {
        data[key] = rawValue.replace(/^["']|["']$/g, "");
      }
    } else if (line.trim() === "") {
      currentKey = null;
    }
  }
  return { data, body: raw.slice(match[0].length) };
}

export function coversOf(data: Record<string, string | string[]>): string[] {
  const covers = data.covers;
  if (covers === undefined) return [];
  const list = Array.isArray(covers) ? covers : [covers];
  return list.map((c) => c.trim()).filter((c) => c.length > 0);
}
