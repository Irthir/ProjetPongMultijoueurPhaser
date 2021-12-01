// loading all dependencies
const jsdom = require('jsdom');
const express = require('express');
const { cp } = require('fs');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
//setting the port
const port = 8080;
//initializing framework
var players = {};
// instancing
const app = express(); //default constructor
const server = http.Server(app); //to launch Express
const io = socketIO(server); //passing 'server' so that it runs on IO server
const DatauriParser = require('datauri/parser');
const parser = new DatauriParser();
const { JSDOM } = jsdom;

app.set('port', port);
//used 'public' folder to use external CSS and JS
app.use( express.static(__dirname + "/public"));
app.get('/', function (req, res){
    res.sendFile(__dirname+"./index.html");
});


//handling requests and responses by setting the Express framework
app.get("/", function (req, res) 
{
    res.sendFile(path.join(__dirname, "./index.html"));
});

function setupAuthoritativePhaser()
{
    JSDOM.fromFile(path.join(__dirname, './index.html'),
    {
        // To run the scripts in the html file
        runScripts: "dangerously",
        // Also load supported external resources
        resources: "usable",
        // So requestAnimatinFrame events fire
        pretendToBeVisual: true
    }).then((dom) =>
    {
        dom.window.URL.createObjectURL = (blob) =>
        {
            if (blob)
            {
                return parser.format(blob.type, blob[Object.getOwnPropertySymbols(blob)[0]]._buffer).content;
            }
        };
        dom.window.URL.revokeObjectURL = (objectURL) => {};
        dom.window.gameLoaded = () => {
            server.listen(process.env.PORT || port, function () {
            console.log("Listening on "+server.address().port);
            });
        };
        dom.window.io = io;
    }).catch((error) =>
    {
            console.log(error.message);
    });
}
setupAuthoritativePhaser();