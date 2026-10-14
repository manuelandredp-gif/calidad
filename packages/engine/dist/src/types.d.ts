export type Kind = 'RF' | 'RNF';
export type Priority = 'Alta' | 'Media' | 'Baja';
export type Severity = 'alta' | 'media' | 'baja';
export type Attribute = 'necesario' | 'no_ambiguo' | 'verificable' | 'completo' | 'correcto' | 'viable' | 'priorizable' | 'consistente';
export type Constraint = {
    type: 'rango';
    a: number;
    b: number;
    unit: string;
    raw: string;
} | {
    type: 'umbral';
    v: number;
    unit: string;
    strict: boolean;
    raw: string;
} | {
    type: 'condicion';
    v: number;
    money: boolean;
    less: boolean;
    consequence: string;
    raw: string;
} | {
    type: 'max' | 'min';
    v: number;
    unit: string;
    raw: string;
} | {
    type: 'carga';
    v: number;
    unit: 'usuarios';
    raw: string;
};
export interface Requirement {
    id: string;
    hasId: boolean;
    line: number;
    kind: Kind;
    priority: Priority | null;
    text: string;
    constraint: Constraint | null;
}
export interface Finding {
    key: string;
    reqId: string;
    ruleId: string;
    attribute: Attribute;
    severity: Severity;
    title: string;
    why: string;
    terms: string[];
}
export interface TestCase {
    id: string;
    reqId: string;
    value: number;
    type: 'valido' | 'invalido' | 'limite' | 'nf';
    technique: string;
    data: string;
    expected: string;
    priority: Priority | 'Sin prioridad';
}
export interface AnalyzeOptions {
    disabledRules?: string[];
    domainTerms?: string[];
}
export interface Analysis {
    engineVersion: string;
    hash: string;
    lines: string[];
    requirements: Requirement[];
    findings: Finding[];
    cases: TestCase[];
}
export interface RuleDefinition {
    id: string;
    attribute: Attribute;
    severity: Severity;
    kind: 'Léxico' | 'Patrón' | 'Estructura' | 'Heurística' | 'Marca de revisión';
    title: string;
    why: string;
    terms: string[];
    examples: {
        bad: string[];
        good: string[];
    };
    rewriteHint: string;
    source: string;
    enabled: boolean;
}
//# sourceMappingURL=types.d.ts.map