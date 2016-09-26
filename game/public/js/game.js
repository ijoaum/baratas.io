/**
 * Created by joao on 25/09/16.
 */
/* global Phaser RemotePlayer io */



function preload () {
    game.load.image('earth', 'assets/tiles2.jpg')
    game.load.image('bullet', 'assets/bullet111.png')
    game.load.spritesheet('dude', 'assets/barata_pp.png', 64, 64)
    game.load.spritesheet('enemy', 'assets/barata_pp.png', 64, 64)
}

var game;

var socket // Socket connection

var land

var playerUsername
var player
var enemies
var bullets

var sessionId

var fireRate = 500;
var nextFire = 0;

var currentSpeed = 0
var cursors

var app = angular.module("app", []).controller("LoginController", function($scope){;
    $scope.joinGame = function () {
        if(!$scope.username) {
            return;
        }

        playerUsername = $scope.username;

        $scope.gameRunning = true;
        game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.CANVAS, 'gameArea', { preload: preload, create: create, update: update, render: render })
    };
});


function create () {
    socket = io.connect()

    // Resize our game world to be a 2000 x 2000 square
    game.world.setBounds(-500, -500, 1000, 1000)

    // Our tiled scrolling background
    land = game.add.tileSprite(0, 0, window.innerWidth, window.innerHeight, 'earth')
    land.fixedToCamera = true

    // The base of our player
    var startX = Math.round(Math.random() * (1000) - 500)
    var startY = Math.round(Math.random() * (1000) - 500)
    player = game.add.sprite(startX, startY, 'dude')
    player.anchor.setTo(0.5, 0.5)
    player.animations.add('move', [0, 1, 2, 3, 4, 5, 6, 7], 20, true)
    player.animations.add('stop', [3], 20, true)


    game.physics.startSystem(Phaser.Physics.ARCADE);

    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;

    bullets.createMultiple(50, 'bullet');
    bullets.setAll('checkWorldBounds', true);
    bullets.setAll('outOfBoundsKill', true);

    // This will force it to decelerate and limit its speed
    // player.body.drag.setTo(200, 200)
    game.physics.enable(player, Phaser.Physics.ARCADE);
    player.body.maxVelocity.setTo(400, 400)
    player.body.collideWorldBounds = true

    // Create some baddies to waste :)
    enemies = []

    player.bringToTop()

    game.camera.follow(player)
    game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300)
    game.camera.focusOnXY(0, 0)

    cursors = game.input.keyboard.createCursorKeys()

    // Start listening for events

    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    //game.scale.setScreenSize(true);

    setEventHandlers()
}



var setEventHandlers = function () {

    socket.on('connect', onSocketConnected)
    socket.on('disconnect', onSocketDisconnect)
    socket.on('new player', onNewPlayer)
    socket.on('move player', onMovePlayer)
    socket.on('remove player', onRemovePlayer)

    socket.on('kill enemy', onKillEnemy)
    socket.on('kill player', onKillPlayer)

}

// Socket connected
function onSocketConnected () {
    console.log('Connected to socket server')

    player.name = socket.io.engine.id
    console.log(socket.io.engine.id)

    // Reset enemies on reconnect
    enemies.forEach(function (enemy) {
        enemy.player.kill()
        enemy.playername.kill()
    })
    enemies = []

    // Send local player data to the game server
    socket.emit('new player', { x: player.x, y: player.y, angle: player.angle, username:playerUsername })
}

// Socket disconnected
function onSocketDisconnect () {
    console.log('Disconnected from socket server')
}

// New player
function onNewPlayer (data) {
    console.log('New player connected:', data.id)

    // Avoid possible duplicate players
    var duplicate = playerById(data.id)
    if (duplicate) {
        console.log('Duplicate player!')
        return
    }

    // Add new player to the remote players array
    enemies.push(new RemotePlayer(data.id, game, player, data.x, data.y, data.angle, data.username))
}

// Move player
function onMovePlayer (data) {
    var movePlayer = playerById(data.id)

    // Player not found
    if (!movePlayer) {
        console.log('Player not found: ', data.id)
        return
    }

    // Update player position
    movePlayer.player.x = data.x
    movePlayer.player.y = data.y
    movePlayer.player.angle = data.angle

    movePlayer.playername.x = Math.floor(movePlayer.player.x);
    movePlayer.playername.y = Math.floor(movePlayer.player.y - 40);
}

// Remove player
function onRemovePlayer (data) {
    var removePlayer = playerById(data.id)

    // Player not found
    if (!removePlayer) {
        console.log('Player not found: ', data.id)
        return
    }

    removePlayer.player.kill()
    removePlayer.playername.kill()

    // Remove player from array
    enemies.splice(enemies.indexOf(removePlayer), 1)
}

function fire() {

    if (game.time.now > nextFire && bullets.countDead() > 0)
    {
        nextFire = game.time.now + fireRate;

        var bullet = bullets.getFirstDead();

        bullet.reset(player.x - 8, player.y - 8);

        game.physics.arcade.moveToPointer(bullet, 400);
    }

}


function update () {
    // for (var i = 0; i < enemies.length; i++) {
    //   if (enemies[i].alive) {
    //     enemies[i].update()
    //     game.physics.arcade.collide(player, enemies[i].player)
    //
    //   }
    // }



    // if (cursors.left.isDown) {
    //   player.angle -= 4
    // } else if (cursors.right.isDown) {
    //   player.angle += 4
    // }

    // if (cursors.up.isDown) {
    //   // The speed we'll travel at
    //   currentSpeed = 300
    // } else {
    //   if (currentSpeed > 0) {
    //     currentSpeed -= 4
    //   }
    // }

    game.physics.arcade.velocityFromRotation(player.rotation, currentSpeed, player.body.velocity)

    enemies.forEach(function (enemy) {
        game.physics.arcade.overlap(bullets, enemy.player, collisionHandler, null, this);
    })


    if (currentSpeed > 0) {
        player.animations.play('move')
    } else {
        player.animations.play('stop')
    }

    player.rotation = game.physics.arcade.angleToPointer(player)

    if (game.input.activePointer.isDown)
    {
        fire();
    }


    land.tilePosition.x = -player.x
    land.tilePosition.y = -player.y

    //if (player.x == cursors.left.x) {
    if (game.physics.arcade.distanceToPointer(player) >= 50) {
        currentSpeed = 200

    } else {
        currentSpeed = 0
    }
    //}

    socket.emit('move player', { x: player.x, y: player.y, angle: player.angle })
}

function render () {

}

// Find player by ID
function playerById (id) {
    for (var i = 0; i < enemies.length; i++) {
        if (enemies[i].player.name === id) {
            return enemies[i]
        }
    }

    return false
}

function collisionHandler (enemy,bullet) {
    bullet.kill();
    enemyHit(enemy);

}

function onKillPlayer(data) {
    player.kill()
}

function onKillEnemy(data) {
    enemies.forEach(function (enemy) {
        console.log(data.id)
        console.log(enemy)
        if(enemy.id === data.id ) {
            enemy.player.kill()
            enemy.playername.kill()
        }
    })
}

function enemyHit(enemy){
    enemy.health = enemy.health - 0.4
    socket.emit('hit player', { id:enemy.name })
    // if(enemy.health <= 0){
    //     console.log(enemy.health);
    //     enemy.kill();
    // }
}