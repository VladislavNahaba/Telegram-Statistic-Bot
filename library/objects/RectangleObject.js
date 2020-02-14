const PaperObject = require('../PaperObject');
class RectangleObject extends PaperObject {
  constructor (fillStyle, bordered = false, borderColor = '#000000') {
    super();
    this.fillStyle = fillStyle;
    this.bordered = bordered;
    this.borderColor = borderColor;
  }

  draw (paper, params) {
    super.draw(paper, params);
    let context = paper.getContext();
    context.fillStyle = this.fillStyle;
    context.fillRect(params.x + paper.getPaddingLeft(), params.y + paper.getPaddingTop(), params.width + paper.getPaddingLeft(), params.height + paper.getPaddingTop());
    if (this.bordered) {
      context.strokeStyle = this.borderColor;
      context.strokeRect(params.x + 1 + paper.getPaddingLeft(), params.y + 1 + paper.getPaddingTop(), params.width - 1 + paper.getPaddingLeft(), params.height - 1 + paper.getPaddingTop());
    }
  }
}
module.exports = RectangleObject;
