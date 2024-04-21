import { sendJSONRequest } from "./client-json.js";

// const objectToSend = {
//     target: "database",
//     method: "getFile",
//     arguments: ["city-world3.json"]
//  };

/**
 * @classdesc Class that works in tandem with ServerDatabase on the server-side. Make sure that urlPath in client instance matches that in the server-instance.
 */
export class ClientDatabase {
    /**
     * Check which instances of ServerDatabase are open for client use.
     * These databases are put into the global object 'clientScope' on server app
     * @returns {string[]} Database labels that are open for client use
     */
    static databases() {
        return new Promise(async (resolve, reject) => {
            const response = await sendJSONRequest({
                target: "ServerDatabase",
                method: "openDatabases",
            });
            resolve(response);
        });
    }

    #databaseLabel;
    #confirmedExistence = false;
    /**
     * A mirror of a ServerDatabase
     * @param {string} databaseLabel A label matching a ServerDatabase in clientScope on server
     */
    constructor(databaseLabel) {
        this.#databaseLabel = databaseLabel;
    }

    get confirmedExistence() {
        return this.#confirmedExistence;
    }

    /**
     * Check if this ClientDatabase corresponds to a ServerDatabase
     */
    checkExistence() {
        return new Promise(async (resolve, reject) => {
            const response = await sendJSONRequest({
                target: this.#databaseLabel,
            });
            if (!response.targetExists) {
                this.#confirmedExistence = false;
                resolve(false);
            } else {
                this.#confirmedExistence = true;
                resolve(true);
            }
        });
    }

    /**
     * Gets all available filenames on ServerDatabase
     * @returns {string[]} Available files on ServerDatabase
     */
    getFileNames() {
        return new Promise(async (resolve, reject) => {
            try {
                const filenames = await sendJSONRequest({
                    target: this.#databaseLabel,
                    method: "getFileNames",
                });
                resolve(filenames);
            } catch (error) {
                reject(err);
            }
        });
    }

    getFile(filename) {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await sendJSONRequest({
                    target: this.#databaseLabel,
                    method: "getFile",
                    arguments: [filename],
                });
                if (response.error) {
                    reject(`File '${filename} couldn't be retrieved from ServerDatabase '${this.#databaseLabel}'`);
                }
                resolve(response);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Adds a file to the database, or overwrites it if it already exists
     * @param {object | string} data
     * @param {string} filename
     * @returns {string | Error }
     */
    addFile(data, filename) {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await sendJSONRequest({
                    target: this.#databaseLabel,
                    method: "addFile",
                    arguments: [data, filename],
                });
                resolve(response);
            } catch (error) {
                reject(err);
            }
        });
    }

    /**
     * Removes a file from ServerDatabase, if it exists
     * @param {string} filename
     * @returns {string | Error }
     */
    removeFile(filename) {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await sendJSONRequest({
                    target: this.#databaseLabel,
                    method: "removeFile",
                    arguments: [filename],
                });
                resolve(response);
            } catch (error) {
                reject(err);
            }
        });
    }
}
