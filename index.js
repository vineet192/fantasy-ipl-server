const socketIO = require('socket.io');
const express = require('express');
const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

var fs = require('fs');

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (client) => {
  console.log('New client connected');
  var matchInterval;
  var match;
  var playerJson = JSON.parse(fs.readFileSync('./players.json'));
  var match_idx = 0;

  //Select a random match
  client.on('select-match', () => {
    console.log('starting random match');
    var files = fs.readdirSync('./matches');
    let matchJson = files[Math.floor(Math.random() * files.length)];
    let matchData = fs.readFileSync('./matches/' + matchJson);
    match = JSON.parse(matchData);

    console.log('Found match', match)

    client.emit('match-info', match.info);
    let selectablePlayers = findValues(match, 'batsman').concat(
      findValues(match, 'bowler')
    );
    selectablePlayers = makeArrayUnique(selectablePlayers);
    client.emit('player-list', selectablePlayers);
  });

  //Start the selected match
  client.on('start-match', () => {
    if (match == undefined) {
      console.log('Match was undefined, try selecting again ');
      return;
    }
    let deliveries = match.innings[0]['1st innings'].deliveries;
    deliveries.concat(match.innings[1]['2nd innings'].deliveries);

    matchInterval = setInterval(() => {
      if (match_idx == deliveries.length) {
        clearInterval(matchInterval);
        match_idx = 0;
        return;
      }

      let delivery = deliveries[match_idx];

      let ball = Object.keys(delivery)[0];
      deliveryObj = delivery[Object.keys(delivery)[0]];
      deliveryObj.ball = ball;

      console.log(deliveryObj);
      client.emit('next-ball', deliveryObj);
      match_idx++;
    }, 5000);
  });

  //Stop the current match
  client.on('stop-match', () => {
    console.log('Stopping match');
    clearInterval(matchInterval);
  });

  client.on('disconnect', (client) => {
    console.log('Client disconnected')
  })
});

//Helper function to find values by key recursively.
function findValues(obj, key) {
  return findValuesHelper(obj, key, []);
}

function findValuesHelper(obj, key, list) {
  if (!obj) return list;
  if (obj instanceof Array) {
    for (var i in obj) {
      list = list.concat(findValuesHelper(obj[i], key, []));
    }
    return list;
  }
  if (obj[key] && !Number.isInteger(obj[key])) list.push(obj[key]);

  if (typeof obj == 'object' && obj !== null) {
    var children = Object.keys(obj);
    if (children.length > 0) {
      for (i = 0; i < children.length; i++) {
        list = list.concat(findValuesHelper(obj[children[i]], key, []));
      }
    }
  }
  return list;
}

//Helper function to make an array unique
function makeArrayUnique(arr) {
  var u = {},
    a = [];
  for (var i = 0, l = arr.length; i < l; ++i) {
    if (!u.hasOwnProperty(arr[i])) {
      a.push(arr[i]);
      u[arr[i]] = 1;
    }
  }
  return a;
}
