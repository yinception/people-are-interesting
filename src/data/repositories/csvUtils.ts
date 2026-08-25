export function escapeCsvValue(value: string | number | null): string {
  if (value === null) {
    return '';
  }

  const text = String(value);
  if (!/[",\n]/.test(text)) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsvRow(columns: Array<string | number | null>): string {
  return columns.map((column) => escapeCsvValue(column)).join(',');
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let isInsideQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const character = text[i];
    const nextCharacter = text[i + 1];

    if (character === '"') {
      if (isInsideQuotes && nextCharacter === '"') {
        currentCell += '"';
        i += 1;
        continue;
      }

      isInsideQuotes = !isInsideQuotes;
      continue;
    }

    if (!isInsideQuotes && character === ',') {
      currentRow.push(currentCell);
      currentCell = '';
      continue;
    }

    if (!isInsideQuotes && character === '\n') {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
      continue;
    }

    if (!isInsideQuotes && character === '\r') {
      continue;
    }

    currentCell += character;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

export function requireColumnIndex(columnByName: Map<string, number>, name: string): number {
  const index = columnByName.get(name);
  if (index === undefined) {
    throw new Error(`Invalid CSV format: missing "${name}" column.`);
  }

  return index;
}

export function getCell(row: string[], index: number): string {
  return row[index] ?? '';
}

export function parseIntegerField(value: string, fieldName: string): number {
  const parsedValue = Number.parseInt(value, 10);
  if (!Number.isFinite(parsedValue)) {
    throw new Error(`Invalid integer value for ${fieldName}: "${value}".`);
  }

  return parsedValue;
}