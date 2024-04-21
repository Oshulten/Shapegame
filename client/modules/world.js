import { AnimationManager, TimeFunctions, PathAnimation, CallbackAnimation, DynamicAnimation } from "./animation.js";
import { Shape } from "./shape.js";
import { Camera } from "./camera.js";
import { Layer } from "./layer.js";
import { math } from "./math.js";
import { Color } from "./color.js";
import { Workshop } from "./workshop.js";
import { Coords, Path } from "./geometry.js";
import { ClientDatabase } from "./client-database.js";
import { sendJSONRequest } from "./client-json.js";

export class World {
    static #database;
    static worldObjects;
    static notifyWorldObjectsChangedCallbacks = [];
    static notifyLayersChangedCallbacks = [];

    static initializeDatabase(databaseLabel) {
        return new Promise(async (resolve, reject) => {
            try {
                this.#database = new ClientDatabase(databaseLabel);
                const databaseExists = await this.#database.checkExistence();
                if (databaseExists) {
                    //get world names from server
                    await this.getWorldNames();
                    resolve(World.worldObjects);
                } else {
                    throw new Error(`ServerDatabase '${databaseLabel}' doesn't exist`);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    static serialize(world) {
        return {
            layers: world.layers.map((layer) => Layer.serialize(layer)),
            filename: world.filename,
        };
    }
    static deserialize(jsonObject, context) {
        const world = new World(context);
        for (let jsonLayer of jsonObject.layers) {
            const layer = Layer.deserialize(world, jsonLayer);
            world.layers.push(layer);
        }
        world.sortLayers();
        return world;
    }
    static getWorld(context, filename) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!World.#database.confirmedExistence) {
                    throw new Error(`Unable to reach ServerDatabase '${World.#database.databaseLabel}'`);
                } else {
                    const response = await World.#database.getFile(filename);
                    const world = World.deserialize(response, context);
                    world.filename = filename;
                    resolve(world);
                }
            } catch (error) {
                console.error(error, `\nReturns a default world instead`);
                //return a default world instead
                resolve(new World(context, "$default"));
            }
        });
    }

    static saveWorld(world, filename) {
        return new Promise(async (resolve, reject) => {
            try {
                world.filename = filename;
                const jsonObject = World.serialize(world, world.context);
                const response = await World.#database.addFile(jsonObject, filename);
                resolve(response);
            } catch (error) {
                reject(error);
            }
        });
    }
    static getWorldNames() {
        return new Promise(async (resolve, reject) => {
            try {
                let response = await World.#database.getFileNames()
                response = response.map((filename) => ({ filename: filename, label: filename.split(".")[0] }));

                World.worldObjects = new Proxy(response, {
                    set: (target, property, value, receiver) => {
                        target[property] = value;
                        World.notifyWorldObjectsChangedCallbacks.forEach((callback) => callback(World.worldObjects));
                        return true;
                    },
                });

                resolve(World.worldObjects);
            } catch (error) {
                reject(error);
            }
        });
    }

    $default() {
        this.workshop.activeLayer = this.addLayer("world", 0);
        this.addLayer("background", 0);
        this.addLayer("foreground", 0);
        this.workshop.focus = true;
    }

    $followMe(numParticles = 100) {
        console.log("creating $followMe world");
        this.addLayer("world", 0);
        this.dummyCursor = { position: [0, 0] };
        for (let i = 0; i < numParticles; i++) {
            const particle = this.layers
                .at(-1)
                .addShape(Coords.circle(math.uniformFloats([-600, 600], 2), math.uniformInt(5, 15), 8), { fillColor: new Color(0, 100, 100, 0.25) });
            AnimationManager.start(new DynamicAnimation(particle, "position", this.dummyCursor, "position", DynamicAnimation.attractionFollow(100, 0.8)));
        }
        this.workshop.activeLayer = this.layers[0];
    }

    $testLayerSorting() {
        console.log("creating $testLayerSorting world");
        this.addLayer("world", -10);
        this.addLayer("world", 0);
        this.addLayer("world", 10);
        this.addLayer("foreground", -10);
        this.addLayer("foreground", 0);
        this.addLayer("foreground", 10);
        this.addLayer("background", -10);
        this.addLayer("background", 0);
        this.addLayer("background", 10);

        this.workshop.activeLayer = this.worldLayers[0];
    }

    $edgeCase() {
        console.log("creating $edgeCase world");
        this.addLayer("foreground", 0);
        const thickness = 10;
        let path = Path.circle(150);
        const coords = Coords.dimBox([0, 0], 150, 75, "center-center");
        this.addLayer("world", 0);
        for (let j = 0; j < 10; j++) {
            this.addLayer("world", 10 * j ** 5);
            const shape = this.worldLayers.at(-1).addShape(coords, { isStatic: true });
            AnimationManager.start(
                new PathAnimation(
                    path,
                    [0 + j * 0.1, 1 + j * 0.1],
                    5,
                    TimeFunctions.linear,
                    (v) => {
                        shape.position = v;
                    },
                    -1,
                    "loop"
                )
            );
        }
    }

    constructor(context, byMethod = undefined, methodArguments = []) {
        this.ctx = context;
        this.engine = Matter.Engine.create();
        this.camera = new Camera(context);
        this.layers = [];
        this.workshop = new Workshop(this);
        this.workshop.focus = false;
        this.filename = undefined;
        this.demoMethods = Object.getOwnPropertyNames( World.prototype)
            .filter((key) => key[0] === "$")
            .map((key) => ({ label:key }));
        if (byMethod && this[byMethod]) {
            this[byMethod](...methodArguments);
            this.filename = byMethod;
        }
        World.notifyLayersChangedCallbacks.forEach((callback) => callback(this));
    }

    get worldLayers() {
        return this.layers.filter((layer) => layer.space === "world");
    }

    get foregroundLayers() {
        return this.layers.filter((layer) => layer.space === "foreground");
    }

    get backgroundLayers() {
        return this.layers.filter((layer) => layer.space === "background");
    }

    setActiveLayer(layer) {
        this.workshop.activeLayer = layer;
    }
    runPhysics(value, layerGroup) {
        this.layers
            .filter((layer) => layer.space === layerGroup)
            .forEach((layer) => {
                layer.runPhysics = value;
            });
    }
    clear() {
        this.engine = Matter.Engine.create();
        this.camera = new Camera(this.ctx);
        this.layers = [new Layer(this.ctx, this.camera, "world", 0)];
        this.workshop.activeLayer = this.worldLayers[0];
        this.workshop.focus = true;
        World.notifyLayersChangedCallbacks.forEach((callback) => callback(this));
    }
    focusWorkshop(focus) {
        this.workshop.focus = focus;
    }
    toggleWorkshop() {
        this.workshop.focus = !this.workshop.focus;
    }
    start() {
        window.requestAnimationFrame(this.mainLoop.bind(this));
    }
    addLayer(space, depth) {
        const layer = new Layer(this.ctx, this.camera, space, depth);
        this.layers.push(layer);
        //sort layers for rendering
        this.sortLayers();
        World.notifyLayersChangedCallbacks.forEach((callback) => callback(this));
        return layer;
    }
    sortLayers() {
        const depthOrdering = {
            foreground: -1,
            world: 0,
            background: 1,
        };
        this.layers.sort((layerA, layerB) => {
            if (layerA.space === layerB.space) {
                return layerA.depth - layerB.depth;
            } else {
                return depthOrdering[layerB.space] - depthOrdering[layerA.space];
            }
        });
    }
    mainLoop(timeStamp) {
        window.requestAnimationFrame(this.mainLoop.bind(this));
        if (this.initTime === undefined) {
            this.initTime = timeStamp;
            this.previousTime = 0;
        }
        this.elapsedTime = timeStamp - this.initTime;
        this.dt = (timeStamp - this.previousTime) / 1000;
        this.previousTime = timeStamp;
        //sets to identity transform and clears screen
        Camera.restoreIdentity(this.ctx);
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        if (this.dummyCursor) this.dummyCursor.position = this.camera.realCursor;
        AnimationManager.update(this.dt);
        //render layers
        this.layers.forEach((layer) => {
            layer.update(this.dt);
            layer.render();
        });
        //render workshop
        if (this.workshop.activeLayer && this.workshop.focus) {
            this.workshop.renderGrid();
            this.workshop.renderCursor();
            this.workshop.renderPreview();
        }
    }
}
