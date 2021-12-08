const config =
{
  type: Phaser.AUTO,
  parent: 'game',
  width: 800,
  height: 800,
  scale: {
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
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
var room = "";
var pathlings = [];

let prevX;
let prevY;
let path=null;
let lengthPath = 0;

function preload()
{
  this.load.image('ship', 'asset/Nanoja.png');
  this.load.image('otherPlayer', 'asset/colibri.png');
  this.load.image('Path','pong/asset/sprite/Path.png');
  this.load.image('Ball','pong/asset/sprite/Ball.png');
}

function create()
{
  var self = this;
  this.socket = io();
  this.players = this.add.group();
  this.blueScoreText = this.add.text(16, 384, '00', { fontSize: '32px', fill: '#0000FF' });
  this.redScoreText = this.add.text(736, 384, '00', { fontSize: '32px', fill: '#FF0000' });
  this.greenScoreText = this.add.text(384, 16, '00', { fontSize: '32px', fill: '#00FF00' });
  this.yellowScoreText = this.add.text(384, 768, '00', { fontSize: '32px', fill: '#FFFF00' });

  var ball = this.physics.add.sprite(
    this.physics.world.bounds.width/2,
    this.physics.world.bounds.height/2,
    'Ball');

  this.socket.on('currentPlayers', function (players)
  {
    Object.keys(players).forEach(function (id)
    {
      if (players[id].playerId === self.socket.id)
      {
        //displayPlayers(self, players[id], 'ship');
        room = players[id].room;
        displayDraw(self,players[id]);
      }
    });

    Object.keys(players).forEach(function (id)//Optimisable côté serveur
    {
      if (players[id].playerId != self.socket.id && players[id].room==room)
      {
        //displayPlayers(self, players[id], 'otherPlayer');
        displayDraw(self,players[id]);
      }
    });
  });

  this.socket.on('newPlayer', function (playerInfo)
  {
    //console.log(playerInfo.room);
    //console.log(room);
    /*if (playerInfo.room == room) //Optimisable côté serveur
    {
      displayPlayers(self, playerInfo, 'otherPlayer');
    }*/
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

  this.socket.on('ballUpdate', function (serverball, serverroom)
  {      
    //console.log(serverroom);
    //console.log(serverball);
    if (serverroom==room)
      ball.setPosition(serverball.x,serverball.y);
  });

  this.socket.on('updateScore', function (scores, sRoom)
  {
    if (sRoom == room && scores!=null && scores.bleu!=null && scores.rouge!=null && scores.vert!=null && scores.jaune!=null)
    {
      self.blueScoreText.setText(scores.bleu);
      self.redScoreText.setText(scores.rouge);
      self.greenScoreText.setText(scores.vert);
      self.yellowScoreText.setText(scores.jaune);
    }
    else if (sRoom == room)
    {
      self.blueScoreText.setText("0");
      self.redScoreText.setText("0");
      self.greenScoreText.setText("0");
      self.yellowScoreText.setText("0");
    }
  });

  this.socket.on('inputPlayer', function(player)
  {
    displayDraw(self, player);
  });

  this.socket.on('destroyPath', function(id)
  {
    pathlings.forEach(element => {
      if (element.name == id)
      {
        element.destroy(true);
      }
    });
    if (id == self.socket.id)
    {
      path = null;
    }
  });

  this.cursors = this.input.keyboard.createCursorKeys();
  this.isDrawing = false;
}

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
      if (!path)
        path = new Phaser.Curves.Path(this.input.activePointer.position.x, this.input.activePointer.position.y);
      
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
  var selfy = this;
  //console.log(player.room);
  //console.log(selfy.room);
  if (player.room == selfy.room)
  {
    if (player.path)
    {
      //console.log(player.path.curves.length);
      player.path.curves.forEach(element =>
      {
        //console.log("x "+element.points[0]+" y "+element.points[1]);
        let pathling = self.physics.add.sprite(
          element.points[0],element.points[1],
          'Path');
        pathling.setCollideWorldBounds(true);
        pathling.setImmovable(true);
        pathling.setName(player.playerId);
        if (!player.draw)
          player.draw = [];
        player.draw.push(pathling);

        switch(player.team)
        {
          case "rouge" :
            pathling.setTint(0xff0000);
            break;
          case "bleu" :
            pathling.setTint(0x0000ff);
            break;
          case "vert" :
            pathling.setTint(0x00ff00);
            break;
          default :
            pathling.setTint(0xffff00);
            break;
        }

        pathlings.push(pathling);
      });
    }
  }
}

window.onbeforeunload = function()
{
  this.socket.emit('disconnect');
}


const game = new Phaser.Game(config);