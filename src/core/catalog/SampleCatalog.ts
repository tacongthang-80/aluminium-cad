import type { ProfileSystemCatalog } from './types';

const SAMPLE_DISCLAIMER = 'Dữ liệu minh họa phục vụ kiểm thử phần mềm, không phải thông số hay công thức sản xuất thực tế.';

export const XINGFA_55_SAMPLE: ProfileSystemCatalog = Object.freeze({
  id: 'sample-xingfa-55',
  name: 'Xingfa 55 Minh họa',
  version: 'sample-1',
  isSampleData: true,
  disclaimer: SAMPLE_DISCLAIMER,
  profiles: Object.freeze([
    Object.freeze({
      id: 'xf55-frame', code: 'XF55-KB', name: 'Khung bao minh họa', alloy: '6063', temper: 'T5',
      widthMm: 55, depthMm: 50, wallThicknessMm: 1.4, weightKgPerM: 1.18, standardStockLengthMm: 6000,
      cuttingFormula: Object.freeze({ id: 'standard-frame-v1', supportedJointTypes: Object.freeze(['MITER_45', 'BUTT_90'] as const) }),
    }),
    Object.freeze({
      id: 'xf55-mullion', code: 'XF55-DO', name: 'Đố minh họa', alloy: '6063', temper: 'T5',
      widthMm: 55, depthMm: 42, wallThicknessMm: 1.4, weightKgPerM: 0.96, standardStockLengthMm: 6000,
      cuttingFormula: Object.freeze({ id: 'standard-mullion-v1', supportedJointTypes: Object.freeze(['BUTT_90'] as const) }),
    }),
  ]),
});

export const PMA_SAMPLE: ProfileSystemCatalog = Object.freeze({
  id: 'sample-pma',
  name: 'PMA Minh họa',
  version: 'sample-1',
  isSampleData: true,
  disclaimer: SAMPLE_DISCLAIMER,
  profiles: Object.freeze([
    Object.freeze({
      id: 'pma-frame', code: 'PMA-KB', name: 'Khung bao minh họa', alloy: '6063', temper: 'T5',
      widthMm: 50, depthMm: 45, wallThicknessMm: 1.3, weightKgPerM: 1.04, standardStockLengthMm: 6000,
      cuttingFormula: Object.freeze({ id: 'standard-frame-v1', supportedJointTypes: Object.freeze(['MITER_45', 'BUTT_90'] as const) }),
    }),
    Object.freeze({
      id: 'pma-pending', code: 'PMA-CHO', name: 'Thanh chờ công thức minh họa', alloy: '6063', temper: 'T5',
      widthMm: 38, depthMm: 25, wallThicknessMm: 1.2, weightKgPerM: 0.62, standardStockLengthMm: 6000,
    }),
  ]),
});

export const SAMPLE_CATALOGS: ReadonlyArray<ProfileSystemCatalog> = Object.freeze([
  XINGFA_55_SAMPLE,
  PMA_SAMPLE,
]);
