const jwt = require("jsonwebtoken");
const config = require("config");

class Generate_token{
    static verify_token(token){
        try {
            return jwt.verify(token, config.get("JWT_PRIVATE_KEY"));
        } catch (err) {
            return err
        }
    }
}

module.exports = Generate_token;