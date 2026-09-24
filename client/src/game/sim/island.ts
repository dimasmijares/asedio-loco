import { CATAPULT_LOCAL, ISLAND_CORNER_R, ISLAND_HALF, toWorld } from '../../../../shared/map';
import { RAPIER, type World } from './rapier';

const THICK = 4.5; // semigrosor del suelo

// Colisionadores fijos de la isla y de los bastiones. El cuadrado redondeado se compone de
// dos cuboides en cruz y cuatro cilindros en las esquinas. Un casco convexo de muchas caras
// hacía vibrar los bloques apoyados y nunca llegaban a dormirse; con cuboides planos, sí.
export function addIslandColliders(world: World): number[] {
  const R = RAPIER;
  const handles: number[] = [];
  const inner = ISLAND_HALF - ISLAND_CORNER_R;
  const body = world.createRigidBody(R.RigidBodyDesc.fixed());
  const add = (d: InstanceType<typeof R.ColliderDesc>) => handles.push(world.createCollider(d.setFriction(0.9), body).handle);
  add(R.ColliderDesc.cuboid(inner, THICK, ISLAND_HALF).setTranslation(0, -THICK, 0));
  add(R.ColliderDesc.cuboid(ISLAND_HALF, THICK, inner).setTranslation(0, -THICK, 0));
  for (const [x, z] of [
    [inner, inner],
    [-inner, inner],
    [-inner, -inner],
    [inner, -inner],
  ])
    add(R.ColliderDesc.cylinder(THICK, ISLAND_CORNER_R).setTranslation(x, -THICK, z));
  for (const slot of [0, 1, 2, 3]) {
    const p = toWorld(slot, [CATAPULT_LOCAL[0], CATAPULT_LOCAL[1] / 2, CATAPULT_LOCAL[2]]);
    const b = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(p[0], p[1], p[2]));
    handles.push(world.createCollider(R.ColliderDesc.cylinder(CATAPULT_LOCAL[1] / 2, 1.3).setFriction(0.9), b).handle);
  }
  return handles;
}
