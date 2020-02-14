const PaperObject = require('../PaperObject');

class TextObject extends PaperObject {
  constructor (text, contextParams, align = false, takePaddings = false, maxWidth = undefined) {
    super();
    this.text = text;
    this.maxWidth = maxWidth;
    this.contextParams = contextParams;
    this.align = align;
    this.takePaddings = takePaddings;
  }

  static __toCenterWidth (width, textWidth) {
    return (width - textWidth) / 2;
  }

  draw (paper, params) {
    super.draw(paper, params);
    let context = paper.getContext();
    let config = {
      x: params.x + paper.getPaddingLeft(),
      y: params.y + paper.getPaddingTop()
    };
    for (let [key, value] of Object.entries(this.contextParams)) {
      context[key] = value;
    }
    if (this.align) {
      config.x = ((this.takePaddings ? (paper.getDimensions().width + paper.getPaddingLeft()) : paper.getDimensions().width) - context.measureText(this.text).width) / 2
    }
    context.fillText(
      this.text,
      config.x,
      config.y,
      this.maxWidth
    )
  }
}

module.exports = TextObject;
