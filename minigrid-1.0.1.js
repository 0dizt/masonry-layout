class Minigrid {
  constructor(props) {
    this.container =
      props.container instanceof Node
        ? props.container
        : document.querySelector(props.container);
    this.itemNodeList =
      props.items instanceof Node
        ? props.items
        : this.container.querySelectorAll(props.items);

    this.gutter = this.validate(props.gutter, 50);

    this.column = this.validate(props.column, 3);

    this.props = this.extend(props, {
      container: this.container,
      items: this.itemNodeList,
      gutter: this.gutter,
      column: this.column,
    });
    this.responsive();
    this.mount();
    this.resize();
  }

  extend(a, b) {
    for (var key in b) {
      if (b.hasOwnProperty(key)) {
        a[key] = b[key];
      }
    }
    return a;
  }

  validate(value, defaultValue) {
    return typeof value === "number" &&
      isFinite(value) &&
      Math.floor(value) === value
      ? value
      : defaultValue;
  }

  resize() {
    window.addEventListener(
      "resize",
      () => {
        this.mount();
        this.responsive();
      },
      false
    );
  }

  responsive() {
    const width = window.innerWidth;
    for (const key in this.props.breakPoint) {
      if (this.props.breakPoint.hasOwnProperty(key)) {
        if (width >= key) {
          this.column = this.props.breakPoint[key];
        }
      }
    }
  }

  mount() {
    if (!this.props.container) {
      return false;
    }
    if (!this.props.items || this.props.items.length === 0) {
      return false;
    }

    let count = 0;
    let gutter = this.gutter;
    let column = this.column;
    let container = this.container;
    let itemNodeList = this.itemNodeList;
    let done = this.props.done;
    let animateOnResize = this.props.animateOnResize;

    let forEach = Array.prototype.forEach;
    let containerWidth = this.container.getBoundingClientRect().width;
    let firstChildWidth = (containerWidth - gutter) / column;

    container.style.position = "relative";

    let itemsGutter = [];
    let itemsPosX = [];

    for (var i = 0; i < column; ++i) {
      itemsPosX.push(i * firstChildWidth + gutter);
      itemsGutter.push(gutter);
    }

    // RTL support
    if (this.props.rtl) {
      itemsPosX.reverse();
    }

    forEach.call(itemNodeList, function (item) {
      let itemIndex = itemsGutter
        .slice(0)
        .sort(function (a, b) {
          return a - b;
        })
        .shift();
      itemIndex = itemsGutter.indexOf(itemIndex);

      let posX = parseInt(itemsPosX[itemIndex]);
      let posY = parseInt(itemsGutter[itemIndex]);

      item.style.width = firstChildWidth - gutter + "px";
      item.style.position = "absolute";
      item.style.webkitBackfaceVisibility = item.style.backfaceVisibility =
        "hidden";
      item.style.transformStyle = "preserve-3d";
      item.style.transform = "translate3D(" + posX + "px," + posY + "px, 0)";

      item.dataset.axisX = posX;
      item.dataset.axisY = posY;

      itemsGutter[itemIndex] += item.getBoundingClientRect().height + gutter;
      count = count + 1;

      let containerHeight = itemsGutter
        .slice(0)
        .sort(function (a, b) {
          return a - b;
        })
        .pop();

      container.style.height = containerHeight + "px";

      if (typeof done === "function") {
        done(itemNodeList);
      }

      // Animate on resize support
      if (animateOnResize) {
        item.style.transition = "300ms 100ms ease-in-out";
      }
    });
  }
}

// start
let layout = new Minigrid({
  container: ".cards",
  items: ".card",
  gutter: 20,
  column: 4,
  rtl: true,
  animateOnResize: true,
  breakPoint: {
    350: 1,
    450: 2,
    900: 3,
    1000: 4,
  },
});
