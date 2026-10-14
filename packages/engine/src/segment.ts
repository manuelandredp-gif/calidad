export interface Line {
  line: number;
  text: string;
}

export function segment(text: string): Line[] {
  return text.split(/\r?\n/).flatMap(toLine).slice(0, 200);
}

function toLine(text: string, line: number): Line[] {
  const trimmed = text.trim();
  return trimmed ? [{ line, text: trimmed }] : [];
}
