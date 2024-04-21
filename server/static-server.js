const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { extensionFromMime, mimeFromExtension } = require("./mimes");

class StaticServer {
    #staticPath = "";
    #entryHTMLPath = "index.html";
    #ignoreExtensions = ["map"];

    constructor(staticPath, entryHTMLPath) {
        this.#staticPath = staticPath;
        this.#entryHTMLPath = entryHTMLPath;
    }

    checkPath(url) {
        return (path.extname(url.href) && url.searchParams.size === 0) || url.pathname === "/";
    }

    getResource(req, res) {
        return new Promise(async (resolve, reject) => {
            //get html entry point
            if (req.url === "/") {
                const resourcePath = path.resolve(this.#staticPath, this.#entryHTMLPath);
                // console.log(resourcePath);
                fs.readFile(resourcePath)
                    .then((data) => {
                        res.writeHead(200, { "Content-Type": "text/html" });
                        res.end(data);
                    })
                    .catch((err) => {
                        console.error(err);
                    });
                resolve();
            }
            //else try to fetch a static resource
            const extension = path.extname(req.url).slice(1);
            const resourcePath = "client" + req.url;
            if (extension) {
                const contentType = mimeFromExtension(extension);
                if (this.#ignoreExtensions.includes(extension)) {
                    resolve();
                }
                // console.log("trying to get static resource", resourcePath, "from url", req.url);
                // console.log(`resource type: ${extension}`);
                if (contentType) {
                    try {
                        const data = await fs.readFile(resourcePath);
                        res.writeHead(200, { "Content-Type": contentType });
                        res.end(data);
                        resolve();
                    } catch (error) {
                        res.writeHead(404);
                        res.end();
                        reject(error);
                    }
                } else {
                    // console.log(`${extension} could not be converted to a MIME type.`);
                    res.writeHead(404);
                    res.end();
                    reject("Extension could not be converted to a MIME type.");
                }
                resolve();
            } else {
                reject();
            }
        });
    }
}

module.exports = StaticServer;
