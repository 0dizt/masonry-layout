/* @license Minigrid v3.1.1 – minimal cascading grid layout http://alves.im/minigrid */
(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define(factory);
  } else if (typeof exports === "object") {
    module.exports = factory();
  } else {
    root.Minigrid = factory();
  }
})(this, function (exports) {
  "use strict";

  function extend(a, b) {
    for (var key in b) {
      if (b.hasOwnProperty(key)) {
        a[key] = b[key];
      }
    }
    return a;
  }

  var Minigrid = function (props) {
    var containerEle =
      props.container instanceof Node
        ? props.container
        : document.querySelector(props.container);

    // var itemsNodeList =
    //   props.item instanceof NodeList
    //     ? props.item
    //     : containerEle.querySelectorAll(props.item)

    var itemsNodeList = props.item;

    this.props = extend(props, {
      container: containerEle,
      nodeList: itemsNodeList,
    });
  };

  Minigrid.prototype.mount = function () {
    if (!this.props.container) {
      return false;
    }
    if (!this.props.nodeList || this.props.nodeList.length === 0) {
      return false;
    }
    var gutter =
      typeof this.props.gutter === "number" &&
      isFinite(this.props.gutter) &&
      Math.floor(this.props.gutter) === this.props.gutter
        ? this.props.gutter
        : 0;

    var done = this.props.done;
    var containerEle = this.props.container;
    var itemsNodeList = this.props.nodeList;

    containerEle.style.width = "";

    var forEach = Array.prototype.forEach;
    var containerWidth = containerEle.getBoundingClientRect().width;
    var firstChildWidth =
      itemsNodeList[0].getBoundingClientRect().width + gutter;
    var cols = Math.max(
      Math.floor((containerWidth - gutter) / firstChildWidth),
      1
    );
    var count = 0;

    containerWidth = firstChildWidth * cols + gutter + "px";
    containerEle.style.width = containerWidth;
    containerEle.style.position = "relative";

    var itemsGutter = [];
    var itemsPosX = [];

    for (var g = 0; g < cols; ++g) {
      itemsPosX.push(g * firstChildWidth + gutter);
      itemsGutter.push(gutter);
    }

    // RTL support
    if (this.props.rtl) {
      itemsPosX.reverse();
    }

    forEach.call(itemsNodeList, function (item) {
      var itemIndex = itemsGutter
        .slice(0)
        .sort(function (a, b) {
          return a - b;
        })
        .shift();
      itemIndex = itemsGutter.indexOf(itemIndex);

      var posX = parseInt(itemsPosX[itemIndex]);
      var posY = parseInt(itemsGutter[itemIndex]);

      // more(item, posX, posY)

      item.style.position = "absolute";
      item.style.webkitBackfaceVisibility = item.style.backfaceVisibility =
        "hidden";
      item.style.transformStyle = "preserve-3d";
      item.style.transform = "translate3D(" + posX + "px," + posY + "px, 0)";

      // dataset
      item.dataset.axisX = posX;
      item.dataset.axisY = posY;

      itemsGutter[itemIndex] += item.getBoundingClientRect().height + gutter;
      count = count + 1;
    });

    containerEle.style.display = "";

    var containerHeight = itemsGutter
      .slice(0)
      .sort(function (a, b) {
        return a - b;
      })
      .pop();

    containerEle.style.height = containerHeight + "px";

    if (typeof done === "function") {
      done(itemsNodeList);
    }
  };

  return Minigrid;
});

const noop = (_) => {};
const closest = (value, array) => {
  let closest = Infinity;
  let closestIndex = -1;

  array.forEach((v, i) => {
    if (Math.abs(value - v) < closest) {
      closest = Math.abs(value - v);
      closestIndex = i;
    }
  });

  return closestIndex;
};

class Grid {
  constructor() {
    this.draggabillies = [];
  }
  init(el) {
    this.el = el;
    this.layout();
    this.setupDraggibilly();
    this.checkIfCorrect();

    this.fixedResult = this.sendResult;
  }

  get tabEls() {
    return Array.prototype.slice.call(this.el.querySelectorAll(".card"));
  }

  get tabContentEl() {
    return this.el.querySelector(".cards");
  }

  get tabContentWidths() {
    const numberOfTabs = this.tabEls.length;
    let widths = [];
    for (let i = 0; i < numberOfTabs; i += 1) {
      let width = this.tabEls[0].offsetWidth;
      widths.push(width);
    }

    return widths;
  }

  get tabPositions() {
    const positions = [];
    const tabEls = this.tabEls;

    tabEls.forEach((tabEl, i) => {
      const pos = {
        elem: tabEl,
        x: parseInt(tabEl.getAttribute("data-axis-x")),
        y: parseInt(tabEl.getAttribute("data-axis-y")),
      };
      positions.push(pos);
    });

    return positions;
  }

  layout() {
    new Minigrid({
      container: this.tabContentEl,
      item: this.tabEls,
      gutter: 12,
    }).mount();
  }
  setupDraggibilly() {
    const tabEls = this.tabEls;
    const tabPositions = this.tabPositions;

    let tabX = [],
      tabY = [];

    tabPositions.forEach((d) => {
      if (d.x) tabX.push(d.x);
      if (d.y) tabY.push(d.y);
    });

    if (this.isDragging) {
      this.isDragging = false;
      this.draggabillyDragging.element.classList.remove("is-dragging");
      this.draggabillyDragging.element.style.transform = "";
      this.draggabillyDragging.dragEnd();
      this.draggabillyDragging.isDragging = false;
      this.draggabillyDragging.positionDrag = noop;
      this.draggabillyDragging.destroy();
      this.draggabillyDragging = null;
    }

    this.draggabillies.forEach((d) => d.destroy());

    tabEls.forEach((tabEl, originalIndex) => {
      const originalTabPositionX = tabX[originalIndex];
      const originalTabPositionY = tabY[originalIndex];
      const draggabilly = new Breek(tabEl, {
        // containment: this.tabContentEl
      });
      this.draggabillies.push(draggabilly);

      draggabilly.on("pointerDown", (_) => {
        // console.log(tabEl);
        tabEls.forEach((tabEl) => {
          tabEl.style.border = "";
          tabEl.style.backgroundColor = "";
        });
        tabEl.style.border = "2px solid grey";
        tabEl.style.backgroundColor = "#111";

        // TODO - settings option for active class
        const setActiveStyle = {
          border: "2px solid grey",
          backgroundColor: "blue",
        };
      });

      draggabilly.on("pointerUp", (_) => {
        tabEl.style.border = "";
        tabEl.style.backgroundColor = "";
      });

      draggabilly.on("dragStart", (_) => {
        this.isDragging = true;
        this.draggabillyDragging = draggabilly;
        tabEl.classList.add("is-active");

        tabEls.forEach((el) => {
          if (el == tabEl) return;
          el.classList.add("sib");
        });
      });

      draggabilly.on("dragEnd", (_) => {
        this.isDragging = false;
        tabEl.style.left = `${parseInt(tabEl.dataset.axisX)}px`;
        tabEl.style.top = `${parseInt(tabEl.dataset.axisY)}px`;
        tabEl.classList.add("animate");

        tabEls.forEach((el) => {
          if (el == tabEl) return;
          el.classList.remove("sib");
        });

        setTimeout((_) => {
          tabEl.classList.remove("animate");
          tabEl.classList.remove("is-active");
          this.setupDraggibilly();
          this.layout();
        }, 300);
      });

      draggabilly.on("dragMove", (event, pointer, moveVector) => {
        this.tabPositions.forEach((pos) => {
          const tabEls = this.tabEls;
          const currentIndex = tabEls.indexOf(tabEl);
          const currentTabPositionX = originalTabPositionX + moveVector.x;
          const currentTabPositionY = originalTabPositionY + moveVector.y;

          let tabElHeight = tabEl.offsetHeight / 1.5;

          if (currentTabPositionX < Math.min(...tabX) - tabElHeight)
            return false;
          if (currentTabPositionY > Math.max(...tabY) + tabElHeight)
            return false;

          if (currentTabPositionX > Math.max(...tabX) + tabElHeight)
            return false;
          if (currentTabPositionY < Math.min(...tabY) - tabElHeight)
            return false;

          const destinationIndexTarget = closest(currentTabPositionX, tabX);
          const destinationIndexTargetY = closest(currentTabPositionY, tabY);

          if (pos.elem == tabEl) return;
          let posX = tabX[destinationIndexTarget];
          let posY = tabY[destinationIndexTargetY];

          if (posX == pos.x && posY == pos.y) {
            let destinationIndex = Math.max(
              0,
              Math.min(tabEls.length, tabEls.indexOf(pos.elem))
            );
            if (currentIndex !== destinationIndex) {
              this.animate(tabEl, currentIndex, destinationIndex);
            }
          }
        });
      });
    });
  }
  animate(tabEl, originalIndex, destinationIndex) {
    // console.log(destinationIndex, originalIndex);
    if (destinationIndex < originalIndex) {
      tabEl.parentNode.insertBefore(tabEl, this.tabEls[destinationIndex]);
    } else {
      tabEl.parentNode.insertBefore(tabEl, this.tabEls[destinationIndex + 1]);
    }

    this.layout();
    this.checkIfCorrect();
  }
  get sendResult() {
    var results = [];
    for (var i = 0, x = this.tabEls.length; i < x; i++) {
      var item = this.tabEls[i];
      let newObj = {
        index: i,
        elem: item,
        x: item.dataset.axisX,
        y: item.dataset.axisY,
        html: item.innerHTML,
      };
      item;
      results.push(newObj);
    }
    return results;
  }

  // This function checks if the cards/elements are in other.
  // If they are in order, Give the parent div a border-color or 'green'
  // If not give the parent div a border-color of 'red'
  checkIfCorrect() {
    let compare = {
      cards: this.sendResult,
      fixed: this.fixedResult || [],
    };

    if (compare.fixed.length == compare.cards.length)
      JSON.stringify(compare.cards) == JSON.stringify(compare.fixed)
        ? (document.querySelector(".cards").style.border = "1px solid green")
        : (document.querySelector(".cards").style.border = "1px solid red");
  }
}

new Grid().init(document.querySelector(".cards-wrap"));
