class PaperObject {
  constructor () {
    this.loaded = false
  }

  load () {
    return new Promise((resolve) => {
      this.loaded = true;
      resolve()
    })
  }

  draw (paper, params) {
    if (!this.loaded) {
      throw new Error('Object not loaded')
    }
  }
}

module.exports = PaperObject;
