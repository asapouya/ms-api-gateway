const express = require("express");
const app = express();
const config = require("config");
const axios = require("axios");

const auth = require("./middlewares/auth");

if(!config.get("JWT_PRIVATE_KEY")) {
    console.log("FATAL ERROR: JWT_PRIVATE_KEY not defined!");
    process.exit(1);
}

app.use(express.json());

app.all("/:service/:path?/:path?", auth ,async (req, res) => {

    const service = config.get(req.params.service);
    const url = service.url + req.path;    
    req.headers["x-user"] = JSON.stringify(req.user);
    try {
        const response = await axios({
            method: req.method,
            url: url,
            headers: req.headers,
            data: req.body
        });
        res.status(response.status).header(response.headers).send(response.data);
    } catch (err) {
        if(!err.response) return res.status(500).send("Internal Server Error.");
        console.log(err)
        res.status(err.response.status).header(err.response.headers).send(err.response.data);
    }
});

const port = process.env.PORT || 9000;
app.listen(port, () => console.info(`api-gateway running on port ${port}...`));