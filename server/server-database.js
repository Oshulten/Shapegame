const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { extensionFromMime, mimeFromExtension } = require("./mimes");
const { URL } = require("node:url");

class ServerDatabase {
    static #masterPath = "/server-databases";
    static #databases = [];
    static #clientScope = undefined;
    static set clientScope(scope) {
        ServerDatabase.#clientScope = scope;
    }
    static openDatabases() {
        console.log("Getting database names");
        return new Promise((resolve, reject) => {
            console.log(this.#clientScope);
            const openDatabases = [];
            for (const key of Object.keys(this.#clientScope)) {
                if (this.#clientScope[key] instanceof ServerDatabase) {
                    openDatabases.push(this.#clientScope[key].label);
                }
            }
            resolve(openDatabases);
        });
    }

    #directoryPath = "";
    #label = "";
    #filenames = [];

    constructor(directoryPath, label) {
        this.#directoryPath = directoryPath;
        this.#label = label;
        this.#filenames = this.getFileNames();
        ServerDatabase.#databases.push(this);
    }

    get label() {
        return this.#label;
    }

    set label(lbl) {
        this.#label = lbl;
    }

    /** DIRECT METHODS */
    getFileNames() {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(this.#directoryPath);
                const filenames = await fs.readdir(this.#directoryPath);
                console.log(filenames);
                resolve(filenames);
            } catch (error) {
                reject(error);
            }
        });
    }

    getFile(filename) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(`${this.#directoryPath}/${filename}`);
                const data = await fs.readFile(`${this.#directoryPath}/${filename}`);
                resolve(data);
            } catch (error) {
                reject(error);
            }
        });
    }

    addFile(data, filename) {
        return new Promise(async (resolve, reject) => {
            try {
                if (typeof data === "object") data = JSON.stringify(data);
                fs.writeFile(`${this.#directoryPath}/${filename}`, data);
                resolve({ success: `File was added to database` });
            } catch (error) {
                reject(error);
            }
        });
    }

    removeFile(filename) {
        return new Promise(async (resolve, reject) => {
            try {
                await fs.unlink(`${this.#directoryPath}/${filename}`);
                resolve({ success: `File was removed from database` });
            } catch (err) {
                reject(err);
            }
        });
    }

    removeAllFiles() {
        return new Promise(async (resolve, reject) => {
            try {
                for await (const fn of await this.getFileNames()) {
                    fs.unlink(`${this.#directoryPath}/${fn}`);
                }
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = ServerDatabase;
