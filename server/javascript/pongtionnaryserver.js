const players = {};
const rooms = [];
const balls = [];
const scores = [];

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
  this.load.image('Ball','asset/sprite/Ball.png');
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

    console.log(self.rooms.length);
    for (let index = 0; index < self.rooms.length; index++)
    {
      const element = self.rooms[index];
      console.log(countPlayerInRoom(self, element));
      if (countPlayerInRoom(self, element)<4)
      {
        sRoom = element;
        break;
      }
    }

    if (sRoom == "")
    {
      self.rooms.push("room"+self.rooms.length);
      sRoom = self.rooms[self.rooms.length-1];
      //Mise en place de la balle
      ball = self.physics.add.sprite(
        self.physics.world.bounds.width/2,
        self.physics.world.bounds.height/2,
          'Ball');
      balls[sRoom] = ball;
      balls[sRoom].setCollideWorldBounds(true);
      //balls[sRoom].setBounce(1.01,1.01);
      balls[sRoom].setBounce(1,1);
      balls[sRoom].body.name = sRoom;

      scores[sRoom] =
      {
        bleu : 0,
        rouge : 0,
        vert : 0,
        jaune : 0
      };

      balls[sRoom].body.onWorldBounds=true;
      self.physics.world.on('worldbounds', (body, up, down, left, right)=>
      {
        /*console.log(body.name);
        console.log(up); //Vert
        console.log(down); //Jaune
        console.log(left); //Bleu
        console.log(right); //Rouge*/

        if (up)
        {
          scores[sRoom].bleu++;
          scores[sRoom].rouge++;
          scores[sRoom].jaune++;
        }
        else if (down)
        {
          scores[sRoom].bleu++;
          scores[sRoom].rouge++;
          scores[sRoom].vert++;
        }
        else if (left)
        {
          scores[sRoom].rouge++;
          scores[sRoom].jaune++;
          scores[sRoom].vert++;
        }
        else if (right)
        {
          scores[sRoom].bleu++;
          scores[sRoom].jaune++;
          scores[sRoom].vert++;
        }

        socket.emit('updateScore', scores[sRoom], sRoom);
      });
    }

    

    console.log(self.rooms);
    console.log('User connected');
    // create a new player and add it to our players object
    players[socket.id] =
    {
      rotation: 0,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 700) + 50,
      playerId: socket.id,
      team: getValidTeamName(self,sRoom),
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
    socket.emit('updateScore', scores, sRoom);

    socket.on('disconnect', function()
    {
      console.log("User disconnected");

      if (players[socket.id]!=null)
      {
        players[socket.id].draw.forEach(element =>
        {
          element.destroy(true);  
        });
        players[socket.id].draw=[];
        players[socket.id].path = null;
      
        io.emit('destroyPath', socket.id);
      }

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
}

function update()
{
  const self = this;
  //console.log (self.rooms);
  for (let index = 0; index < self.rooms.length; index++)
  {
    const room = self.rooms[index];
    //console.log(balls[room].body.velocity);
    if (balls[room].body.velocity.x==0 || balls[room].body.velocity.y==0)
    {
      let nDirX = 1;
      if (Math.random()>0.5)
      {
          nDirX = -1;
      }
      let nDirY = 1;
      if (Math.random()>0.5)
      {
          nDirY = -1;
      }
      //Initialisation de la balle.
      //console.log (balls);
      const initialVelocityX = ((Math.random() *150)+100)*nDirX;
      const initialVelocityY = ((Math.random() *150)+100)*nDirY;
      balls[room].setVelocityX(initialVelocityX);
      balls[room].setVelocityY(initialVelocityY);
    }
    io.emit('ballUpdate', balls[room],room);
  }
 
  //console.log(balls);
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
  
      players[playerId].path = input;
      
      io.emit('inputPlayer', players[playerId]);

      if (Array.isArray(players[playerId].draw))
      {
        players[playerId].draw.forEach(element =>{
          element.destroy();
        });
      }

      //console.log(input.curves.length);
      players[playerId].draw.forEach(element =>
      {
        element.destroy(true);  
      });
      players[playerId].draw = [];
      players[playerId].path.curves.forEach(element =>
      {
        //console.log("x "+element.points[0]+" y "+element.points[1]);
        pathling = self.physics.add.sprite(
          element.points[0],element.points[1],
          'Path');
        pathling.setCollideWorldBounds(true);
        pathling.setImmovable(true);
        players[playerId].draw.push(pathling);
        pathling.name = playerId;

        self.physics.add.collider(balls[players[playerId].room], pathling, function(ball,pathling)
        {
          if (players[pathling.name]!=null)
          {
            players[pathling.name].draw.forEach(element =>
            {
              element.destroy(true);  
            });
            players[pathling.name].draw=[];
            players[pathling.name].path = null;
          
            io.emit('destroyPath', pathling.name);
          }
        });
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

function getValidTeamName(self, sRoom)
{
  team = ["rouge","bleu","vert","jaune"];
  self.players.getChildren().forEach((player) =>
  {
    if (players[player.playerId].room == sRoom)
    {
      let i = team.indexOf(players[player.playerId].team);
      team.splice(i,1);
    }
  });
  team.push("noir");
  return team[0];
}

const game = new Phaser.Game(config);
window.gameLoaded();