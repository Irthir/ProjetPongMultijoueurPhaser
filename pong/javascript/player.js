class Player extends Phaser.Physics.Arcade.Sprite 
{
    constructor (scene, x, y, nJoueur)
    {
        // super
        super(scene, x, y, "player");
        this.nJoueur = nJoueur;
        // render
        scene.add.existing(this);
        // physics rendering to move around and shoot with our players
        scene.physics.add.existing(this);
        this.player_speed = 600;
        this.depth = 5;
        this.setImmovable(true);
        // holds scene
        this.scene = scene;
        this.setCollideWorldBounds(true); //to ensure that the player stays in the window
        self = this;
        // input handlers
        this.keyUp = scene.input.keyboard.addKey('Z');
        this.keyDown = scene.input.keyboard.addKey('S');

        //scene.ball is a group
        scene.physics.add.collider(this, scene.ball);
        console.log(nJoueur);
        console.log(typeof(nJoueur));

        if (nJoueur < 2)
        {
            this.x = this.width;
            this.y = 400;
            console.log("Luc");
        }
        else
        {
            this.x = 800-this.width;
            this.y = 400;
        }

        console.log(this.x);

        this.old_x = this.x;
        this.old_y = this.y;

        this.scene.io.emit('player_connect'); //connection of the player
    }

    update()
    {
        this.setVelocityY(0); //with every CPU tick, reset velocity to 0 since we don't want it to forever move upwards or downwards
        if (this.keyUp.isDown)
        {
            this.setVelocityY(this.player_speed * -1);
        }
        else if(this.keyDown.isDown)
        {
            this.setVelocityY(this.player_speed);
        }

        //synchronizing enemy movement
        var x = this.x;
        var y = this.y;
        if (x != this.old_x || y != this.old_y)
        {
            //this if statement exists only when the player moves
            // send socket to server
            this.scene.io.emit('player_moved', {x: x, y: y}); //the object contains the movement data
            //assigning new movement data after the player has moved
            this.old_x = x;
            this.old_y = y;
        }
    }
}