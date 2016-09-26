/* ************************************************
** GAME PLAYER CLASS
************************************************ */
var Player = function (startX, startY, startAngle, startName) {
  var x = startX
  var y = startY
  var angle = startAngle
  var id

  var health
  var team
  var level
  var xp

  var name = startName
  var skin

  // Getters and setters
  var getX = function () {
    return x
  }

  var getY = function () {
    return y
  }

  var getAngle = function () {
    return angle
  }

  var setX = function (newX) {
    x = newX
  }

  var setY = function (newY) {
    y = newY
  }

  var setAngle = function (newAngle) {
    angle = newAngle
  }

  var getName = function () {
    return name
  }

  var setName = function (newName) {
    name = newName
  }


  var init = function (player_team) {
    this.health = 100
    this.team = player_team
    this.level = 1
    this.xp = 0
  }

  // Define which variables and methods can be accessed
  return {
    getX: getX,
    getY: getY,
    getAngle: getAngle,
    setX: setX,
    setY: setY,
    setAngle: setAngle,
    init: init,
    getName: getName,
    setName: setName,
    id: id
  }
}

// Export the Player class so you can use it in
// other files by using require("Player")
module.exports = Player
