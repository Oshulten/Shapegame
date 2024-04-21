const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const StaticServer = require("./static-server");
const ServerDatabase = require("./server-database");
const { requestJSON, responseJSON } = require("./server-json");

const port = 80;
const staticPath = "client";
const entryHTMLPath = "index.html";
const databaseDirectoryPath = "./server/data/worlds";

const server = http.createServer();
const worldDatabase = new ServerDatabase(databaseDirectoryPath, "worldDatabase");
const staticServer = new StaticServer(staticPath, entryHTMLPath);

const clientScope = {
    ServerDatabase,
    worldDatabase,
};
ServerDatabase.clientScope = clientScope;

//exits cleanly to avoid clogging ports
process.on("exit", (code) => {
    console.log(`exiting the code implicitly ${code}. Closing all connections.`);
    server.closeAllConnections();
    server.close();
});

//server error handling
server.on("error", (error) => {
    console.error("Server error: ", error);
    process.exit(1);
});

//server general request routing
server.on("request", async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    console.log(url.href);
    try {
        switch (req.method) {
            case "GET":
                if (staticServer.checkPath(url)) await staticServer.getResource(req, res);
                break;
            case "POST":
                if (req.headers["content-type"] === "application/json") {
                    requestJSON(req, res, routerJSON);
                }
                break;
            default:
                console.error("Unrecognized HTTP verb.");
                break;
        }
    } catch (error) {
        console.log(error);
    }
});

//json routing
async function routerJSON(req, res, object) {
    console.log(clientScope);
    console.log(
        `routerJSON:\n\t${Object.keys(object)
            .map((key) => [`${key}: ${object[key]}`])
            .join("\n\t")}`
    );
    if (object) {
        if (clientScope[object.target]) {
            if (object.method) {
                if (clientScope[object.target][object.method]) {
                    try {
                        if (!object.arguments) object.arguments = [];
                        let responseObject = await clientScope[object.target][object.method](...object.arguments);
                        if (responseObject instanceof Buffer) responseObject = await JSON.parse(responseObject);
                        responseJSON(req, res, responseObject);
                    } catch (error) {
                        responseJSON(req, res, {error});
                    }
                } else {
                    responseJSON(req, res, { 
                        targetExists: true,
                        methodExists: false 
                    });
                }
            } else {
                responseJSON(req, res, { 
                    targetExists: true,
                });
            }
        } else {
            responseJSON(req, res, { targetExists: false });
        }
        /*
        if (clientScope[object.target]) {
            if (!object.method) {
                responseJSON(req, res, { exists: true });
                console.log(`${object.target} exists`);
                return;
            }
        }
        if (!clientScope[object.target]) {
            if (!object.method) {
                responseJSON(req, res, { exists: false });
                return;
            } else {
                responseJSON(req, res, { error: `target '${object.target}' doesn't exist in client scope` });
                return;
            }
        } else if (!clientScope[object.target][object.method]) {
            responseJSON(req, res, { error: `method '${object.method}' doesn't exist on target: ${object.target}` });
            return;
        } else {
            try {
                if (!object.arguments) object.arguments = [];
                let ret = await clientScope[object.target][object.method](...object.arguments);
                if (ret instanceof Buffer) ret = await JSON.parse(ret);
                responseJSON(req, res, ret);
                return;
            } catch (error) {
                responseJSON(req, res, error);
                return;
            }
        }*/
    }
}

//start server
server.listen(port, (err) => {
    if (err) {
        console.error(err);
    } else {
        console.log(`Server is running on port ${port}`);
    }
});
