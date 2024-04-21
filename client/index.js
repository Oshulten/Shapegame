import { Shape } from "./modules/shape.js";
import { Camera } from "./modules/camera.js";
import { Layer } from "./modules/layer.js";
import { math } from "./modules/math.js";
import { Color } from "./modules/color.js";
import { World } from "./modules/world.js";
import { DynamicAnimation } from "./modules/animation.js";
import { ClientDatabase } from "./modules/client-database.js";

const defaultSettings = {
    attemptToLoadWorld: "city-world2.json",
};

let world = undefined;
let worldObjectsProxy = undefined;
let worldNames = [];
const databaseLabel = "worldDatabase";

(async () => {
    try {
        //Get canvas element. If none is found, do not continue script
        const canvas = document.querySelector("canvas#world-canvas");
        if (!canvas) throw new ReferenceError("No canvas element is present in the document.");
        canvas.classList.add("fullscreen");
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("A rendering context could not be extracted from the canvas element");

        //Initializes static World
        await World.initializeDatabase(databaseLabel);

        // console.log(World.worldObjects);
        // Attempt to load a default world from server
        // If failed, create an empty world instead
        // world = await World.getWorld(context, "city-world33.json");
        world = new World(context, "$default");
        // world = new World(context, "$testLayerSorting");
        world.start();

        //Attempt to hook up to UI elements
        //Add functionality if they are found
        const toolbar = document.querySelector("tool-bar");
        const saveWorldBtn = toolbar.querySelector("#toolbar-save-world");
        const openWorldBtn = toolbar.querySelector("#toolbar-open-world");
        const openDemosBtn = toolbar.querySelector("#toolbar-open-demos");
        const layersBtn = toolbar.querySelector("#toolbar-layers");
        const prompt = document.querySelector("command-prompt");
        const layerWindow = document.querySelector("#layer-window");
        const openWorldWindow = document.querySelector("#open-world-window");
        const openDemosWindow = document.querySelector("#open-demos-window");
        const layerTable = document.querySelector("#layer-table");
        const worldTable = document.querySelector("#open-world-table");
        const demosTable = document.querySelector("#demos-table");
        const runPhysicsToggle = document.querySelector("#run-toggle");
        const setStaticToggle = document.querySelector("#set-static");

        //UI functionality
        if (toolbar) {
            if (toolbar) toolbar.connectWorld(world);

            //Save world
            if (saveWorldBtn) {
                saveWorldBtn.addEventListener("click", (event) => {
                    if (world && toolbar.worldName.value.length !== 0) {
                        World.saveWorld(world, toolbar.worldName.value + ".json");
                    } else {
                        window.alert("A world name is needed.");
                    }
                });
            }
            //Open world
            if (openWorldBtn) {
                openWorldBtn.addEventListener("click", (event) => {
                    if (openWorldWindow.toggle()) {
                        openWorldBtn.classList.add("active");
                    } else {
                        openWorldBtn.classList.remove("active");
                    }
                    //Make sure layers button match window visibility state
                    openWorldWindow.addEventListener("hiddenChanged", () => {
                        if (!openWorldWindow.hidden) openWorldBtn.classList.add("active");
                        else openWorldBtn.classList.remove("active");
                    });
                });
            }
            //Layers
            if (layersBtn) {
                layersBtn.addEventListener("click", (event) => {
                    if (layerWindow.toggle()) layersBtn.classList.add("active");
                    else layersBtn.classList.remove("active");
                });
                //Make sure layers button match window visibility state
                layerWindow.addEventListener("hiddenChanged", () => {
                    if (!layerWindow.hidden) layersBtn.classList.add("active");
                    else layersBtn.classList.remove("active");
                });
            }
            //Demos
            if (openDemosBtn) {
                openDemosBtn.addEventListener("click", (event) => {
                    if (openDemosWindow.toggle()) {
                        openDemosBtn.classList.add("active");
                    } else {
                        openDemosBtn.classList.remove("active");
                    }
                    //Make sure layers button match window visibility state
                    openDemosWindow.addEventListener("hiddenChanged", () => {
                        if (!openDemosWindow.hidden) openDemosBtn.classList.add("active");
                        else openDemosBtn.classList.remove("active");
                    });
                });
            }
        } else console.error("No toolbar element is present in the document.");

        //Prompt
        if (prompt) {
            prompt.addParseCallback((text) => {
                if (!world.workshop.tryCommand(text)) {
                    const words = text.split(" ");
                    switch (words[0]) {
                        case "generateworld":
                            world = World.GeneratedWorldA(canvas);
                            world.start();
                            break;
                        case "layers":
                            layerWindow.toggle();
                            break;
                        case "world":
                            console.log(world);
                            break;
                        case "clear":
                            world.clear();
                            break;
                        case "snap":
                            world.workshop.grid.snap = !world.workshop.grid.snap;
                            break;
                        case "serverworlds":
                            synchronizeUI(world);
                            console.log(worldNames);
                            break;
                        case "loadworld":
                            if (words[1]) {
                                try {
                                    const newWorld = new World(context, words[1]);
                                    world = newWorld;
                                    synchronizeUI(world);
                                    world.start();
                                } catch (error) {
                                    console.error(error);
                                }
                            } else {
                                console.log("A world name is needed.");
                            }

                        default:
                            return;
                    }
                }
            });
            //Hi-jack backquote key to focus on the prompt whenever
            window.addEventListener("keydown", (event) => {
                if (event.code === "Backquote") {
                    event.preventDefault();
                    prompt.focus();
                }
            });
            prompt.focus();
        }
        if (runPhysicsToggle) {
            runPhysicsToggle.addEventListener("change", (event) => {
                world.runPhysics(event.detail.on);
            });
            world.runPhysics(runPhysicsToggle.atts.on);
        }
        if (setStaticToggle) {
            setStaticToggle.addEventListener("change", (event) => {
                world.workshop.createStaticShapes = !event.detail.on;
            });
            world.workshop.createStaticShapes = !setStaticToggle.atts.on;
        }

        if (worldTable) {
            worldTable.connectArray(World.worldObjects, {
                keys: ["label"],
                prettyKeys: ["World Name"],
                activeObject: undefined,
                callbacks: {
                    activeObject: async (object) => {
                        world = await World.getWorld(context, object.filename);
                        if (toolbar) {
                            toolbar.connectWorld(world);
                        }
                        world.start();
                    },
                },
            });
            World.notifyWorldObjectsChangedCallbacks.push((worldObjects) => {
                worldTable.construct();
            });
            World.worldObjects.push({ filename: "nother world.json", label: "nother world" });
        }

        if (layerTable) {
            function constructLayerTable(world) {
                layerTable.connectArray(world.layers, {
                    keys: ["runPhysics", "space", "depth"],
                    prettyKeys: ["Physics", "Type", "Depth"],
                    activeObject: world.layers[0],
                    callbacks: {
                        activeObject: (object) => {
                            world.setActiveLayer(object);
                        },
                    },
                });
            }
            World.notifyLayersChangedCallbacks.push((world) => {
                constructLayerTable(world);
            });
            constructLayerTable(world);
        }

        if (demosTable) {
            demosTable.connectArray(world.demoMethods, {
                keys: ["label"],
                prettyKeys: ["Demo Name"],
                activeObject: undefined,
                callbacks: {
                    activeObject: async (object) => {
                        world = new World(context, object.label);
                        if (toolbar) {
                            toolbar.connectWorld(world);
                        }
                        world.start();
                    },
                },
            });
        }

        async function refreshWorldNames() {
            if (worldTable) {
                await World.getWorldNames();
                worldTable.refresh();
            }
        }

        async function refreshLayers() {
            if (layerTable) {
                layerTable.refresh();
            }
        }

        console.log(world.layers);
    } catch (error) {
        console.log(error);
    }
})();
