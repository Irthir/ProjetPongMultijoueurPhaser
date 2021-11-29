//Configuration du canvas phaser
const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 800,
    height: 640,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

//Variables de vie du jeu
const game = new Phaser.Game(config);
let ball;
let player1;
let player2;
let bGameStart = false;
const nPaddleSpeed = 350;
let keys = {};
let p1VictoryText;
let p2VictoryText;

function preload()
{
    this.load.image('Ball','asset/sprite/Ball.png');
    this.load.image('BallMotion','asset/sprite/BallMotion.png');
    this.load.image('Board','asset/sprite/Board.png');
    this.load.image('Player1','asset/sprite/Player1.png');
    this.load.image('Player2','asset/sprite/Player2.png');
    this.load.image('ScoreBar','asset/sprite/ScoreBar.png');

    //Évènement de rescale de la fenêtre, à revoir
    window.addEventListener('resize', () =>
    {
        game.scale.resize(window.innerWidth,window.innerHeight);
    });
}

function create()
{
    //Mise en place du terrain
    board = this.physics.add.sprite(
        this.physics.world.bounds.width/2,
        this.physics.world.bounds.height/2,
        'Board');
    let board_scaleX = this.cameras.main.width / board.width;
    let board_scaleY = this.cameras.main.height / board.height;
    let board_scale = Math.max(board_scaleX, board_scaleY);
    board.setScale(board_scale).setScrollFactor(0);

    //Mise en place de la balle
    ball = this.physics.add.sprite(
        this.physics.world.bounds.width/2,
        this.physics.world.bounds.height/2,
        'Ball');
    ball.setCollideWorldBounds(true);
    ball.setBounce(1,1);

    //Mise en place du joueur 1
    player1 = this.physics.add.sprite(
        this.physics.world.bounds.width - (ball.body.width/2),
        this.physics.world.bounds.height/2,
        'Player1');
    player1.setCollideWorldBounds(true);
    player1.setImmovable(true);

    //Mise en place du joueur 2
    player2 = this.physics.add.sprite(
        ball.body.width/2,
        this.physics.world.bounds.height/2,
        'Player2');
    player2.setCollideWorldBounds(true);
    player2.setImmovable(true);

    //Mise en place des collisions
    this.physics.add.collider(ball, player1);
    this.physics.add.collider(ball, player2);

    //Texte de victoire joueur 1
    p1VictoryText = this.add.text(
        this.physics.world.bounds.width/2,
        this.physics.world.bounds.height/2,
        "Victoire du joueur 1 !"
    );
    p1VictoryText.setVisible(false);
    p1VictoryText.setOrigin(.5);

    //Texte de victoire joueur 2
    p2VictoryText = this.add.text(
        this.physics.world.bounds.width/2,
        this.physics.world.bounds.height/2,
        "Victoire du joueur 2 !"
    );
    p2VictoryText.setVisible(false);
    p2VictoryText.setOrigin(.5);

    //Mise en place des inputs joueurs
    cursors = this.input.keyboard.createCursorKeys();
    keys.z = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    keys.s = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
}

function update()
{
    if (!bGameStart)
    {
        //Mise en place de la première trajectoire de la balle
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
        const initialVelocityX = ((Math.random() *150)+100)*nDirX;
        const initialVelocityY = ((Math.random() *150)+100)*nDirY;
        ball.setVelocityX(initialVelocityX);
        ball.setVelocityY(initialVelocityY);
        bGameStart = true;
    }
    else
    {
        //Conditions de victoire
        if ((ball.body.x+ball.body.width/2) > player1.body.x)
        {
            ball.setVelocityX(0);
            ball.setVelocityY(0);
            p2VictoryText.setVisible(false);
        }
        else if (ball.body.x <= player2.body.x)
        {
            ball.setVelocityX(0);
            ball.setVelocityY(0);
            p1VictoryText.setVisible(false);
        }

        //Inputs joueur 1
        player1.body.setVelocityY(0);
        if (cursors.up.isDown)
        {
            player1.body.setVelocityY(-nPaddleSpeed);
        }
        if (cursors.down.isDown)
        {
            player1.body.setVelocityY(nPaddleSpeed);
        }

        //Inputs joueur 2
        player2.body.setVelocityY(0);
        if (keys.z.isDown)
        {
            player2.body.setVelocityY(-nPaddleSpeed);
        }
        if (keys.s.isDown)
        {
            player2.body.setVelocityY(nPaddleSpeed);
        }

        //Mouvements bots
        player1.body.y = ball.body.y-player1.body.height/2+ball.body.height/2;
        player2.body.y = ball.body.y-player1.body.height/2+ball.body.height/2;

        //Limites pour la balle
        if (ball.body.velocity.y > nPaddleSpeed)
        {
            ball.body.velocity.y = nPaddleSpeed;
        }
        else if (ball.body.velocity.y < -nPaddleSpeed)
        {
            ball.body.velocity.y = -nPaddleSpeed;
        }
    }
}
	