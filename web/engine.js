const ENG_FONTNAME = 'px Courier New, Courier, sans-serif';

const ENG_UNDO_PLAYER_MAX = 100;
const ENG_UNDO_RECENT_MAX = 100;



class TRRBTEngine {

    constructor(game, canvasname, divname) {
        this.game = game;
        this.canvasname = canvasname;
        this.divname = divname;

        this.canvas = null;
        this.ctx = null;
        this.engineEditor = null;

        this.padding = 10;
        this.cell_size = 50;
        this.keysDown = new Set();

        this.spriteImages = null;
        this.spriteTiles = null;
        this.back = null;

        this.player_id_colors = new Map();

        this.undoStackPlayer = [];
        this.undoStackRecent = [];

        this.callStack = null;
        this.callResult = null;
        this.gameResult = null;
        this.loopCheck = 0;

        this.board = null;
        this.rows = 0;
        this.cols = 0;

        this.choicesByRct = null;
        this.choicesByBtn = null;
        this.choicePlayer = null;
        this.choiceWait = false;

        this.mouseChoice = null;
        this.mouseAlt = false;
        this.stepManual = false;
        this.stepDelay = null;

        this.editor = null;
    }

    updateEditor() {
        if (this.editor !== null) {
            this.editor.updatePositionsAndDraw();
        }
    }

    undoPush() {
        var callStackCopy = null;

        if (this.callStack !== null) {
            callStackCopy = [];
            for (var frame of this.callStack) {
                var frameCopy = {node: frame.node, local: copymap(frame.local)};
                callStackCopy.push(frameCopy);
            }
        }

        var state = {};

        state.callStack = callStackCopy;
        state.callResult = this.callResult;
        state.gameResult = deepcopyobj(this.gameResult);
        state.loopCheck = this.loopCheck;

        state.board = deepcopyobj(this.board);
        state.rows = this.rows;
        state.cols = this.cols;

        state.choicesByRct = copymap(this.choicesByRct);
        state.choicesByBtn = copymap(this.choicesByBtn);
        state.choicePlayer = this.choicePlayer;
        state.choiceWait = deepcopyobj(this.choiceWait);

        while (this.undoStackRecent.length >= ENG_UNDO_RECENT_MAX) {
            var oldState = this.undoStackRecent.shift();
            if (oldState.callStack !== null && oldState.callStack.length > 0 && oldState.callStack.at(-1).node.type === 'player' && oldState.choiceWait === true) {
                while (this.undoStackPlayer.length >= ENG_UNDO_PLAYER_MAX) {
                    this.undoStackPlayer.shift();
                }
                this.undoStackPlayer.push(oldState);
            }
        }
        this.undoStackRecent.push(state);
    }

    undoPop() {
        var state = null;
        if (this.undoStackRecent.length > 0) {
            state = this.undoStackRecent.pop();
        } else if (this.undoStackPlayer.length > 0) {
            state = this.undoStackPlayer.pop();
        }

        if (state !== null) {
            this.callStack = state.callStack;
            this.callResult = state.callResult;
            this.gameResult = state.gameResult;
            this.loopCheck = state.loopCheck;

            this.board = state.board;
            this.rows = state.rows;
            this.cols = state.cols;

            this.choicesByRct = state.choicesByRct;
            this.choicesByBtn = state.choicesByBtn;
            this.choicePlayer = state.choicePlayer;
            this.choiceWait = state.choiceWait;
        } else {
            this.callStack = null;
            this.callResult = null;
            this.gameResult = null;
            this.loopCheck = 0;

            this.board = null;
            this.rows = null;
            this.cols = null;

            this.choicesByRct = null;
            this.choicesByBtn = null;
            this.choicePlayer = null;
            this.choiceWait = false;
        }

        this.mouseChoice = null;
        this.mouseAlt = false;
        this.stepDelay = null;

        this.resizeCanvas();
    }

    undoEmpty() {
        return (this.undoStackRecent.length + this.undoStackPlayer.length) === 0;
    }

    shouldStepToInput() {
        return this.gameResult !== true && this.choiceWait !== true && this.loopCheck !== true && this.stepDelay === null;
    }

    stepToInput() {
        var stepped = false;

        if (this.loopCheck !== true) {
            this.loopCheck = 0;
            while (this.shouldStepToInput()) {
                this.stepGameTree();
                ++ this.loopCheck;
                stepped = true;

                if (this.loopCheck === 100000) {
                    this.loopCheck = true;
                    setTimeout(() => { alert('too many steps before player input, stopping') }, 100);
                    break;
                }
            }
        }

        if (stepped) {
            this.updateEditor();
        }
    }

    arrayToImageData(from_data, fw, fh, ww, hh) {
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

    loadSpriteImage(image_name, image_info) {
        this.spriteImages.set(image_name, null);

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
                const image_data = this.arrayToImageData(image_read_array, image_info.size[0], image_info.size[1], this.cell_size, this.cell_size);
                let img_promise = createImageBitmap(image_data);
                img_promise.then((img_loaded) => this.spriteImages.set(image_name, img_loaded));
            }
        });
    }

    onLoad() {
        document.oncontextmenu = function() {
            return false;
        }

        this.undoStackPlayer = [];
        this.undoStackRecent = [];

        this.callStack = null;
        this.callResult = null;
        this.gameResult = null;

        this.board = null;
        this.rows = null;
        this.cols = null;

        this.choicesByRct = null;
        this.choicesByBtn = null;
        this.choicePlayer = null;
        this.choiceWait = false;
        this.loopCheck = 0;

        this.mouseChoice = null;
        this.mouseAlt = false;
        this.stepDelay = null;
        this.stepManual = false;

        this.canvas = document.getElementById(this.canvasname);
        this.ctx = this.canvas.getContext('2d');
        this.engineEditor = this.divname ? document.getElementById(this.divname) : null;
        this.keysDown = new Set();

        this.canvas.addEventListener('mousedown', bind0(this, 'onMouseDown'));
        this.canvas.addEventListener('mousemove', bind0(this, 'onMouseMove'));
        this.canvas.addEventListener('mouseup', bind0(this, 'onMouseUp'));
        this.canvas.addEventListener('mouseout', bind0(this, 'onMouseOut'));
        this.canvas.addEventListener('keydown', bind0(this, 'onKeyDown'));
        this.canvas.addEventListener('keyup', bind0(this, 'onKeyUp'));
        this.canvas.focus();

        if (this.game.sprites !== null) {
            this.spriteImages = new Map();
            for (let imageName in this.game.sprites.images) {
                const image_info = this.game.sprites.images[imageName];
                this.loadSpriteImage(imageName, image_info)
            }
            this.spriteTiles = new Map();
            for (let tile in this.game.sprites.tiles) {
                this.spriteTiles.set(tile, this.game.sprites.tiles[tile]);
            }
            if (this.game.sprites.players !== undefined) {
                for (let pid in this.game.sprites.players) {
                    this.player_id_colors.set(pid, this.game.sprites.players[pid]);
                }
            }
            if (this.game.sprites.back !== undefined) {
                this.back = this.game.sprites.back;
            }
        }

        this.canvas.style.backgroundColor = '#ffffff';

        this.updateEngineEditor();

        this.resizeCanvas();
        window.requestAnimationFrame(bind0(this, 'onDraw'));
    }

    updateEngineEditor() {
        if (this.engineEditor === null) {
            return;
        }

        const ed = this.engineEditor;

        ed.innerHTML = '';

        appendButton(ed, 'Restart', bind0(this, 'onLoad'));
        appendBr(ed);
        appendBr(ed);

        appendButton(ed, 'Break/Resume', bind0(this, 'onBreakResume'));
        appendBr(ed);

        appendButton(ed, 'Undo Step', bind1(this, 'onUndo', false));
        appendButton(ed, 'Undo Move', bind1(this, 'onUndo', true));
        appendBr(ed);

        appendButton(ed, 'Next Step', bind1(this, 'onNext', false));
        appendButton(ed, 'Next Move', bind1(this, 'onNext', true));
        appendBr(ed);
    }

    onDraw() {
        if (this.spriteImages !== null) {
            for (let [imgName, img] of this.spriteImages) {
                if (img === null) {
                    window.requestAnimationFrame(bind0(this, 'onDraw'));
                    return;
                }
            }
        }

        if (this.stepDelay !== null) {
            if (Date.now() < this.stepDelay) {
                window.requestAnimationFrame(bind0(this, 'onDraw'));
                return;
            } else {
                this.stepDelay = null;
            }
        }

        if (!this.stepManual) {
            this.stepToInput();
        }

        if (this.stepDelay !== null) {
            window.requestAnimationFrame(bind0(this, 'onDraw'));
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#eeeeee';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        if (this.back !== null) {
            const brows = this.back.length;
            const bcols = this.back[0].length;

            for (let rr = 0; rr < this.rows; rr += 1) {
                for (let cc = 0; cc < this.cols; cc += 1) {
                    let all_invis = true;
                    for (const [layer, pattern] of Object.entries(this.board)) {
                        if (pattern[rr][cc] !== '.') {
                            all_invis = false;
                        }
                    }
                    if (!all_invis) {
                        const back_tile = this.back[rr % brows][cc % bcols];
                        if (this.spriteTiles !== null && this.spriteTiles.has(back_tile)) {
                            const img = this.spriteImages.get(this.spriteTiles.get(back_tile));
                            this.ctx.drawImage(img, this.tocvsx(cc), this.tocvsy(rr));
                        }
                    }
                }
            }
        }

        let choiceOverwrite = null;
        if (this.mouseChoice !== null && !this.mouseAlt) {
            choiceOverwrite = {rct: this.mouseChoice.rct, rhs:this.choicesByRct.get(JSON.stringify(this.mouseChoice.rct)).choices[this.mouseChoice.idx].rhs };
        }

        this.ctx.fillStyle = '#000000';

        for (let rr = 0; rr < this.rows; rr += 1) {
            for (let cc = 0; cc < this.cols; cc += 1) {
                let tiles = [];
                let overwrites = [];
                if (choiceOverwrite !== null &&
                    choiceOverwrite.rct.row <= rr && rr < choiceOverwrite.rct.row + choiceOverwrite.rct.rows &&
                    choiceOverwrite.rct.col <= cc && cc < choiceOverwrite.rct.col + choiceOverwrite.rct.cols) {
                    for (const [layer, pattern] of Object.entries(this.board)) {
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
                    for (const [layer, pattern] of Object.entries(this.board)) {
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
                        this.ctx.globalAlpha = 0.5;
                    } else {
                        this.ctx.globalAlpha = 1.0;
                    }
                    if (tile !== '.') {
                        if (this.spriteTiles !== null && this.spriteTiles.has(tile)) {
                            const imgName = this.spriteTiles.get(tile);
                            if (imgName !== null) {
                                const img = this.spriteImages.get(imgName);
                                this.ctx.drawImage(img, this.tocvsx(cc), this.tocvsy(rr));
                            }
                        } else {
                            this.ctx.font = (this.cell_size / tile.length) + ENG_FONTNAME;
                            this.ctx.fillText(tile, this.tocvsx(cc + 0.5), this.tocvsy(rr + 0.5));
                        }
                    }
                }
            }
        }

        if (this.choicesByRct !== null) {
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 1.0;

            if (!this.player_id_colors.has(this.choicePlayer)) {
                let color_num = this.player_id_colors.size % 5;
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
                this.player_id_colors.set(this.choicePlayer, next_color);
            }

            let player_color = this.player_id_colors.get(this.choicePlayer);

            if (this.mouseChoice !== null) {
                let rct = this.mouseChoice.rct;
                let idx = this.mouseChoice.idx;

                let rct_choices = this.choicesByRct.get(JSON.stringify(rct)).choices;
                let desc = rct_choices[idx].desc;

                this.ctx.strokeStyle = `rgb(${player_color[0]}, ${player_color[1]}, ${player_color[2]})`;
                this.ctx.beginPath();
                this.ctx.roundRect(this.tocvsx(rct.col), this.tocvsy(rct.row), rct.cols * this.cell_size, rct.rows * this.cell_size, 3);
                this.ctx.stroke();

                if (rct_choices.length > 1) {
                    this.ctx.fillStyle = `rgb(${player_color[0]}, ${player_color[1]}, ${player_color[2]})`;
                    this.ctx.beginPath();
                    this.ctx.roundRect(this.tocvsx(rct.col), this.tocvsy(rct.row), 0.4 * this.cell_size, 0.4 * this.cell_size, 3);
                    this.ctx.fill();
                    this.ctx.fillStyle = '#DCDCDC'
                    this.ctx.font = (0.9 * 0.4 * this.cell_size) + ENG_FONTNAME;
                    this.ctx.fillText(idx + 1, this.tocvsx(rct.col + 0.2), this.tocvsy(rct.row + 0.2 + 0.025));
                }
                if (desc !== undefined) {
                    this.ctx.fillStyle = `rgb(${player_color[0]}, ${player_color[1]}, ${player_color[2]})`;
                    this.ctx.font = (0.9 * 0.4 * this.cell_size) + ENG_FONTNAME;
                    this.ctx.fillText(desc, this.tocvsx(rct.col + 0.5 * rct.cols), this.tocvsy(rct.row + rct.rows - 0.2));
                }
            } else {
                if (!this.mouseAlt) {
                    this.ctx.strokeStyle = `rgb(${player_color[0] * 0.5}, ${player_color[1] * 0.5}, ${player_color[2] * 0.5})`;

                    for (const [rctk, rctChoices] of this.choicesByRct.entries()) {
                        let rct = rctChoices.rct;
                        let choices = rctChoices.choices;
                        this.ctx.beginPath();
                        this.ctx.roundRect(this.tocvsx(rct.col), this.tocvsy(rct.row), rct.cols * this.cell_size, rct.rows * this.cell_size, 3);
                        this.ctx.stroke();
                        if (choices.length > 1) {
                            this.ctx.fillStyle = `rgb(${player_color[0] * 0.5}, ${player_color[1] * 0.5}, ${player_color[2] * 0.5})`;
                            this.ctx.beginPath();
                            this.ctx.roundRect(this.tocvsx(rct.col), this.tocvsy(rct.row), 0.4 * this.cell_size, 0.4 * this.cell_size, 3);
                            this.ctx.fill();
                            this.ctx.fillStyle = '#DCDCDC'
                            this.ctx.font = (0.9 * 0.4 * this.cell_size) + ENG_FONTNAME;
                            this.ctx.fillText(choices.length, this.tocvsx(rct.col + 0.2), this.tocvsy(rct.row + 0.2 + 0.025));
                        }
                    }
                }
            }
        }

        if (this.stepManual) {
            this.ctx.lineWidth = 10;
            this.ctx.strokeStyle = '#ffdddd';
            this.ctx.strokeRect(0, 0, this.canvas.width / PIXEL_RATIO, this.canvas.height / PIXEL_RATIO);
        }
    }

    resizeCanvas() {
        const desiredWidth = this.tocvsx(Math.max(1, this.cols)) + this.padding;
        const desiredHeight = this.tocvsy(Math.max(1, this.rows)) + this.padding;
        if (this.canvas.width != desiredWidth || this.canvas.height != desiredHeight) {
            const ratio = window.devicePixelRatio;
            this.canvas.width = desiredWidth * ratio;
            this.canvas.height = desiredHeight * ratio;
            this.canvas.style.width = desiredWidth + "px";
            this.canvas.style.height = desiredHeight + "px";
            this.ctx.scale(ratio, ratio);
        }
    }

    onBreakResume() {
        this.stepManual = !this.stepManual;
        window.requestAnimationFrame(bind0(this, 'onDraw'));
    }

    onUndo(toInput) {
        this.undoPop();
        if (toInput) {
            while (!this.undoEmpty() && this.shouldStepToInput()) {
                this.undoPop();
            }
        } else {
            this.stepManual = true;
        }
        this.updateEditor();
        window.requestAnimationFrame(bind0(this, 'onDraw'));
    }

    onNext(toInput) {
        if (this.shouldStepToInput()) {
            this.stepGameTree();
            if (toInput) {
                this.stepToInput();
            }
            this.updateEditor();
        } else {
            this.stepManual = true;
        }
        window.requestAnimationFrame(bind0(this, 'onDraw'));
    }

    onKeyDown(evt) {
        var key = evt.key;

        if (!this.keysDown.has(key)) {
            this.keysDown.add(key);

            if (key === 'b' || key === 'B') {
                this.onBreakResume();
            } else if (key === 'n' || key === 'N') {
                this.onNext(key === 'n');
            } else if (key === 'p' || key === 'P') {
                this.onUndo(key === 'p');
            }

            if (this.choiceWait === true) {
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
                if (keyp !== null && this.choicesByBtn.has(keyp)) {
                    this.stepGameTree();

                    this.choiceWait = this.choicesByBtn.get(keyp);
                    this.rewriteLayerPattern(this.choiceWait.rhs, this.choiceWait.row, this.choiceWait.col);
                    this.mouseChoice = null;
                    this.choicesByRct = null;
                    this.choicesByBtn = null;
                    this.choicePlayer = null;
                }
            }
        }

        evt.preventDefault();
        window.requestAnimationFrame(bind0(this, 'onDraw'));
    }

    onKeyUp(evt) {
        var key = evt.key;

        this.keysDown.delete(key);

        evt.preventDefault();
    }

    onMouseDown(evt) {
        this.canvas.focus();

        const mouseButton = evt.button;

        if (mouseButton === BUTTON_LEFT) {
            if (this.mouseChoice !== null) {
                if (this.choiceWait === true) {
                    this.stepGameTree();

                    this.choiceWait = this.choicesByRct.get(JSON.stringify(this.mouseChoice.rct)).choices[this.mouseChoice.idx];
                    this.rewriteLayerPattern(this.choiceWait.rhs, this.choiceWait.row, this.choiceWait.col);
                    this.mouseChoice = null;
                    this.choicesByRct = null;
                    this.choicesByBtn = null;
                    this.choicePlayer = null;
                }
            }
        } else if (mouseButton === BUTTON_RIGHT) {
            this.mouseAlt = true;
        }

        evt.preventDefault();
        window.requestAnimationFrame(bind0(this, 'onDraw'));
    }

    onMouseUp(evt) {
        const mouseButton = evt.button;

        if (mouseButton === BUTTON_RIGHT) {
            this.mouseAlt = false;
        }

        evt.preventDefault();
        window.requestAnimationFrame(bind0(this, 'onDraw'));
    }

    onMouseMove(evt) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = evt.clientX - rect.left;
        const mouseY = evt.clientY - rect.top;

        this.mouseChoice = null;
        if (this.choicesByRct !== null) {
            const mr = this.fromcvsy(mouseY);
            const mc = this.fromcvsx(mouseX);
            if (0 <= mr && mr < this.rows && 0 <= mc && mc < this.cols) {
                let best_choices = [];
                let best_dist_sqr = null;

                for (const [rctk, rctChoices] of this.choicesByRct.entries()) {
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
                    this.mouseChoice = {rct:best_choices[choice_idx].rct, idx:best_choices[choice_idx].idx}
                }
            }
        }

        evt.preventDefault();
        window.requestAnimationFrame(bind0(this, 'onDraw'));
    }

    onMouseOut(evt) {
        this.mouseChoice = null;

        evt.preventDefault();
        window.requestAnimationFrame(bind0(this, 'onDraw'));
    }

    tocvsx(x) {
        return (x * this.cell_size) + this.padding;
    }

    tocvsy(y) {
        return (y * this.cell_size) + this.padding;
    }

    fromcvsx(x) {
        return (x - this.padding) / this.cell_size;
    }

    fromcvsy(y) {
        return (y - this.padding) / this.cell_size;
    }

    layerPatternSize(lpattern) {
        for (const [layer, pattern] of Object.entries(lpattern)) {
            return [pattern.length, pattern[0].length];
        }
        return [0, 0];
    }

    matchLayerPattern(lpattern, row, col) {
        const [prows, pcols] = this.layerPatternSize(lpattern);

        for (let rr = 0; rr < prows; rr += 1) {
            for (let cc = 0; cc < pcols; cc += 1) {
                for (let layer in lpattern) {
                    if (lpattern[layer][rr][cc] === '.') {
                        continue;
                    }
                    if (this.board[layer][row + rr][col + cc] !== lpattern[layer][rr][cc]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    rewriteLayerPattern(lpattern, row, col) {
        const [prows, pcols] = this.layerPatternSize(lpattern);

        for (let rr = 0; rr < prows; rr += 1) {
            for (let cc = 0; cc < pcols; cc += 1) {
                for (let layer in lpattern) {
                    if (lpattern[layer][rr][cc] === '.') {
                        continue;
                    }
                    this.board[layer][row + rr][col + cc] = lpattern[layer][rr][cc];
                }
            }
        }
    }

    findLayerPattern(lpattern) {
        const [prows, pcols] = this.layerPatternSize(lpattern);

        let ret = []
        for (let rr = 0; rr < this.rows - prows + 1; rr += 1) {
            for (let cc = 0; cc < this.cols - pcols + 1; cc += 1) {
                if (this.matchLayerPattern(lpattern, rr, cc)) {
                    ret.push({row:rr, col:cc});
                }
            }
        }
        return ret;
    }

    localInit(frame, what) {
        if (frame.local === null) {
            frame.local = new Map();
            for (let [name, val] of what) {
                frame.local.set(name, val);
            }
        }
    }

    localGet(frame, name) {
        return frame.local.get(name);
    }

    localSet(frame, name, val) {
        return frame.local.set(name, val);
    }

    localSetIfTrue(frame, name, check) {
        if (check === true) {
            frame.local.set(name, true);
        }
    }

    localIncrement(frame, name) {
        frame.local.set(name, frame.local.get(name) + 1)
    }

    localEqual(frame, name, val) {
        return frame.local.get(name) === val;
    }

    pushCallStack(node) {
        this.callStack.push({node: node, local: null});
    }

    pushCallStackNextChild(frame) {
        this.pushCallStack(frame.node.children[frame.local.get('index')]);
        frame.local.set('index', frame.local.get('index') + 1);
        return null;
    }

    stepGameTree(stack) {
        const NODE_FN_MAP = {
            'display-board': bind0(this, 'stepNodeDisplayBoard'),
            'set-board': bind0(this, 'stepNodeSetBoard'),
            'layer-template': bind0(this, 'stepNodeLayerTemplate'),
            'append-rows': bind0(this, 'stepNodeAppendRows'),
            'order': bind0(this, 'stepNodeOrder'),
            'loop-until-all': bind0(this, 'stepNodeLoopUntilAll'),
            'loop-times': bind0(this, 'stepNodeLoopTimes'),
            'random-try': bind0(this, 'stepNodeRandomTry'),
            'all': bind0(this, 'stepNodeAll'),
            'none': bind0(this, 'stepNodeNone'),
            'win': bind0(this, 'stepNodeWin'),
            'lose': bind0(this, 'stepNodeLose'),
            'draw': bind0(this, 'stepNodeDraw'),
            'match': bind0(this, 'stepNodeMatch'),
            'rewrite': bind0(this, 'stepNodeRewrite'),
            'player': bind0(this, 'stepNodePlayer'),
        };

        if (this.loopCheck !== true && this.stepDelay === null) {
            if (this.callStack === null) {
                this.undoPush();

                this.callStack = [];
                this.pushCallStack(this.game.tree);
            } else {
                if (this.gameResult === true) {
                } else if (this.gameResult === null) {
                    this.undoPush();

                    if (this.callStack.length === 0) {
                        this.gameResult = {result:'stalemate'};
                    } else {
                        var frame = this.callStack.at(-1);
                        this.callResult = NODE_FN_MAP[frame.node.type](frame, this.callResult);

                        if (this.callResult === true || this.callResult === false) {
                            this.callStack.pop();
                        }
                    }
                } else {
                    this.undoPush();

                    if (this.gameResult.result === 'win') {
                        var player = this.gameResult.player;
                        setTimeout(() => { alert('Game over, player ' + player + ' wins!') }, 100);
                    } else if (this.gameResult.result === 'lose') {
                        var player = this.gameResult.player;
                        setTimeout(() => { alert('Game over, player ' + player + ' loses!') }, 100);
                    } else if (this.gameResult.result === 'draw') {
                        setTimeout(() => { alert('Game over, draw!') }, 100);
                    } else if (this.gameResult.result === 'stalemate') {
                        setTimeout(() => { alert('Game over, stalemate!') }, 100);
                    } else {
                        setTimeout(() => { alert('Game over, unknown result!') }, 100);
                    }
                    this.gameResult = true;
                }
            }
        }
    }

    stepNodeOrder(frame, lastResult) {
        this.localInit(frame, [['any', false],
                               ['index', 0]]);

        this.localSetIfTrue(frame, 'any', lastResult);

        if (this.localEqual(frame, 'index', frame.node.children.length)) {
            return this.localGet(frame, 'any');
        } else {
            return this.pushCallStackNextChild(frame);
        }
    }

    stepNodeLoopUntilAll(frame, lastResult) {
        this.localInit(frame, [['any', false],
                               ['anyThisLoop', false],
                               ['index', 0]]);

        this.localSetIfTrue(frame, 'any', lastResult);
        this.localSetIfTrue(frame, 'anyThisLoop', lastResult);

        if (this.localEqual(frame, 'index', frame.node.children.length)) {
            if (this.localGet(frame, 'anyThisLoop')) {
                this.localSet(frame, 'anyThisLoop', false);
                this.localSet(frame, 'index', 0);
            } else {
                return this.localGet(frame, 'any');
            }
        } else {
            return this.pushCallStackNextChild(frame);
        }
    }

    stepNodeLoopTimes(frame, lastResult) {
        this.localInit(frame, [['any', false],
                               ['times', 0],
                               ['index', 0]]);

        this.localSetIfTrue(frame, 'any', lastResult);

        if (this.localEqual(frame, 'index', frame.node.children.length)) {
            if (this.localEqual(frame, 'times', frame.node.times)) {
                return this.localGet(frame, 'any');
            } else {
                this.localIncrement('times');
                this.localSet(frame, 'index', 0);
            }
        } else {
            return this.pushCallStackNextChild(frame);
        }
    }

    stepNodeRandomTry(frame, lastResult) {
        this.localInit(frame, [['order', null]]);

        if (this.localEqual(frame, 'order', null)) {
            var order = [];
            for (var ii = 0; ii < frame.node.children.length; ++ ii) {
                order.push(ii);
            }
            order.sort((a, b) => 0.5 - Math.random());
            this.localSet(frame, 'order', order);
        }


        if (lastResult === true) {
            return true;
        } else if (this.localGet(frame, 'order').length == 0) {
            return false;
        } else {
            const index = this.localGet(frame, 'order').pop();
            this.pushCallStack(frame.node.children[index]);
            return null;
        }
    }

    stepNodeAll(frame, lastResult) {
        this.localInit(frame, [['index', 0]]);

        if (lastResult === false) {
            return false;
        } else if (this.localEqual(frame, 'index', frame.node.children.length)) {
            return true;
        } else {
            return this.pushCallStackNextChild(frame);
        }
    }

    stepNodeNone(frame, lastResult) {
        this.localInit(frame, [['index', 0]]);

        if (lastResult === true) {
            return false;
        } else if (this.localEqual(frame, 'index', frame.node.children.length)) {
            return true;
        } else {
            return this.pushCallStackNextChild(frame);
        }
    }

    stepNodeWin(frame, lastResult) {
        this.localInit(frame, [['index', 0]]);

        if (lastResult === true) {
            this.gameResult = {result:'win', player:frame.node.pid};
            return null;
        } else if (this.localEqual(frame, 'index', frame.node.children.length)) {
            return false;
        } else {
            return this.pushCallStackNextChild(frame);
        }
    }

    stepNodeLose(frame, lastResult) {
        this.localInit(frame, [['index', 0]]);

        if (lastResult === true) {
            this.gameResult = {result:'lose', player:frame.node.pid};
            return null;
        } else if (this.localEqual(frame, 'index', frame.node.children.length)) {
            return false;
        } else {
            return this.pushCallStackNextChild(frame);
        }
    }

    stepNodeDraw(frame, lastResult) {
        this.localInit(frame, [['index', 0]]);

        if (lastResult === true) {
            this.gameResult = {result:'draw'};
            return null;
        } else if (this.localEqual(frame, 'index', frame.node.children.length)) {
            return false;
        } else {
            return this.pushCallStackNextChild(frame);
        }
    }

    stepNodeSetBoard(frame, lastResult) {
        this.board = JSON.parse(JSON.stringify(frame.node.pattern));

        const [newRows, newCols] = this.layerPatternSize(this.board);
        if (newRows !== this.rows || newCols !== this.cols) {
            this.rows = newRows;
            this.cols = newCols;

            this.resizeCanvas();
        }

        return true;
    }

    stepNodeDisplayBoard(frame, lastResult) {
        if (frame.node.hasOwnProperty('delay')) {
            this.stepDelay = Date.now() + frame.node.delay;
        }
        return true;
    }

    stepNodeLayerTemplate(frame, lastResult) {
        let newLayer = [];
        for (let row of this.board['main']) {
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

        this.board[frame.node.what] = newLayer;

        return true;
    }

    stepNodeAppendRows(frame, lastResult) {
        if (this.rows === 0 || this.cols === 0) {
            this.board = frame.node.pattern.slice();
        } else {
            for (let patternRow of frame.node.pattern) {
                let newRow = []
                while (newRow.length < this.cols) {
                    for (let tile of patternRow) {
                        if (newRow.length < this.cols) {
                            newRow.push(tile);
                        }
                    }
                }
                this.board.push(newRow);
            }
        }

        let newRows = this.board.length;
        let newCols = this.board[0].length;
        if (newRows !== this.rows || newCols !== this.cols) {
            this.rows = this.board.length;
            this.cols = this.board[0].length;

            this.resizeCanvas();
        }

        return true;
    }

    stepNodeMatch(frame, lastResult) {
        if (this.findLayerPattern(frame.node.pattern).length > 0) {
            return true;
        } else {
            return false;
        }
    }

    stepNodeRewrite(frame, lastResult) {
        let matches = this.findLayerPattern(frame.node.lhs);
        if (matches.length > 0) {
            let match = matches[Math.floor(Math.random()*matches.length)];
            this.rewriteLayerPattern(frame.node.rhs, match.row, match.col);
            return true;
        } else {
            return false;
        }
    }

    stepNodePlayer(frame, lastResult) {
        if (this.choiceWait === true) {
            return null;
        } else if (this.choiceWait !== false) {
            let choiceInfo = this.choiceWait;
            this.choiceWait = false;

            this.rewriteLayerPattern(choiceInfo.rhs, choiceInfo.row, choiceInfo.col);
            return true;
        } else {
            let choices = []
            for (let child of frame.node.children) {
                if (child.type === 'rewrite') {
                    let matches = this.findLayerPattern(child.lhs);
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
                this.choicePlayer = frame.node.pid;

                this.choicesByRct = new Map();
                this.choicesByBtn = new Map();

                for (let choice of choices) {
                    let [rowsChoice, colsChoice] = this.layerPatternSize(choice.rhs);
                    let rct = {row:choice.row, col:choice.col, rows:rowsChoice, cols:colsChoice };
                    let rctk = JSON.stringify(rct);

                    let mapChoices = []
                    if (this.choicesByRct.has(rctk)) {
                        mapChoices = this.choicesByRct.get(rctk).choices;
                    }

                    mapChoices.push(choice);
                    this.choicesByRct.set(rctk, {rct:rct, choices:mapChoices});

                    if (choice.button !== undefined) {
                        this.choicesByBtn.set(choice.button, choice);
                    }
                }

                this.choiceWait = true;

                return null;
            } else {
                return false;
            }
        }
    }

};
