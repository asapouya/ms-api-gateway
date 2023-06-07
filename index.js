const express = require("express");
const app = express();
const config = require("config");
const { readFile } = require("fs/promises");
const { unlink } = require("fs");
const { Blob } = require("buffer");
const axios = require("axios");
const fileUpload = require("express-fileupload");
const {verify_token} = require("./utils/auth");

if(!config.get("JWT_PRIVATE_KEY")) {
    console.log("FATAL ERROR: JWT_PRIVATE_KEY not defined!");
    process.exit(1);
}

process.on("uncaughtException", err => {
    if(err) return console.log(err);
})
process.on("unhandledRejection", err => {
    if(err) return console.log(err);
})

app.use(fileUpload({createParentPath: true}));
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
                    if(decodded.admin === true) ;
                    else return res.status(401).send("Unauthorized, Not an admin.");
                }
            }
            let filePath = null;
            let response;
            try {
                req.headers["x-user"] = JSON.stringify(req.user);
                if(route.formData) {
                    console.log(req.headers);
                    let bodyFormData = new FormData();
                    for(const key in req.body) {
                        bodyFormData.append(key, req.body[key]);
                    }

                if(!req.files) return res.status(400).send("File is required.");
                const file = req.files.file;

                console.log(file.mimetype);
                if(file.mimetype != route.formData.mimetype) return res.status(400).send(`"file" must be of type "${route.formData.mimetype}"`);

                filePath = __dirname + "/pdfs/" + file.name;
                await file.mv(filePath);
                const pdfFile = await readFile(filePath); 
                const pdfBlob = new Blob([pdfFile], {type: "application/pdf"});
                bodyFormData.append("file", pdfBlob, file.name);
                response = await axios({
                    method: req.method,
                    url: service.url + req.url,
                    data: bodyFormData,
                    headers: req.headers
                });
                res.status(response.status).header(response.headers).send(response.data);

            }else{
                console.log(service.url + req.url);

                response = await axios({
                    method: req.method,
                    url: service.url + req.url,
                    headers: req.headers,
                    data: req.body
                });
                res.status(response.status).header(response.headers).send(response.data);
            }
            } catch (err) {
                console.log(err)
                if(!err.response) return res.status(500).send("Internal Server Error.");
                res.status(err.response.status).header(err.response.headers).send(err.response.data);
            }finally {
                if(route.formData){
                    if(filePath) {
                        unlink(filePath, err => {
                            if(err) return console.log(err);
                            console.log(`${filePath} is deleted.`);
                        });
                    }
                }
            }
        })
    });
    app.use(router);
});

const port = process.env.PORT || 9000;
app.listen(port, () => console.info(`api-gateway running on port ${port}...`));