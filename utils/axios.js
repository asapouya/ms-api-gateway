const axios = require("axios");


module.exports = async function(method, headers, data, url) {
    return await axios({
        method: method,
        url: url,
        headers: headers,
        data: data
    });
}