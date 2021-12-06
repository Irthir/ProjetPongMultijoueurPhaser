const config =
{
  type: Phaser.AUTO,
  parent: 'game',
  width: 800,
  height: 800,
  physics : {
    default: 'arcade',
    arcade: {
      gravity: false
    }
  },
  scene:
  {
    preload: preload,
    create: create,
    update: update
  }
};

function preload()
{
  this.load.image('ship', 'asset/Nanoja.png');
  this.load.image('otherPlayer', 'asset/colibri.png');
  this.load.image('star', 'asset/Champagne.png');
  this.load.image('Path','pong/asset/sprite/Path.png');
}

function create()
{
  var self = this;
  this.socket = io();
  this.players = this.add.group();
  this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' });
  this.redScoreText = this.add.text(584, 16, '', { fontSize: '32px', fill: '#FF0000' });
  this.greenScoreText = this.add.text(16, 584, '', { fontSize: '32px', fill: '#00FF00' });
  this.yellowScoreText = this.add.text(584, 584, '', { fontSize: '32px', fill: '#FFFF00' });
  var room = "";


  this.socket.on('currentPlayers', function (players)
  {
    Object.keys(players).forEach(function (id)
    {
      if (players[id].playerId === self.socket.id)
      {
        displayPlayers(self, players[id], 'ship');
        room = players[id].room;
      }
    });

    Object.keys(players).forEach(function (id)//Optimisable côté serveur
    {
      if (players[id].playerId != self.socket.id && players[id].room==room)
      {
        displayPlayers(self, players[id], 'otherPlayer');
      }
    });
  });

  this.socket.on('newPlayer', function (playerInfo)
  {
    console.log(playerInfo.room);
    console.log(room);
    if (playerInfo.room == room) //Optimisable côté serveur
    {
      displayPlayers(self, playerInfo, 'otherPlayer');
    }
  });

  this.socket.on('disconnected', function (playerId)
  {
    self.players.getChildren().forEach(function (player)
    {
      if (playerId === player.playerId)
      {
        player.destroy();
      }
    });
  });

  this.socket.on('playerUpdates', function (players)
  {
    Object.keys(players).forEach(function (id)
    {
      self.players.getChildren().forEach(function (player)
      {
        if (players[id].playerId === player.playerId)
        {
          player.setRotation(players[id].rotation);
          player.setPosition(players[id].x, players[id].y);
        }
      });
    });
  });

  this.socket.on('updateScore', function (scores)
  {
    self.blueScoreText.setText('Blue: ' + scores.blue);
    self.redScoreText.setText('Red: ' + scores.red);
  });
  this.socket.on('starLocation', function (starLocation)
  {
    if (!self.star)
    {
      self.star = self.add.image(starLocation.x, starLocation.y, 'star');
    }
    else
    {
      self.star.setPosition(starLocation.x, starLocation.y);
    }
  });

  this.socket.on('inputPlayer', function(player)
  {
    displayDraw(self, player);
  });

  this.cursors = this.input.keyboard.createCursorKeys();
  this.isDrawing = false;
}

let prevX;
let prevY;
let path=null;
let lengthPath = 0;
function update()
{

  if (!this.input.activePointer.isDown)
  {
      this.isDrawing = false;
  }
  else
  {
    if (!this.isDrawing)
    {
      prevX = this.input.activePointer.position.x;
      prevY = this.input.activePointer.position.y;
      if (!path)
        path = new Phaser.Curves.Path(this.input.activePointer.position.x, this.input.activePointer.position.y);
      this.isDrawing = true;
    }
    else
    {
      if (((this.input.activePointer.position.x)!= prevX || (this.input.activePointer.position.y)!=prevY) && path.curves.length<30)
      {
        path.lineTo(this.input.activePointer.position.x, this.input.activePointer.position.y);
        prevX = this.input.activePointer.position.x;
        prevY = this.input.activePointer.position.y;
      }

      if (lengthPath!=path.curves.length)
      {
        this.socket.emit('playerInput', path);
        lengthPath=path.curves.length;
      }
    }


    //console.log(path.curves.length);
  }
}

function displayPlayers(self, playerInfo, sprite)
{
  const player = self.add.sprite(playerInfo.x, playerInfo.y, sprite).setOrigin(0.5, 0.5).setDisplaySize(53, 40);
  
  switch(playerInfo.team)
  {
    case "rouge" :
      player.setTint(0xff0000);
      break;
    case "bleu" :
      player.setTint(0x0000ff);
      break;
    case "vert" :
      player.setTint(0x00ff00);
      break;
    default :
      player.setTint(0xffff00);
      break;
  }
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}

function displayDraw(self, player)
{
  /*if (room == self.room)
  {*/
    if (Array.isArray(player.draw))
    {
      player.draw.forEach(element =>{
        element.destroy();
      });
    }
  
    console.log(player.path.curves.length);
    player.path.curves.forEach(element =>
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
    });
  //}
}


const game = new Phaser.Game(config);