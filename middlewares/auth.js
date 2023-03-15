const { verify_token } = require("../utils/auth")
const config = require("config");

module.exports = function(req, res, next){

    if(!config.has(req.params.service)) return res.status(400).send("service name not a valid service.");
    const service = config.get(req.params.service);
    
    let urlConfig;
    let urlMethod;
    let role;

    if(service.service == "orders"){
        role = ["auth"];
    }else {
        urlConfig = service.routes[`${req.path}`];
        if(!urlConfig) return res.status(404).send("No routes found.");
        urlMethod = urlConfig[`${req.method}`];
        if(!urlMethod) return res.status(404).send("No routes found.");
        role = urlMethod.permissions;
        if(role == false) return next();
    }
    const token = req.header("x-auth-token");
    if(!token) return res.status(401).send("Unauthorized.");
    try {
        const decodded = verify_token(token);
        req.user = decodded;
        if(role.includes("admin")) {
            if(decodded.admin === true) return next();
            res.status(401).send("Unauthorized, Not an admin.");
        }
        next();
    } catch (err) {
        res.status(401).send("Unauthorized, Invalid token.");
    }
}
            // let urlPath = req.path;
            // let splitted = urlPath.split("/");
            // console.log(splitted);
        
            // if(splitted.length === ordersRoute){}
        
            // const ordersRoute = {
            //     2: "/orders",
            //     3: "/orders/{param}",
            //     4: "/orders/{param}/{param}",
            // }