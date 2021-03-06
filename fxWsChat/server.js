﻿var WebSocketServer = require('ws').Server
  , http = require('http')
  , express = require('express')
  , app = express();

var chatters = [];
app.use(express.static(__dirname + '/public'));

var server = http.createServer(app);
server.listen(3000);

var wss = new WebSocketServer({ server: server });
wss.on('connection', function (ws) {
    
    console.log('started client interval');
    
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);

        var jsonObj = parseJson(message);
        if (jsonObj === null || jsonObj === undefined) {
            wss.broadcast(message, ws.name);
        } else {
            if (jsonObj.code === "join") {
                chatters.push(jsonObj.name);
                ws.name = jsonObj.name;
                ws.send(JSON.stringify({
                    code: "join",
                    chatters: chatters
                }), function () { /* ignore errors */ });
                wss.newUserBroadcast(jsonObj.name);
            } else {
                wss.broadcast(message, ws.name);
            }

        }
    });

    ws.on('close', function () {
        console.log('stopping client interval');
        removeElement(chatters, ws.name);
        wss.removeUserBroadcast(ws.name);
    });
});

wss.broadcast = function broadcast(message, name) {
    wss.clients.forEach(function each(client) {
        client.send(JSON.stringify({
            code: "chat",
            user: name,
            text: message
        }), function () { /* ignore errors */ });
    });
};

wss.newUserBroadcast = function newUserBroadcast(name) {
    wss.clients.forEach(function each(client) {
        client.send(JSON.stringify({
            code: "newUser",
            user: name
        }), function () { /* ignore errors */ });
    });
};

wss.removeUserBroadcast = function removeUserBroadcast(name) {
    wss.clients.forEach(function each(client) {
        client.send(JSON.stringify({
            code: "removeUser",
            user: name
        }), function () { /* ignore errors */ });
    });
};

var parseJson = function (data) {
    
    try {
        return JSON.parse(data);
    } catch (e) {
        return null;
    }
}

var removeElement = function (array, element) {
    var index = array.indexOf(element);
    if (index > -1) {
        array.splice(index, 1);
    }
}

