let g_canvas = null;
let g_padding = 10;
let g_cell_size = 50;

let g_spriteImages = null;
let g_spriteTiles = null;
let g_back = null;

let g_player_id_colors = new Map();

let g_undoStack = [];

let g_callStack = null;
let g_callResult = null;
let g_gameResult = null;
let g_loopCheck = 0;

let g_board = null;
let g_rows = 0;
let g_cols = 0;

let g_choicesByRct = null;
let g_choicesByBtn = null;
let g_choicePlayer = null;
let g_choiceWait = false;

let g_mouseChoice = null;
let g_mouseAlt = false;



function copymap(map) {
    if (map === null) {
        return null;
    } else {
        return new Map(JSON.parse(JSON.stringify(Array.from(map))));
    }
}

function deepcopyobj(obj) {
    if (obj === null) {
        return null;
    } else if (obj === true) {
        return true;
    } else if (obj === false) {
        return false;
    } else {
        return JSON.parse(JSON.stringify(obj));
    }
}

function undoPush() {
    return;

    var callStackCopy = [];
    for (var frame of g_callStack) {
        var frameCopy = {node: frame.node, local: copymap(frame.local)};
        callStackCopy.push(frameCopy);
    }

    var state = {};

    state.callStack = callStackCopy;
    state.callResult = g_callResult;
    state.gameResult = deepcopyobj(g_gameResult);
    state.loopCheck = g_loopCheck;

    state.board = deepcopyobj(g_board);
    state.rows = g_rows;
    state.cols = g_cols;

    state.choicesByRct = copymap(g_choicesByRct);
    state.choicesByBtn = copymap(g_choicesByBtn);
    state.choicePlayer = g_choicePlayer;
    state.choiceWait = deepcopyobj(g_choiceWait);

    g_undoStack.push(state);

    console.log(g_callStack);
    console.log(g_choiceWait, g_undoStack.length);
}

function undoPop() {
    if (g_undoStack.length > 0) {
        var state = g_undoStack.pop();

        g_callStack = state.callStack;
        g_callResult = state.callResult;
        g_gameResult = state.gameResult;
        g_loopCheck: loopCheck;

        g_board = state.board;
        g_rows = state.rows;
        g_cols = state.cols;

        g_choicesByRct = state.choicesByRct;
        g_choicesByBtn = state.choicesByBtn;
        g_choicePlayer = state.choicePlayer;
        g_choiceWait = state.choiceWait;
    } else {
        g_callStack = null;
        g_callResult = null;
        g_gameResult = null;
        g_loopCheck = 0;

        g_board = null;
        g_rows = 0;
        g_cols = 0;

        g_choicesByRct = null;
        g_choicesByBtn = null;
        g_choicePlayer = null;
        g_choiceWait = false;
    }

    g_mouseChoice = null;
    g_mouseAlt = false;

    console.log(g_callStack);
    console.log(g_choiceWait, g_undoStack.length);
}

function shouldStepToInput() {
    return g_gameResult !== true && g_choiceWait !== true && g_loopCheck !== true;
}

function stepToInput() {
    if (g_loopCheck !== true) {
        g_loopCheck = 0;
        while (shouldStepToInput()) {
            stepGameTree();
            ++ g_loopCheck;

            if (g_loopCheck === 100000) {
                g_loopCheck = true;
                setTimeout(() => { alert('too many steps before player input, stopping') }, 10);
                break;
            }
        }
    }
}

function preload() {
    if (GAME_SETUP.sprites !== null) {
        g_spriteImages = new Map();
        for (let imageName in GAME_SETUP.sprites.images) {
            let img = loadImage('data:image/png;base64,' + GAME_SETUP.sprites.images[imageName]);
            g_spriteImages.set(imageName, img);
        }
        g_spriteTiles = new Map();
        for (let tile in GAME_SETUP.sprites.tiles) {
            g_spriteTiles.set(tile, GAME_SETUP.sprites.tiles[tile]);
        }
        if (GAME_SETUP.sprites.players !== undefined) {
            for (let pid in GAME_SETUP.sprites.players) {
                g_player_id_colors.set(pid, GAME_SETUP.sprites.players[pid]);
            }
        }
        if (GAME_SETUP.sprites.back !== undefined) {
            g_back = GAME_SETUP.sprites.back;
        }
    }
}

function setup() {
    document.oncontextmenu = function() {
        return false;
    }

    g_callStack = null;
    g_callResult = null;
    g_gameResult = null;

    g_board = null;
    g_rows = 0;
    g_cols = 0;

    g_choicesByRct = null;
    g_choicesByBtn = null;
    g_choicePlayer = null;
    g_choiceWait = false;
    g_loopCheck = 0;

    g_mouseChoice = null;
    g_mouseAlt = false;

    g_canvas = createCanvas(tocvsx(g_cols) + g_padding, tocvsy(g_rows) + g_padding);
    g_canvas.mousePressed(mousePressed);
    g_canvas.mouseMoved(mouseMoved);
    g_canvas.mouseOut(mouseOut);

    if (g_spriteImages !== null) {
        let newImages = new Map();
        for (const [path, img] of g_spriteImages.entries()) {
            newImages.set(path, resizeImage(img, g_cell_size, g_cell_size));
        }
        g_spriteImages = newImages;
    }

    textAlign(CENTER, CENTER);
    textFont('Courier New');
    rectMode(CORNERS);
    imageMode(CENTER);
}

function draw() {
    stepToInput();

    background(255);

    noStroke();

    if (g_back !== null) {
        const brows = g_back.length;
        const bcols = g_back[0].length;

        for (let rr = 0; rr < g_rows; rr += 1) {
            for (let cc = 0; cc < g_cols; cc += 1) {
                let all_invis = true;
                for (const [layer, pattern] of Object.entries(g_board)) {
                    if (pattern[rr][cc] !== '.') {
                        all_invis = false;
                    }
                }
                if (!all_invis) {
                    let back_tile = g_back[rr % brows][cc % bcols];
                    if (g_spriteTiles !== null && g_spriteTiles.has(back_tile)) {
                        tint(255, 255, 255, 255);
                        let img = g_spriteImages.get(g_spriteTiles.get(back_tile));
                        image(img, tocvsx(cc + 0.5), tocvsy(rr + 0.5));
                    }
                }
            }
        }
    }

    let choiceOverwrite = null;
    if (g_mouseChoice !== null && !g_mouseAlt) {
        choiceOverwrite = {rct: g_mouseChoice.rct, rhs:g_choicesByRct.get(JSON.stringify(g_mouseChoice.rct)).choices[g_mouseChoice.idx].rhs };
    }

    for (let rr = 0; rr < g_rows; rr += 1) {
        for (let cc = 0; cc < g_cols; cc += 1) {
            let tiles = [];
            let overwrites = [];
            if (choiceOverwrite !== null &&
                choiceOverwrite.rct.row <= rr && rr < choiceOverwrite.rct.row + choiceOverwrite.rct.rows &&
                choiceOverwrite.rct.col <= cc && cc < choiceOverwrite.rct.col + choiceOverwrite.rct.cols) {
                for (const [layer, pattern] of Object.entries(g_board)) {
                    if (choiceOverwrite.rhs.hasOwnProperty(layer)) {
                        const tileOverwrite = choiceOverwrite.rhs[layer][rr - choiceOverwrite.rct.row][cc - choiceOverwrite.rct.col];
                        if (tileOverwrite !== '.') {
                            tiles.push(tileOverwrite);
                            overwrites.push(true);
                        } else {
                            tiles.push(pattern[rr][cc]);
                            overwrites.push(false);
                        }
                    } else {
                        tiles.push(pattern[rr][cc]);
                        overwrites.push(false);
                    }
                }
            } else {
                for (const [layer, pattern] of Object.entries(g_board)) {
                    tiles.push(pattern[rr][cc]);
                    overwrites.push(false);
                }
            }
            tiles = tiles.reverse();
            overwrites = overwrites.reverse();
            for (let ii in tiles) {
                const tile = tiles[ii];
                const overwrite = overwrites[ii];
                if (tile !== '.') {
                    if (g_spriteTiles !== null && g_spriteTiles.has(tile)) {
                        if (overwrite) {
                            tint(255, 255, 255, 128);
                        } else {
                            tint(255, 255, 255, 255);
                        }
                        const imgName = g_spriteTiles.get(tile);
                        if (imgName !== null) {
                            const img = g_spriteImages.get(imgName);
                            image(img, tocvsx(cc + 0.5), tocvsy(rr + 0.5));
                        }
                    } else {
                        if (overwrite) {
                            fill(0, 0, 0, 128);
                        } else {
                            fill(0, 0, 0, 255);
                        }
                        textSize(g_cell_size / tile.length);
                        text(tile, tocvsx(cc + 0.5), tocvsy(rr + 0.5));
                    }
                }
            }
        }
    }

    if (g_choicesByRct !== null) {
        strokeWeight(3);
        if (!g_player_id_colors.has(g_choicePlayer)) {
            let color_num = g_player_id_colors.size % 5;
            let next_color = null;
            if (color_num === 0) {
                next_color = [0, 0, 220];
            } else if (color_num === 1) {
                next_color = [0, 220, 0];
            } else if (color_num === 2) {
                next_color = [220, 220, 0];
            } else if (color_num === 3) {
                next_color = [220, 0, 220];
            } else {
                next_color = [0, 220, 220];
            }
            g_player_id_colors.set(g_choicePlayer, next_color);
        }

        let player_color = g_player_id_colors.get(g_choicePlayer);

        if (g_mouseChoice !== null) {
            stroke(player_color[0], player_color[1], player_color[2]);

            let rct = g_mouseChoice.rct;
            let idx = g_mouseChoice.idx;

            let rct_choices = g_choicesByRct.get(JSON.stringify(rct)).choices;
            let desc = rct_choices[idx].desc;

            noFill();
            rect(tocvsx(rct.col), tocvsy(rct.row), tocvsx(rct.col + rct.cols), tocvsy(rct.row + rct.rows), 3);
            if (rct_choices.length > 1) {
                noStroke();
                fill(player_color[0], player_color[1], player_color[2]);
                rect(tocvsx(rct.col), tocvsy(rct.row), tocvsx(rct.col + 0.4), tocvsy(rct.row + 0.4), 3);
                fill(220);
                textSize(0.9 * 0.4 * g_cell_size);
                text(idx + 1, tocvsx(rct.col + 0.2), tocvsy(rct.row + 0.2 + 0.025));
            }
            if (desc !== undefined) {
                noStroke();
                fill(player_color[0], player_color[1], player_color[2]);
                textSize(0.9 * 0.4 * g_cell_size);
                text(desc, tocvsx(rct.col + 0.5 * rct.cols), tocvsy(rct.row + rct.rows - 0.2));
            }
        } else {
            if (!g_mouseAlt) {
                stroke(player_color[0] * 0.5, player_color[1] * 0.5, player_color[2] * 0.5);

                for (const [rctk, rctChoices] of g_choicesByRct.entries()) {
                    let rct = rctChoices.rct;
                    let choices = rctChoices.choices;
                    noFill();
                    rect(tocvsx(rct.col), tocvsy(rct.row), tocvsx(rct.col + rct.cols), tocvsy(rct.row + rct.rows), 3);
                    if (choices.length > 1) {
                        fill(player_color[0] * 0.5, player_color[1] * 0.5, player_color[2] * 0.5);
                        rect(tocvsx(rct.col), tocvsy(rct.row), tocvsx(rct.col + 0.4), tocvsy(rct.row + 0.4), 3);
                        fill(220);
                        textSize(0.9 * 0.4 * g_cell_size);
                        text(choices.length, tocvsx(rct.col + 0.2), tocvsy(rct.row + 0.2 + 0.025));
                    }
                }
            }
        }
    }
}

function keyPressed() {
    if (key === 'n' || key === 'N') {
        if (shouldStepToInput()) {
            stepGameTree();
            if (key === 'n') {
                stepToInput();
            }
        }
    } else if (key === 'p' || key === 'P') {
        undoPop();
        if (key === 'p') {
            while (g_undoStack.length > 0 && shouldStepToInput()) {
                undoPop();
            }
        }
    }

    if (g_choiceWait === true) {
        let keyp = null;
        if (keyCode === LEFT_ARROW) {
            keyp = 'left';
        } else if (keyCode === RIGHT_ARROW) {
            keyp = 'right';
        } else if (keyCode === UP_ARROW) {
            keyp = 'up';
        } else if (keyCode === DOWN_ARROW) {
            keyp = 'down';
        } else if (key === 'z') {
            keyp = 'z';
        }
        if (keyp !== null && g_choicesByBtn.has(keyp)) {
            stepGameTree();

            g_choiceWait = g_choicesByBtn.get(keyp);
            rewriteLayerPattern(g_choiceWait.rhs, g_choiceWait.row, g_choiceWait.col);
            g_mouseChoice = null;
            g_choicesByRct = null;
            g_choicesByBtn = null;
            g_choicePlayer = null;
        }
    }

    return false;
}

function mousePressed() {
    if (mouseButton === LEFT) {
        if (g_mouseChoice !== null) {
            if (g_choiceWait === true) {
                stepGameTree();

                g_choiceWait = g_choicesByRct.get(JSON.stringify(g_mouseChoice.rct)).choices[g_mouseChoice.idx];
                rewriteLayerPattern(g_choiceWait.rhs, g_choiceWait.row, g_choiceWait.col);
                g_mouseChoice = null;
                g_choicesByRct = null;
                g_choicesByBtn = null;
                g_choicePlayer = null;
            }
        }
    } else if (mouseButton === RIGHT) {
        g_mouseAlt = true;
    }
}

function mouseReleased() {
    if (mouseButton === RIGHT) {
        g_mouseAlt = false;
    }
}

function mouseMoved() {
    g_mouseChoice = null;
    if (g_choicesByRct !== null) {
        const mr = fromcvsy(mouseY);
        const mc = fromcvsx(mouseX);
        if (0 <= mr && mr < g_rows && 0 <= mc && mc < g_cols) {
            let best_choices = [];
            let best_dist_sqr = null;

            for (const [rctk, rctChoices] of g_choicesByRct.entries()) {
                let rct = rctChoices.rct;
                let choices = rctChoices.choices;
                if (rct.row <= mr && mr <= rct.row + rct.rows && rct.col <= mc && mc <= rct.col + rct.cols) {
                    let rowmid = rct.row + rct.rows / 2.0;
                    let colmid = rct.col + rct.cols / 2.0;
                    let dist_sqr = (mr - rowmid) ** 2 + (mc - colmid) ** 2;
                    if (best_dist_sqr === null || dist_sqr < best_dist_sqr - 0.001) {
                        best_dist_sqr = dist_sqr;
                        best_choices = [];
                        for (let ii = 0; ii < choices.length; ii += 1) {
                            best_choices.push({rct:rct, idx:ii});
                        }
                    } else if (dist_sqr < best_dist_sqr + 0.001) {
                        for (let ii = 0; ii < choices.length; ii += 1) {
                            best_choices.push({rct:rct, idx:ii});
                        }
                    }
                }
            }

            if (best_choices.length > 0) {
                const choice_idx = Math.max(0, Math.min(best_choices.length - 1, Math.floor(best_choices.length * (mc - Math.floor(mc)))));
                g_mouseChoice = {rct:best_choices[choice_idx].rct, idx:best_choices[choice_idx].idx}
            }
        }
    }
}

function mouseOut() {
    g_mouseChoice = null;
}

function tocvsx(x) {
    return (x * g_cell_size) + g_padding;
}

function tocvsy(y) {
    return (y * g_cell_size) + g_padding;
}

function fromcvsx(x) {
    return (x - g_padding) / g_cell_size;
}

function fromcvsy(y) {
    return (y - g_padding) / g_cell_size;
}

function resizeImage(img, ww, hh) {
    let newimg = createImage(ww, hh);
    img.loadPixels();
    newimg.loadPixels();
    for (let xx = 0; xx < ww; xx += 1) {
        for (let yy = 0; yy < hh; yy += 1) {
            let pix = img.get(Math.floor(xx / ww * img.width), Math.floor(yy / hh * img.height));
            newimg.set(xx, yy, pix);
        }
    }
    newimg.updatePixels();
    return newimg;
}

function layerPatternSize(lpattern) {
    for (const [layer, pattern] of Object.entries(lpattern)) {
        return [pattern.length, pattern[0].length];
    }
    return [0, 0];
}

function matchLayerPattern(lpattern, row, col) {
    const [prows, pcols] = layerPatternSize(lpattern);

    for (let rr = 0; rr < prows; rr += 1) {
        for (let cc = 0; cc < pcols; cc += 1) {
            for (let layer in lpattern) {
                if (lpattern[layer][rr][cc] === '.') {
                    continue;
                }
                if (g_board[layer][row + rr][col + cc] !== lpattern[layer][rr][cc]) {
                    return false;
                }
            }
        }
    }
    return true;
}

function rewriteLayerPattern(lpattern, row, col) {
    const [prows, pcols] = layerPatternSize(lpattern);

    for (let rr = 0; rr < prows; rr += 1) {
        for (let cc = 0; cc < pcols; cc += 1) {
            for (let layer in lpattern) {
                if (lpattern[layer][rr][cc] === '.') {
                    continue;
                }
                g_board[layer][row + rr][col + cc] = lpattern[layer][rr][cc];
            }
        }
    }
}

function findLayerPattern(lpattern) {
    const [prows, pcols] = layerPatternSize(lpattern);

    let ret = []
    for (let rr = 0; rr < g_rows - prows + 1; rr += 1) {
        for (let cc = 0; cc < g_cols - pcols + 1; cc += 1) {
            if (matchLayerPattern(lpattern, rr, cc)) {
                ret.push({row:rr, col:cc});
            }
        }
    }
    return ret;
}

const NODE_FN_MAP = {
    'display-board': stepNodeDisplayBoard,
    'set-board': stepNodeSetBoard,
    'layer-template': stepNodeLayerTemplate,
    'append-rows': stepNodeAppendRows,
    'order': stepNodeOrder,
    'loop-until-all': stepNodeLoopUntilAll,
    'loop-times': stepNodeLoopTimes,
    'random-try': stepNodeRandomTry,
    'all': stepNodeAll,
    'none': stepNodeNone,
    'win': stepNodeWin,
    'lose': stepNodeLose,
    'draw': stepNodeDraw,
    'match': stepNodeMatch,
    'rewrite': stepNodeRewrite,
    'player': stepNodePlayer,
};

function localInit(frame, what) {
    if (frame.local === null) {
        frame.local = new Map();
        for (let [name, val] of what) {
            frame.local.set(name, val);
        }
    }
}

function localGet(frame, name) {
    return frame.local.get(name);
}

function localSet(frame, name, val) {
    return frame.local.set(name, val);
}

function localSetIfTrue(frame, name, check) {
    if (check === true) {
        frame.local.set(name, true);
    }
}

function localIncrement(frame, name) {
    frame.local.set(name, frame.local.get(name) + 1)
}

function localEqual(frame, name, val) {
    return frame.local.get(name) === val;
}

function pushCallStack(node) {
    g_callStack.push({node: node, local: null});
}

function pushCallStackNextChild(frame) {
    pushCallStack(frame.node.children[frame.local.get('index')]);
    frame.local.set('index', frame.local.get('index') + 1);
    return null;
}

function stepGameTree(stack) {
    if (g_loopCheck !== true) {
        if (g_callStack === null) {
            g_callStack = [];
            pushCallStack(GAME_SETUP.tree);
        }

        if (g_gameResult === true) {
        } else if (g_gameResult === null) {
            undoPush();

            if (g_callStack.length === 0) {
                g_gameResult = {result:'stalemate'};
            } else {
                var frame = g_callStack.at(-1);
                g_callResult = NODE_FN_MAP[frame.node.type](frame, g_callResult);

                if (g_callResult === true || g_callResult === false) {
                    g_callStack.pop();
                }
            }
        } else {
            undoPush();

            if (g_gameResult.result === 'win') {
                var player = g_gameResult.player;
                setTimeout(() => { alert('Game over, player ' + player + ' wins!') }, 10);
            } else if (g_gameResult.result === 'lose') {
                var player = g_gameResult.player;
                setTimeout(() => { alert('Game over, player ' + player + ' loses!') }, 10);
            } else if (g_gameResult.result === 'draw') {
                setTimeout(() => { alert('Game over, draw!') }, 10);
            } else if (g_gameResult.result === 'stalemate') {
                setTimeout(() => { alert('Game over, stalemate!') }, 10);
            } else {
                setTimeout(() => { alert('Game over, unknown result!') }, 10);
            }
            g_gameResult = true;
        }
    }
}

function stepNodeOrder(frame, lastResult) {
    localInit(frame, [['any', false],
                      ['index', 0]]);

    localSetIfTrue(frame, 'any', lastResult);

    if (localEqual(frame, 'index', frame.node.children.length)) {
        return localGet(frame, 'any');
    } else {
        return pushCallStackNextChild(frame);
    }
}

function stepNodeLoopUntilAll(frame, lastResult) {
    localInit(frame, [['any', false],
                      ['anyThisLoop', false],
                      ['index', 0]]);

    localSetIfTrue(frame, 'any', lastResult);
    localSetIfTrue(frame, 'anyThisLoop', lastResult);

    if (localEqual(frame, 'index', frame.node.children.length)) {
        if (localGet(frame, 'anyThisLoop')) {
            localSet(frame, 'anyThisLoop', false);
            localSet(frame, 'index', 0);
        } else {
            return localGet(frame, 'any');
        }
    } else {
        return pushCallStackNextChild(frame);
    }
}

function stepNodeLoopTimes(frame, lastResult) {
    localInit(frame, [['any', false],
                      ['times', 0],
                      ['index', 0]]);

    localSetIfTrue(frame, 'any', lastResult);

    if (localEqual(frame, 'index', frame.node.children.length)) {
        if (localEqual(frame, 'times', frame.node.times)) {
            return localGet(frame, 'any');
        } else {
            localIncrement('times');
            localSet(frame, 'index', 0);
        }
    } else {
        return pushCallStackNextChild(frame);
    }
}

function stepNodeRandomTry(frame, lastResult) {
    localInit(frame, [['order', null]]);

    if (localEqual(frame, 'order', null)) {
        var order = [];
        for (var ii = 0; ii < frame.node.children.length; ++ ii) {
            order.push(ii);
        }
        order.sort((a, b) => 0.5 - Math.random());
        localSet(frame, 'order', order);
    }


    if (lastResult === true) {
        return true;
    } else if (localGet(frame, 'order').length == 0) {
        return false;
    } else {
        const index = localGet(frame, 'order').pop();
        pushCallStack(frame.node.children[index]);
        return null;
    }
}

function stepNodeAll(frame, lastResult) {
    localInit(frame, [['index', 0]]);

    if (lastResult === false) {
        return false;
    } else if (localEqual(frame, 'index', frame.node.children.length)) {
        return true;
    } else {
        return pushCallStackNextChild(frame);
    }
}

function stepNodeNone(frame, lastResult) {
    localInit(frame, [['index', 0]]);

    if (lastResult === true) {
        return false;
    } else if (localEqual(frame, 'index', frame.node.children.length)) {
        return true;
    } else {
        return pushCallStackNextChild(frame);
    }
}

function stepNodeWin(frame, lastResult) {
    localInit(frame, [['index', 0]]);

    if (lastResult === true) {
        g_gameResult = {result:'win', player:frame.node.pid};
        return null;
    } else if (localEqual(frame, 'index', frame.node.children.length)) {
        return false;
    } else {
        return pushCallStackNextChild(frame);
    }
}

function stepNodeLose(frame, lastResult) {
    localInit(frame, [['index', 0]]);

    if (lastResult === true) {
        g_gameResult = {result:'lose', player:frame.node.pid};
        return null;
    } else if (localEqual(frame, 'index', frame.node.children.length)) {
        return false;
    } else {
        return pushCallStackNextChild(frame);
    }
}

function stepNodeDraw(frame, lastResult) {
    localInit(frame, [['index', 0]]);

    if (lastResult === true) {
        g_gameResult = {result:'draw'};
        return null;
    } else if (localEqual(frame, 'index', frame.node.children.length)) {
        return false;
    } else {
        return pushCallStackNextChild(frame);
    }
}

function stepNodeSetBoard(frame, lastResult) {
    g_board = JSON.parse(JSON.stringify(frame.node.pattern));

    const [newRows, newCols] = layerPatternSize(g_board);
    if (newRows !== g_rows || newCols !== g_cols) {
        g_rows = newRows;
        g_cols = newCols;

        g_canvas = resizeCanvas(tocvsx(g_cols) + g_padding, tocvsy(g_rows) + g_padding);
    }

    return true;
}

function stepNodeDisplayBoard(frame, lastResult) {
    return true;
}

function stepNodeLayerTemplate(frame, lastResult) {
    let newLayer = [];
    for (let row of g_board['main']) {
        let newRow = [];
        for (let tile of row) {
            if (tile === '.') {
                newRow.push('.');
            } else {
                newRow.push(frame.node.with);
            }
        }
        newLayer.push(newRow);
    }

    g_board[frame.node.what] = newLayer;

    return true;
}

function stepNodeAppendRows(frame, lastResult) {
    if (g_rows === 0 || g_cols === 0) {
        g_board = frame.node.pattern.slice();
    } else {
        for (let patternRow of frame.node.pattern) {
            let newRow = []
            while (newRow.length < g_cols) {
                for (let tile of patternRow) {
                    if (newRow.length < g_cols) {
                        newRow.push(tile);
                    }
                }
            }
            g_board.push(newRow);
        }
    }

    let newRows = g_board.length;
    let newCols = g_board[0].length;
    if (newRows !== g_rows || newCols !== g_cols) {
        g_rows = g_board.length;
        g_cols = g_board[0].length;

        g_canvas = resizeCanvas(tocvsx(g_cols) + g_padding, tocvsy(g_rows) + g_padding);
    }

    return true;
}

function stepNodeMatch(frame, lastResult) {
    if (findLayerPattern(frame.node.pattern).length > 0) {
        return true;
    } else {
        return false;
    }
}

function stepNodeRewrite(frame, lastResult) {
    let matches = findLayerPattern(frame.node.lhs);
    if (matches.length > 0) {
        let match = matches[Math.floor(Math.random()*matches.length)];
        rewriteLayerPattern(frame.node.rhs, match.row, match.col);
        return true;
    } else {
        return false;
    }
}

function stepNodePlayer(frame, lastResult) {
    if (g_choiceWait === true) {
        return null;
    } else if (g_choiceWait !== false) {
        let choiceInfo = g_choiceWait;
        g_choiceWait = false;

        rewriteLayerPattern(choiceInfo.rhs, choiceInfo.row, choiceInfo.col);
        return true;
    } else {
        let choices = []
        for (let child of frame.node.children) {
            if (child.type === 'rewrite') {
                let matches = findLayerPattern(child.lhs);
                for (let match of matches) {
                    choices.push({desc:child.desc, button:child.button, rhs:child.rhs, row:match.row, col:match.col});
                }
            }
        }

        let choicesUnique = []
        let choicesSeen = new Set();
        for (let choice of choices) {
            const choicek = JSON.stringify(choice);
            if (!choicesSeen.has(choicek)) {
                choicesSeen.add(choicek);
                choicesUnique.push(choice);
            }
        }
        choices = choicesUnique;

        if (choices.length > 0) {
            g_choicePlayer = frame.node.pid;

            g_choicesByRct = new Map();
            g_choicesByBtn = new Map();

            for (let choice of choices) {
                let [rowsChoice, colsChoice] = layerPatternSize(choice.rhs);
                let rct = {row:choice.row, col:choice.col, rows:rowsChoice, cols:colsChoice };
                let rctk = JSON.stringify(rct);

                let mapChoices = []
                if (g_choicesByRct.has(rctk)) {
                    mapChoices = g_choicesByRct.get(rctk).choices;
                }

                mapChoices.push(choice);
                g_choicesByRct.set(rctk, {rct:rct, choices:mapChoices});

                if (choice.button !== undefined) {
                    g_choicesByBtn.set(choice.button, choice);
                }
            }

            g_choiceWait = true;

            return null;
        } else {
            return false;
        }
    }
}
