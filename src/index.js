const converter = {
  converterPointsToCanvas(point, canvasWidth, canvasHeight, view = true) {
    return new Point(
      Math.round(point.x * canvasWidth),
      view
        ? Math.round(canvasHeight - point.y * canvasHeight)
        : Math.round(point.y * canvasHeight)
    );
  },
  converterCanvasToPoints(point, canvasWidth, canvasHeight, view = true) {
    return new Point(
      Math.floor((point.x * 100) / canvasWidth) / 100,
      view
        ? Math.floor(((canvasHeight - point.y) * 100) / canvasHeight) / 100
        : Math.floor((point.y * 100) / canvasHeight) / 100
    );
  },
};

// observer

const Observer = {
  aInternal: 0,
  aListener: function (val) {},
  set a(val) {
    this.aInternal = val;
    this.aListener(val);
  },
  get a() {
    return this.aInternal;
  },
  registerListener: function (listener) {
    this.aListener = listener;
  },
};

const helpers = {
  buttonManipulate: (element) => {
    element.classList.replace("bi-clipboard", "bi-clipboard-plus");
    setTimeout(() => {
      element.classList.replace("bi-clipboard-plus", "bi-clipboard");
    }, 700);
  },
  copyBezierPreset: (event, data) => {
    navigator.clipboard.writeText(
      JSON.stringify(data)
      //   `cubic-bezier(${defDotPreset[0].x}, ${defDotPreset[0].y}, ${defDotPreset[1].x}, ${defDotPreset[1].y})`
    );
  },
};

class Point {
  x = 0;
  y = 0;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class StorageData {
  time = 0;
  point1 = {};
  point2 = {};
  constructor(point1, point2, time) {
    if (point1) {
      this.point1 = point1;
    }
    if (point2) {
      this.point2 = point2;
    }
    if (time) this.time = time;
  }
}

class StorageImplementation {
  initData = {};
  shouldUpdateUi = false;
  constructor(initData) {
    if (!initData) {
      throw new Error("pls set init data instance of StorageData");
    }
    this.initData = initData;
  }

  getData() {
    return this.initData;
  }
  getDataForView() {
    let x = JSON.stringify(this.initData);
    return x;
  }
  updateData(storageData) {
    if (JSON.stringify(this.initData) !== JSON.stringify(storageData)) {
      for (let key in storageData) {
        this.initData[key] = storageData[key];
      }
      this.shouldUpdateUi = true;
      Observer.a = this.shouldUpdateUi;
    }
    return undefined;
  }
}

class Updater {
  elementListForOutput = [];
  canvasElementList = [];
  elementsListForAnimation = [];
  canvas;
  /**
   * @param {Array} elementListForOutput
   */
  constructor(
    elementListForOutput,
    elementsListForAnimation,
    canvasElementList,
    canvasWidth,
    canvasHeight
  ) {
    if (!canvasElementList) {
      throw new Error("pls set list of canvas elements for move");
    }
    if (!elementListForOutput) {
      throw new Error("pls set list of elements for view output data");
    }
    if (!elementsListForAnimation) {
      throw new Error("pls set list of elements for view animation");
    }
    if (!canvasWidth || !canvasHeight) {
      throw new Error(
        "pls set width and height of element where elements should be updated"
      );
    }
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.elementListForOutput = [...elementListForOutput];
    this.elementsListForAnimation = [...elementsListForAnimation];
    this.canvasElementList = [...canvasElementList];
  }
  /**
   * @param {string} data
   */
  update(data) {
    this._updateCanvasShape(data);
    let convertedData = {
      point1: converter.converterCanvasToPoints(
        data.point1,
        this.canvasWidth,
        this.canvasHeight
      ),
      point2: converter.converterCanvasToPoints(
        data.point2,
        this.canvasWidth,
        this.canvasHeight
      ),
    };
    let convertedForView = {
      time: data.time,
      dataString: `${convertedData.point1.x}, ${convertedData.point1.y}, ${convertedData.point2.x}, ${convertedData.point2.y}`,
    };
    this._updateUi(convertedForView);
    this._updateAnimation(convertedForView);
    return undefined;
  }
  _updateUi(data) {
    this.elementListForOutput.forEach(
      (element) => (element.innerHTML = data.dataString)
    );
  }
  _updateAnimation(data) {
    this.elementsListForAnimation.forEach((element) => {
      element.style = `animation-duration:${data.time}s; animation-timing-function:cubic-bezier(${data.dataString})`;
    });
  }
  _updateCanvasShape(dataObj) {
    this.canvasElementList.forEach((shape) => {
      shape.update(dataObj);
    });
  }
}

/**
 * @abstract
 */
class AbstractShape {
  /**
   * @abstract
   * @param {Canvas} canvas
   */
  draw(canvas) {
    throw new Error("Not implemented");
  }

  /**
   * @abstract
   * @param {Canvas} canvas
   */
  update(canvas) {
    throw new Error("Not implemented");
  }
}

class LineShape extends AbstractShape {
  startPoint = new Point(0, 0);
  endPoint = new Point(0, 0);
  lineWidth = 1;
  color = "#cecece";
  constructor(startPoint, endPoint, lineWidth, color) {
    super();
    if (startPoint) this.startPoint = startPoint;
    if (endPoint) this.endPoint = endPoint;
    if (lineWidth) this.lineWidth = lineWidth;
    if (color) this.color = color;
  }

  draw(canvas) {
    canvas.ctx.lineWidth = this.lineWidth;
    canvas.ctx.strokeStyle = this.color;
    canvas.ctx.beginPath();
    canvas.ctx.moveTo(this.startPoint.x, this.startPoint.y);
    canvas.ctx.lineTo(this.endPoint.x, this.endPoint.y);
    canvas.ctx.stroke();
    canvas.ctx.closePath();
    return undefined;
  }

  update(startPoint, endPoint) {
    this.startPoint = startPoint;
    this.endPoint = endPoint;
    return undefined;
  }
}

class CurveControlShape extends AbstractShape {
  startPoint = new Point(300, 0);
  endPoint = new Point(0, 0);
  lineWidth = 1;
  lineColor = "#cecece";
  circleWidth = 5;
  circleColor = "#00ff00";
  controlPointNumber = 1;
  constructor(
    startPoint,
    endPoint,
    lineWidth,
    lineColor,
    circleWidth,
    circleColor,
    controlPointNumber
  ) {
    super();
    if (startPoint) this.startPoint = startPoint;
    if (endPoint) this.endPoint = endPoint;
    if (lineWidth) this.lineWidth = lineWidth;
    if (lineColor) this.lineColor = lineColor;
    if (circleWidth) this.circleWidth = circleWidth;
    if (circleColor) this.circleColor = circleColor;
    if (controlPointNumber) this.controlPointNumber = controlPointNumber;
  }
  draw(canvas) {
    canvas.ctx.lineWidth = this.lineWidth;
    canvas.ctx.strokeStyle = this.lineColor;
    canvas.ctx.beginPath();
    canvas.ctx.moveTo(this.startPoint.x, this.startPoint.y);
    canvas.ctx.lineTo(this.endPoint.x, this.endPoint.y);
    canvas.ctx.stroke();
    canvas.ctx.closePath();
    canvas.ctx.beginPath();
    canvas.ctx.arc(
      this.startPoint.x,
      this.startPoint.y,
      this.circleWidth,
      0,
      2 * Math.PI
    );
    canvas.ctx.fillStyle = this.circleColor;
    canvas.ctx.fill();
    canvas.ctx.closePath();
    return undefined;
  }

  update(points) {
    this.startPoint = points[`point${this.controlPointNumber}`];
    return undefined;
  }
}

class CurveShape extends AbstractShape {
  startPoint = new Point(0, 0);
  endPoint = new Point(1, 1);
  controlPoints = { point1: new Point(0, 1), point2: new Point(1, 0) };
  lineWidth = 7;
  color = "#0000ff";
  animationDuration = 4;
  scalable = true;
  canvasWidth = 0;
  canvasHeight = 0;
  constructor(controlPoints, lineWidth, color) {
    super();
    if (controlPoints) this.controlPoints = controlPoints;
    if (lineWidth) this.lineWidth = lineWidth;
    if (color) this.color = color;
  }

  draw(canvas) {
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
    canvas.ctx.lineWidth = this.lineWidth;
    canvas.ctx.strokeStyle = this.color;
    canvas.ctx.beginPath();
    this.getCurvePoints((canvas.width + canvas.height) / 2).forEach((point) => {
      const pointForCurve = converter.converterPointsToCanvas(
        point,
        canvas.width,
        canvas.height
        // false
      );
      canvas.ctx.lineTo(
        pointForCurve.x, // / 2 + canvas.width / 4,
        pointForCurve.y // / 2 + canvas.height / 4
      );
    });
    canvas.ctx.stroke();
    canvas.ctx.closePath();
    return undefined;
  }

  update(controlPoints) {
    let point1 = converter.converterCanvasToPoints(
      controlPoints.point1,
      this.canvasWidth,
      this.canvasHeight
    );
    let point2 = converter.converterCanvasToPoints(
      controlPoints.point2,
      this.canvasWidth,
      this.canvasHeight
    );
    this.controlPoints = { point1, point2 };
    return undefined;
  }

  cube(i, axis) {
    // P = (1−t)3P1 + 3(1−t)2tP2 +3(1−t)t2P3 + t3P4
    const p1 = Math.pow(1 - i, 3) * this.startPoint[axis];
    const p2 = 3 * Math.pow(1 - i, 2) * i * this.controlPoints.point1[axis];
    const p3 = 3 * (1 - i) * Math.pow(i, 2) * this.controlPoints.point2[axis];
    const p4 = Math.pow(i, 3) * this.endPoint[axis];
    return p1 + p2 + p3 + p4;
  }
  getCurvePoints(canvasWidth = 100) {
    let array = [];
    for (let i = 1; i > 0; i -= this.animationDuration / canvasWidth) {
      array.push(new Point(this.cube(i, "x"), this.cube(i, "y")));
    }
    array.push(new Point(0, 0));
    return array;
  }
}

class CanvasElement {
  /**
   * @type {CanvasRenderingContext2D}
   */
  ctx;

  /**
   * @type {HTMLCanvasElement}
   */
  domNode;

  /**
   * @type {Set<AbstractShape>}
   */
  existingShapes = new Set();

  width = 0;
  height = 0;

  constructor(domNode) {
    if (!domNode.getContext) {
      throw new Error("domeNode is not canvas");
    }
    if (!domNode.width || !domNode.height) {
      throw new Error("be sure that canvas element has width and height");
    }
    this.domNode = domNode;
    this.width = domNode.width;
    this.height = domNode.height;
    this.ctx = this.domNode.getContext("2d");
  }

  /**
   *
   * @param {AbstractShape} shape
   */
  drawShape() {
    this.ctx.clearRect(0, 0, this.domNode.width, this.domNode.height);
    this.existingShapes.forEach((shape) => {
      shape.draw(this);
    });
  }
  addToListElementForDraw(shape) {
    this.existingShapes.add(shape);
  }
  drawNet(xCount, yCount, ElementClass, PointClass) {
    this.ctx.clearRect(0, 0, this.domNode.width, this.domNode.height);
    for (let i = 0; i < this.domNode.width; i += this.domNode.width / xCount) {
      this.addToListElementForDraw(
        new ElementClass(
          new PointClass(i, 0),
          new PointClass(i, this.domNode.height)
        )
      );
    }
    for (
      let i = 0;
      i < this.domNode.height;
      i += this.domNode.height / yCount
    ) {
      this.addToListElementForDraw(
        new ElementClass(
          new PointClass(0, i),
          new PointClass(this.domNode.width, i)
        )
      );
    }
    this.existingShapes.forEach((shape) => {
      shape.draw(this);
    });
  }
}

class InputCanvasElement extends CanvasElement {
  /**
   * @type {boolean} isDown if mouse key pressed down
   */
  isDown = false;

  /**
   * @type {number} activeDotIndex number of currently active controlDot
   * possible value -1|0|1
   * default value -1
   */
  activeDotIndex = -1;

  arrayOfControllingPrimitiveShape = [];
  storageElem;

  /**
   * @param {HTMLCanvasElement} domNode Canvas element
   */

  constructor(domNode, arrayOfControllingPrimitiveShape, storageElem) {
    super(domNode);
    if (!arrayOfControllingPrimitiveShape) {
      throw new Error("pls set list of elements for control animation");
    }
    if (!storageElem) {
      throw new Error("pls set storage for save output data");
    }
    this.arrayOfControllingPrimitiveShape = arrayOfControllingPrimitiveShape;
    this.storageElem = storageElem;
    this._subscribe();
  }

  _subscribe() {
    // this.domNode.addEventListener("click", this._onCanvasClick.bind(this));
    this.domNode.addEventListener(
      "mousedown",
      this._onCanvasMouseDown.bind(this)
    );
    this.domNode.addEventListener("mouseup", this._resetSelection.bind(this));
    this.domNode.addEventListener(
      "mouseleave",
      this._resetSelection.bind(this)
    );
    this.domNode.addEventListener(
      "mousemove",
      this._controlDotChangePosition.bind(this)
    );
  }

  /**
   *
   * @param {HTMLCanvasElement} domNode Canvas element
   * @param {Event} ev
   * @private
   */
  _getMousePos(canvas, ev) {
    const rect = canvas.getBoundingClientRect();
    const x = ev?.clientX - rect.left;
    const y = ev?.clientY - rect.top;
    return new Point(x, y);
  }
  _compareMousePlace(point) {
    this.arrayOfControllingPrimitiveShape.forEach((controlShape, index) => {
      const { startPoint, circleWidth } = controlShape;

      const compare =
        point.x >= startPoint.x - 4 * circleWidth &&
        point.x <= startPoint.x + 4 * circleWidth &&
        point.y >= startPoint.y - 4 * circleWidth &&
        point.y <= startPoint.y + 4 * circleWidth;
      if (compare) {
        this.activeDotIndex = index;
      }
    });
    return undefined;
  }
  /**
   *
   * @param {Event} ev
   * @private
   */
  _controlDotChangePosition(ev) {
    /**
     * 1. get mouse coordinates
     * 2. choose which dot moved
     * 3. update output dots pos
     * **/
    if (this.isDown) {
      const hittedControlPointCoords = this._getMousePos(this.domNode, ev);
      if (this.activeDotIndex === -1) {
        let x = this._compareMousePlace(hittedControlPointCoords);
      }
      if (this.activeDotIndex !== -1) {
        let copyStorageData = { ...this.storageElem.initData };

        let whichControlActive = `point${this.activeDotIndex + 1}`;
        copyStorageData[whichControlActive] = hittedControlPointCoords;
        this.storageElem.updateData(copyStorageData);
        this.drawShape();
      }
    }
    return undefined;
  }

  _onCanvasMouseDown(ev) {
    this.isDown = true;
  }

  _resetSelection() {
    this.isDown = false;
    this.activeDotIndex = -1;
  }
}

class InputElement {
  storageElem;
  domNode;
  canvasElement;
  triggerType = "click";
  /**
   * @param {HTMLCanvasElement} domNode Canvas element
   */

  constructor(domNode, triggerType, storageElem, canvasElement) {
    if (!storageElem) {
      throw new Error("pls set storage for save output data");
    }
    if (!domNode) {
      throw new Error("pls set dom element");
    }
    if (!canvasElement) {
      throw Error("pls set canvasElement element");
    }
    this.domNode = domNode;
    this.triggerType = triggerType;
    this.storageElem = storageElem;
    this.canvasElement = canvasElement;
    this._subscribe();
  }

  _subscribe() {
    this.domNode.addEventListener(
      this.triggerType,
      this._controlDotChangePosition.bind(this)
    );
  }
  _test(value) {
    let c1 = value.split(", ").length !== 4;
    let c2 = !value;
    let c3 = !value
      .split(", ")
      .every((el) => Number(el) <= 1 && Number(el) >= 0);
    if (c1 || c2 || c3) {
      return false;
    }
    return true;
  }
  /**
   *
   * @param {Event} ev
   * @private
   */
  _controlDotChangePosition(ev) {
    /**
     * 1. get mouse coordinates
     * 2. choose which dot moved
     * 3. update output dots pos
     * **/

    if (this._test(ev.target.value)) {
      const userPointsPreset = ev.target.value.split(", ");
      const dataPreset = {
        point1: new Point(
          Number(userPointsPreset[0]),
          Number(userPointsPreset[1])
        ),
        point2: new Point(
          Number(userPointsPreset[2]),
          Number(userPointsPreset[3])
        ),
      };
      dataPreset.point1 = converter.converterPointsToCanvas(
        dataPreset.point1,
        this.canvasElement.width,
        this.canvasElement.height
      );
      dataPreset.point2 = converter.converterPointsToCanvas(
        dataPreset.point2,
        this.canvasElement.width,
        this.canvasElement.height
      );
      this.storageElem.updateData(dataPreset);

      this.canvasElement.drawShape();
    }
    return undefined;
  }
}

class TimeInput extends InputElement {
  constructor(domNode, triggerType, storageElem, canvasElement) {
    super(domNode, triggerType, storageElem, canvasElement);
  }
  _controlDotChangePosition(ev) {
    if (this._test(ev.target.value)) {
      this.storageElem.updateData({ time: Number(ev.target.value) });
    }
  }
  _test(value) {
    if (Number(value) > 10 || Number(value) < 0 || !value) {
      return false;
    }
    return true;
  }
}

(() => {
  const copyButton = document.getElementById("copy");
  const copyButtonIcon = document.querySelector("#copy .bi");
  const canvas = document.getElementById("canvas");
  const canvasBack = document.getElementById("canvasBack");
  const inputTime = document.getElementById("duration");
  const output = document.getElementById("output");
  const input = document.getElementById("input");
  const time = document.getElementById("time");
  const circle = document.querySelector(".circle");
  const radiobuttons = document.querySelectorAll(
    '[name="selectTypeOfAnimation"]'
  );

  copyButton.addEventListener("click", (event) => {
    helpers.copyBezierPreset(event, dataStorage.getData());
    helpers.buttonManipulate(copyButtonIcon);
  });

  const domeNodeOutput = document.getElementById("output");
  const domeNodeCanvasDynamic = document.getElementById("canvasDynamic");
  const domeNodeCanvasStatic = document.getElementById("canvasStatic");

  const staticCanvas = new CanvasElement(domeNodeCanvasStatic);
  staticCanvas.drawNet(10, 10, LineShape, Point);
  staticCanvas.drawShape();

  const initDataPoints = new StorageData(
    new Point(0, 0),
    new Point(300, 300),
    4
  );
  const dataStorage = new StorageImplementation(initDataPoints);

  const curve = new CurveShape();
  const control = new CurveControlShape(
    initDataPoints.point1,
    new Point(0, 300),
    2,
    "#000",
    5,
    "#f0f",
    1
  );
  const control2 = new CurveControlShape(
    initDataPoints.point2,
    new Point(300, 0),
    2,
    "#000",
    5,
    "#0ff",
    2
  );

  const updater = new Updater(
    [domeNodeOutput],
    [circle],
    [control, control2, curve],
    domeNodeCanvasDynamic.width,
    domeNodeCanvasDynamic.height
  );

  const dynamicCanvas = new InputCanvasElement(
    domeNodeCanvasDynamic,
    [control, control2],
    dataStorage
  );

  dynamicCanvas.addToListElementForDraw(curve);
  dynamicCanvas.addToListElementForDraw(control);
  dynamicCanvas.addToListElementForDraw(control2);

  dynamicCanvas.drawShape();

  radiobuttons.forEach(
    (radioButton) =>
      new InputElement(radioButton, "click", dataStorage, dynamicCanvas)
  );

  const inputElement = new InputElement(
    input,
    "input",
    dataStorage,
    dynamicCanvas
  );
  const timeInputElement = new TimeInput(
    time,
    "input",
    dataStorage,
    dynamicCanvas
  );

  const someFunc = function (shouldUpdateUi) {
    updater.update(dataStorage.initData);
  };

  Observer.registerListener(someFunc);

  document.getElementById("global").classList.remove("loading-skeleton");
})();
