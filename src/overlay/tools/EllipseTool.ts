/** The ellipse tool: drag out an outlined ellipse. */

import { DragShapeTool } from './DragShapeTool';
import type {
  StrokeStyle,
  VisualEmphasisAnnotation,
} from '../../model/annotation';
import type { Point } from '../../model/geometry';
import { rectFromPoints } from '../../model/geometryOps';

export class EllipseTool extends DragShapeTool {
  readonly id = 'ellipse' as const;

  protected buildGeometry(
    start: Point,
    end: Point,
    style: StrokeStyle,
  ): VisualEmphasisAnnotation['geometry'] {
    return { kind: 'ellipse', rect: rectFromPoints(start, end), style };
  }
}
