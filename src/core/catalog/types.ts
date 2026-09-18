export const FORMULA_STATUS = {
  READY: 'READY',
  PENDING_RULE: 'PENDING_RULE',
} as const;

export type FormulaStatus = typeof FORMULA_STATUS[keyof typeof FORMULA_STATUS];
export type JointType = 'MITER_45' | 'BUTT_90';

export interface Miter45Joint {
  readonly type: 'MITER_45';
}

export interface Butt90Joint {
  readonly type: 'BUTT_90';
  readonly overlapMm: number;
  readonly rebateDepthMm?: number;
}

export type EndJoint = Miter45Joint | Butt90Joint;

export interface CuttingFormula {
  readonly id: string;
  readonly supportedJointTypes: ReadonlyArray<JointType>;
}

export interface ProfileDefinition {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly alloy: string;
  readonly temper: string;
  readonly widthMm: number;
  readonly depthMm: number;
  readonly wallThicknessMm: number;
  readonly weightKgPerM: number;
  readonly standardStockLengthMm: number;
  readonly cuttingFormula?: CuttingFormula;
}

export interface ProfileSystemCatalog {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly isSampleData: boolean;
  readonly disclaimer: string;
  readonly profiles: ReadonlyArray<ProfileDefinition>;
}

export interface ProfileSnapshot extends ProfileDefinition {
  readonly snapshotVersion: 1;
  readonly sourceSystemId: string;
  readonly sourceSystemName: string;
  readonly sourceCatalogVersion: string;
  readonly sourceIsSampleData: boolean;
  readonly sourceDisclaimer: string;
}

export interface CutLengthRequest {
  readonly geometricLengthMm: number;
  readonly formula?: CuttingFormula;
  readonly joints: ReadonlyArray<EndJoint>;
}

export interface ReadyCutLengthResult {
  readonly formulaStatus: 'READY';
  readonly cutLengthMm: number;
  readonly adjustmentMm: number;
}

export interface PendingCutLengthResult {
  readonly formulaStatus: 'PENDING_RULE';
  readonly cutLengthMm: null;
  readonly reason: string;
}

export type CutLengthResult = ReadyCutLengthResult | PendingCutLengthResult;
