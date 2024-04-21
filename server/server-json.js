function requestJSON(req, res, callback) {
    return new Promise((resolve, reject) => {
        if (!callback) {
            callback = (req, res, object) => {
                console.log(object);
            }
        }
        try {
            let buffer = "";
            req.on("data", (data) => {
                buffer += data;
            });
            req.on("end", async () => {
                const object = await JSON.parse(buffer);
                await callback(req, res, object);
                resolve(object);
            });
        } catch (error) {
            reject(error);
        }
    });
}

function responseJSON(req, res, object) {
    return new Promise(async(resolve, reject) => {
        res.writeHead(200, {"Content-Type": "application/json"});
        if (typeof object !== "object") object = { response: object };
        object = JSON.stringify(object);
        console.log(object);
        res.end(object);
        resolve();
    })
}

module.exports = { requestJSON, responseJSON };