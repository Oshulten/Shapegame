export class Camera {
    static restoreIdentity(context) {
        context.setTransform(1, 0, 0, 1, 0, 0);
    }
    constructor(context, settings = {}) {
        this.grabPan = undefined;
        this.distance = settings.distance || 1000.0;
        this.lookAt = settings.initialPosition || [0, 0];
        this.ctx = context;
        this.screenCursor = [0, 0];
        this.realCursor = [0, 0];
        this.fieldOfView = settings.fieldOfView || Math.PI / 4.0;
        this.viewport = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            width: 0,
            height: 0,
            scale: [settings.scaleX || 1.0, settings.scaleY || 1.0]
        };
        this.drawCursor = true;
        this.addListeners();
        this.updateViewport();
    }
    canvasViewport() {
        return {
            left: 0,
            right: this.ctx.canvas.width,
            top: 0,
            bottom: this.ctx.canvas.height,
            width: this.ctx.canvas.width,
            height: this.ctx.canvas.height,
            scale: [1, 1]
        };
    }
    getViewportAtDepth(depth) {
        this.distance += depth;
        this.updateViewport();
        const viewportCopy = Object.assign({}, this.viewport);
        this.distance -= depth;
        this.updateViewport();
        return viewportCopy;
    }
    apply(deltaDepth = 0) {
        if (deltaDepth !== 0) {
            this.distance += deltaDepth;
            this.updateViewport();
        }
        this.ctx.scale(this.viewport.scale[0], this.viewport.scale[1]);
        this.ctx.translate(-this.viewport.left, -this.viewport.top);
        const viewportCopy = Object.assign({}, this.viewport);
        if (deltaDepth !== 0) {
            this.distance -= deltaDepth;
            this.updateViewport();
        }
        return viewportCopy;
    }
    restore() {
        Camera.restoreIdentity(this.ctx);
    }
    updateViewport() {
        this.aspectRatio = this.ctx.canvas.width / this.ctx.canvas.height;
        this.viewport.width = this.distance * Math.tan(this.fieldOfView);
        this.viewport.height = this.viewport.width / this.aspectRatio;
        this.viewport.left = this.lookAt[0] - (this.viewport.width / 2.0);
        this.viewport.top = this.lookAt[1] - (this.viewport.height / 2.0);
        this.viewport.right = this.viewport.left + this.viewport.width;
        this.viewport.bottom = this.viewport.top + this.viewport.height;
        this.viewport.scale[0] = this.ctx.canvas.width / this.viewport.width;
        this.viewport.scale[1] = this.ctx.canvas.height / this.viewport.height;
    }
    zoomTo(z) {
        this.distance = z;
        this.updateViewport();
        this.updateCursor();
    }
    zoomMultiply(f) {
        this.distance *= f;
        this.updateViewport();
        this.updateCursor();
    }
    moveTo(coords, event) {
        this.lookAt[0] = coords[0];
        this.lookAt[1] = coords[1];
        this.updateViewport();
        this.updateCursor();
    }
    pan(delta) {
        this.lookAt[0] += delta[0];
        this.lookAt[1] += delta[1];
        this.updateViewport();
        this.updateCursor();
    }
    focusOn(center, maxDim = 5000) {
        this.lookAt = center;
        if (maxDim)
            this.distance = maxDim / Math.tan(this.fieldOfView);
        this.updateViewport();
    }
    coordsToWorld(coords, deltaDepth = 0) {
        this.distance += deltaDepth;
        this.updateViewport();
        const transformedCoords = [
            (coords[0] / this.viewport.scale[0]) + this.viewport.left,
            (coords[1] / this.viewport.scale[1]) + this.viewport.top
        ];
        this.distance -= deltaDepth;
        this.updateViewport();
        return transformedCoords;
    }
    coordsToScreen(coords, deltaDepth = 0) {
        this.distance += deltaDepth;
        this.updateViewport();
        const transformedCoords = [
            (coords[0] - this.viewport.left) * (this.viewport.scale[0]),
            (coords[1] - this.viewport.top) * (this.viewport.scale[1])
        ];
        this.distance -= deltaDepth;
        this.updateViewport();
        return transformedCoords;
    }
    dimsToWorld(dims) {
        return [
            dims[0] / this.viewport.scale[0],
            dims[1] / this.viewport.scale[1]
        ];
    }
    dimsToScreen(dims, deltaDepth = 0) {
        this.distance += deltaDepth;
        this.updateViewport();
        const screenDim = [
            dims[0] * this.viewport.scale[0],
            dims[1] * this.viewport.scale[1]
        ];
        this.distance -= deltaDepth;
        this.updateViewport();
        return screenDim;
    }
    dimToWorld(dim, x = true) {
        return dim * (x ? this.viewport.scale[0] : this.viewport.scale[1]);
    }
    dimToScreen(dim, x = true) {
        return dim / (x ? this.viewport.scale[0] : this.viewport.scale[1]);
    }
    updateCursor(event = undefined) {
        if (event) {
            this.screenCursor = [
                event.clientX - this.ctx.canvas.offsetLeft,
                event.clientY - this.ctx.canvas.offsetTop
            ];
        }
        this.realCursor = this.coordsToWorld(this.screenCursor);
    }
    realCursorAtDepth(depth) {
        return this.coordsToWorld(this.screenCursor, depth);
    }
    addListeners() {
        this.ctx.canvas.addEventListener("mousedown", event => {
            this.updateCursor(event);
            if (event.button === 2) {
                //this.moveTo(this.realCursor, event);
                this.grabPan = {
                    startPosition: [...this.realCursor],
                    controller: new AbortController
                };
                this.ctx.canvas.addEventListener("mousemove", event => {
                    const delta = [
                        this.grabPan.startPosition[0] - this.realCursor[0],
                        this.grabPan.startPosition[1] - this.realCursor[1]
                    ];
                    this.pan(delta);
                }, { signal: this.grabPan.controller.signal });
                this.ctx.canvas.addEventListener("mouseup", event => {
                    if (event.button === 2) {
                        this.grabPan.controller.abort();
                    }
                }, { signal: this.grabPan.controller.signal });
            }
        });
        //update cursor
        this.ctx.canvas.addEventListener("mousemove", event => {
            this.updateCursor(event);
        });
        window.addEventListener("wheel", (event) => {
            const zoomStep = 1.1;
            if (event.deltaY < 0)
                this.zoomMultiply(zoomStep);
            else
                this.zoomMultiply(1 / zoomStep);
        });
    }
}
;
//# sourceMappingURL=camera.js.map