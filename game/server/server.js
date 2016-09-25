/**
 * Created by joao on 25/09/16.
 */

var util = require('util')
var http = require('http')
var path = require('path')
var ecstatic = require('ecstatic')
var io = require('socket.io')

var Player = require('./Player')

var port = process.env.PORT || 8080

/* ************************************************
 ** GAME VARIABLES
 ************************************************ */
var socket	// Socket controller
var players	// Array of connected players
var teambugPlayers // Aray of bug team players
var teamhumanPlayers  // Array of human team players

/* ************************************************
 ** GAME INITIALISATION
 ************************************************ */

// Create and start the http server
var server = http.createServer(
    ecstatic({ root: path.resolve(__dirname, '../public') })
).listen(port, function (err) {
    if (err) {
        throw err
    }

    init()
})

function init () {

    players = []
    teambugPlayers = []
    teamhumanPlayers = []
    socket = io.listen(server)
    setEventHandlers()
}

/* ************************************************
 ** GAME EVENT HANDLERS
 ************************************************ */
var setEventHandlers = function () {
    // Socket.IO
    socket.sockets.on('connection', onSocketConnection)
}

// New socket connection
function onSocketConnection (client) {
    util.log('New player has connected: ' + client.id)

    client.on('disconnect', onClientDisconnect)
    client.on('new player', onNewPlayer)
    client.on('move player', onMovePlayer)
    client.on('hit player', onHitPlayer)
}

// Socket client has disconnected
function onClientDisconnect () {
    util.log('Player has disconnected: ' + this.id)

    var removePlayer = playerById(this.id)

    // Player not found
    if (!removePlayer) {
        util.log('Player not found: ' + this.id)
        return
    }

    // Remove player from players array
    players.splice(players.indexOf(removePlayer), 1)

    // Broadcast removed player to connected socket clients
    this.broadcast.emit('remove player', {id: this.id})
}

// New player has joined
function onNewPlayer (data) {
    // Create a new player
    var newPlayer = new Player(data.x, data.y, data.angle)
    newPlayer.id = this.id

    // Broadcast new player to connected socket clients
    this.broadcast.emit('new player', {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY(), angle: newPlayer.getAngle()})

    // Send existing players to the new player
    var i, existingPlayer
    for (i = 0; i < players.length; i++) {
        existingPlayer = players[i]
        this.emit('new player', {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY(), angle: existingPlayer.getAngle()})
    }

    assignTeam(newPlayer)

    // Add new player to the players array
    players.push(newPlayer)
}

function assignTeam(player){
    bug_count = teambugPlayers.length
    human_count = teamhumanPlayers.length

    if(bug_count < human_count) {
        teambugPlayers.push(player);
        player.init("bug");
    } else {
        teamhumanPlayers.push(player);
        player.init("human");
    }
}

// Player has moved
function onMovePlayer (data) {
    // Find player in array
    var movePlayer = playerById(this.id)

    // Player not found
    if (!movePlayer) {
        util.log('Player not found: ' + this.id)
        return
    }

    // Update player position
    movePlayer.setX(data.x)
    movePlayer.setY(data.y)
    movePlayer.setAngle(data.angle)

    // Broadcast updated position to connected socket clients
    this.broadcast.emit('move player', {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY(), angle: movePlayer.getAngle()})
}

// Player has hit
function onHitPlayer (data) {
    var player = playerById(data.id)

    if (!player) {
        util.log('Player not found: ' + data.id)
        return
    }

    player.health = player.health-20;
    console.log("id: "+player.health)
    if(player.health <= 0) {
        console.log("Player dead: "+player.id)
        this.emit('kill enemy', {id: player.id})
        //this.clients[player.id].send('player kill')
    }

    this.broadcast.emit('player health sync', {id: player.id, health:player.health})

}

/* ************************************************
 ** GAME HELPER FUNCTIONS
 ************************************************ */
// Find player by ID
function playerById (id) {
    var i
    for (i = 0; i < players.length; i++) {
        if (players[i].id === id) {
            return players[i]
        }
    }

    return false
}

