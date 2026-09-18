import { finite } from '../geom/Constants';
import type { CuttingFormula, ProfileDefinition, ProfileSnapshot, ProfileSystemCatalog } from './types';

function requireText(value: string, field: string): void {
  if (value.trim().length === 0) throw new RangeError(`${field} cannot be empty`);
}

function cloneFormula(formula: CuttingFormula | undefined): CuttingFormula | undefined {
  if (!formula) return undefined;
  requireText(formula.id, 'Cutting formula id');
  if (formula.supportedJointTypes.length === 0) throw new RangeError('Cutting formula must support at least one joint type');
  return Object.freeze({ id: formula.id, supportedJointTypes: Object.freeze([...formula.supportedJointTypes]) });
}

function cloneProfile(profile: ProfileDefinition): ProfileDefinition {
  requireText(profile.id, 'Profile id');
  requireText(profile.code, 'Profile code');
  requireText(profile.name, 'Profile name');
  requireText(profile.alloy, 'Profile alloy');
  requireText(profile.temper, 'Profile temper');
  finite(profile.widthMm, profile.depthMm, profile.wallThicknessMm, profile.weightKgPerM, profile.standardStockLengthMm);
  if (profile.widthMm <= 0 || profile.depthMm <= 0 || profile.wallThicknessMm <= 0 || profile.weightKgPerM <= 0 || profile.standardStockLengthMm <= 0) {
    throw new RangeError('Profile dimensions, weight, and stock length must be positive');
  }
  return Object.freeze({ ...profile, cuttingFormula: cloneFormula(profile.cuttingFormula) });
}

function cloneSystem(system: ProfileSystemCatalog): ProfileSystemCatalog {
  requireText(system.id, 'System id');
  requireText(system.name, 'System name');
  requireText(system.version, 'System version');
  if (system.isSampleData) requireText(system.disclaimer, 'Sample data disclaimer');
  const profiles = system.profiles.map(cloneProfile);
  if (new Set(profiles.map(profile => profile.id)).size !== profiles.length) {
    throw new RangeError('Profile ids must be unique within a system');
  }
  return Object.freeze({ ...system, profiles: Object.freeze(profiles) });
}

export class CatalogManager {
  private readonly systems = new Map<string, ProfileSystemCatalog>();

  constructor(systems: ReadonlyArray<ProfileSystemCatalog> = []) {
    for (const system of systems) {
      if (this.systems.has(system.id)) throw new RangeError(`Duplicate system id: ${system.id}`);
      this.systems.set(system.id, cloneSystem(system));
    }
  }

  listSystems(): ReadonlyArray<ProfileSystemCatalog> {
    return Object.freeze([...this.systems.values()]);
  }

  getSystem(systemId: string): ProfileSystemCatalog | undefined {
    return this.systems.get(systemId);
  }

  getProfile(systemId: string, profileId: string): ProfileDefinition | undefined {
    return this.systems.get(systemId)?.profiles.find(profile => profile.id === profileId);
  }

  upsertSystem(system: ProfileSystemCatalog): void {
    this.systems.set(system.id, cloneSystem(system));
  }

  removeSystem(systemId: string): boolean {
    return this.systems.delete(systemId);
  }

  createSnapshot(systemId: string, profileId: string): ProfileSnapshot {
    const system = this.getSystem(systemId);
    if (!system) throw new RangeError(`Unknown profile system: ${systemId}`);
    const profile = system.profiles.find(candidate => candidate.id === profileId);
    if (!profile) throw new RangeError(`Unknown profile: ${profileId}`);
    return Object.freeze({
      ...cloneProfile(profile),
      snapshotVersion: 1,
      sourceSystemId: system.id,
      sourceSystemName: system.name,
      sourceCatalogVersion: system.version,
      sourceIsSampleData: system.isSampleData,
      sourceDisclaimer: system.disclaimer,
    });
  }
}
