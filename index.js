const express = require("express");
const app = express();
const axios = require("axios");
const config = require("config");

app.use(express.json());

app.all("/:service/:path", async (req, res) => {

    if(!config.has(req.params.service)) return res.status(400).send("service name not a valid service.");

    const service = config.get(req.params.service);
    const path = req.params.path;

    try {
        const response = await axios({
            method: req.method,
            url: service.url + path,
            headers: req.headers,
            data: req.body
        });
        res.send(response.data);
    } catch (err) {
        res.status(err.response.status).send(err.message);
    }
});

const port = process.env.PORT | 9000;
app.listen(port, () => console.info(`api-gateway running on port ${port}...`));