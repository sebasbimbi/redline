/** The highlight tool: drag out a translucent marker-style fill. */

import { DragShapeTool } from './DragShapeTool';
import type {
  StrokeStyle,
  VisualEmphasisAnnotation,
} from '../../model/annotation';
import type { Point } from '../../model/geometry';
import { rectFromPoints } from '../../model/geometryOps';

export class HighlightTool extends DragShapeTool {
  readonly id = 'highlight' as const;

  protected buildGeometry(
    start: Point,
    end: Point,
    style: StrokeStyle,
  ): VisualEmphasisAnnotation['geometry'] {
    return {
      kind: 'highlight',
      rect: rectFromPoints(start, end),
      color: style.color,
    };
  }
}
