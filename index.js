const io = require('socket.io')({
  cors: {
    origin: '*',
  },
});
var fs = require('fs');

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

console.log('running on ' + io.path());
io.listen(3000);
