const jwt = require("jsonwebtoken");
const config = require("config");

class Generate_token{
    static verify_token(token){
        return jwt.verify(token, config.get("JWT_PRIVATE_KEY"));
    }
}

module.exports = Generate_token;