// Capa de servicio: lógica de negocio PURA (sin Express ni Prisma), testeable de forma aislada.
// Calcula los indicadores ISTQB y la economía de IA de un proyecto.

export interface TestCaseLike {
  status: string;
  evidenceStatus: string;
  type: string;
  source: string;
}
export interface AiGenerationLike {
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  responseTimeMs: number;
}
export interface RequirementLike {
  testCases: TestCaseLike[];
  aiGenerations: AiGenerationLike[];
}
export interface ProjectLike {
  requirements: RequirementLike[];
}

export function computeProjectMetrics(project: ProjectLike) {
  const totalRequirements = project.requirements.length;
  let coveredRequirements = 0;

  let totalCases = 0;
  let approvedCases = 0;
  let modifiedCases = 0;
  let rejectedCases = 0;
  let pendingCases = 0;

  let derivedEvidenceCount = 0;
  let suggestedEvidenceCount = 0;
  let ambiguousEvidenceCount = 0;
  let conflictEvidenceCount = 0;

  let manualCount = 0;
  let ruleBasedCount = 0;
  let aiGeneratedCount = 0;

  const typeDistribution: Record<string, number> = {
    positive: 0,
    negative: 0,
    alternative: 0,
    boundary: 0,
    validation: 0,
  };

  let totalGenerations = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCostUsd = 0;
  let totalLatencyMs = 0;

  project.requirements.forEach((req) => {
    if (req.testCases.some((tc) => tc.status === 'APPROVED')) coveredRequirements++;

    req.testCases.forEach((tc) => {
      totalCases++;
      if (tc.status === 'APPROVED') approvedCases++;
      else if (tc.status === 'MODIFIED') modifiedCases++;
      else if (tc.status === 'REJECTED') rejectedCases++;
      else if (tc.status === 'PENDING') pendingCases++;

      if (tc.evidenceStatus === 'derived') derivedEvidenceCount++;
      else if (tc.evidenceStatus === 'suggested') suggestedEvidenceCount++;
      else if (tc.evidenceStatus === 'ambiguous') ambiguousEvidenceCount++;
      else if (tc.evidenceStatus === 'conflict') conflictEvidenceCount++;

      if (typeDistribution[tc.type] !== undefined) typeDistribution[tc.type]++;

      if (tc.source === 'MANUAL') manualCount++;
      else if (tc.source === 'RULE_BASED') ruleBasedCount++;
      else if (tc.source === 'AI_GENERATED') aiGeneratedCount++;
    });

    req.aiGenerations.forEach((gen) => {
      totalGenerations++;
      totalInputTokens += gen.inputTokens;
      totalOutputTokens += gen.outputTokens;
      totalCostUsd += gen.estimatedCost;
      totalLatencyMs += gen.responseTimeMs;
    });
  });

  const pct = (val: number, total: number) => (total > 0 ? Math.round((val / total) * 1000) / 10 : 0);

  return {
    summary: {
      totalRequirements,
      coveredRequirements,
      coveragePercent: pct(coveredRequirements, totalRequirements),
      totalCases,
      approvedCases,
      modifiedCases,
      rejectedCases,
      pendingCases,
    },
    istqbRates: {
      approvalRate: pct(approvedCases, totalCases),
      modificationRate: pct(modifiedCases, totalCases),
      rejectionRate: pct(rejectedCases, totalCases),
      pendingRate: pct(pendingCases, totalCases),
    },
    sourceDistribution: {
      manual: { count: manualCount, percent: pct(manualCount, totalCases) },
      ruleBased: { count: ruleBasedCount, percent: pct(ruleBasedCount, totalCases) },
      aiGenerated: { count: aiGeneratedCount, percent: pct(aiGeneratedCount, totalCases) },
    },
    evidenceQuality: {
      derivedCount: derivedEvidenceCount,
      derivedPercent: pct(derivedEvidenceCount, totalCases),
      suggestedCount: suggestedEvidenceCount,
      suggestedPercent: pct(suggestedEvidenceCount, totalCases),
      ambiguousCount: ambiguousEvidenceCount,
      conflictCount: conflictEvidenceCount,
    },
    typeDistribution,
    aiEconomics: {
      totalGenerations,
      totalInputTokens,
      totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
      totalCostUsd: Math.round(totalCostUsd * 10000) / 10000,
      averageCostPerRequirementUsd:
        totalRequirements > 0 ? Math.round((totalCostUsd / totalRequirements) * 10000) / 10000 : 0,
      averageLatencyMs: totalGenerations > 0 ? Math.round(totalLatencyMs / totalGenerations) : 0,
    },
  };
}
