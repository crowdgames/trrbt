let g_board = null;
let g_rows = 0;
let g_cols = 0;

let g_canvas = null;
let g_padding = 10;
let g_cell_size = 50;

let g_spriteImages = null;
let g_spriteTiles = null;
let g_back = null;

let g_player_id_colors = new Map();

let g_mouseChoice = null;
let g_mouseAlt = false;

let g_choicesByRct = null;
let g_choicePlayer = null;
let g_choiceWait = false;

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

    g_board = null;
    g_rows = 0;
    g_cols = 0;

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

    runGameTree(GAME_SETUP.tree);
}

function draw() {
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

const waitForChoice = () => new Promise(resolve => {
    function checkChoiceMade(resolve) {
        if (g_choiceWait !== true) {
            resolve();
        } else {
            setTimeout(() => { checkChoiceMade(resolve); });
        }
    }

    g_choiceWait = true;
    checkChoiceMade(resolve);
});

function mousePressed() {
    if (mouseButton === LEFT) {
        if (g_mouseChoice !== null) {
            if (g_choiceWait === true) {
                g_choiceWait = g_choicesByRct.get(JSON.stringify(g_mouseChoice.rct)).choices[g_mouseChoice.idx];
                rewriteLayerPattern(g_choiceWait.rhs, g_choiceWait.row, g_choiceWait.col);
                g_mouseChoice = null;
                g_choicesByRct = null;
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
        const mc = fromcvsy(mouseX);
        if (0 <= mr && mr < g_rows && 0 <= mc && mc < g_cols) {
            let choice = null;
            let best_choice = null;

            for (const [rctk, rctChoices] of g_choicesByRct.entries()) {
                let rct = rctChoices.rct;
                let choices = rctChoices.choices;
                if (rct.row <= mr && mr <= rct.row + rct.rows && rct.col <= mc && mc <= rct.col + rct.cols) {
                    let rowmid = rct.row + rct.rows / 2.0;
                    let colmid = rct.col + rct.cols / 2.0;
                    let dist_sqr = (mr - rowmid) ** 2 + (mc - colmid) ** 2;
                    if (best_choice === null || dist_sqr < best_choice) {
                        best_choice = dist_sqr;
                        let idx = Math.max(0, Math.min(choices.length - 1, Math.floor((mc - rct.col) / rct.cols * choices.length)));
                        g_mouseChoice = {rct:rct, idx:idx};
                    }
                }
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
    return (y - g_padding) / g_cell_size;
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

async function runGameTree(tree) {
    let fnMap = {
        'display-board': runNodeDisplayBoard,
        'set-board': runNodeSetBoard,
        'layer-template': runNodeLayerTemplate,
        'append-rows': runNodeAppendRows,
        'order': runNodeOrder,
        'loop-until-all': runNodeLoopUntilAll,
        'loop-times': runNodeLoopTimes,
        'random-try': runNodeRandomTry,
        'all': runNodeAll,
        'none': runNodeNone,
        'win': runNodeWin,
        'lose': runNodeLose,
        'draw': runNodeDraw,
        'match': runNodeMatch,
        'rewrite': runNodeRewrite,
        'player': runNodePlayer,
    };
    try {
        await runNode(tree, fnMap);
    } catch(ex) {
        if (ex.result === 'win') {
            setTimeout(() => { alert('Game over, player ' + ex.player + ' wins!'); }, 10);
        } else if (ex.result === 'lose') {
            setTimeout(() => { alert('Game over, player ' + ex.player + ' loses!'); }, 10);
        } else if (ex.result === 'draw') {
            setTimeout(() => { alert('Game over, draw!'); }, 10);
        } else {
            throw ex;
        }
        return;
    }
    setTimeout(() => { alert('Game over, stalemate!'); }, 10);
}

async function runNode(node, fnMap) {
    if (node.type in fnMap) {
        return await fnMap[node.type](node, fnMap);
    } else {
        console.log('unknown node type ' + node.type);
        return false;
    }
}

async function runNodeOrder(node, fnMap) {
    let flag = false;
    for (let child of node.children) {
        if (await runNode(child, fnMap)) {
            flag = true;
        }
    }
    return flag;
}

async function runNodeDisplayBoard(node, fnMap) {
    return true;
}

async function runNodeSetBoard(node, fnMap) {
    g_board = JSON.parse(JSON.stringify(node.pattern));

    const [newRows, newCols] = layerPatternSize(g_board);
    if (newRows !== g_rows || newCols !== g_cols) {
        g_rows = newRows;
        g_cols = newCols;

        g_canvas = resizeCanvas(tocvsx(g_cols) + g_padding, tocvsy(g_rows) + g_padding);
    }

    return true;
}

async function runNodeLayerTemplate(node, fnMap) {
    let newLayer = [];
    for (let row of g_board['main']) {
        let newRow = [];
        for (let tile of row) {
            if (tile === '.') {
                newRow.push('.');
            } else {
                newRow.push(node.with);
            }
        }
        newLayer.push(newRow);
    }

    g_board[node.what] = newLayer;

    return true;
}

async function runNodeAppendRows(node, fnMap) {
    if (g_rows === 0 || g_cols === 0) {
        g_board = node.pattern.slice();
    } else {
        for (let patternRow of node.pattern) {
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

async function runNodeLoopUntilAll(node, fnMap) {
    let flag = false;
    let keep_going = true;
    while (keep_going) {
        keep_going = false;
        for (let child of node.children) {
            if (await runNode(child, fnMap)) {
                flag = true;
                keep_going = true;
            }
        }
    }
    return flag;
}

async function runNodeLoopTimes(node, fnMap) {
    let flag = false;
    let times = node.times;
    while (times > 0) {
        times -= 1;
        for (let child of node.children) {
            if (await runNode(child, fnMap)) {
                flag = true;
            }
        }
    }
    return flag;
}

async function runNodeRandomTry(node, fnMap) {
    children = node.children.slice();
    children.sort((a, b) => 0.5 - Math.random());
    for (let child of children) {
        if (await runNode(child, fnMap)) {
            return true;
        }
    }
    return false;
}

async function runNodeAll(node, fnMap) {
    for (let child of node.children) {
        if (!await runNode(child, fnMap)) {
            return false;
        }
    }
    return true;
}

async function runNodeNone(node, fnMap) {
    for (let child of node.children) {
        if (await runNode(child, fnMap)) {
            return false;
        }
    }
    return true;
}

async function runNodeWin(node, fnMap) {
    for (let child of node.children) {
        if (await runNode(child, fnMap)) {
            throw {result:'win', player:node.pid};
        }
    }
    return false;
}

async function runNodeLose(node, fnMap) {
    for (let child of node.children) {
        if (await runNode(child, fnMap)) {
            throw {result:'lose', player:node.pid};
        }
    }
    return false;
}

async function runNodeDraw(node, fnMap) {
    for (let child of node.children) {
        if (await runNode(child, fnMap)) {
            throw {result:'draw'};
        }
    }
    return false;
}

async function runNodeMatch(node, fnMap) {
    if (findLayerPattern(node.pattern).length > 0) {
        return true;
    } else {
        return false;
    }
}

async function runNodeRewrite(node, fnMap) {
    let matches = findLayerPattern(node.lhs);
    if (matches.length > 0) {
        let match = matches[Math.floor(Math.random()*matches.length)];
        rewriteLayerPattern(node.rhs, match.row, match.col);
        return true;
    } else {
        return false;
    }
}

async function runNodePlayer(node, fnMap) {
    let choices = []
    for (let child of node.children) {
        if (child.type === 'rewrite') {
            let matches = findLayerPattern(child.lhs);
            for (let match of matches) {
                choices.push({desc:child.desc, rhs:child.rhs, row:match.row, col:match.col});
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
        g_choicePlayer = node.pid;

        g_choicesByRct = new Map();

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
        }

        await waitForChoice();

        let choiceInfo = g_choiceWait;
        g_choiceWait = false;

        rewriteLayerPattern(choiceInfo.rhs, choiceInfo.row, choiceInfo.col);
        return true;
    } else {
        return false;
    }
}
