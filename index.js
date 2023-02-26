const express = require("express");
const app = express();
const config = require("config");
const axios = require("./utils/axios")

app.use(express.json());


app.all("/:service/:path?/:path?", async (req, res) => {

    if(!config.has(req.params.service)) return res.status(400).send("service name not a valid service.");

    const service = config.get(req.params.service);
    const url = service.url + req.path;
    try {
        const response = await axios(req.method, req.headers, req.body, url)
        res.send(response.data);
    } catch (err) {
        if(!err.response) return res.status(500).send("Internal Server Error.");
        res.status(err.response.status).send(err.message);
    }
});

const port = process.env.PORT | 9000;
app.listen(port, () => console.info(`api-gateway running on port ${port}...`));