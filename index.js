const express = require("express");
const app = express();
const config = require("config");
const axios = require("axios");

const {verify_token} = require("./utils/auth")


if(!config.get("JWT_PRIVATE_KEY")) {
    console.log("FATAL ERROR: JWT_PRIVATE_KEY not defined!");
    process.exit(1);
}

app.use(express.json());

const services = config.get("services");

services.forEach(service => {

    const router = express.Router();

    service.routes.forEach(route => {

        router[route.method.toLowerCase()](route.path, async (req, res) => {

            if(route.permissions.includes("auth")){
                const token = req.header("x-auth-token");
                if(!token) return res.status(401).send("Unauthorized.");
                const decodded = verify_token(token);
                req.user = decodded;
                if(route.permissions.includes("admin")) {
                    if(decodded.admin === true) return
                    return res.status(401).send("Unauthorized, Not an admin.");
                }
            } 

            req.headers["x-user"] = JSON.stringify(req.user);
            try {
                const response = await axios({
                    method: req.method,
                    url: service.url + route.path,
                    headers: req.headers,
                    data: req.body
                });
                res.status(response.status).header(response.headers).send(response.data);
            } catch (err) {
                if(!err.response) return res.status(500).send("Internal Server Error.");
                console.log(err)
                res.status(err.response.status).header(err.response.headers).send(err.response.data);
            }
        })
    });

    app.use(router);
});

const port = process.env.PORT || 9000;
app.listen(port, () => console.info(`api-gateway running on port ${port}...`));