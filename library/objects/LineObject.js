const PaperObject = require('../PaperObject');
class LineObject extends PaperObject{
  constructor(strokeStyle = '#000000', lineWidth = 1) {
    super();
    this.strokeStyle = strokeStyle;
    this.lineWidth = lineWidth;
  }

  draw (paper, params) {
    super.draw(paper, params);
    let context = paper.getContext();
    context.beginPath();
    context.strokeStyle = this.strokeStyle;
    context.moveTo(params.start.x + paper.getPaddingLeft(), params.start.y + paper.getPaddingTop());
    context.lineWidth = this.lineWidth;
    context.lineTo(params.end.x + paper.getPaddingLeft(), params.end.y + paper.getPaddingTop());
    context.stroke();
  }
}

module.exports = LineObject;
