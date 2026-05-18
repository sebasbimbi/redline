/** The measurement tool: drag to draw a dimension line labeled in pixels. */

import { DragShapeTool } from './DragShapeTool';
import type {
  StrokeStyle,
  VisualEmphasisAnnotation,
} from '../../model/annotation';
import type { Point } from '../../model/geometry';

export class MeasureTool extends DragShapeTool {
  readonly id = 'measure' as const;

  protected buildGeometry(
    start: Point,
    end: Point,
    style: StrokeStyle,
  ): VisualEmphasisAnnotation['geometry'] {
    return { kind: 'measure', from: { ...start }, to: { ...end }, style };
  }
}
