const { registerFont, createCanvas } = require('canvas');
const fs = require('fs');

class Paper {
  constructor (
    width,
    height,
    {
      padding = 0,
      paddingTop = false,
      paddingRight = false,
      paddingBottom = false,
      paddingLeft = false
    } = {}
  ) {
    this.width = width;
    this.height = height;
    this.paddingTop = (paddingTop === false) ? (padding > 0) ? padding : 0 : paddingTop;
    this.paddingRight = (paddingRight === false) ? (padding > 0) ? padding : 0 : paddingRight;
    this.paddingBottom = (paddingBottom === false) ? (padding > 0) ? padding : 0 : paddingBottom;
    this.paddingLeft = (paddingLeft === false) ? (padding > 0) ? padding : 0 : paddingLeft;
    this.canvas = createCanvas(this.width, this.height);
    this.context = this.canvas.getContext('2d')
  }

  fill (fillStyle, withPaddings = true) {
    this.context.fillStyle = fillStyle;
    let x = 0, y = 0;
    let width = this.width, height = this.height;
    if (!withPaddings) {
      x += this.paddingLeft;
      width -= this.paddingLeft + this.paddingRight;
      y += this.paddingTop;
      height -= this.paddingTop + this.paddingBottom
    }
    this.context.fillRect(x, y, width, height)
  }

  getDimensions() {
    return {
      width: this.width,
      height: this.height
    }
  }

  getContext () {
    return this.context
  }

  getPaddingTop () {
    return this.paddingTop
  }

  getPaddingBottom () {
    return this.paddingBottom
  }

  getPaddingRight () {
    return this.paddingRight
  }

  getPaddingLeft () {
    return this.paddingLeft
  }

  static fontRegister (path, params) {
    try {
      registerFont(path, params)
    } catch (e) {
      console.log(e);
    }
  }

  save (file) {
    return new Promise((resolve, reject) => {
      const out = fs.createWriteStream(file);
      const stream = this.canvas.createPNGStream();
      stream.pipe(out);
      out.on('finish', () => resolve(file));
      out.on('error', (error) => reject(error));
      return file;
    })
  }
}

module.exports = Paper;
