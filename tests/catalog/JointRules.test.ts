import { describe, expect, it } from 'vitest';
import { calculateCutLength, FORMULA_STATUS, JointRules, type CuttingFormula } from '../../src/core/catalog';

const allJoints: CuttingFormula = {
  id: 'all-joints',
  supportedJointTypes: ['MITER_45', 'BUTT_90'],
};

describe('JointRules', () => {
  it('keeps the outside length for miter joints', () => {
    const result = calculateCutLength({
      geometricLengthMm: 1200,
      formula: allJoints,
      joints: [{ type: 'MITER_45' }, { type: 'MITER_45' }],
    });
    expect(result).toEqual({ formulaStatus: FORMULA_STATUS.READY, cutLengthMm: 1200, adjustmentMm: 0 });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('deducts butt overlap and adds rebate depth at each end', () => {
    const result = JointRules.calculateCutLength({
      geometricLengthMm: 1000,
      formula: allJoints,
      joints: [
        { type: 'BUTT_90', overlapMm: 55, rebateDepthMm: 8 },
        { type: 'BUTT_90', overlapMm: 40 },
      ],
    });
    expect(result).toEqual({ formulaStatus: FORMULA_STATUS.READY, cutLengthMm: 913, adjustmentMm: -87 });
  });

  it('combines miter and butt ends without applying a miter deduction', () => {
    expect(calculateCutLength({
      geometricLengthMm: 800,
      formula: allJoints,
      joints: [{ type: 'MITER_45' }, { type: 'BUTT_90', overlapMm: 50, rebateDepthMm: 5 }],
    })).toMatchObject({ formulaStatus: 'READY', cutLengthMm: 755 });
  });

  it('reports pending instead of inventing a production length', () => {
    const missing = calculateCutLength({ geometricLengthMm: 1000, joints: [{ type: 'MITER_45' }] });
    expect(missing.formulaStatus).toBe('PENDING_RULE');
    expect(missing.cutLengthMm).toBeNull();
    expect(missing).toHaveProperty('reason');

    const unsupported = calculateCutLength({
      geometricLengthMm: 1000,
      formula: { id: 'miter-only', supportedJointTypes: ['MITER_45'] },
      joints: [{ type: 'BUTT_90', overlapMm: 50 }],
    });
    expect(unsupported).toEqual({
      formulaStatus: 'PENDING_RULE',
      cutLengthMm: null,
      reason: 'Cutting formula does not support BUTT_90',
    });
  });

  it('rejects invalid lengths and butt dimensions', () => {
    expect(() => calculateCutLength({ geometricLengthMm: 0, formula: allJoints, joints: [] })).toThrow(RangeError);
    expect(() => calculateCutLength({ geometricLengthMm: Infinity, formula: allJoints, joints: [] })).toThrow(RangeError);
    expect(() => calculateCutLength({ geometricLengthMm: 100, formula: allJoints, joints: [{ type: 'BUTT_90', overlapMm: -1 }] })).toThrow(RangeError);
    expect(() => calculateCutLength({ geometricLengthMm: 100, formula: allJoints, joints: [{ type: 'BUTT_90', overlapMm: 1, rebateDepthMm: -1 }] })).toThrow(RangeError);
    expect(() => calculateCutLength({ geometricLengthMm: 100, formula: allJoints, joints: [{ type: 'BUTT_90', overlapMm: NaN }] })).toThrow(RangeError);
    expect(() => calculateCutLength({ geometricLengthMm: 50, formula: allJoints, joints: [{ type: 'BUTT_90', overlapMm: 50 }] })).toThrow(RangeError);
  });
});
