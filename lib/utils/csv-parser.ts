export function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const nonEmpty = lines.filter((l) => l.trim() !== "");
  if (nonEmpty.length === 0) return { headers: [], rows: [] };

  const headers = parseCSVLine(nonEmpty[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < nonEmpty.length; i++) {
    const values = parseCSVLine(nonEmpty[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }

  result.push(current.trim());
  return result;
}

export function validateCSVHeaders(
  headers: string[],
  required: string[]
): { valid: boolean; missing: string[] } {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const missing = required.filter((r) => !lower.includes(r.toLowerCase().trim()));
  return { valid: missing.length === 0, missing };
}

export function generateCSVTemplate(
  columns: string[],
  exampleRow: Record<string, string>
): string {
  const header = columns.join(",");
  const example = columns
    .map((c) => {
      const val = exampleRow[c] ?? "";
      return val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
    })
    .join(",");
  return `${header}\n${example}\n`;
}
