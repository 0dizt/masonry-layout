console.log(`
  Breek.js v-1.0.0
  MIT License sept 23 2019 
  https://github.io/joshnwosu/breek-example`);

window['Breek'] = (function() {
  'use strict';

  /** helpers and variables  */

  // event methods
  var postStartEvents = {
    mousedown: ['mousemove', 'mouseup'],
    touchstart: ['touchmove', 'touchend', 'touchcancel'],
    pointerdown: ['pointermove', 'pointerup', 'pointercancel']
  };

  // css position values that don't need to be set
  var positionValues = {
    relative: true,
    absolute: true,
    fixed: true
  };

  // nodes that have text fields
  var cursorNodes = {
    TEXTAREA: true,
    INPUT: true,
    SELECT: true,
    OPTION: true
  };

  // input types that do not have text fields
  var clickTypes = {
    radio: true,
    checkbox: true,
    button: true,
    submit: true,
    image: true,
    file: true
  };

  var extend = function(a, b) {
    for (var prop in b) {
      a[prop] = b[prop];
    }
    return a;
  };

  var noop = function() {};

  function Breek(element, options) {
    // check if element is a string
    // else query element
    this.element =
      'string' === typeof element ? document.querySelector(element) : element;

    // log error msg for no element
    // or element is not a DOM node
    if (!this.element || !this.element.addEventListener)
      throw new Error('Please provide DOM node to attach to');

    if (!this || this === window) return Breek(element, options);

    this.options = extend({}, this.options);
    extend(this.options, options);
    this._ready();
  }

  Breek.prototype = {
    /** Event emitter */
    on: function(eventName, listener) {
      if (!eventName || !listener) return;
      var events = (this._events = this._events || {});
      var listeners = (events[eventName] = events[eventName] || []);
      if (listeners.indexOf(listener) == -1) listeners.push(listener);
      return this;
    },

    off: function(eventName, listener) {
      var listeners = this._events && this._events[eventName];
      if (!listeners || !listeners.length) return;
      var index = listeners.indexOf(listener);
      if (index != -1) listeners.splice(index, 1);
      return this;
    },

    emitEvent: function(eventName, args) {
      var listeners = this._events && this._events[eventName];
      if (!listeners || !listeners.length) return;
      listeners = listeners.slice(0);
      args = args || [];
      for (var i = 0; i < listeners.length; i++) {
        var listener = listeners[i];
        listener.apply(this, args);
      }
      return this;
    },

    /** pointer event */

    bindStartEvent: function(elem) {
      this._bindStartEvent(elem, true);
    },

    unbindStartEvent: function(elem) {
      this._bindStartEvent(elem, false);
    },

    _bindStartEvent: function(elem, isAdd) {
      isAdd = isAdd === undefined ? true : isAdd;
      var bindMethod = isAdd ? 'addEventListener' : 'removeEventListener';

      // default to mouse events
      var startEvent = 'mousedown';
      if (window.PointerEvent) startEvent = 'pointerdown';
      else if ('ontouchstart' in window) startEvent = 'touchstart';
      elem[bindMethod](startEvent, this);
    },

    handleEvent: function(event) {
      var method = 'on' + event.type;
      if (this[method]) this[method](event);
    },

    getTouch: function(touches) {
      for (var i = 0; i < touches.length; i++) {
        var touch = touches[i];
        if (touch.identifier == this.pointerIdentifier) return touch;
      }
    },

    // start event
    onmousedown: function(event) {
      var button = event.button;
      if (button && (button !== 0 && button !== 1)) return;
      this._pointerDown(event, event);
    },

    ontouchstart: function(event) {
      this._pointerDown(event, event.changedTouches[0]);
    },

    onpointerdown: function(event) {
      this._pointerDown(event, event);
    },

    /**
     * pointer start
     */
    _pointerDown: function(event, pointer) {
      if (event.button || this.isPointerDown) return;
      this.isPointerDown = true;
      this.pointerIdentifier =
        pointer.pointerId !== undefined
          ? pointer.pointerId
          : pointer.identifier;
      this.pointerDown(event, pointer);
    },

    pointerDown: function(event, pointer) {
      this._bindPostStartEvents(event);
      this.emitEvent('pointerDown', [event, pointer]);
    },

    _bindPostStartEvents: function(event) {
      if (!event) {
        return;
      }
      // get proper events to match start event
      var events = postStartEvents[event.type];
      // bind events to node
      events.forEach(function(eventName) {
        window.addEventListener(eventName, this);
      }, this);
      // save these arguments
      this._boundPointerEvents = events;
    },

    _unbindPostStartEvents: function() {
      // check for _boundEvents, in case dragEnd triggered twice (old IE8 bug)
      if (!this._boundPointerEvents) {
        return;
      }
      this._boundPointerEvents.forEach(function(eventName) {
        window.removeEventListener(eventName, this);
      }, this);

      delete this._boundPointerEvents;
    },

    // move event
    onmousemove: function(event) {
      this._pointerMove(event, event);
    },

    onpointermove: function(event) {
      if (event.pointerId == this.pointerIdentifier) {
        this._pointerMove(event, event);
      }
    },

    ontouchmove: function(event) {
      var touch = this.getTouch(event.changedTouches);
      if (touch) this._pointerMove(event, touch);
    },

    _pointerMove: function(event, pointer) {
      this.pointerMove(event, pointer);
    },

    pointerMove: function(event, pointer) {
      this.emitEvent('pointerMove', [event, pointer]);
    },

    // end event
    onmouseup: function(event) {
      this._pointerUp(event, event);
    },

    onpointerup: function(event) {
      if (event.pointerId == this.pointerIdentifier) {
        this._pointerUp(event, event);
      }
    },

    ontouchend: function(event) {
      var touch = this.getTouch(event.changedTouches);
      if (touch) this._pointerUp(event, touch);
    },

    _pointerUp: function(event, pointer) {
      this._pointerDone();
      this.pointerUp(event, pointer);
    },

    pointerUp: function(event, pointer) {
      this.emitEvent('pointerUp', [event, pointer]);
    },

    // pointer done
    // triggered on pointer up & pointer cancel
    _pointerDone: function() {
      this._pointerReset();
      this._unbindPostStartEvents();
      this.pointerDone();
    },

    _pointerReset: function() {
      // reset properties
      this.isPointerDown = false;
      delete this.pointerIdentifier;
    },

    pointerDone: noop,

    // ----- pointer cancel ----- //

    onpointercancel: function(event) {
      if (event.pointerId == this.pointerIdentifier) {
        this._pointerCancel(event, event);
      }
    },

    ontouchcancel: function(event) {
      var touch = this.getTouch(event.changedTouches);
      if (touch) {
        this._pointerCancel(event, touch);
      }
    },

    _pointerCancel: function(event, pointer) {
      this._pointerDone();
      this.pointerCancel(event, pointer);
    },

    // public
    pointerCancel: function(event, pointer) {
      this.emitEvent('pointerCancel', [event, pointer]);
    },

    /** Dragger event */
    bindHandles: function() {
      this._bindHandles(true);
    },

    unbindHandles: function() {
      this._bindHandles(false);
    },

    _bindHandles: function(isAdd) {
      // munge isAdd, default to true
      isAdd = isAdd === undefined ? true : isAdd;
      // bind each handle
      var bindMethod = isAdd ? 'addEventListener' : 'removeEventListener';
      var touchAction = isAdd ? this._touchActionValue : '';
      for (var i = 0; i < this.handles.length; i++) {
        var handle = this.handles[i];
        this._bindStartEvent(handle, isAdd);
        handle[bindMethod]('click', this);
        // touch-action: none to override browser touch gestures. metafizzy/flickity#540
        if (window.PointerEvent) {
          handle.style.touchAction = touchAction;
        }
      }
    },

    // ype so it can be overwriteable by Flickity
    _touchActionValue: 'none',

    pointerDown: function(event, pointer) {
      var isOkay = this.okayPointerDown(event);
      if (!isOkay) {
        return;
      }
      // track start event position
      this.pointerDownPointer = pointer;
      event.preventDefault();
      this.pointerDownBlur();
      // bind move and end events
      this._bindPostStartEvents(event);
      this.emitEvent('pointerDown', [event, pointer]);
    },

    // dismiss inputs with text fields
    okayPointerDown: function(event) {
      var isCursorNode = cursorNodes[event.target.nodeName];
      var isClickType = (clickTypes = [event.target.type]);
      var isOkay = !isCursorNode || isClickType;
      if (!isOkay) {
        this._pointerReset;
      }
      return isOkay;
    },

    pointerDownBlur: function() {
      var focused = document.activeElement;
      // do not blur body for IE10
      var canBlur = focused && focused.blur && focused != document.body;
      if (canBlur) {
        focused.blur();
      }
    },

    //----- move event ------//
    /**
     * drage move
     */

    pointerMove: function(event, pointer) {
      var moveVector = this._draggerMove(event, pointer);
      this.emitEvent('pointerMove', [event, pointer, moveVector]);
      this._dragMove(event, pointer, moveVector);
    },

    // pointer move logic
    _draggerMove: function(event, pointer) {
      var moveVector = {
        x: pointer.pageX - this.pointerDownPointer.pageX,
        y: pointer.pageY - this.pointerDownPointer.pageY
      };
      // star drag if pointer has moved far enough to start drag
      if (!this.isDragging && this.hasDragStarted(moveVector)) {
        this._dragStart(event, pointer);
      }
      return moveVector;
    },

    // condition if pointer has moved afr enough to start drag
    hasDragStarted: function(moveVector) {
      return Math.abs(moveVector.x) > 3 || Math.abs(moveVector.y) > 3;
    },

    // ---- end event ---- //

    /**
     * pointer up
     * @param {Event} event
     * @param {Event or Touch} pointer
     */
    pointerUp: function(event, pointer) {
      this.emitEvent('pointerUp', [event, pointer]);
      this._draggerUp(event, pointer);
    },

    _draggerUp: function(event, pointer) {
      if (this.isDragging) {
        this._dragEnd(event, pointer);
      }
    },

    // ------ drag ------------//

    // dragStart
    _dragStart: function(event, pointer) {
      this.isDragging = true;
      // prevent clicks
      this.isPreventingClicks = true;
      this.dragStart(event, pointer);
    },

    dragStart: function(event, pointer) {
      this.emitEvent('dragStart', [event, pointer]);
    },

    // dragMove
    _dragMove: function(event, pointer, moveVector) {
      // do not drag if not dragging yet
      if (!this.isDragging) {
        return;
      }
      this.dragMove(event, pointer, moveVector);
    },
    dragMove: function(event, pointer, moveVector) {
      this.emitEvent('dragMove', [event, pointer, moveVector]);
    },

    // dragEnd
    _dragEnd: function(event, pointer) {
      // set flag
      this.isDragging = false;
      // re-enbale click async
      setTimeout(
        function() {
          delete this.isPreventingClicks;
        }.bind(this)
      );

      this.dragEnd(event, pointer);
    },

    dragEnd: function(event, pointer) {
      this.emitEvent('dragEnd', [event, pointer]);
    },

    // ----- onclick ----- //

    // handle all clicks and prevent clicks when dragging
    onclick: function(event) {
      if (this.isPreventingClicks) {
        event.preventDefault();
      }
    },

    /** functionality ready state */

    _ready: function() {
      // properties
      this.position = {};
      this._getPosition();

      this.startPoint = { x: 0, y: 0 };
      this.dragPoint = { x: 0, y: 0 };

      this.startPosition = extend({}, this.position);

      // set relative positioning
      var style = getComputedStyle(this.element);
      if (!positionValues[style.position]) {
        this.element.style.position = 'relative';
      }
      this.on('pointerDown', this.onPointerDown);
      this.on('pointerMove', this.onPointerMove);
      this.on('pointerUp', this.onPointerUp);

      this.enable();
      this.setHandles();
    },

    setHandles: function() {
      this.handles =
        this.options.handle &&
        this.element.querySelectorAll(this.options.handle).length
          ? this.element.querySelectorAll(this.options.handle)
          : [this.element];
      this.bindHandles();
    },

    dispatchEvent: function(type, event, args) {
      var emitArgs = [event].concat(args);
      this.emitEvent(type, emitArgs);
    },

    _getPosition: function() {
      var style = getComputedStyle(this.element);
      var x = this._getPositionCoord(style.left, 'width');
      var y = this._getPositionCoord(style.top, 'height');
      // clean up 'auto' or other non-integer values
      this.position.x = isNaN(x) ? 0 : x;
      this.position.y = isNaN(y) ? 0 : y;

      this._addTransformPosition(style);
    },

    _getPositionCoord: function(styleSide, measure) {
      return parseInt(styleSide, 10);
    },

    // add transform: translate( x, y ) to position
    _addTransformPosition: function(style) {
      var transform = style.transform;
      // bail out if value is 'none'
      if (transform.indexOf('matrix') !== 0) {
        return;
      }
      // split matrix(1, 0, 0, 1, x, y)
      var matrixValues = transform.split(',');
      // translate X value is in 12th or 4th position
      var xIndex = transform.indexOf('matrix3d') === 0 ? 12 : 4;
      var translateX = parseInt(matrixValues[xIndex], 10);
      // translate Y value is in 13th or 5th position
      var translateY = parseInt(matrixValues[xIndex + 1], 10);
      this.position.x += translateX;
      this.position.y += translateY;
    },

    // start event

    onPointerDown: function(event, pointer) {
      this.element.classList.add('is-pointer-down');
    },

    dragStart: function(event, pointer) {
      if (!this.isEnabled) {
        return;
      }
      this._getPosition();
      // this.measureContainment()
      // position _when_ drag began
      this.startPosition.x = this.position.x;
      this.startPosition.y = this.position.y;
      // reset left/top style
      this.setLeftTop();

      this.dragPoint.x = 0;
      this.dragPoint.y = 0;

      this.element.classList.add('is-dragging');
      this.dispatchEvent('dragStart', event, [pointer]);
      // start animation
      this.animate();
    },

    // ----- move event ----- //

    onPointerMove: function(event, pointer, moveVector) {},

    dragMove: function(event, pointer, moveVector) {
      if (!this.isEnabled) {
        return;
      }
      var dragX = moveVector.x;
      var dragY = moveVector.y;

      // constrain to axis
      dragX = this.options.axis === 'y' ? 0 : dragX;
      dragY = this.options.axis === 'x' ? 0 : dragY;

      this.position.x = this.startPosition.x + dragX;
      this.position.y = this.startPosition.y + dragY;
      // set dragPoint properties
      this.dragPoint.x = dragX;
      this.dragPoint.y = dragY;

      this.dispatchEvent('dragMove', event, [pointer, moveVector]);
    },

    // end event

    onPointerUp: function(event, pointer) {
      this.element.classList.remove('is-pointer-down');
    },

    dragEnd: function(event, pointer) {
      if (!this.isEnabled) {
        return;
      }
      // use top left position when complete
      this.element.style.transform = '';
      this.setLeftTop();
      this.element.classList.remove('is-dragging');
      this.dispatchEvent('dragEnd', event, [pointer]);
    },

    // -------------------------- animation -------------------------- //

    animate: function() {
      // only render and animate if dragging
      if (!this.isDragging) {
        return;
      }

      this.positionDrag();

      var _this = this;
      requestAnimationFrame(function animateFrame() {
        _this.animate();
      });
    },

    // left/top positioning
    setLeftTop: function() {
      this.element.style.left = this.position.x + 'px';
      this.element.style.top = this.position.y + 'px';
    },

    positionDrag: function() {
      this.element.style.transform =
        'translate3d( ' +
        this.dragPoint.x +
        'px, ' +
        this.dragPoint.y +
        'px, 0)';
    },

    // ----- methods ----- //

    setPosition: function(x, y) {
      this.position.x = x;
      this.position.y = y;
      this.setLeftTop();
    },

    enable: function() {
      this.isEnabled = true;
    },

    disable: function() {
      this.isEnabled = false;
      if (this.isDragging) {
        this.dragEnd();
      }
    },

    destroy: function() {
      this.disable();
      // reset styles
      this.element.style.transform = '';
      this.element.style.left = '';
      this.element.style.top = '';
      this.element.style.position = '';
      // unbind handles
      this.unbindHandles();
    }
  };

  // AMD
  if ('function' === typeof define && define.amd) {
    define(function() {
      return Breek;
    });
  }
  // CJS
  if ('object' === typeof module && module.exports) {
    module.exports = Breek;
  }

  return Breek;
})();
