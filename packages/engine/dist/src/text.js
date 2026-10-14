const LETTER = /[a-z0-9áéíóúñü]/;
export function findWord(text, word) {
    let start = text.indexOf(word);
    while (start >= 0) {
        if (hasBoundary(text, start, word.length))
            return start;
        start = text.indexOf(word, start + 1);
    }
    return -1;
}
function hasBoundary(text, start, length) {
    return !LETTER.test(text[start - 1] ?? '') && !LETTER.test(text[start + length] ?? '');
}
export function maskDomainTerms(text, terms) {
    return terms.reduce(maskTerm, text.toLowerCase());
}
function maskTerm(text, term) {
    const normalized = term.toLowerCase();
    if (!normalized)
        return text;
    return text.split(normalized).join(' '.repeat(normalized.length));
}
export function hashText(text) {
    let hash = 5381;
    for (const char of text)
        hash = ((hash << 5) + hash + char.charCodeAt(0)) >>> 0;
    return hash.toString(16).slice(-6).padStart(6, '0');
}
