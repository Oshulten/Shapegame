var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _ClientDatabase_confirmedExistence;
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
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const response = yield sendJSONRequest({
                target: "ServerDatabase",
                method: "openDatabases",
            });
            resolve(response);
        }));
    }
    /**
     * A mirror of a ServerDatabase
     * @param {string} databaseLabel A label matching a ServerDatabase in clientScope on server
     */
    constructor(databaseLabel) {
        _ClientDatabase_confirmedExistence.set(this, false);
        this.databaseLabel = databaseLabel;
    }
    get confirmedExistence() {
        return __classPrivateFieldGet(this, _ClientDatabase_confirmedExistence, "f");
    }
    /**
     * Check if this ClientDatabase corresponds to a ServerDatabase
     */
    checkExistence() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const response = yield sendJSONRequest({
                target: this.databaseLabel,
            });
            if (!response.targetExists) {
                __classPrivateFieldSet(this, _ClientDatabase_confirmedExistence, false, "f");
                resolve(false);
            }
            else {
                __classPrivateFieldSet(this, _ClientDatabase_confirmedExistence, true, "f");
                resolve(true);
            }
        }));
    }
    /**
     * Gets all available filenames on ServerDatabase
     * @returns Available files on ServerDatabase
     */
    getFileNames() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                const filenames = yield sendJSONRequest({
                    target: this.databaseLabel,
                    method: "getFileNames",
                });
                resolve(filenames);
            }
            catch (error) {
                reject(error);
            }
        }));
    }
    getFile(filename) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield sendJSONRequest({
                    target: this.databaseLabel,
                    method: "getFile",
                    arguments: [filename],
                });
                if (response.error) {
                    reject(`File '${filename} couldn't be retrieved from ServerDatabase '${this.databaseLabel}'`);
                }
                resolve(response);
            }
            catch (error) {
                reject(error);
            }
        }));
    }
    /**
     * Adds a file to the database, or overwrites it if it already exists
     * @param {object | string} data
     * @param {string} filename
     * @returns {string | Error }
     */
    addFile(data, filename) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield sendJSONRequest({
                    target: this.databaseLabel,
                    method: "addFile",
                    arguments: [data, filename],
                });
                resolve(response);
            }
            catch (error) {
                reject(error);
            }
        }));
    }
    /**
     * Removes a file from ServerDatabase, if it exists
     * @param filename
     * @returns response from ServerDatabase
     */
    removeFile(filename) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield sendJSONRequest({
                    target: this.databaseLabel,
                    method: "removeFile",
                    arguments: [filename],
                });
                resolve(response);
            }
            catch (error) {
                reject(error);
            }
        }));
    }
}
_ClientDatabase_confirmedExistence = new WeakMap();
