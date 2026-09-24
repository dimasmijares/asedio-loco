import RAPIER from '@dimforge/rapier3d-compat';

let ready: Promise<typeof RAPIER> | null = null;

export function loadRapier(): Promise<typeof RAPIER> {
  ready ??= RAPIER.init().then(() => RAPIER);
  return ready;
}

export { RAPIER };
export type { RigidBody, Collider, ImpulseJoint, World } from '@dimforge/rapier3d-compat';
