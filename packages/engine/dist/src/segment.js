export function segment(text) {
    return text.split(/\r?\n/).flatMap(toLine).slice(0, 200);
}
function toLine(text, line) {
    const trimmed = text.trim();
    return trimmed ? [{ line, text: trimmed }] : [];
}
