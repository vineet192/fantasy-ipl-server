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
  var matchInterval;

  //Start a random match
  client.on('start-match', () => {
    console.log('starting random match');
    var files = fs.readdirSync('./matches');
    let matchJson = files[Math.floor(Math.random() * files.length)];
    let matchData = fs.readFileSync('./matches/' + matchJson);
    let match = JSON.parse(matchData);
    var match_idx = 0;

    client.emit('match-info', match.info);
    let firstTeam = match.innings[0]['1st innings'].team;
    let secondTeam = match.innings[1]['2nd innings'].team;

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
});
