export function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  const len = line.length;

  while (i < len) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < len && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i += 1;
        }
      } else {
        current += ch;
        i += 1;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i += 1;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
        i += 1;
      } else {
        current += ch;
        i += 1;
      }
    }
  }

  fields.push(current);
  return fields;
}
