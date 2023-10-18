export default class Bounds {
  constructor(bounds) {
    this.bounds = bounds;
  }

  getBounds() {
    return this.bounds;
  }

  expand(bounds) {
    if (!this.bounds.length) {
      this.bounds = bounds;
    } else {
      if (bounds[0] < this.bounds[0]) {
        this.bounds[0] = bounds[0];
      }
      if (bounds[1] < this.bounds[1]) {
        this.bounds[1] = bounds[1];
      }
      if (bounds[2] > this.bounds[2]) {
        this.bounds[2] = bounds[2];
      }
      if (bounds[3] > this.bounds[3]) {
        this.bounds[3] = bounds[3];
      }
    }
  }
}
