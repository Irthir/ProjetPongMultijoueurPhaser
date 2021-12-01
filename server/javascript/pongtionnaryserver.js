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
  this.players = this.physics.add.group();
  if (!this.rooms)
  {
    this.rooms = [];
  }

  io.on('connection', function (socket)
  {
    let sRoom = "";

    for (let index = 0; index < rooms.length; index++)
    {
      const element = rooms[index];
      if (countPlayerInRoom(self, element)<4)
      {
        sRoom = element;
        break;
      }
    }

    if (sRoom == "")
    {
      self.rooms.push("room "+self.rooms.length);
      sRoom = self.rooms[self.rooms.length];
    }
    
    console.log('User connected');
    // create a new player and add it to our players object
    players[socket.id] =
    {
      rotation: 0,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      playerId: socket.id,
      team: (countProperties(players) == 0) ? 'rouge' : (countProperties(players) == 1) ? 'bleu' : (countProperties(players) == 2) ? 'vert' : 'jaune',
      draw : [],
      path : null,
      input:
      {
        click: false,
        x : 0,
        y : 0
      },
      room : sRoom
    };
    // add player to server
    addPlayer(self, players[socket.id]);
    // send the players object to the new player
    socket.emit('currentPlayers', players);
    // update all other players of the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

    //setTeam(self,"room 1");

    for (let index = 0; index < rooms.length; index++)
    {
      const element = array[index];

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

  //console.log(count);
  return count;
}

function countPlayerInRoom(self, sRoom)
{
  count = 0;
  //console.log(players);
  self.players.getChildren().forEach((player) =>
  {
    if (self.players[player.playerId].room == sRoom)
    {
      count++;
    }
  });
  //console.log(count);
  return count;
}

function setTeam(self, sRoom)
{
  sTeam = "";
  tPlayers = getPlayersInRoom(self, sRoom);
  
  console.log(tPlayers);

  return sTeam;
}

function getPlayersInRoom(self, sRoom)
{
  tPlayers = [];
  self.players.getChildren().forEach((player) =>
  {
    console.log(self.players[player.playerId]);
    if (self.players[player.playerId].room == sRoom)
    {
      tPlayers.push(player);
    }
  });
  return tPlayers;
}

const game = new Phaser.Game(config);
window.gameLoaded();