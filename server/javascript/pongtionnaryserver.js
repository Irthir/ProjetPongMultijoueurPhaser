const players = {};
const rooms = [];

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
  self.players = self.physics.add.group();
  if (!self.rooms)
  {
    self.rooms = [];
  }

  io.on('connection', function (socket)
  {
    var sRoom = "";

    for (let index = 0; index < self.rooms.length; index++)
    {
      const element = self.rooms[index];
      if (countPlayerInRoom(self, element)<4)
      {
        sRoom = element;
        break;
      }
    }

    if (sRoom == "")
    {
      self.rooms.push("room "+self.rooms.length);
      sRoom = self.rooms[self.rooms.length-1];
    }
    
    console.log('User connected');
    // create a new player and add it to our players object
    players[socket.id] =
    {
      rotation: 0,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 700) + 50,
      playerId: socket.id,
      team: (countPlayerInRoom(self,sRoom) == 0) ? 'rouge' : (countPlayerInRoom(self,sRoom) == 1) ? 'bleu' : (countPlayerInRoom(self,sRoom) == 2) ? 'vert' : 'jaune',
      draw : [],
      path : null,
      room : sRoom
    };
    // add player to server
    addPlayer(self, players[socket.id]);
    // send the players object to the new player
    socket.emit('currentPlayers', players);
    // update all other players of the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

    for (let index = 0; index < self.rooms.length; index++)
    {
      const element = self.rooms[index];

      console.log ("Players in "+element+" : "+countPlayerInRoom(self, element));
    }

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
      players[player.playerId].path = input;
      
      io.emit('inputPlayer', players[player.playerId]);

      if (Array.isArray(player.draw))
      {
        player.draw.forEach(element =>{
          element.destroy();
        });
      }

      console.log(input.curves.length);
      players[player.playerId].path.curves.forEach(element =>
      {
        console.log("x "+element.points[0]+" y "+element.points[1]);
        pathling = self.physics.add.sprite(
          element.points[0],element.points[1],
          'Path');
        pathling.setCollideWorldBounds(true);
        pathling.setImmovable(true);
        if (!player.draw)
          player.draw = [];
        player.draw.push(pathling);
        //self.physics.add.collider(ball, pathling);
      });
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

  //console.log(count);
  return count;
}

function countPlayerInRoom(self, sRoom)
{
  count = 0;
  //console.log(players);
  self.players.getChildren().forEach((player) =>
  {
    if (players[player.playerId].room == sRoom)
    {
      count++;
    }
  });
  //console.log(count);
  return count;
}

function getPlayersInRoom(self, sRoom)
{
  tPlayers = [];
  self.players.getChildren().forEach((player) =>
  {
    if (players[player.playerId].room == sRoom)
    {
      tPlayers.push(player);
    }
  });
  return tPlayers;
}

const game = new Phaser.Game(config);
window.gameLoaded();