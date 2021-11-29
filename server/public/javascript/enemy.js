class Enemy extends Phaser.Physics.Arcade.Sprite
{
    constructor (scene, x, y, id, nJoueur)
    {
        // super
        super(scene, x, y, "enemy");
        this.nJoueur = nJoueur;
        // render
        scene.add.existing(this);
        // physics rendering
        scene.physics.add.existing(this);
        this.depth = 5;
        this.id = id;
    }
}