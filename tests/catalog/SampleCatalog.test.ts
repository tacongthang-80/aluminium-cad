import { describe, expect, it } from 'vitest';
import { CatalogManager, PMA_SAMPLE, SAMPLE_CATALOGS, XINGFA_55_SAMPLE } from '../../src/core/catalog';

describe('sample catalogs', () => {
  it('contains the named Xingfa 55 and PMA illustration systems', () => {
    expect(SAMPLE_CATALOGS).toContain(XINGFA_55_SAMPLE);
    expect(SAMPLE_CATALOGS).toContain(PMA_SAMPLE);
    expect(XINGFA_55_SAMPLE.name).toBe('Xingfa 55 Minh họa');
    expect(PMA_SAMPLE.name).toBe('PMA Minh họa');
    expect(SAMPLE_CATALOGS).toHaveLength(2);
  });

  it('labels every system as sample data with a production disclaimer', () => {
    for (const system of SAMPLE_CATALOGS) {
      expect(system.isSampleData).toBe(true);
      expect(system.disclaimer.length).toBeGreaterThan(20);
      expect(system.disclaimer).toContain('không phải');
      expect(system.profiles.length).toBeGreaterThan(0);
      expect(Object.isFrozen(system)).toBe(true);
      expect(Object.isFrozen(system.profiles)).toBe(true);
    }
  });

  it('loads through CatalogManager and carries sample provenance into snapshots', () => {
    const manager = new CatalogManager(SAMPLE_CATALOGS);
    expect(manager.listSystems()).toHaveLength(2);
    const snapshot = manager.createSnapshot('sample-xingfa-55', 'xf55-frame');
    expect(snapshot.sourceIsSampleData).toBe(true);
    expect(snapshot.sourceDisclaimer).toBe(XINGFA_55_SAMPLE.disclaimer);
    expect(snapshot.weightKgPerM).toBeGreaterThan(0);

    const pending = manager.createSnapshot('sample-pma', 'pma-pending');
    expect(pending.cuttingFormula).toBeUndefined();
  });
});
