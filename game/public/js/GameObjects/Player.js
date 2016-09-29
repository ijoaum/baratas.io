/**
 * Created by joao on 27/09/16.
 */

var Player = function (game) {

    this.x = 0
    this.y = 0
    this.angle = 0
    this.currentSpeed = 0

    this.game = game
    this.health = 100
    this.alive = true


    // The base of our player
    var startX = Math.round(Math.random() * (1000) - 500)
    var startY = Math.round(Math.random() * (1000) - 500)

    this.player = game.add.sprite(startX, startY, 'dude')
    this.player.anchor.setTo(0.5, 0.5)
    this.player.animations.add('move', [0, 1, 2, 3, 4, 5, 6, 7], 20, true)
    this.player.animations.add('stop', [3], 20, true)

    // This will force it to decelerate and limit its speed
    // player.body.drag.setTo(200, 200)
    this.game.physics.enable(this.player, Phaser.Physics.ARCADE);
    this.player.body.maxVelocity.setTo(400, 400)
    this.player.body.collideWorldBounds = true

    this.player.bringToTop()

    this.game.camera.follow(this.player)

}

Player.prototype.update = function () {
    this.game.physics.arcade.velocityFromRotation(this.player.rotation, this.currentSpeed, this.player.body.velocity)
    if (this.currentSpeed > 0) {
        this.player.animations.play('move')
    } else {
        this.player.animations.play('stop')
    }

    this.player.rotation = this.game.physics.arcade.angleToPointer(this.player)

    if (this.game.input.activePointer.isDown)
    {
        fire();
    }

    //if (player.x == cursors.left.x) {
    if (this.game.physics.arcade.distanceToPointer(this.player) >= 50) {
        this.currentSpeed = 200

    } else {
        this.currentSpeed = 0
    }
    //}

    console.log(this.player.x);
    console.log(this.player.y);
    //socket.emit('move player', { x: this.player.x, y: this.player.y, angle: this.player.angle })
}
