var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Sends a request to the server on document.baseURI with POST method.
 * The call object follows this structure:
 *
 * @param {JSONCall}  call = {
 *                           target {string}: "identifier",
 *                           method {string]}: "method to call",
 *                           arguments {any[]}: [arg1, arg2, ...]
 *                          }
 *                       target object must exist inside clientScope<instance[]>
 *                       if a target is specified, but not a method, then the response will contain an existence check
 *
 * @returns {object} the return value of the called method
 */
export function sendJSONRequest(call) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            const url = new URL("/", document.baseURI);
            const response = yield fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(call),
            });
            const object = yield response.json();
            resolve(object);
        }
        catch (error) {
            console.error(error);
        }
    }));
}
