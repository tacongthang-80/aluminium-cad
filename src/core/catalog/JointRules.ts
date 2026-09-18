import { finite } from '../geom/Constants';
import {
  FORMULA_STATUS,
  type CutLengthRequest,
  type CutLengthResult,
  type EndJoint,
} from './types';

function jointAdjustment(joint: EndJoint): number {
  if (joint.type === 'MITER_45') return 0;
  const rebateDepthMm = joint.rebateDepthMm ?? 0;
  finite(joint.overlapMm, rebateDepthMm);
  if (joint.overlapMm < 0 || rebateDepthMm < 0) {
    throw new RangeError('Butt joint dimensions cannot be negative');
  }
  return -joint.overlapMm + rebateDepthMm;
}

export function calculateCutLength(request: CutLengthRequest): CutLengthResult {
  finite(request.geometricLengthMm);
  if (request.geometricLengthMm <= 0) throw new RangeError('Geometric length must be positive');
  if (!request.formula) {
    return Object.freeze({
      formulaStatus: FORMULA_STATUS.PENDING_RULE,
      cutLengthMm: null,
      reason: 'Profile has no cutting formula',
    });
  }

  const unsupported = request.joints.find(joint => !request.formula!.supportedJointTypes.includes(joint.type));
  if (unsupported) {
    return Object.freeze({
      formulaStatus: FORMULA_STATUS.PENDING_RULE,
      cutLengthMm: null,
      reason: `Cutting formula does not support ${unsupported.type}`,
    });
  }

  const adjustmentMm = request.joints.reduce((sum, joint) => sum + jointAdjustment(joint), 0);
  const cutLengthMm = request.geometricLengthMm + adjustmentMm;
  if (cutLengthMm <= 0) throw new RangeError('Joint deductions consume the full member length');
  return Object.freeze({ formulaStatus: FORMULA_STATUS.READY, cutLengthMm, adjustmentMm });
}

export class JointRules {
  static calculateCutLength(request: CutLengthRequest): CutLengthResult {
    return calculateCutLength(request);
  }
}
