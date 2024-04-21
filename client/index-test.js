import { ClientDatabase } from "./modules/client-database.js";
import { sendJSONRequest } from "./modules/client-json.js";

const objectToSend = {
    targetType: "ServerDatabase",
    target: "database",
    method: "getFile",
    arguments: ["city-world3.json"],
};

(async () => {
    try {
        let response1 = await sendJSONRequest({
            target: "test",
            method: "getText"
        })
        console.log(response1);
        const response2 = await sendJSONRequest({
            target: "test",
            method: "getObject"
        })
        console.log(response2);
        const response3 = await sendJSONRequest({
            target: "test",
            method: "receiveObject",
            arguments: ["I'm an argument!"]
        })
        console.log(response3);
    } catch (error) {
        console.log(error);
    }
})();

// database.checkExistence()
// .then((message) => {
//     console.log(message);
//     database.getFileNames()
//     .then(filenames => {
//         console.log(filenames);
//     })
// })
// .catch(err => {
//     console.error(err);
// });
