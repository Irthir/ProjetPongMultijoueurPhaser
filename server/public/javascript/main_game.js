//storing height and width of the client’s browser
var window_height = 800;
var window_width = 800;
//since we’re using a phaser, we have to create a variable that holds the config data for the phaser.
const config =
{
    type: Phaser.AUTO,
    width: window_width,
    height: window_height,
    backgroundColor: '#000000',
    //this object will hold configuration for arcade physics
    physics:
    {
        default: 'arcade',
        arcade:
        {
            gravity:false,
            //this means it will not cross 60
            fps: 60,
        }
    },
    scene:
    {
        //function where the statements and the comments will be executed pre initializing the game
        preload: preload,
        //create function works when the game is initialized only once at a time
        create: create,
        //main game loop that executes every CPU tick since we are modifying it upto 60 only
        update: update,
    }
};
// holds a game instance

var game = new Phaser.Game(config);
var player;
var player_init = false;

function preload()
{
    // loading images
    this.load.image('player', 'pong/asset/sprite/Player1.png');
    this.load.image('enemy', 'pong/asset/sprite/Player2.png');
    this.load.image('ball', 'pong/asset/sprite/Ball.png');
}

function create()
{
    this.io = io(); //initializing a new io server
    self = this; //because we have an event handler
    this.enemies = this.physics.add.group();
    this.ball = this.physics.add.group();
    this.io.on('actualPlayers', function(players)
    {
        console.log(players);
        console.log(countProperties(players));
        Object.keys(players).forEach(function (id)
        {
            if (countProperties(players)>2)
            {
                console.log("Connexion impossible, plus de deux joueurs.");

                // we are creating other players
                createEnemy(self, players[Object.keys(players)[0]]);
                // we are creating other players
                createEnemy(self, players[Object.keys(players)[1]]);
            }
            else
            {
                //looping through the players
                if (players[id].player_id == self.io.id)
                {
                    //we are in the array
                    createPlayer(self, players[id].x, players[id].y, countProperties(players));

                    //self.scene.io.emit('new_player', players[id]);
                }
                else
                {
                    /*console.log(players[id]);
                    if (players[id].nJoueur<=2)
                    {*/
                        // we are creating other players
                        createEnemy(self, players[id]);
                    //}
                }
            }
        });
        
    });

    this.io.on('new_player', function (pInfo)
    {
        //we’re sending info about the new player from the server. So, we accept the info by pInfo
        createEnemy(self.scene, pInfo);
    });

    //synchronizing enemy movement
    enemies_ref = this.enemies; //holds the reference to the enemy’s group
    this.io.on('enemy_moved', function(player_data) 
    {
        enemies_ref.getChildren().forEach(function(enemy)
        {
            if (player_data.player_id == enemy.id)
            {
                //set a new position for the enemy because the player data and enemy id in the enemy’s group match together
                enemy.setPosition(player_data.x, player_data.y);
            }
        });
    });

    this.io.on('player_disconnect', function(socket_id)
    {
        enemies_ref.getChildren().forEach(function(enemy)
        {
            if (socket_id == enemy.id)
            {
                enemy.destroy();
            }
        });
    });
}

function update()
{
    if (this.player_init == true)
    {
        this.player.update();
    }
}

function createPlayer(scene, x, y, nJoueur)
{
    //creating the player on the scene i.e making the new players visible
    scene.player_init = true;
    scene.player = new Player(scene, x, y, nJoueur);
}

function createEnemy(scene, enemy_info)
{
    console.log (enemy_info);
    const enemy = new Enemy(scene, enemy_info.x, enemy_info.y, enemy_info.player_id, enemy_info.nJoueur);
    scene.enemies.add(enemy);
}

function countProperties(obj) {
    var count = 0;

    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            ++count;
    }

    return count;
}