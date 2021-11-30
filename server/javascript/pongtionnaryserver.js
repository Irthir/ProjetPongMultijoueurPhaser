const players = {};

const config =
{
  type: Phaser.HEADLESS,
  parent: 'game',
  width: 800,
  height: 800,
  physics:
  {
    default: 'arcade',
    arcade:
    {
      gravity: false
    }
  },
  scene:
  {
    preload: preload,
    create: create,
    update: update
  },
  autoFocus: false
};

function preload()
{
  this.load.image('ship', 'asset/Nanoja.png');
  this.load.image('star', 'asset/Champagne.png');
}

function create()
{
  const self = this;
  this.players = this.physics.add.group();

  io.on('connection', function (socket)
  {
    console.log('User connected');

    // create a new player and add it to our players object
    players[socket.id] =
    {
      playerId: socket.id,
      team: (countProperties(players) == 0) ? 'rouge' : (countProperties(players) == 1) ? 'bleu' : (countProperties(players) == 2) ? 'vert' : 'jaune',
      draw=[],
      path=null,
      input:
      {
        click: false,
        x : 0,
        y : 0
      }
    };
    // add player to server
    addPlayer(self, players[socket.id]);
    // send the players object to the new player
    socket.emit('currentPlayers', players);
    // update all other players of the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // send the star object to the new player
    //socket.emit('starLocation', { x: self.star.x, y: self.star.y });
    // send the current scores
    socket.emit('updateScore', self.scores);


    socket.on('disconnect', function()
    {
      console.log("User disconnected");
      // remove player from server
      removePlayer(self, socket.id);
      // remove this player from our players object
      delete players[socket.id];
      // emit a message to all players to remove this player
      io.emit('disconnected', socket.id);
    });

    // when a player moves, update the player data
    socket.on('playerInput', function (inputData)
    {
      handlePlayerInput(self, socket.id, inputData);
    });
  });

  this.scores =
  {
    bleu : 0,
    rouge : 0,
    vert : 0,
    jaune : 0
  };
  /*this.star = this.physics.add.image(randomPosition(700), randomPosition(500), 'star');
  this.physics.add.collider(this.players);
  this.physics.add.overlap(this.players, this.star, function (star, player) {
    if (players[player.playerId].team === 'red')
    {
      self.scores.red += 10;
    }
    else
    {
      self.scores.blue += 10;
    }
    self.star.setPosition(randomPosition(700), randomPosition(500));
    io.emit('updateScore', self.scores);
    io.emit('starLocation', { x: self.star.x, y: self.star.y });
  });*/
}

function update()
{
  this.players.getChildren().forEach((player) =>
  {
    const input = players[player.playerId].input;
    if (player.path!=null)
    {
      
    }
    players[player.playerId].x = player.x;
    players[player.playerId].y = player.y;
    players[player.playerId].rotation = player.rotation;
  });
  this.physics.world.wrap(this.players, 5);
  io.emit('playerUpdates', players);
}

function addPlayer(self, playerInfo)
{
  const player = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
  player.setDrag(100);
  player.setAngularDrag(100);
  player.setMaxVelocity(200);
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}

function removePlayer(self, playerId)
{
  self.players.getChildren().forEach((player) =>
  {
    if (playerId === player.playerId)
    {
      player.destroy();
    }
  });
}

function handlePlayerInput(self, playerId, input)
{
  self.players.getChildren().forEach((player) =>
  {
    if (playerId === player.playerId)
    {
      players[player.playerId].input = input;
    }
  });
}

function randomPosition(max)
{
  return Math.floor(Math.random() * max) + 50;
}

function countProperties(obj)
{
  var count = 0;

  for(var prop in obj)
  {
    if(obj.hasOwnProperty(prop))
        ++count;
  }

  console.log(count);
  return count;
}

const game = new Phaser.Game(config);
window.gameLoaded();