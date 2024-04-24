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

/**
 * @typedef {Object} WorldJSON
 * @property {LayerJSON[]} layers
 * @property {string} filename
 */

/**
 * @typedef {Object} WorldObject
 * @property {string} filename
 * @property {string} label
 */

export class World {
    static #database; /** {ClientDatabase} */
    static worldObjects; /** {WorldObject[]} */
    static notifyWorldObjectsChangedCallbacks = [];
    static notifyLayersChangedCallbacks = [];

    /**
     * Hooks up a ClientDatabase to a ServerDatabase
     * @param {string} databaseLabel A label matching a ServerDatabase
     * @returns {Promise<WorldObject[]>} A list of world objects
     */
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

    /**
     * 
     * @param {World} world 
     * @returns {WorldJSON}
     */
    static serialize(world) {
        return {
            layers: world.layers.map((layer) => Layer.serialize(layer)),
            filename: world.filename,
        };
    }
    /**
     * 
     * @param {WorldJSON} jsonObject 
     * @param {CanvasRenderingContext2D} context 
     * @returns {World}
     */
    static deserialize(context, jsonObject) {
        const world = new World(context);
        for (let jsonLayer of jsonObject.layers) {
            const layer = Layer.deserialize(context, world.camera, jsonLayer);
            world.layers.push(layer);
        }
        world.sortLayers();
        return world;
    }
    /**
     * 
     * @param {CanvasRenderingContext2D} context 
     * @param {string} filename 
     * @returns {Promise<World>}
     */
    static getWorld(context, filename) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!World.#database.confirmedExistence) {
                    throw new Error(`Unable to reach ServerDatabase '${World.#database.databaseLabel}'`);
                } else {
                    const response = await World.#database.getFile(filename);
                    const world = World.deserialize(context, response);
                    world.chooseWorkshopLayer();
                    world.workshop.focus = true;
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

    /**
     * 
     * @param {World} world 
     * @param {string} filename 
     * @returns {Promise<string>} Response from ServerDatabase
     */
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
    /**
     * 
     * @returns {Promise<WorldObject[]>} A list of world objects
     */
    static getWorldNames() {
        return new Promise(async (resolve, reject) => {
            try {
                let response = await World.#database.getFileNames();
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

    /**
     * Sets up a world with default settings (called form constructor)
     */
    $default() {
        this.workshop.activeLayer = this.addLayer("world", 0);
        this.addLayer("background", 0);
        this.addLayer("foreground", 0);
        this.workshop.focus = true;
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} context 
     * @param {string} byMethod A string starting with '$' that corresponds to a method in this class
     * @param {any[]} methodArguments Parameters that should be passed along to creation method
     */
    constructor(context, byMethod = undefined, methodArguments = []) {
        this.ctx = context;
        this.engine = Matter.Engine.create();
        this.camera = new Camera(context);
        console.log(this.camera);
        this.layers = [];
        this.workshop = new Workshop(this);
        this.workshop.focus = false;
        this.filename = undefined;
        this.demoMethods = Object.getOwnPropertyNames(World.prototype)
            .filter((key) => key[0] === "$")
            .map((key) => ({ label: key }));
        if (byMethod && this[byMethod]) {
            this[byMethod](...methodArguments);
            this.filename = byMethod;
        }
        World.notifyLayersChangedCallbacks.forEach((callback) => callback(this));
    }

    /**
     * Chooses an available layer that will be operated on by the workshop
     */
    chooseWorkshopLayer() {
        //choose the first world layer if it exists (lowest depth value)
        const worldLayers = this.worldLayers;
        const foregroundLayers = this.foregroundLayers;
        const backgroundLayers = this.backgroundLayers;
        if (worldLayers.length > 0) {
            this.workshop.activeLayer = worldLayers[0];
        } else if (foregroundLayers.length > 0) {
            this.workshop.activeLayer = foregroundLayers[0];
        } else {
            this.workshop.activeLayer = backgroundLayers[0];
        }
        console.log(this.workshop.activeLayer);
    }

    /**
     * @return {Layer[]} All layers where space==="world"
     */
    get worldLayers() {
        return this.layers.filter((layer) => layer.space === "world");
    }

    /**
     * @return {Layer[]} All layers where space==="foreground"
     */
    get foregroundLayers() {
        return this.layers.filter((layer) => layer.space === "foreground");
    }

    /**
     * @return {Layer[]} All layers where space==="background"
     */
    get backgroundLayers() {
        return this.layers.filter((layer) => layer.space === "background");
    }

    setActiveLayer(layer) {
        this.workshop.activeLayer = layer;
    }
    /**
     * Sets whether a group of layers should run physics
     * @param {boolean} value 
     * @param {RenderSpace} renderSpace 
     */
    runPhysics(value, renderSpace) {
        if (renderSpace) {
            this.layers
                .filter((layer) => layer.space === renderSpace)
                .forEach((layer) => {
                    layer.runPhysics = value;
                });
        } else {
            this.layers.forEach((layer) => {
                layer.runPhysics = value;
            });
        }
    }
    /**
     * Clears the world and sets up a new one ($default)
     */
    clear() {
        this.engine = Matter.Engine.create();
        this.layers = [];
        this.$default();
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
