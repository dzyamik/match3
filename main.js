var config = {
    type: Phaser.CANVAS,
    parent: 'c',
    width: 700,
    height: 800,
    scene: {
        preload: preload,
        create: create
    }
};
// max canvas size to not get "square pixels"
var MAX_WIDTH = 700;
var MAX_HEIGHT = 800;
var MAX_FIELD_HEIGHT = 700;
//
var fieldSize = 7;
var orbColors = 6;
var orbSize = 100;
//
var swapSpeed = 200;
var fallSpeed = 1000;
var destroySpeed = 500;
var fastFall = true;
var moveCallback = false;
//
var gameArray = [];
var removeMap = [];
var orbGroup;
var selectedOrb;
var canPick = true;
var isMobile = true;
var isAndroid = true;
var ABtn;
var GBtn;
var ALink = "https://itunes.apple.com/us/app/gardenscapes-new-acres/id1105855019?mt=8";
var GLink = "https://play.google.com/store/apps/details?id=com.playrix.gardenscapes&hl=en";

var game = new Phaser.Game(config);
var tweens;
var scene;

var tutorialBuild = [
    [2, 5, 3, 1, 5, 2, 5],
    [1, 4, 0, 0, 5, 2, 1],
    [3, 1, 1, 2, 3, 0, 0],
    [2, 3, 0, 2, 0, 5, 0],
    [1, 5, 4, 1, 2, 4, 1],
    [4, 4, 0, 1, 1, 5, 1],
    [4, 5, 5, 2, 4, 4, 5]
];
var tutorialGraphics;
var tutorialText;
var tutorialEnded = false;

window.onresize = resize;
window.addEventListener('resize', resize, true);

function resize() {
    if (game) {
        var canvas = document.querySelector("canvas");

        var windowWidth = window.innerWidth;
        var windowHeight = window.innerHeight;
        if (windowWidth > MAX_WIDTH && windowHeight > MAX_HEIGHT) {
            windowWidth = MAX_WIDTH;
            windowHeight = MAX_HEIGHT;
        }

        var windowRatio = windowWidth / windowHeight;
        var gameRatio = game.config.width / game.config.height;

        if (windowRatio < gameRatio) {
            canvas.style.width = windowWidth + "px";
            canvas.style.height = (windowWidth / gameRatio) + "px";
        } else {
            canvas.style.width = (windowHeight * gameRatio) + "px";
            canvas.style.height = windowHeight + "px";
        }
    }

    return;
}

function preload() {
    this.load.atlas('orbs', './orbs.png', './orbs.json');
    if (navigator.appVersion.indexOf("Android") != -1) {
        this.load.image('GBtn', './GBtn.png');
    } else if (navigator.appVersion.indexOf("iPhone") != -1) {
        isAndroid = false;
        this.load.image('ABtn', './ABtn.png');
    } else {
        isMobile = false;
        isAndroid = false;
        this.load.image('ABtn', './ABtn.png');
        this.load.image('GBtn', './GBtn.png');
    }
}

function create() {
    orbGroup = this.add.group();
    for (var i = 0; i < fieldSize; i++) {
        gameArray[i] = [];
        for (var j = 0; j < fieldSize; j++) {
            var color = tutorialBuild[i][j];
            var orb = this.add.image(orbSize * j + orbSize / 2, orbSize * i + orbSize / 2, 'orbs', color.toString()).setOrigin(0.5, 0.5);
            gameArray[i][j] = {
                orbColor: color,
                orbSprite: orb
            };
            orbGroup.add(orb);

            // random start
            // var randomColor;
            // do {
            //     randomColor = Phaser.Math.Between(0, orbColors - 1);
            //     gameArray[i][j] = {
            //         orbColor: randomColor
            //     }
            // } while (isMatch(i, j));
            // var orb = this.add.image(orbSize * j + orbSize / 2, orbSize * i + orbSize / 2, 'orbs', randomColor.toString()).setOrigin(0.5, 0.5).setInteractive();
            // gameArray[i][j].orbSprite = orb;
            // orbGroup.add(orb);
            // this.input.setDraggable(orb);
        }
    }

    gameArray[4][3].orbSprite.setInteractive();
    gameArray[4][4].orbSprite.setInteractive();
    this.input.setDraggable(gameArray[4][3].orbSprite);
    this.input.setDraggable(gameArray[4][4].orbSprite);
    selectedOrb = null;
    canPick = true;

    this.input.on('dragstart', function (pointer, gameObject) {
        orbSelect(pointer, gameObject);
    });

    this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
        if (moveCallback) {
            orbMove(dragX, dragY);
        }
    });

    this.input.on('dragend', function (pointer, gameObject) {
        orbDeselect(pointer);
    });
    scene = orbGroup.scene;
    tweens = game.scene.scenes[0].tweens;


    // Tutorial block
    var initialX = 3;
    var initialY = 4;
    tutorialGraphics = this.add.graphics();
    tutorialGraphics.alpha = 0.65;
    tutorialGraphics.fillStyle(0x444444);
    tutorialGraphics.fillRect(0, 0, MAX_WIDTH, 2 * orbSize);
    tutorialGraphics.fillRect(0, 2 * orbSize, initialX * orbSize, 3 * orbSize);

    tutorialGraphics.fillRect((initialX + 1) * orbSize, 2 * orbSize, MAX_WIDTH - (initialX + 1) * orbSize, 2 * orbSize);
    tutorialGraphics.fillRect((initialX + 2) * orbSize, initialY * orbSize, MAX_WIDTH - (initialX + 2) * orbSize, orbSize);

    tutorialGraphics.fillRect(0, (initialY + 1) * orbSize, MAX_WIDTH, MAX_FIELD_HEIGHT - (initialY + 1) * orbSize);

    tutorialText = this.add.text(398, 540, '↑   ↔   ↑\nSwap these two elements', { fill: '#00ff00', fontSize: 30, fontFamily: 'Arial', align: 'center' })
        .setOrigin(0.5, 0.5);
    tweens.add({
        targets: tutorialText,
        scaleX: 1.2,
        scaleY: 1.2,
        ease: 'None',
        yoyo: true,
        duration: 700,
        repeat: -1
    });




    // redirect buttons
    if (isAndroid) {
        GBtn = this.add.image(Math.round(MAX_WIDTH / 2), Math.round(MAX_HEIGHT + (MAX_FIELD_HEIGHT - MAX_HEIGHT) / 2), 'GBtn').setOrigin(0.5, 0.5);
        GBtn.alpha = 0;
    } else if (isMobile) {
        ABtn = this.add.image(Math.round(MAX_WIDTH / 2), Math.round(MAX_HEIGHT + (MAX_FIELD_HEIGHT - MAX_HEIGHT) / 2), 'ABtn').setOrigin(0.5, 0.5);
        ABtn.alpha = 0;
    } else {
        ABtn = this.add.image(Math.round(MAX_WIDTH / 4), Math.round(MAX_HEIGHT + (MAX_FIELD_HEIGHT - MAX_HEIGHT) / 2), 'ABtn').setOrigin(0.5, 0.5);
        GBtn = this.add.image(Math.round(3 * MAX_WIDTH / 4), Math.round(MAX_HEIGHT + (MAX_FIELD_HEIGHT - MAX_HEIGHT) / 2), 'GBtn').setOrigin(0.5, 0.5);
        ABtn.alpha = 0;
        GBtn.alpha = 0;
    }


    resize();
}


function redirect(url) {
    window.location.href = url;
    // window.open(url, '_blank');
}


function orbSelect(pointer) {
    if (canPick) {
        var row = Math.floor(pointer.y / orbSize);
        var col = Math.floor(pointer.x / orbSize);
        var pickedOrb = gemAt(row, col)
        if (pickedOrb != -1) {
            if (selectedOrb == null) {
                pickedOrb.orbSprite.setScale(1.2);
                orbGroup.scene.children.bringToTop(pickedOrb.orbSprite);
                selectedOrb = pickedOrb;
                moveCallback = true;
            } else {
                if (areTheSame(pickedOrb, selectedOrb)) {
                    selectedOrb.orbSprite.setScale(1);
                    selectedOrb = null;
                } else {
                    if (areNext(pickedOrb, selectedOrb)) {
                        selectedOrb.orbSprite.setScale(1);
                        swapOrbs(selectedOrb, pickedOrb, true);
                    } else {
                        selectedOrb.orbSprite.setScale(1);
                        pickedOrb.orbSprite.setScale(1.2);
                        selectedOrb = pickedOrb;
                        moveCallback = true;
                    }
                }
            }
        }
    }
}

function orbDeselect(pointer) {
    moveCallback = false;
}

function orbMove(pX, pY) {
    var distX = pX - selectedOrb.orbSprite.x;
    var distY = pY - selectedOrb.orbSprite.y;
    var deltaRow = 0;
    var deltaCol = 0;
    if (Math.abs(distX) > orbSize / 2) {
        if (distX > 0) {
            deltaCol = 1;
        } else {
            deltaCol = -1;
        }
    } else {
        if (Math.abs(distY) > orbSize / 2) {
            if (distY > 0) {
                deltaRow = 1;
            } else {
                deltaRow = -1;
            }
        }
    }
    if (deltaRow + deltaCol != 0) {
        var pickedOrb = gemAt(getOrbRow(selectedOrb) + deltaRow, getOrbCol(selectedOrb) + deltaCol);
        if (pickedOrb != -1) {
            selectedOrb.orbSprite.setScale(1);
            swapOrbs(selectedOrb, pickedOrb, true);
            moveCallback = false;
        }
    }
}

function swapOrbs(orb1, orb2, swapBack) {
    canPick = false;
    var fromColor = orb1.orbColor;
    var fromSprite = orb1.orbSprite;
    var toColor = orb2.orbColor;
    var toSprite = orb2.orbSprite;
    gameArray[getOrbRow(orb1)][getOrbCol(orb1)].orbColor = toColor;
    gameArray[getOrbRow(orb1)][getOrbCol(orb1)].orbSprite = toSprite;
    gameArray[getOrbRow(orb2)][getOrbCol(orb2)].orbColor = fromColor;
    gameArray[getOrbRow(orb2)][getOrbCol(orb2)].orbSprite = fromSprite;

    // orb tween 1st itteration
    tweens.add({
        targets: gameArray[getOrbRow(orb1)][getOrbCol(orb1)].orbSprite,
        x: getOrbCol(orb1) * orbSize + orbSize / 2,
        y: getOrbRow(orb1) * orbSize + orbSize / 2,
        ease: 'None',
        duration: swapSpeed,
        repeat: 0
    });

    // orb tween 2nd itteration
    tweens.add({
        targets: gameArray[getOrbRow(orb2)][getOrbCol(orb2)].orbSprite,
        x: getOrbCol(orb2) * orbSize + orbSize / 2,
        y: getOrbRow(orb2) * orbSize + orbSize / 2,
        ease: 'None',
        duration: swapSpeed,
        repeat: 0,
        onComplete: function () {
            if (!matchInBoard() && swapBack) {
                swapOrbs(orb1, orb2, false);
            } else {
                if (matchInBoard()) {
                    handleMatches();
                } else {
                    canPick = true;
                    selectedOrb = null;
                }
            }
        }
    });
}

function areNext(orb1, orb2) {
    return Math.abs(getOrbRow(orb1) - getOrbRow(orb2)) + Math.abs(getOrbCol(orb1) - getOrbCol(orb2)) == 1;
}

function areTheSame(orb1, orb2) {
    return getOrbRow(orb1) == getOrbRow(orb2) && getOrbCol(orb1) == getOrbCol(orb2);
}

function gemAt(row, col) {
    if (row < 0 || row >= fieldSize || col < 0 || col >= fieldSize) {
        return -1;
    }
    return gameArray[row][col];
}

function getOrbRow(orb) {
    return Math.floor(orb.orbSprite.y / orbSize);
}

function getOrbCol(orb) {
    return Math.floor(orb.orbSprite.x / orbSize);
}

function isHorizontalMatch(row, col) {
    return gemAt(row, col).orbColor == gemAt(row, col - 1).orbColor && gemAt(row, col).orbColor == gemAt(row, col - 2).orbColor;
}

function isVerticalMatch(row, col) {
    return gemAt(row, col).orbColor == gemAt(row - 1, col).orbColor && gemAt(row, col).orbColor == gemAt(row - 2, col).orbColor;
}

function isMatch(row, col) {
    return isHorizontalMatch(row, col) || isVerticalMatch(row, col);
}

function matchInBoard() {
    for (var i = 0; i < fieldSize; i++) {
        for (var j = 0; j < fieldSize; j++) {
            if (isMatch(i, j)) {
                return true;
            }
        }
    }
    return false;
}

function handleMatches() {
    if (!tutorialEnded) {
        // tutorialGraphics Tween to disappear
        tweens.add({
            targets: tutorialGraphics,
            alpha: 0,
            ease: 'None',
            duration: swapSpeed,
            repeat: 0,
            onComplete: function() {
                tutorialGraphics.clear();
                delete(tutorialGraphics);
                // scene.children.remove(scene.children.last);

                tutorialEnded = true;
            }
        });
        // tutorialText Tween to disappear
        tweens.add({
            targets: tutorialText,
            alpha: 0,
            ease: 'None',
            duration: swapSpeed,
            repeat: 0,
            onComplete: function() {
                delete(tutorialText);
            }
        });
        // buttons appear
        if (isAndroid) {
            tweens.add({
                targets: GBtn,
                alpha: 1,
                ease: 'None',
                duration: swapSpeed,
                repeat: 0,
                onComplete: function() {
                    this.targets[0].setInteractive().on('pointerdown', function() {
                        redirect(GLink);
                    });
                }
            });
        } else if (isMobile) {
            tweens.add({
                targets: ABtn,
                alpha: 1,
                ease: 'None',
                duration: swapSpeed,
                repeat: 0,
                onComplete: function() {
                    this.targets[0].setInteractive().on('pointerdown', function() {
                        redirect(ALink);
                    });
                }
            });
        } else {
            tweens.add({
                targets: ABtn,
                alpha: 1,
                ease: 'None',
                duration: swapSpeed,
                repeat: 0,
                onComplete: function() {
                    this.targets[0].setInteractive().on('pointerdown', function() {
                        redirect(ALink);
                    });
                }
            });
            tweens.add({
                targets: GBtn,
                alpha: 1,
                ease: 'None',
                duration: swapSpeed,
                repeat: 0,
                onComplete: function() {
                    this.targets[0].setInteractive().on('pointerdown', function() {
                        redirect(GLink);
                    });
                }
            });
        }


        for (var i = 0; i < fieldSize; i++) {
            for (var j = 0; j < fieldSize; j++) {
                gameArray[i][j].orbSprite.setInteractive();
                gameArray[i][j].orbSprite.input.draggable = true;
            }
        }
    }
    removeMap = [];
    for (var i = 0; i < fieldSize; i++) {
        removeMap[i] = [];
        for (var j = 0; j < fieldSize; j++) {
            removeMap[i].push(0);
        }
    }
    handleHorizontalMatches();
    handleVerticalMatches();
    destroyOrbs();
}

function handleVerticalMatches() {
    for (var i = 0; i < fieldSize; i++) {
        var colorStreak = 1;
        var currentColor = -1;
        var startStreak = 0;
        for (var j = 0; j < fieldSize; j++) {
            if (gemAt(j, i).orbColor == currentColor) {
                colorStreak++;
            }
            if (gemAt(j, i).orbColor != currentColor || j == fieldSize - 1) {
                if (colorStreak >= 3) {
                    console.log("VERTICAL :: Length = " + colorStreak + " :: Start = (" + startStreak + "," + i + ") :: Color = " + currentColor);
                    for (var k = 0; k < colorStreak; k++) {
                        removeMap[startStreak + k][i]++;
                    }
                }
                startStreak = j;
                colorStreak = 1;
                currentColor = gemAt(j, i).orbColor;
            }
        }
    }
}

function handleHorizontalMatches() {
    for (var i = 0; i < fieldSize; i++) {
        var colorStreak = 1;
        var currentColor = -1;
        var startStreak = 0;
        for (var j = 0; j < fieldSize; j++) {
            if (gemAt(i, j).orbColor == currentColor) {
                colorStreak++;
            }
            if (gemAt(i, j).orbColor != currentColor || j == fieldSize - 1) {
                if (colorStreak >= 3) {
                    console.log("HORIZONTAL :: Length = " + colorStreak + " :: Start = (" + i + "," + startStreak + ") :: Color = " + currentColor);
                    for (var k = 0; k < colorStreak; k++) {
                        removeMap[i][startStreak + k]++;
                    }
                }
                startStreak = j;
                colorStreak = 1;
                currentColor = gemAt(i, j).orbColor;
            }
        }
    }
}

function destroyOrbs() {
    var destroyed = 0;
    for (var i = 0; i < fieldSize; i++) {
        for (var j = 0; j < fieldSize; j++) {
            if (removeMap[i][j] > 0) {

                // destroy orbs tween
                tweens.add({
                    targets: gameArray[i][j].orbSprite,
                    alpha: 0,
                    duration: destroySpeed,
                    ease: 'None',
                    repeat: 0,
                    onComplete: function () {
                        this.targets[0].destroy();
                        destroyed--;
                        if (destroyed == 0) {
                            makeOrbsFall();
                            if (fastFall) {
                                replenishField();
                            }
                        }
                    }
                });
                destroyed++;
                gameArray[i][j] = null;
            }
        }
    }
}

function makeOrbsFall() {
    var fallen = 0;
    var restart = false;
    for (var i = fieldSize - 2; i >= 0; i--) {
        for (var j = 0; j < fieldSize; j++) {
            if (gameArray[i][j] != null) {
                var fallTiles = holesBelow(i, j);
                if (fallTiles > 0) {
                    if (!fastFall && fallTiles > 1) {
                        fallTiles = 1;
                        restart = true;
                    }

                    // orbs tween to fall
                    tweens.add({
                        targets: gameArray[i][j].orbSprite,
                        y: gameArray[i][j].orbSprite.y + fallTiles * orbSize,
                        duration: fallSpeed,
                        ease: 'None',
                        repeat: 0,
                        onComplete: function () {
                            fallen--;
                            if (fallen == 0) {
                                if (restart) {
                                    makeOrbsFall();
                                } else {
                                    if (!fastFall) {
                                        replenishField();
                                    }
                                }
                            }
                        }
                    });
                    fallen++;
                    gameArray[i + fallTiles][j] = {
                        orbSprite: gameArray[i][j].orbSprite,
                        orbColor: gameArray[i][j].orbColor
                    };
                    gameArray[i][j] = null;
                }
            }
        }
    }
    if (fallen == 0) {
        replenishField();
    }
}

function replenishField() {
    var replenished = 0;
    var restart = false;
    for (var j = 0; j < fieldSize; j++) {
        var emptySpots = holesInCol(j);
        if (emptySpots > 0) {
            if (!fastFall && emptySpots > 1) {
                emptySpots = 1;
                restart = true;
            }
            for (i = 0; i < emptySpots; i++) {
                var randomColor = Phaser.Math.Between(0, orbColors - 1);
                var orb = orbGroup.scene.add.image(orbSize * j + orbSize / 2, -(orbSize * (emptySpots - 1 - i) + orbSize / 2), 'orbs', randomColor.toString()).setOrigin(0.5, 0.5).setInteractive();
                gameArray[i][j] = {
                    orbColor: randomColor,
                    orbSprite: orb
                }
                orbGroup.add(orb);
                orbGroup.scene.input.setDraggable(orb);

                // replenish field tween
                tweens.add({
                    targets: gameArray[i][j].orbSprite,
                    y: orbSize * i + orbSize / 2,
                    ease: 'None',
                    duration: fallSpeed,
                    repeat: 0,
                    onComplete: function () {
                        replenished--;
                        if (replenished == 0) {
                            if (restart) {
                                makeOrbsFall();
                            } else {
                                if (matchInBoard()) {
                                    orbGroup.scene.time.delayedCall(250, handleMatches, [], this);
                                } else {
                                    canPick = true;
                                    selectedOrb = null;
                                }
                            }
                        }
                    }
                });
                replenished++;
            }
        }
    }
}

function holesBelow(row, col) {
    var result = 0;
    for (var i = row + 1; i < fieldSize; i++) {
        if (gameArray[i][col] == null) {
            result++;
        }
    }
    return result;
}

function holesInCol(col) {
    var result = 0;
    for (var i = 0; i < fieldSize; i++) {
        if (gameArray[i][col] == null) {
            result++;
        }
    }
    return result;
}