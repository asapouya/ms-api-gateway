const { verify_token } = require("../utils/auth")
const config = require("config");

module.exports = function(req, res, next){

    console.log(req.params);

    if(!config.has(req.params.service)) return res.status(400).send("service name not a valid service.");
    const service = config.get(req.params.service);
    const url = service.url + req.path;
    const urlConfig = service.routes[`${url}`];
    if(!urlConfig) return res.status(404).send("No routes found.");
    const urlMethod = urlConfig[`${req.method}`];
    if(!urlMethod) return res.status(404).send("No routes found.");
    const role = urlMethod.permissions;
    if(role == false) return next();
    const token = req.header("X-auth-token");
    if(!token) return res.status(401).send("Unauthorized.");
    const decodded = verify_token(token);
    req.user = decodded;
    if(role.includes("admin")) {
        if(decodded.admin === true) return next();
        res.status(401).send("Unauthorized.");
    }
}