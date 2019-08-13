const mysql = require('mysql');
const fs = require("fs");
const connection = mysql.createPool({
    host: '35.242.186.22',
    // host: 'localhost',
    database: 'trogj',
    user: 'root',
    // password: '',
    password:'Fpt4lfIf2C138chy',
    ssl: {
        ca:fs.readFileSync('./sql_certs/server-ca.pem'),
        cert:fs.readFileSync('./sql_certs/client-cert.pem'),
        key:fs.readFileSync('./sql_certs/client-key.pem')
    },
});
module.exports = connection;