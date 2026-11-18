import type { PreviewState } from '../app/state.ts';
import type { ClassDefinition, ClassId } from '../content/class-definition.ts';
import type { Body, Point } from '../domain/movement.ts';
import type { Run } from '../domain/run.ts';
import type { ThirdPersonCamera } from '../rendering/camera.ts';

/**
 * Live, read-only view of the current expedition for the interface modules.
 * Exposed through getters because a restart or class change replaces the run and definition.
 * Nothing in the interface writes back into the simulation through this object.
 */
export interface UiContext {
  readonly run: Run;
  readonly definition: ClassDefinition;
  readonly classId: ClassId;
  readonly body: Body;
  readonly camera: ThirdPersonCamera;
  readonly state: PreviewState;
  /** True when reduced motion is requested by the system or the settings. */
  quiet(): boolean;
  /** Camera-relative bearing from the hero to a point, in radians. */
  bearingTo(target: Point): number;
}
