window.addEventListener('load', ENG_onLoad, false);



let ENG_canvas = null;
let ENG_ctx = null;
let ENG_padding = 10;
let ENG_cell_size = 50;
let ENG_keysDown = new Set();

let ENG_spriteImages = null;
let ENG_spriteTiles = null;
let ENG_back = null;

let ENG_player_id_colors = new Map();

let ENG_undoStackPlayer = [];
let ENG_undoStackRecent = [];

let ENG_callStack = null;
let ENG_callResult = null;
let ENG_gameResult = null;
let ENG_loopCheck = 0;

let ENG_board = null;
let ENG_rows = 0;
let ENG_cols = 0;

let ENG_choicesByRct = null;
let ENG_choicesByBtn = null;
let ENG_choicePlayer = null;
let ENG_choiceWait = false;

let ENG_mouseChoice = null;
let ENG_mouseAlt = false;
let ENG_stepManual = false;
let ENG_stepDelay = null;

const ENG_FONTNAME = 'px Courier New, Courier, sans-serif';

const ENG_UNDO_PLAYER_MAX = 100;
const ENG_UNDO_RECENT_MAX = 100;



function ENG_updateEditor() {
    if (typeof EDT_updatePositionsAndDraw !== 'undefined') {
        EDT_updatePositionsAndDraw();
    }
}

function ENG_undoPush() {
    var callStackCopy = null;

    if (ENG_callStack !== null) {
        callStackCopy = [];
        for (var frame of ENG_callStack) {
            var frameCopy = {node: frame.node, local: copymap(frame.local)};
            callStackCopy.push(frameCopy);
        }
    }

    var state = {};

    state.callStack = callStackCopy;
    state.callResult = ENG_callResult;
    state.gameResult = deepcopyobj(ENG_gameResult);
    state.loopCheck = ENG_loopCheck;

    state.board = deepcopyobj(ENG_board);
    state.rows = ENG_rows;
    state.cols = ENG_cols;

    state.choicesByRct = copymap(ENG_choicesByRct);
    state.choicesByBtn = copymap(ENG_choicesByBtn);
    state.choicePlayer = ENG_choicePlayer;
    state.choiceWait = deepcopyobj(ENG_choiceWait);

    while (ENG_undoStackRecent.length >= ENG_UNDO_RECENT_MAX) {
        var oldState = ENG_undoStackRecent.shift();
        if (oldState.callStack !== null && oldState.callStack.length > 0 && oldState.callStack.at(-1).node.type === 'player' && oldState.choiceWait === true) {
            while (ENG_undoStackPlayer.length >= ENG_UNDO_PLAYER_MAX) {
                ENG_undoStackPlayer.shift();
            }
            ENG_undoStackPlayer.push(oldState);
        }
    }
    ENG_undoStackRecent.push(state);
}

function ENG_undoPop() {
    var state = null;
    if (ENG_undoStackRecent.length > 0) {
        state = ENG_undoStackRecent.pop();
    } else if (ENG_undoStackPlayer.length > 0) {
        state = ENG_undoStackPlayer.pop();
    }

    if (state !== null) {
        ENG_callStack = state.callStack;
        ENG_callResult = state.callResult;
        ENG_gameResult = state.gameResult;
        ENG_loopCheck: state.loopCheck;

        ENG_board = state.board;
        ENG_rows = state.rows;
        ENG_cols = state.cols;

        ENG_choicesByRct = state.choicesByRct;
        ENG_choicesByBtn = state.choicesByBtn;
        ENG_choicePlayer = state.choicePlayer;
        ENG_choiceWait = state.choiceWait;
    } else {
        ENG_callStack = null;
        ENG_callResult = null;
        ENG_gameResult = null;
        ENG_loopCheck = 0;

        ENG_board = null;
        ENG_rows = null;
        ENG_cols = null;

        ENG_choicesByRct = null;
        ENG_choicesByBtn = null;
        ENG_choicePlayer = null;
        ENG_choiceWait = false;
    }

    ENG_mouseChoice = null;
    ENG_mouseAlt = false;
    ENG_stepDelay = null;

    ENG_resizeCanvas();
}

function ENG_undoEmpty() {
    return (ENG_undoStackRecent.length + ENG_undoStackPlayer.length) === 0;
}

function ENG_shouldStepToInput() {
    return ENG_gameResult !== true && ENG_choiceWait !== true && ENG_loopCheck !== true && ENG_stepDelay === null;
}

function ENG_stepToInput() {
    var stepped = false;

    if (ENG_loopCheck !== true) {
        ENG_loopCheck = 0;
        while (ENG_shouldStepToInput()) {
            ENG_stepGameTree();
            ++ ENG_loopCheck;
            stepped = true;

            if (ENG_loopCheck === 100000) {
                ENG_loopCheck = true;
                setTimeout(() => { alert('too many steps before player input, stopping') }, 100);
                break;
            }
        }
    }

    if (stepped) {
        ENG_updateEditor();
    }
}

function ENG_arrayToImageData(from_data, fw, fh, ww, hh) {
    let new_data = new Uint8ClampedArray(ww * hh * 4);
    for (let xx = 0; xx < ww; xx += 1) {
        for (let yy = 0; yy < hh; yy += 1) {
            const fx = Math.floor(xx / ww * fw);
            const fy = Math.floor(yy / hh * fh);

            new_data[4 * (yy * ww + xx) + 0] = from_data[4 * (fy * fw + fx) + 0];
            new_data[4 * (yy * ww + xx) + 1] = from_data[4 * (fy * fw + fx) + 1];
            new_data[4 * (yy * ww + xx) + 2] = from_data[4 * (fy * fw + fx) + 2];
            new_data[4 * (yy * ww + xx) + 3] = from_data[4 * (fy * fw + fx) + 3];
        }
    }
    return new ImageData(new_data, ww, hh);
}

function ENG_loadSpriteImage(image_name, image_info) {
    ENG_spriteImages.set(image_name, null);

    const image_info_data = image_info.data;
    const image_decoded = atob(image_info_data);
    const image_array = Uint8Array.from(image_decoded, c => c.charCodeAt(0));
    const image_blob = new Blob([image_array.buffer]);
    const image_decompressed = image_blob.stream().pipeThrough(new DecompressionStream('deflate'));
    const image_reader = image_decompressed.getReader();

    let image_read_array = null;

    image_reader.read().then(function process({ done, value }) {
        if (!done) {
            if (image_read_array === null) {
                image_read_array = value;
            } else {
                var merged_array = new Uint8Array(image_read_array.length + value.length);
                merged_array.set(image_read_array);
                merged_array.set(value, image_read_array.length);
                image_read_array = merged_array;
            }
            return image_reader.read().then(process);
        } else {
            const image_data = ENG_arrayToImageData(image_read_array, image_info.size[0], image_info.size[1], ENG_cell_size, ENG_cell_size);
            let img_promise = createImageBitmap(image_data);
            img_promise.then((img_loaded) => ENG_spriteImages.set(image_name, img_loaded));
        }
    });
}

function ENG_onLoad() {
    document.oncontextmenu = function() {
        return false;
    }

    ENG_callStack = null;
    ENG_callResult = null;
    ENG_gameResult = null;

    ENG_board = null;
    ENG_rows = null;
    ENG_cols = null;

    ENG_choicesByRct = null;
    ENG_choicesByBtn = null;
    ENG_choicePlayer = null;
    ENG_choiceWait = false;
    ENG_loopCheck = 0;

    ENG_mouseChoice = null;
    ENG_mouseAlt = false;
    ENG_stepDelay = null;
    ENG_stepManual = false;

    ENG_canvas = document.getElementById('enginecanvas');
    ENG_ctx = ENG_canvas.getContext('2d');
    ENG_keysDown = new Set();

    ENG_canvas.addEventListener('mousedown', ENG_onMouseDown);
    ENG_canvas.addEventListener('mousemove', ENG_onMouseMove);
    ENG_canvas.addEventListener('mouseup', ENG_onMouseUp);
    ENG_canvas.addEventListener('mouseout', ENG_onMouseOut);
    ENG_canvas.addEventListener('keydown', ENG_onKeyDown);
    ENG_canvas.addEventListener('keyup', ENG_onKeyUp);
    ENG_canvas.focus();

    if (GAME_SETUP.sprites !== null) {
        ENG_spriteImages = new Map();
        for (let imageName in GAME_SETUP.sprites.images) {
            const image_info = GAME_SETUP.sprites.images[imageName];
            ENG_loadSpriteImage(imageName, image_info)
        }
        ENG_spriteTiles = new Map();
        for (let tile in GAME_SETUP.sprites.tiles) {
            ENG_spriteTiles.set(tile, GAME_SETUP.sprites.tiles[tile]);
        }
        if (GAME_SETUP.sprites.players !== undefined) {
            for (let pid in GAME_SETUP.sprites.players) {
                ENG_player_id_colors.set(pid, GAME_SETUP.sprites.players[pid]);
            }
        }
        if (GAME_SETUP.sprites.back !== undefined) {
            ENG_back = GAME_SETUP.sprites.back;
        }
    }

    ENG_canvas.style.backgroundColor = '#ffffff';

    ENG_resizeCanvas();
    window.requestAnimationFrame(ENG_onDraw);
}

function ENG_onDraw() {
    if (ENG_spriteImages !== null) {
        for (let [imgName, img] of ENG_spriteImages) {
            if (img === null) {
                window.requestAnimationFrame(ENG_onDraw);
                return;
            }
        }
    }

    if (ENG_stepDelay !== null) {
        if (Date.now() < ENG_stepDelay) {
            window.requestAnimationFrame(ENG_onDraw);
            return;
        } else {
            ENG_stepDelay = null;
        }
    }

    if (!ENG_stepManual) {
        ENG_stepToInput();
    }

    if (ENG_stepDelay !== null) {
        window.requestAnimationFrame(ENG_onDraw);
    }

    ENG_ctx.clearRect(0, 0, ENG_canvas.width, ENG_canvas.height);
    ENG_ctx.fillStyle = '#eeeeee';
    ENG_ctx.fillRect(0, 0, ENG_canvas.width, ENG_canvas.height);
    ENG_ctx.textAlign = 'center';
    ENG_ctx.textBaseline = 'middle';

    if (ENG_back !== null) {
        const brows = ENG_back.length;
        const bcols = ENG_back[0].length;

        for (let rr = 0; rr < ENG_rows; rr += 1) {
            for (let cc = 0; cc < ENG_cols; cc += 1) {
                let all_invis = true;
                for (const [layer, pattern] of Object.entries(ENG_board)) {
                    if (pattern[rr][cc] !== '.') {
                        all_invis = false;
                    }
                }
                if (!all_invis) {
                    const back_tile = ENG_back[rr % brows][cc % bcols];
                    if (ENG_spriteTiles !== null && ENG_spriteTiles.has(back_tile)) {
                        const img = ENG_spriteImages.get(ENG_spriteTiles.get(back_tile));
                        ENG_ctx.drawImage(img, ENG_tocvsx(cc), ENG_tocvsy(rr));
                    }
                }
            }
        }
    }

    let choiceOverwrite = null;
    if (ENG_mouseChoice !== null && !ENG_mouseAlt) {
        choiceOverwrite = {rct: ENG_mouseChoice.rct, rhs:ENG_choicesByRct.get(JSON.stringify(ENG_mouseChoice.rct)).choices[ENG_mouseChoice.idx].rhs };
    }

    ENG_ctx.fillStyle = '#000000';

    for (let rr = 0; rr < ENG_rows; rr += 1) {
        for (let cc = 0; cc < ENG_cols; cc += 1) {
            let tiles = [];
            let overwrites = [];
            if (choiceOverwrite !== null &&
                choiceOverwrite.rct.row <= rr && rr < choiceOverwrite.rct.row + choiceOverwrite.rct.rows &&
                choiceOverwrite.rct.col <= cc && cc < choiceOverwrite.rct.col + choiceOverwrite.rct.cols) {
                for (const [layer, pattern] of Object.entries(ENG_board)) {
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
                for (const [layer, pattern] of Object.entries(ENG_board)) {
                    tiles.push(pattern[rr][cc]);
                    overwrites.push(false);
                }
            }
            tiles = tiles.reverse();
            overwrites = overwrites.reverse();
            for (let ii in tiles) {
                const tile = tiles[ii];
                const overwrite = overwrites[ii];
                if (overwrite) {
                    ENG_ctx.globalAlpha = 0.5;
                } else {
                    ENG_ctx.globalAlpha = 1.0;
                }
                if (tile !== '.') {
                    if (ENG_spriteTiles !== null && ENG_spriteTiles.has(tile)) {
                        const imgName = ENG_spriteTiles.get(tile);
                        if (imgName !== null) {
                            const img = ENG_spriteImages.get(imgName);
                            ENG_ctx.drawImage(img, ENG_tocvsx(cc), ENG_tocvsy(rr));
                        }
                    } else {
                        ENG_ctx.font = (ENG_cell_size / tile.length) + ENG_FONTNAME;
                        ENG_ctx.fillText(tile, ENG_tocvsx(cc + 0.5), ENG_tocvsy(rr + 0.5));
                    }
                }
            }
        }
    }

    if (ENG_choicesByRct !== null) {
        ENG_ctx.lineWidth = 3;
        ENG_ctx.globalAlpha = 1.0;

        if (!ENG_player_id_colors.has(ENG_choicePlayer)) {
            let color_num = ENG_player_id_colors.size % 5;
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
            ENG_player_id_colors.set(ENG_choicePlayer, next_color);
        }

        let player_color = ENG_player_id_colors.get(ENG_choicePlayer);

        if (ENG_mouseChoice !== null) {
            let rct = ENG_mouseChoice.rct;
            let idx = ENG_mouseChoice.idx;

            let rct_choices = ENG_choicesByRct.get(JSON.stringify(rct)).choices;
            let desc = rct_choices[idx].desc;

            ENG_ctx.strokeStyle = `rgb(${player_color[0]}, ${player_color[1]}, ${player_color[2]})`;
            ENG_ctx.beginPath();
            ENG_ctx.roundRect(ENG_tocvsx(rct.col), ENG_tocvsy(rct.row), rct.cols * ENG_cell_size, rct.rows * ENG_cell_size, 3);
            ENG_ctx.stroke();

            if (rct_choices.length > 1) {
                ENG_ctx.fillStyle = `rgb(${player_color[0]}, ${player_color[1]}, ${player_color[2]})`;
                ENG_ctx.beginPath();
                ENG_ctx.roundRect(ENG_tocvsx(rct.col), ENG_tocvsy(rct.row), 0.4 * ENG_cell_size, 0.4 * ENG_cell_size, 3);
                ENG_ctx.fill();
                ENG_ctx.fillStyle = '#DCDCDC'
                ENG_ctx.font = (0.9 * 0.4 * ENG_cell_size) + ENG_FONTNAME;
                ENG_ctx.fillText(idx + 1, ENG_tocvsx(rct.col + 0.2), ENG_tocvsy(rct.row + 0.2 + 0.025));
            }
            if (desc !== undefined) {
                ENG_ctx.fillStyle = `rgb(${player_color[0]}, ${player_color[1]}, ${player_color[2]})`;
                ENG_ctx.font = (0.9 * 0.4 * ENG_cell_size) + ENG_FONTNAME;
                ENG_ctx.fillText(desc, ENG_tocvsx(rct.col + 0.5 * rct.cols), ENG_tocvsy(rct.row + rct.rows - 0.2));
            }
        } else {
            if (!ENG_mouseAlt) {
                ENG_ctx.strokeStyle = `rgb(${player_color[0] * 0.5}, ${player_color[1] * 0.5}, ${player_color[2] * 0.5})`;

                for (const [rctk, rctChoices] of ENG_choicesByRct.entries()) {
                    let rct = rctChoices.rct;
                    let choices = rctChoices.choices;
                    ENG_ctx.beginPath();
                    ENG_ctx.roundRect(ENG_tocvsx(rct.col), ENG_tocvsy(rct.row), rct.cols * ENG_cell_size, rct.rows * ENG_cell_size, 3);
                    ENG_ctx.stroke();
                    if (choices.length > 1) {
                        ENG_ctx.fillStyle = `rgb(${player_color[0] * 0.5}, ${player_color[1] * 0.5}, ${player_color[2] * 0.5})`;
                        ENG_ctx.beginPath();
                        ENG_ctx.roundRect(ENG_tocvsx(rct.col), ENG_tocvsy(rct.row), 0.4 * ENG_cell_size, 0.4 * ENG_cell_size, 3);
                        ENG_ctx.fill();
                        ENG_ctx.fillStyle = '#DCDCDC'
                        ENG_ctx.font = (0.9 * 0.4 * ENG_cell_size) + ENG_FONTNAME;
                        ENG_ctx.fillText(choices.length, ENG_tocvsx(rct.col + 0.2), ENG_tocvsy(rct.row + 0.2 + 0.025));
                    }
                }
            }
        }
    }

    if (ENG_stepManual) {
        ENG_ctx.lineWidth = 10;
        ENG_ctx.strokeStyle = '#ffdddd';
        ENG_ctx.strokeRect(0, 0, ENG_canvas.width / PIXEL_RATIO, ENG_canvas.height / PIXEL_RATIO);
    }
}

function ENG_resizeCanvas() {
    const desiredWidth = ENG_tocvsx(Math.max(1, ENG_cols)) + ENG_padding;
    const desiredHeight = ENG_tocvsy(Math.max(1, ENG_rows)) + ENG_padding;
    if (ENG_canvas.width != desiredWidth || ENG_canvas.height != desiredHeight) {
        const ratio = window.devicePixelRatio;
        ENG_canvas.width = desiredWidth * ratio;
        ENG_canvas.height = desiredHeight * ratio;
        ENG_canvas.style.width = desiredWidth + "px";
        ENG_canvas.style.height = desiredHeight + "px";
        ENG_ctx.scale(ratio, ratio);
    }
}

function ENG_onKeyDown(evt) {
    var key = evt.key;

    if (!ENG_keysDown.has(key)) {
        ENG_keysDown.add(key);

        if (key === 'b' || key === 'B') {
            ENG_stepManual = !ENG_stepManual;
        } else if (key === 'n' || key === 'N') {
            if (ENG_shouldStepToInput()) {
                ENG_stepGameTree();
                if (key === 'n') {
                    ENG_stepToInput();
                }
                ENG_updateEditor();
            } else {
                ENG_stepManual = true;
            }
        } else if (key === 'p' || key === 'P') {
            ENG_undoPop();
            if (key === 'p') {
                while (!ENG_undoEmpty() && ENG_shouldStepToInput()) {
                    ENG_undoPop();
                }
            } else {
                ENG_stepManual = true;
            }
            ENG_updateEditor();
        }

        if (ENG_choiceWait === true) {
            let keyp = null;
            if (key === 'ArrowLeft') {
                keyp = 'left';
            } else if (key === 'ArrowRight') {
                keyp = 'right';
            } else if (key === 'ArrowUp') {
                keyp = 'up';
            } else if (key === 'ArrowDown') {
                keyp = 'down';
            } else if (key === 'z') {
                keyp = 'z';
            }
            if (keyp !== null && ENG_choicesByBtn.has(keyp)) {
                ENG_stepGameTree();

                ENG_choiceWait = ENG_choicesByBtn.get(keyp);
                ENG_rewriteLayerPattern(ENG_choiceWait.rhs, ENG_choiceWait.row, ENG_choiceWait.col);
                ENG_mouseChoice = null;
                ENG_choicesByRct = null;
                ENG_choicesByBtn = null;
                ENG_choicePlayer = null;
            }
        }
    }

    evt.preventDefault();
    window.requestAnimationFrame(ENG_onDraw);
}

function ENG_onKeyUp(evt) {
    var key = evt.key;

    ENG_keysDown.delete(key);

    evt.preventDefault();
}

function ENG_onMouseDown(evt) {
    ENG_canvas.focus();

    const mouseButton = evt.button;

    if (mouseButton === BUTTON_LEFT) {
        if (ENG_mouseChoice !== null) {
            if (ENG_choiceWait === true) {
                ENG_stepGameTree();

                ENG_choiceWait = ENG_choicesByRct.get(JSON.stringify(ENG_mouseChoice.rct)).choices[ENG_mouseChoice.idx];
                ENG_rewriteLayerPattern(ENG_choiceWait.rhs, ENG_choiceWait.row, ENG_choiceWait.col);
                ENG_mouseChoice = null;
                ENG_choicesByRct = null;
                ENG_choicesByBtn = null;
                ENG_choicePlayer = null;
            }
        }
    } else if (mouseButton === BUTTON_RIGHT) {
        ENG_mouseAlt = true;
    }

    evt.preventDefault();
    window.requestAnimationFrame(ENG_onDraw);
}

function ENG_onMouseUp(evt) {
    const mouseButton = evt.button;

    if (mouseButton === BUTTON_RIGHT) {
        ENG_mouseAlt = false;
    }

    evt.preventDefault();
    window.requestAnimationFrame(ENG_onDraw);
}

function ENG_onMouseMove(evt) {
    const rect = ENG_canvas.getBoundingClientRect();
    const mouseX = evt.clientX - rect.left;
    const mouseY = evt.clientY - rect.top;

    ENG_mouseChoice = null;
    if (ENG_choicesByRct !== null) {
        const mr = ENG_fromcvsy(mouseY);
        const mc = ENG_fromcvsx(mouseX);
        if (0 <= mr && mr < ENG_rows && 0 <= mc && mc < ENG_cols) {
            let best_choices = [];
            let best_dist_sqr = null;

            for (const [rctk, rctChoices] of ENG_choicesByRct.entries()) {
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
                ENG_mouseChoice = {rct:best_choices[choice_idx].rct, idx:best_choices[choice_idx].idx}
            }
        }
    }

    evt.preventDefault();
    window.requestAnimationFrame(ENG_onDraw);
}

function ENG_onMouseOut(evt) {
    ENG_mouseChoice = null;

    evt.preventDefault();
    window.requestAnimationFrame(ENG_onDraw);
}

function ENG_tocvsx(x) {
    return (x * ENG_cell_size) + ENG_padding;
}

function ENG_tocvsy(y) {
    return (y * ENG_cell_size) + ENG_padding;
}

function ENG_fromcvsx(x) {
    return (x - ENG_padding) / ENG_cell_size;
}

function ENG_fromcvsy(y) {
    return (y - ENG_padding) / ENG_cell_size;
}

function ENG_layerPatternSize(lpattern) {
    for (const [layer, pattern] of Object.entries(lpattern)) {
        return [pattern.length, pattern[0].length];
    }
    return [0, 0];
}

function ENG_matchLayerPattern(lpattern, row, col) {
    const [prows, pcols] = ENG_layerPatternSize(lpattern);

    for (let rr = 0; rr < prows; rr += 1) {
        for (let cc = 0; cc < pcols; cc += 1) {
            for (let layer in lpattern) {
                if (lpattern[layer][rr][cc] === '.') {
                    continue;
                }
                if (ENG_board[layer][row + rr][col + cc] !== lpattern[layer][rr][cc]) {
                    return false;
                }
            }
        }
    }
    return true;
}

function ENG_rewriteLayerPattern(lpattern, row, col) {
    const [prows, pcols] = ENG_layerPatternSize(lpattern);

    for (let rr = 0; rr < prows; rr += 1) {
        for (let cc = 0; cc < pcols; cc += 1) {
            for (let layer in lpattern) {
                if (lpattern[layer][rr][cc] === '.') {
                    continue;
                }
                ENG_board[layer][row + rr][col + cc] = lpattern[layer][rr][cc];
            }
        }
    }
}

function ENG_findLayerPattern(lpattern) {
    const [prows, pcols] = ENG_layerPatternSize(lpattern);

    let ret = []
    for (let rr = 0; rr < ENG_rows - prows + 1; rr += 1) {
        for (let cc = 0; cc < ENG_cols - pcols + 1; cc += 1) {
            if (ENG_matchLayerPattern(lpattern, rr, cc)) {
                ret.push({row:rr, col:cc});
            }
        }
    }
    return ret;
}

const NODE_FN_MAP = {
    'display-board': ENG_stepNodeDisplayBoard,
    'set-board': ENG_stepNodeSetBoard,
    'layer-template': ENG_stepNodeLayerTemplate,
    'append-rows': ENG_stepNodeAppendRows,
    'order': ENG_stepNodeOrder,
    'loop-until-all': ENG_stepNodeLoopUntilAll,
    'loop-times': ENG_stepNodeLoopTimes,
    'random-try': ENG_stepNodeRandomTry,
    'all': ENG_stepNodeAll,
    'none': ENG_stepNodeNone,
    'win': ENG_stepNodeWin,
    'lose': ENG_stepNodeLose,
    'draw': ENG_stepNodeDraw,
    'match': ENG_stepNodeMatch,
    'rewrite': ENG_stepNodeRewrite,
    'player': ENG_stepNodePlayer,
};

function ENG_localInit(frame, what) {
    if (frame.local === null) {
        frame.local = new Map();
        for (let [name, val] of what) {
            frame.local.set(name, val);
        }
    }
}

function ENG_localGet(frame, name) {
    return frame.local.get(name);
}

function ENG_localSet(frame, name, val) {
    return frame.local.set(name, val);
}

function ENG_localSetIfTrue(frame, name, check) {
    if (check === true) {
        frame.local.set(name, true);
    }
}

function ENG_localIncrement(frame, name) {
    frame.local.set(name, frame.local.get(name) + 1)
}

function ENG_localEqual(frame, name, val) {
    return frame.local.get(name) === val;
}

function ENG_pushCallStack(node) {
    ENG_callStack.push({node: node, local: null});
}

function ENG_pushCallStackNextChild(frame) {
    ENG_pushCallStack(frame.node.children[frame.local.get('index')]);
    frame.local.set('index', frame.local.get('index') + 1);
    return null;
}

function ENG_stepGameTree(stack) {
    if (ENG_loopCheck !== true && ENG_stepDelay === null) {
        if (ENG_callStack === null) {
            ENG_undoPush();

            ENG_callStack = [];
            ENG_pushCallStack(GAME_SETUP.tree);
        } else {
            if (ENG_gameResult === true) {
            } else if (ENG_gameResult === null) {
                ENG_undoPush();

                if (ENG_callStack.length === 0) {
                    ENG_gameResult = {result:'stalemate'};
                } else {
                    var frame = ENG_callStack.at(-1);
                    ENG_callResult = NODE_FN_MAP[frame.node.type](frame, ENG_callResult);

                    if (ENG_callResult === true || ENG_callResult === false) {
                        ENG_callStack.pop();
                    }
                }
            } else {
                ENG_undoPush();

                if (ENG_gameResult.result === 'win') {
                    var player = ENG_gameResult.player;
                    setTimeout(() => { alert('Game over, player ' + player + ' wins!') }, 100);
                } else if (ENG_gameResult.result === 'lose') {
                    var player = ENG_gameResult.player;
                    setTimeout(() => { alert('Game over, player ' + player + ' loses!') }, 100);
                } else if (ENG_gameResult.result === 'draw') {
                    setTimeout(() => { alert('Game over, draw!') }, 100);
                } else if (ENG_gameResult.result === 'stalemate') {
                    setTimeout(() => { alert('Game over, stalemate!') }, 100);
                } else {
                    setTimeout(() => { alert('Game over, unknown result!') }, 100);
                }
                ENG_gameResult = true;
            }
        }
    }
}

function ENG_stepNodeOrder(frame, lastResult) {
    ENG_localInit(frame, [['any', false],
                          ['index', 0]]);

    ENG_localSetIfTrue(frame, 'any', lastResult);

    if (ENG_localEqual(frame, 'index', frame.node.children.length)) {
        return ENG_localGet(frame, 'any');
    } else {
        return ENG_pushCallStackNextChild(frame);
    }
}

function ENG_stepNodeLoopUntilAll(frame, lastResult) {
    ENG_localInit(frame, [['any', false],
                          ['anyThisLoop', false],
                          ['index', 0]]);

    ENG_localSetIfTrue(frame, 'any', lastResult);
    ENG_localSetIfTrue(frame, 'anyThisLoop', lastResult);

    if (ENG_localEqual(frame, 'index', frame.node.children.length)) {
        if (ENG_localGet(frame, 'anyThisLoop')) {
            ENG_localSet(frame, 'anyThisLoop', false);
            ENG_localSet(frame, 'index', 0);
        } else {
            return ENG_localGet(frame, 'any');
        }
    } else {
        return ENG_pushCallStackNextChild(frame);
    }
}

function ENG_stepNodeLoopTimes(frame, lastResult) {
    ENG_localInit(frame, [['any', false],
                          ['times', 0],
                          ['index', 0]]);

    ENG_localSetIfTrue(frame, 'any', lastResult);

    if (ENG_localEqual(frame, 'index', frame.node.children.length)) {
        if (ENG_localEqual(frame, 'times', frame.node.times)) {
            return ENG_localGet(frame, 'any');
        } else {
            ENG_localIncrement('times');
            ENG_localSet(frame, 'index', 0);
        }
    } else {
        return ENG_pushCallStackNextChild(frame);
    }
}

function ENG_stepNodeRandomTry(frame, lastResult) {
    ENG_localInit(frame, [['order', null]]);

    if (ENG_localEqual(frame, 'order', null)) {
        var order = [];
        for (var ii = 0; ii < frame.node.children.length; ++ ii) {
            order.push(ii);
        }
        order.sort((a, b) => 0.5 - Math.random());
        ENG_localSet(frame, 'order', order);
    }


    if (lastResult === true) {
        return true;
    } else if (ENG_localGet(frame, 'order').length == 0) {
        return false;
    } else {
        const index = ENG_localGet(frame, 'order').pop();
        ENG_pushCallStack(frame.node.children[index]);
        return null;
    }
}

function ENG_stepNodeAll(frame, lastResult) {
    ENG_localInit(frame, [['index', 0]]);

    if (lastResult === false) {
        return false;
    } else if (ENG_localEqual(frame, 'index', frame.node.children.length)) {
        return true;
    } else {
        return ENG_pushCallStackNextChild(frame);
    }
}

function ENG_stepNodeNone(frame, lastResult) {
    ENG_localInit(frame, [['index', 0]]);

    if (lastResult === true) {
        return false;
    } else if (ENG_localEqual(frame, 'index', frame.node.children.length)) {
        return true;
    } else {
        return ENG_pushCallStackNextChild(frame);
    }
}

function ENG_stepNodeWin(frame, lastResult) {
    ENG_localInit(frame, [['index', 0]]);

    if (lastResult === true) {
        ENG_gameResult = {result:'win', player:frame.node.pid};
        return null;
    } else if (ENG_localEqual(frame, 'index', frame.node.children.length)) {
        return false;
    } else {
        return ENG_pushCallStackNextChild(frame);
    }
}

function ENG_stepNodeLose(frame, lastResult) {
    ENG_localInit(frame, [['index', 0]]);

    if (lastResult === true) {
        ENG_gameResult = {result:'lose', player:frame.node.pid};
        return null;
    } else if (ENG_localEqual(frame, 'index', frame.node.children.length)) {
        return false;
    } else {
        return ENG_pushCallStackNextChild(frame);
    }
}

function ENG_stepNodeDraw(frame, lastResult) {
    ENG_localInit(frame, [['index', 0]]);

    if (lastResult === true) {
        ENG_gameResult = {result:'draw'};
        return null;
    } else if (ENG_localEqual(frame, 'index', frame.node.children.length)) {
        return false;
    } else {
        return ENG_pushCallStackNextChild(frame);
    }
}

function ENG_stepNodeSetBoard(frame, lastResult) {
    ENG_board = JSON.parse(JSON.stringify(frame.node.pattern));

    const [newRows, newCols] = ENG_layerPatternSize(ENG_board);
    if (newRows !== ENG_rows || newCols !== ENG_cols) {
        ENG_rows = newRows;
        ENG_cols = newCols;

        ENG_resizeCanvas();
    }

    return true;
}

function ENG_stepNodeDisplayBoard(frame, lastResult) {
    if (frame.node.hasOwnProperty('delay')) {
        ENG_stepDelay = Date.now() + frame.node.delay;
    }
    return true;
}

function ENG_stepNodeLayerTemplate(frame, lastResult) {
    let newLayer = [];
    for (let row of ENG_board['main']) {
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

    ENG_board[frame.node.what] = newLayer;

    return true;
}

function ENG_stepNodeAppendRows(frame, lastResult) {
    if (ENG_rows === 0 || ENG_cols === 0) {
        ENG_board = frame.node.pattern.slice();
    } else {
        for (let patternRow of frame.node.pattern) {
            let newRow = []
            while (newRow.length < ENG_cols) {
                for (let tile of patternRow) {
                    if (newRow.length < ENG_cols) {
                        newRow.push(tile);
                    }
                }
            }
            ENG_board.push(newRow);
        }
    }

    let newRows = ENG_board.length;
    let newCols = ENG_board[0].length;
    if (newRows !== ENG_rows || newCols !== ENG_cols) {
        ENG_rows = ENG_board.length;
        ENG_cols = ENG_board[0].length;

        ENG_resizeCanvas();
    }

    return true;
}

function ENG_stepNodeMatch(frame, lastResult) {
    if (ENG_findLayerPattern(frame.node.pattern).length > 0) {
        return true;
    } else {
        return false;
    }
}

function ENG_stepNodeRewrite(frame, lastResult) {
    let matches = ENG_findLayerPattern(frame.node.lhs);
    if (matches.length > 0) {
        let match = matches[Math.floor(Math.random()*matches.length)];
        ENG_rewriteLayerPattern(frame.node.rhs, match.row, match.col);
        return true;
    } else {
        return false;
    }
}

function ENG_stepNodePlayer(frame, lastResult) {
    if (ENG_choiceWait === true) {
        return null;
    } else if (ENG_choiceWait !== false) {
        let choiceInfo = ENG_choiceWait;
        ENG_choiceWait = false;

        ENG_rewriteLayerPattern(choiceInfo.rhs, choiceInfo.row, choiceInfo.col);
        return true;
    } else {
        let choices = []
        for (let child of frame.node.children) {
            if (child.type === 'rewrite') {
                let matches = ENG_findLayerPattern(child.lhs);
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
            ENG_choicePlayer = frame.node.pid;

            ENG_choicesByRct = new Map();
            ENG_choicesByBtn = new Map();

            for (let choice of choices) {
                let [rowsChoice, colsChoice] = ENG_layerPatternSize(choice.rhs);
                let rct = {row:choice.row, col:choice.col, rows:rowsChoice, cols:colsChoice };
                let rctk = JSON.stringify(rct);

                let mapChoices = []
                if (ENG_choicesByRct.has(rctk)) {
                    mapChoices = ENG_choicesByRct.get(rctk).choices;
                }

                mapChoices.push(choice);
                ENG_choicesByRct.set(rctk, {rct:rct, choices:mapChoices});

                if (choice.button !== undefined) {
                    ENG_choicesByBtn.set(choice.button, choice);
                }
            }

            ENG_choiceWait = true;

            return null;
        } else {
            return false;
        }
    }
}
