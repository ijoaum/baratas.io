/**
 * Created by joao on 25/09/16.
 */
/* global Phaser RemotePlayer io */



function preload () {
    game.load.image('earth', 'assets/tiles2.jpg')
    game.load.image('bullet', 'assets/bullet111.png')
    game.load.spritesheet('enemy', 'assets/barata_pp.png', 64, 64)
    game.load.spritesheet('dude', 'assets/barata_pp.png', 64, 64)
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

var cursors

var gameObjects = [];

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

function addGameObject(gameObject){
    gameObjects.push(gameObject);
}

function create () {
    socket = io.connect()

    // Resize our game world to be a 2000 x 2000 square
    game.world.setBounds(-2500, -2500, 5000, 5000)

    // Our tiled scrolling background
    land = game.add.tileSprite(0, 0, window.innerWidth, window.innerHeight, 'earth')
    land.fixedToCamera = true

    player = new Player(game);
    addGameObject(player);

    game.physics.startSystem(Phaser.Physics.ARCADE);

    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;

    bullets.createMultiple(50, 'bullet');
    bullets.setAll('checkWorldBounds', true);
    bullets.setAll('outOfBoundsKill', true);


    // Create some baddies to waste :)
    enemies = []

    game.camera.focusOnXY(0, 0)

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

    // player.name = socket.io.engine.id
    // console.log(socket.io.engine.id)

    // Reset enemies on reconnect
    enemies.forEach(function (enemy) {
        enemy.player.kill()
        enemy.playername.kill()
    })
    enemies = []

    // Send local player data to the game server
    socket.emit('new player', { x: player.player.x, y: player.player.y, angle: player.player.angle, username:playerUsername })
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
    enemies.push(new RemotePlayer(data.id, game, player.player, data.x, data.y, data.angle, data.username))
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

        bullet.reset(player.player.x - 8, player.player.y - 8);

        game.physics.arcade.moveToPointer(bullet, 400);
    }

}


function update () {

    enemies.forEach(function (enemy) {
        game.physics.arcade.overlap(bullets, enemy.player, collisionHandler, null, this);
    })

    gameObjects.forEach(function(object){
        object.update();
    })

    land.tilePosition.x = -player.player.x
    land.tilePosition.y = -player.player.y

    socket.emit('move player', { x: player.player.x, y: player.player.y, angle: player.player.angle })

    //game.physics.arcade.velocityFromRotation(player.player.rotation, 300, player.player.body.velocity)

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

function dieAndRespawn() {

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