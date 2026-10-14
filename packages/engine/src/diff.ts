export interface DiffToken {
  t: string;
  op: 'eq' | 'del' | 'ins';
}

export function wordDiff(a: string, b: string): DiffToken[] {
  const wordsA = tokenize(a);
  const wordsB = tokenize(b);
  const lcs = longestCommonSubsequence(wordsA, wordsB);
  const result: DiffToken[] = [];
  let ia = 0;
  let ib = 0;
  let il = 0;
  while (il < lcs.length) {
    while (ia < wordsA.length && wordsA[ia] !== lcs[il]) {
      result.push({ t: wordsA[ia] ?? '', op: 'del' });
      ia++;
    }
    while (ib < wordsB.length && wordsB[ib] !== lcs[il]) {
      result.push({ t: wordsB[ib] ?? '', op: 'ins' });
      ib++;
    }
    result.push({ t: lcs[il] ?? '', op: 'eq' });
    ia++;
    ib++;
    il++;
  }
  while (ia < wordsA.length) {
    result.push({ t: wordsA[ia] ?? '', op: 'del' });
    ia++;
  }
  while (ib < wordsB.length) {
    result.push({ t: wordsB[ib] ?? '', op: 'ins' });
    ib++;
  }
  return result;
}

function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}

function longestCommonSubsequence(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]);
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] = a[i - 1] === b[j - 1]
        ? (dp[i - 1]?.[j - 1] ?? 0) + 1
        : Math.max(dp[i - 1]?.[j] ?? 0, dp[i]?.[j - 1] ?? 0);
    }
  }
  const result: string[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift(a[i - 1] ?? '');
      i--;
      j--;
    } else if ((dp[i - 1]?.[j] ?? 0) > (dp[i]?.[j - 1] ?? 0)) {
      i--;
    } else {
      j--;
    }
  }
  return result;
}
