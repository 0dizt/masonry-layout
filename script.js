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
      container: ".cards",
      item: ".card",
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
        // console.log(tabEl)
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
    if (destinationIndex < originalIndex) {
      tabEl.parentNode.insertBefore(tabEl, this.tabEls[destinationIndex]);
    } else {
      tabEl.parentNode.insertBefore(tabEl, this.tabEls[destinationIndex + 1]);
    }

    this.layout();
  }
  sendResult() {
    var results = [];
    for (var i = 0, x = this.tabEls.length; i < x; i++) {
      var item = this.tabEls[i];
      let x = results[item.dataset];
      let newObj = {
        elem: item,
        x: item.dataset.axisX,
        y: item.dataset.axisY,
      };
      results.push(newObj);
    }
    console.log(results);
  }
}

var el = document.querySelector(".cards-wrap");
var g = new Grid();
g.init(el);
