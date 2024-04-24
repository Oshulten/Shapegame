interface JSONCall {
    target?: string;
    method?: string;
    arguments?: any[];
}

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

export function sendJSONRequest(call: JSONCall): Promise<any> {
    return new Promise(async (resolve, reject) => {
        try {
            const url = new URL("/", document.baseURI);
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(call),
            });
            const object = await response.json();
            resolve(object);
        } catch (error) {
            console.error(error);
        }
    });
}