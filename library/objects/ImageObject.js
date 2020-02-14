const { loadImage } = require('canvas');
const sizeOf = require('image-size');
const PaperObject = require('../PaperObject');

class ImageObject extends PaperObject {
  constructor (file, scale = 1, align = false, takePaddings = false) {
    super();
    this.file = file;
    this.image = null;
    this.align = align;
    this.scale = scale;
    this.takePaddings = takePaddings;
  }

  load () {
    return new Promise((resolve, reject) => {
      if (!this.loaded) {
        loadImage(this.file).then((image) => {
          this.loaded = true;
          this.image = image;
          resolve()
        }).catch(err => {
          reject(err)
        })
      } else {
        resolve()
      }
    })
  }

  __getImageHeight () {
    return ImageObject.getSize(this.file).height;
  }

  __getImageWidth () {
    return ImageObject.getSize(this.file).width;
  }

  static __toCenterHeight (height, imageHeight) {
    return (height - imageHeight) / 2;
  }

  static __toCenterWidth (width, imageWidth) {
    return (width - imageWidth) / 2;
  }

  __paramsHandler (config, width, height) {
    let result = config;
    result.dWidth = this.__getImageWidth() * this.scale;
    result.dHeight = this.__getImageHeight() * this.scale;
    switch (this.align) {
      case "centerHeight":
        result.y = ImageObject.__toCenterHeight(height, this.__getImageHeight() * this.scale);
        break;
      case "centerWidth":
        result.x = ImageObject.__toCenterWidth(width, this.__getImageWidth() * this.scale);
        break;
      case "center":
        result.y = ImageObject.__toCenterHeight(height, this.__getImageHeight() * this.scale);
        result.x = ImageObject.__toCenterWidth(width, this.__getImageWidth() * this.scale);
        break;
    }
    return result;
  }

  draw (paper, params) {
    super.draw(paper, params);
    let config = {
      x: params.x + paper.getPaddingLeft(),
      y: params.y + paper.getPaddingTop(),
      dWidth: this.__getImageWidth(),
      dHeight: this.__getImageHeight()
    };
    let canvasDimensions = paper.getDimensions();
    if (this.takePaddings) {
      canvasDimensions.width += paper.getPaddingRight() + paper.getPaddingLeft();
      canvasDimensions.height += paper.getPaddingBottom() + paper.getPaddingTop();
    }
    config = Object.assign(config, this.__paramsHandler(config, canvasDimensions.width, canvasDimensions.height));
    paper.getContext().drawImage(
      this.image,
      config.x,
      config.y,
      config.dWidth,
      config.dHeight
    )
  }

  static getSize (image) {
    return sizeOf(image);
  }
}

module.exports = ImageObject;
