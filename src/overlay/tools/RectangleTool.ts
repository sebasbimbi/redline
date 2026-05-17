/** The rectangle tool: drag out an outlined box. */

import { DragShapeTool } from './DragShapeTool';
import type {
  StrokeStyle,
  VisualEmphasisAnnotation,
} from '../../model/annotation';
import type { Point } from '../../model/geometry';
import { rectFromPoints } from '../../model/geometryOps';

export class RectangleTool extends DragShapeTool {
  readonly id = 'rectangle' as const;

  protected buildGeometry(
    start: Point,
    end: Point,
    style: StrokeStyle,
  ): VisualEmphasisAnnotation['geometry'] {
    return { kind: 'rectangle', rect: rectFromPoints(start, end), style };
  }
}
