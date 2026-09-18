import { describe, expect, it } from 'vitest';
import { CatalogManager, type ProfileSystemCatalog } from '../../src/core/catalog';

const makeSystem = (version = '1'): ProfileSystemCatalog => ({
  id: 'system-a',
  name: 'System A',
  version,
  isSampleData: false,
  disclaimer: '',
  profiles: [{
    id: 'frame', code: 'A-01', name: 'Frame', alloy: '6063', temper: 'T5',
    widthMm: 55, depthMm: 45, wallThicknessMm: 1.4, weightKgPerM: 1.1,
    standardStockLengthMm: 6000,
    cuttingFormula: { id: 'frame-v1', supportedJointTypes: ['MITER_45', 'BUTT_90'] },
  }],
});

describe('CatalogManager snapshots', () => {
  it('copies catalog input and exposes frozen records', () => {
    const source = makeSystem() as unknown as { name: string; profiles: Array<{ name: string; cuttingFormula: { supportedJointTypes: string[] } }> };
    const manager = new CatalogManager([source as unknown as ProfileSystemCatalog]);
    source.name = 'Changed outside';
    source.profiles[0].name = 'Changed profile';
    source.profiles[0].cuttingFormula.supportedJointTypes.push('UNKNOWN');

    const stored = manager.getSystem('system-a')!;
    expect(stored.name).toBe('System A');
    expect(stored.profiles[0].name).toBe('Frame');
    expect(stored.profiles[0].cuttingFormula?.supportedJointTypes).toEqual(['MITER_45', 'BUTT_90']);
    expect(Object.isFrozen(stored)).toBe(true);
    expect(Object.isFrozen(stored.profiles)).toBe(true);
    expect(Object.isFrozen(stored.profiles[0].cuttingFormula?.supportedJointTypes)).toBe(true);
    expect(Object.isFrozen(manager.listSystems())).toBe(true);
  });

  it('creates independent immutable snapshots that survive catalog updates', () => {
    const manager = new CatalogManager([makeSystem('1')]);
    const first = manager.createSnapshot('system-a', 'frame');
    const second = manager.createSnapshot('system-a', 'frame');
    expect(second).not.toBe(first);
    expect(first).toMatchObject({
      snapshotVersion: 1,
      sourceSystemId: 'system-a',
      sourceSystemName: 'System A',
      sourceCatalogVersion: '1',
      sourceIsSampleData: false,
      widthMm: 55,
    });
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.cuttingFormula)).toBe(true);

    const baseReplacement = makeSystem('2');
    const replacement: ProfileSystemCatalog = {
      ...baseReplacement,
      profiles: [{ ...baseReplacement.profiles[0], widthMm: 70 }],
    };
    manager.upsertSystem(replacement);
    expect(manager.createSnapshot('system-a', 'frame').widthMm).toBe(70);
    expect(first.widthMm).toBe(55);
    expect(first.sourceCatalogVersion).toBe('1');
  });

  it('looks up and removes systems without leaking mutable collections', () => {
    const manager = new CatalogManager([makeSystem()]);
    expect(manager.getProfile('system-a', 'frame')?.code).toBe('A-01');
    expect(manager.getProfile('missing', 'frame')).toBeUndefined();
    expect(manager.getProfile('system-a', 'missing')).toBeUndefined();
    expect(manager.removeSystem('system-a')).toBe(true);
    expect(manager.removeSystem('system-a')).toBe(false);
    expect(manager.listSystems()).toEqual([]);
  });

  it('rejects unknown snapshot sources and malformed catalogs', () => {
    const manager = new CatalogManager([makeSystem()]);
    expect(() => manager.createSnapshot('missing', 'frame')).toThrow('Unknown profile system');
    expect(() => manager.createSnapshot('system-a', 'missing')).toThrow('Unknown profile');
    expect(() => new CatalogManager([makeSystem(), makeSystem()])).toThrow('Duplicate system id');

    const invalidCases: ProfileSystemCatalog[] = [
      { ...makeSystem(), id: '' },
      { ...makeSystem(), name: '' },
      { ...makeSystem(), version: '' },
      { ...makeSystem(), isSampleData: true, disclaimer: '' },
      { ...makeSystem(), profiles: [{ ...makeSystem().profiles[0], id: '' }] },
      { ...makeSystem(), profiles: [{ ...makeSystem().profiles[0], code: '' }] },
      { ...makeSystem(), profiles: [{ ...makeSystem().profiles[0], name: '' }] },
      { ...makeSystem(), profiles: [{ ...makeSystem().profiles[0], alloy: '' }] },
      { ...makeSystem(), profiles: [{ ...makeSystem().profiles[0], temper: '' }] },
      { ...makeSystem(), profiles: [{ ...makeSystem().profiles[0], widthMm: 0 }] },
      { ...makeSystem(), profiles: [{ ...makeSystem().profiles[0], weightKgPerM: Infinity }] },
      { ...makeSystem(), profiles: [{ ...makeSystem().profiles[0], cuttingFormula: { id: '', supportedJointTypes: ['MITER_45'] } }] },
      { ...makeSystem(), profiles: [{ ...makeSystem().profiles[0], cuttingFormula: { id: 'empty', supportedJointTypes: [] } }] },
      { ...makeSystem(), profiles: [makeSystem().profiles[0], makeSystem().profiles[0]] },
    ];
    for (const catalog of invalidCases) expect(() => new CatalogManager([catalog])).toThrow(RangeError);
  });
});
