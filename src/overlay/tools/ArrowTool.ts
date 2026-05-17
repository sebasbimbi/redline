/** The arrow tool: drag from a start point to an arrowhead. */

import { DragShapeTool } from './DragShapeTool';
import type {
  StrokeStyle,
  VisualEmphasisAnnotation,
} from '../../model/annotation';
import type { Point } from '../../model/geometry';

export class ArrowTool extends DragShapeTool {
  readonly id = 'arrow' as const;

  protected buildGeometry(
    start: Point,
    end: Point,
    style: StrokeStyle,
  ): VisualEmphasisAnnotation['geometry'] {
    return { kind: 'arrow', from: { ...start }, to: { ...end }, style };
  }
}
