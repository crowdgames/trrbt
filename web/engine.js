const ENG_FONTNAME = 'px Courier New, Courier, sans-serif';

const ENG_UNDO_PLAYER_MAX = 100;
const ENG_UNDO_RECENT_MAX = 100;

const ENG_LOOP_CHECK_MAX = 100000;

const ENG_CELL_SIZE_MIN     =  15;
const ENG_CELL_SIZE_MAX     =  60;
const ENG_CELL_SIZE_DEFAULT =  50;
const ENG_CELL_SIZE_STEP    =   5;



class TRRBTState {

    constructor() {
        this.callStack = null;
        this.callResult = null;
        this.gameResult = null;
        this.loopCheck = 0;

        this.board = null;
        this.rows = 0;
        this.cols = 0;

        this.displayWait = false;
        this.displayDone = false;
        this.displayDelay = null;

        this.choiceWait = false;
        this.choiceMade = null;
        this.choicePlayer = null;
        this.choices = null;
        this.choicesByRct = null;
        this.choicesByBtn = null;
    }

};



class TRRBTStepper {

    clearDisplayWait(nodeLookup, state, clearLoopCheck) {
        state.displayWait = false;
        state.displayDone = true;
        state.displayDelay = null;

        if (clearLoopCheck) {
            state.loopCheck = 0;
        }
    }

    clearChoiceWait(nodeLookup, state, clearLoopCheck, choiceIndex) {
        state.choiceWait = false;
        state.choiceMade = state.choices[choiceIndex];
        state.choicePlayer = null;
        state.choices = null;
        state.choicesByRct = null;
        state.choicesByBtn = null;

        if (clearLoopCheck) {
            state.loopCheck = 0;
        }

        this.rewriteLayerPattern(state, state.choiceMade.rhs, state.choiceMade.row, state.choiceMade.col);
    }

    stepReady(nodeLookup, state) {
        return nodeLookup !== null && state.gameResult === null && state.displayWait === false && state.choiceWait === false;
    }

    step(nodeLookup, state, stepout) {
        const NODE_FN_MAP = {
            'display-board': bind0(this, 'stepNodeDisplayBoard'),
            'set-board': bind0(this, 'stepNodeSetBoard'),
            'layer-template': bind0(this, 'stepNodeLayerTemplate'),
            'append-rows': bind0(this, 'stepNodeAppendRows'),
            'append-columns': bind0(this, 'stepNodeAppendCols'),
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
            'rewrite-all': bind0(this, 'stepNodeRewriteAll'),
            'player': bind0(this, 'stepNodePlayer'),
        };

        if (nodeLookup === null) {
            // pass
        } else if (state.gameResult !== null) {
            // pass
        } else if (state.callStack === null) {
            state.callStack = [];
            this.pushCallStack(nodeLookup.nodeToId, state, nodeLookup.idToNode.get(0));
        } else if (state.callStack.length === 0) {
            state.gameResult = { result: 'stalemate' };
        } else {
            let stateFrame = state.callStack.at(-1);
            let stateNode = nodeLookup.idToNode.get(stateFrame.nodeId);

            state.loopCheck += 1;

            if (stepout !== null && state.loopCheck >= stepout) {
                state.gameResult = { result: 'stepout' };
            } else {
                let fn = NODE_FN_MAP[stateNode.type];
                state.callResult = fn(nodeLookup.nodeToId, state, stateFrame, stateNode, state.callResult);

                if (state.callResult === true || state.callResult === false) {
                    state.callStack.pop();
                }
            }
        }
    }

    stepNodeOrder(nodeToId, state, stateFrame, stateNode, stateCallResult) {
        this.localInit(stateFrame, [['any', false],
                                    ['index', 0]]);

        this.localSetIfTrue(stateFrame, 'any', stateCallResult);

        if (this.localEqual(stateFrame, 'index', stateNode.children.length)) {
            return this.localGet(stateFrame, 'any');
        } else {
            return this.pushCallStackNextChild(nodeToId, state, stateFrame, stateNode);
        }
    }

    stepNodeLoopUntilAll(nodeToId, state, stateFrame, stateNode, stateCallResult) {
        this.localInit(stateFrame, [['any', false],
                                    ['anyThisLoop', false],
                                    ['index', 0]]);

        this.localSetIfTrue(stateFrame, 'any', stateCallResult);
        this.localSetIfTrue(stateFrame, 'anyThisLoop', stateCallResult);

        if (this.localEqual(stateFrame, 'index', stateNode.children.length)) {
            if (this.localGet(stateFrame, 'anyThisLoop')) {
                this.localSet(stateFrame, 'anyThisLoop', false);
                this.localSet(stateFrame, 'index', 0);
                return null;
            } else {
                return this.localGet(stateFrame, 'any');
            }
        } else {
            return this.pushCallStackNextChild(nodeToId, state, stateFrame, stateNode);
        }
    }

    stepNodeLoopTimes(nodeToId, state, stateFrame, stateNode, stateCallResult) {
        this.localInit(stateFrame, [['any', false],
                                    ['times', 0],
                                    ['index', 0]]);

        this.localSetIfTrue(stateFrame, 'any', stateCallResult);

        if (this.localEqual(stateFrame, 'index', stateNode.children.length)) {
            this.localIncrement(stateFrame, 'times');
            if (this.localEqual(stateFrame, 'times', stateNode.times)) {
                return this.localGet(stateFrame, 'any');
            } else {
                this.localSet(stateFrame, 'index', 0);
                return null;
            }
        } else {
            return this.pushCallStackNextChild(nodeToId, state, stateFrame, stateNode);
        }
    }

    stepNodeRandomTry(nodeToId, state, stateFrame, stateNode, stateCallResult) {
        this.localInit(stateFrame, [['order', null]]);

        if (this.localEqual(stateFrame, 'order', null)) {
            let order = [];
            for (let ii = 0; ii < stateNode.children.length; ++ii) {
                order.push(ii);
            }
            order.sort((a, b) => 0.5 - Math.random());
            this.localSet(stateFrame, 'order', order);
        }

        if (stateCallResult === true) {
            return true;
        } else if (this.localGet(stateFrame, 'order').length == 0) {
            return false;
        } else {
            const index = this.localGet(stateFrame, 'order').pop();
            this.pushCallStack(nodeToId, state, stateNode.children[index]);
            return null;
        }
    }

    stepNodeAll(nodeToId, state, stateFrame, stateNode, stateCallResult) {
        this.localInit(stateFrame, [['index', 0]]);

        if (stateCallResult === false) {
            return false;
        } else if (this.localEqual(stateFrame, 'index', stateNode.children.length)) {
            return true;
        } else {
            return this.pushCallStackNextChild(nodeToId, state, stateFrame, stateNode);
        }
    }

    stepNodeNone(nodeToId, state, stateFrame, stateNode, stateCallResult) {
        this.localInit(stateFrame, [['index', 0]]);

        if (stateCallResult === true) {
            return false;
        } else if (this.localEqual(stateFrame, 'index', stateNode.children.length)) {
            return true;
        } else {
            return this.pushCallStackNextChild(nodeToId, state, stateFrame, stateNode);
        }
    }

    stepNodeWin(nodeToId, state, stateFrame, stateNode, stateCallResult) {
        this.localInit(stateFrame, [['index', 0]]);

        if (stateCallResult === true) {
            state.gameResult = { result: 'win', player: stateNode.pid };
            return null;
        } else if (this.localEqual(stateFrame, 'index', stateNode.children.length)) {
            return false;
        } else {
            return this.pushCallStackNextChild(nodeToId, state, stateFrame, stateNode);
        }
    }

    stepNodeLose(nodeToId, state, stateFrame, stateNode, stateCallResult) {
        this.localInit(stateFrame, [['index', 0]]);

        if (stateCallResult === true) {
            state.gameResult = { result: 'lose', player: stateNode.pid };
            return null;
        } else if (this.localEqual(stateFrame, 'index', stateNode.children.length)) {
            return false;
        } else {
            return this.pushCallStackNextChild(nodeToId, state, stateFrame, stateNode);
        }
    }

    stepNodeDraw(nodeToId, state, stateFrame, stateNode, stateCallResult) {
        this.localInit(stateFrame, [['index', 0]]);

        if (stateCallResult === true) {
            state.gameResult = { result: 'draw' };
            return null;
        } else if (this.localEqual(stateFrame, 'index', stateNode.children.length)) {
            return false;
        } else {
            return this.pushCallStackNextChild(nodeToId, state, stateFrame, stateNode);
        }
    }

    stepNodeSetBoard(nodeToId, state, stateFrame, stateNode, stateCallResult) {
        state.board = deepcopyobj(stateNode.pattern);

        const [newRows, newCols] = this.layerPatternSize(state.board);
        state.rows = newRows;
        state.cols = newCols;

        return true;
    }

    stepNodeLayerTemplate(nodeToId, state, stateFrame, stateNode, stateCallResult) {
        let newLayer = [];
        for (let row of state.board['main']) {
            let newRow = [];
            for (let tile of row) {
                if (tile === '.') {
                    newRow.push('.');
                } else {
                    newRow.push(stateNode.with);
                }
            }
            newLayer.push(newRow);
        }

        state.board[stateNode.layer] = newLayer;

        return true;
    }

    stepNodeAppendRows(nodeToId, state, stateFrame, stateNode, stateCallResult) {
        if (state.board === null) {
            state.board = deepcopyobj(stateNode.pattern);
        } else {
            const patt = stateNode.pattern;
            if (!samepropsobj(state.board, patt)) {
                return false;
            }

            for (let layer in state.board) {
                for (let patternRow of patt[layer]) {
                    let newRow = [];
                    for (let ii = 0; ii < state.cols; ii += 1) {
                        newRow.push(patternRow[ii % patternRow.length]);
                    }
                    state.board[layer].push(newRow);
                }
            }
        }

        const [newRows, newCols] = this.layerPatternSize(state.board);
        state.rows = newRows;
        state.cols = newCols;

        return true;
    }

    stepNodeAppendCols(nodeToId, state, stateFrame, stateNode, stateCallResult) {
        if (state.board === null) {
            state.board = deepcopyobj(stateNode.pattern);
        } else {
            const patt = stateNode.pattern;
            if (!samepropsobj(state.board, patt)) {
                return false;
            }
            for (let layer in state.board) {
                for (let ii = 0; ii < state.rows; ii += 1) {
                    state.board[layer][ii].push(...patt[layer][ii % patt[layer].length].slice(0));
                }
            }
        }

        const [newRows, newCols] = this.layerPatternSize(state.board);
        state.rows = newRows;
        state.cols = newCols;

        return true;
    }

    stepNodeMatch(nodeToId, state, stateFrame, stateNode, stateCallResult) {
        if (this.findLayerPattern(state, stateNode.pattern).length > 0) {
            return true;
        } else {
            return false;
        }
    }

    stepNodeRewrite(nodeToId, state, stateFrame, stateNode, stateCallResult) {
        let matches = this.findLayerPattern(state, stateNode.lhs);
        if (matches.length > 0) {
            let match = matches[Math.floor(Math.random() * matches.length)];
            this.rewriteLayerPattern(state, stateNode.rhs, match.row, match.col);
            return true;
        } else {
            return false;
        }
    }

    stepNodeRewriteAll(nodeToId, state, stateFrame, stateNode, stateCallResult) {
        let matches = this.findLayerPattern(state, stateNode.lhs);
        if (matches.length > 0) {
            matches.sort((a, b) => 0.5 - Math.random());
            for (let match of matches) {
                if (this.matchLayerPattern(state, stateNode.lhs, match.row, match.col)) {
                    this.rewriteLayerPattern(state, stateNode.rhs, match.row, match.col);
                }
            }
            return true;
        } else {
            return false;
        }
    }

    stepNodeDisplayBoard(nodeToId, state, stateFrame, stateNode, stateCallResult) {
        if (state.displayWait === true) {
            return null;
        } else if (state.displayDone) {
            state.displayDone = false;
            return true;
        } else {
            state.displayWait = true;
            state.displayDone = false;
            state.displayDelay = 0;

            if (stateNode.hasOwnProperty('delay')) {
                state.displayDelay = stateNode.delay;
            }
            return null;
        }
    }

    stepNodePlayer(nodeToId, state, stateFrame, stateNode, stateCallResult) {
        if (state.choiceWait === true) {
            return null;
        } else if (state.choiceMade !== null) {
            this.rewriteLayerPattern(state, state.choiceMade.rhs, state.choiceMade.row, state.choiceMade.col);
            state.choiceMade = null;
            return true;
        } else {
            state.choiceWait = false;
            state.choiceMade = null;
            state.choicePlayer = null;
            state.choices = null;
            state.choicesByRct = null;
            state.choicesByBtn = null;

            let choices = [];
            for (let child of stateNode.children) {
                if (child.type === 'rewrite') {
                    let matches = this.findLayerPattern(state, child.lhs);
                    for (let match of matches) {
                        choices.push({ desc: child.desc, button: child.button, mouse: child.mouse,
                                       lhs: child.lhs, rhs: child.rhs, row: match.row, col: match.col });
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
                state.choicePlayer = stateNode.pid;

                state.choices = choices;
                state.choicesByRct = Object.create(null);
                state.choicesByBtn = Object.create(null);

                for (let choiceIndex = 0; choiceIndex < state.choices.length; choiceIndex += 1) {
                    const choice = state.choices[choiceIndex];

                    if (choice.mouse !== false) {
                        let [rowsChoice, colsChoice] = this.layerPatternSize(choice.rhs);
                        let rct = { row: choice.row, col: choice.col, rows: rowsChoice, cols: colsChoice };
                        let rctk = JSON.stringify(rct);

                        let mapChoices = [];
                        if (Object.hasOwn(state.choicesByRct, rctk)) {
                            mapChoices = state.choicesByRct[rctk].choices;
                        }

                        mapChoices.push(choiceIndex);
                        state.choicesByRct[rctk] = { rct: rct, choices: mapChoices };
                    }

                    if (choice.button !== undefined) {
                        state.choicesByBtn[choice.button] = choiceIndex;
                    }
                }

                state.choiceWait = true;

                return null;
            } else {
                return false;
            }
        }
    }

    pushCallStack(nodeToId, state, stateNode) {
        state.callStack.push({ nodeId: nodeToId.get(stateNode), local: null });
    }

    pushCallStackNextChild(nodeToId, state, stateFrame, stateNode) {
        this.pushCallStack(nodeToId, state, stateNode.children[stateFrame.local['index']]);
        stateFrame.local['index'] = stateFrame.local['index'] + 1;
        return null;
    }

    layerPatternSize(lpattern) {
        for (const [layer, pattern] of Object.entries(lpattern)) {
            return [pattern.length, pattern[0].length];
        }
        return [0, 0];
    }

    matchLayerPattern(state, lpattern, row, col) {
        const [prows, pcols] = this.layerPatternSize(lpattern);

        if (prows === 0 || pcols === 0) {
            return false;
        }

        for (let rr = 0; rr < prows; rr += 1) {
            for (let cc = 0; cc < pcols; cc += 1) {
                for (let layer in lpattern) {
                    if (lpattern[layer][rr][cc] === '.') {
                        continue;
                    }
                    if (!state.board.hasOwnProperty(layer)) {
                        return false;
                    }
                    if (state.board[layer][row + rr][col + cc] !== lpattern[layer][rr][cc]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    rewriteLayerPattern(state, lpattern, row, col) {
        const [prows, pcols] = this.layerPatternSize(lpattern);

        for (let rr = 0; rr < prows; rr += 1) {
            for (let cc = 0; cc < pcols; cc += 1) {
                for (let layer in lpattern) {
                    if (lpattern[layer][rr][cc] === '.') {
                        continue;
                    }
                    state.board[layer][row + rr][col + cc] = lpattern[layer][rr][cc];
                }
            }
        }
    }

    findLayerPattern(state, lpattern) {
        const [prows, pcols] = this.layerPatternSize(lpattern);

        let ret = [];
        for (let rr = 0; rr < state.rows - prows + 1; rr += 1) {
            for (let cc = 0; cc < state.cols - pcols + 1; cc += 1) {
                if (this.matchLayerPattern(state, lpattern, rr, cc)) {
                    ret.push({ row: rr, col: cc });
                }
            }
        }
        return ret;
    }

    localInit(frame, what) {
        if (frame.local === null) {
            frame.local = Object.create(null);
            for (let [name, val] of what) {
                frame.local[name] = val;
            }
        }
    }

    localGet(frame, name) {
        return frame.local[name];
    }

    localSet(frame, name, val) {
        return frame.local[name] = val;
    }

    localSetIfTrue(frame, name, check) {
        if (check === true) {
            frame.local[name] = true;
        }
    }

    localIncrement(frame, name) {
        frame.local[name] = frame.local[name] + 1;
    }

    localEqual(frame, name, val) {
        return frame.local[name] === val;
    }
};



class TRRBTEngine {

    constructor(game, undoEnabled) {
        this.game = game;

        this.nodeLookup = null;

        this.state = null;
        this.stepper = null;

        this.undoEnabled = undoEnabled;
        this.undoStackFirst = null;
        this.undoStackMove = null;
        this.undoStackRecent = null;
    }

    onLoad() {
        this.game = this.game;

        if (this.game.tree === null) {
            this.nodeLookup = null;
        } else {
            this.nodeLookup = { idToNode:new Map(), nodeToId:new WeakMap() };
            this.initializeNodeLookup(this.nodeLookup, this.game.tree, [0]);
        }

        this.state = new TRRBTState();
        this.stepper = new TRRBTStepper();

        if (!this.undoEnabled) {
            this.undoStackFirst = null;
            this.undoStackMove = null;
            this.undoStackRecent = null;
        } else {
            this.undoStackFirst = null;
            this.undoStackMove = [];
            this.undoStackRecent = [];
        }
    }

    initializeNodeLookup(nodeLookup, node, id) {
        nodeLookup.idToNode.set(id[0], node);
        nodeLookup.nodeToId.set(node, id[0]);

        if (node.hasOwnProperty('children')) {
            for (let child of node.children) {
                id[0] += 1;
                this.initializeNodeLookup(nodeLookup, child, id);
            }
        }
    }

    getState() {
        return deepcopyobj(this.state);
    }

    setState(state) {
        this.state = deepcopyobj(state);
    }

    undoPush() {
        if (!this.undoEnabled) {
            return;
        }

        let state = deepcopyobj(this.state);

        if (this.undoStackFirst === null) {
            this.undoStackFirst = state;
        } else {
            while (this.undoStackRecent.length >= ENG_UNDO_RECENT_MAX) {
                let oldState = this.undoStackRecent.shift();
                if (oldState.callStack !== null && oldState.callStack.length > 0 && (oldState.choiceWait === true || oldState.displayWait === true)) {
                    while (this.undoStackMove.length >= ENG_UNDO_PLAYER_MAX) {
                        this.undoStackMove.shift();
                    }
                    this.undoStackMove.push(oldState);
                }
            }
            this.undoStackRecent.push(state);
        }
    }

    undoPop() {
        if (!this.undoEnabled) {
            return;
        }

        let state = null;
        if (this.undoStackRecent.length > 0) {
            state = this.undoStackRecent.pop();
        } else if (this.undoStackMove.length > 0) {
            state = this.undoStackMove.pop();
        } else if (this.undoStackFirst !== null) {
            state = this.undoStackFirst;
            this.undoStackFirst = null;
        }

        if (state !== null) {
            this.state = state;
        } else {
            this.state = new TRRBTState();
        }
    }

    undoEmpty() {
        if (!this.undoEnabled) {
            return true;
        } else {
            return (this.undoStackRecent.length + this.undoStackMove.length) === 0 && this.undoStackFirst === null;
        }
    }

    gameOver() {
        return this.state.gameResult !== null;
    }

    clearDisplayWait(clearLoopCheck) {
        this.undoPush();
        this.stepper.clearDisplayWait(this.nodeLookup, this.state, clearLoopCheck);
    }

    clearChoiceWait(clearLoopCheck, choiceIndex) {
        this.undoPush();
        this.stepper.clearChoiceWait(this.nodeLookup, this.state, clearLoopCheck, choiceIndex);
    }

    step() {
        this.undoPush();
        this.stepper.step(this.nodeLookup, this.state, ENG_LOOP_CHECK_MAX);
    }

    stepReady() {
        return this.stepper.stepReady(this.nodeLookup, this.state);
    }

    stepToWait() {
        let stepped = 0;

        while (this.stepReady()) {
            this.step();
            ++ stepped;
        }

        return stepped;
    }

    stepToWaitChoiceOrResult() {
        let stepped = 0;

        stepped += this.stepToWait();
        while (this.state.displayWait) {
            this.clearDisplayWait(false);
            stepped += this.stepToWait();
        }

        return stepped;
    }

};



class TRRBTWebEngine extends TRRBTEngine {

    constructor(game, canvasname, divname) {
        super(game, true);

        this.canvasname = canvasname;
        this.divname = divname;

        this.canvas = null;
        this.ctx = null;
        this.gameResultText = null;
        this.gameResultFrames = null;
        this.breakResumeText = null;
        this.layersDiv = null;
        this.engineDiv = null;

        this.padding = null;
        this.cell_size = null;
        this.min_width = null;
        this.keysDown = null;

        this.spriteArrays = null;
        this.spriteImages = null;
        this.spriteTiles = null;
        this.back = null;

        this.player_id_colors = null;

        this.mouseChoice = null;
        this.mouseAlt = false;
        this.delayUntil = null;

        this.stepManual = false;

        this.drawRequested = false;
        this.hiddenLayers = null;

        this.editor = null;
    }

    onLoad() {
        super.onLoad(this);

        document.oncontextmenu = function () {
            return false;
        }

        this.canvas = document.getElementById(this.canvasname);
        this.ctx = this.canvas.getContext('2d');
        this.gameResultText = null;
        this.gameResultFrames = null;
        this.breakResumeText = null;
        this.engineDiv = this.divname ? document.getElementById(this.divname) : null;

        this.padding = (this.padding === null) ? 10 : this.padding;
        this.cell_size = (this.cell_size === null) ? ENG_CELL_SIZE_DEFAULT : this.cell_size;
        this.min_width = 10 * ENG_CELL_SIZE_MAX;
        this.keysDown = new Set();

        this.spriteArrays = null;
        this.spriteImages = null;
        this.spriteTiles = null;
        this.back = null;

        this.player_id_colors = Object.create(null);

        this.mouseChoice = null;
        this.mouseAlt = false;
        this.delayUntil = null;

        this.stepManual = false;

        this.drawRequested = false;
        this.hiddenLayers = Object.create(null);

        this.canvas.addEventListener('mousedown', bind0(this, 'onMouseDown'));
        this.canvas.addEventListener('mousemove', bind0(this, 'onMouseMove'));
        this.canvas.addEventListener('mouseup', bind0(this, 'onMouseUp'));
        this.canvas.addEventListener('mouseout', bind0(this, 'onMouseOut'));
        this.canvas.addEventListener('keydown', bind0(this, 'onKeyDown'));
        this.canvas.addEventListener('keyup', bind0(this, 'onKeyUp'));
        this.canvas.focus();

        if (this.game.sprites !== null) {
            if (this.game.sprites.images !== undefined) {
                this.spriteArrays = Object.create(null);
                this.spriteImages = Object.create(null);
                for (let imageName in this.game.sprites.images) {
                    const image_info = this.game.sprites.images[imageName];
                    this.loadSpriteImage(imageName, image_info)
                }
            }
            if (this.game.sprites.tiles !== undefined) {
                this.spriteTiles = Object.create(null);
                for (let tile in this.game.sprites.tiles) {
                    this.spriteTiles[tile] = this.game.sprites.tiles[tile];
                }
            }
            if (this.game.sprites.players !== undefined) {
                for (let pid in this.game.sprites.players) {
                    this.player_id_colors[String(pid)] = this.game.sprites.players[pid];
                }
            }
            if (this.game.sprites.back !== undefined) {
                this.back = this.game.sprites.back;
            }
        }

        this.canvas.style.backgroundColor = '#ffffff';

        this.updateEngineEditor();

        this.requestDraw();
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
        this.spriteArrays[image_name] = null;
        this.spriteImages[image_name] = null;

        const image_info_data = image_info.data;
        const image_decoded = atob(image_info_data);
        const image_array = Uint8Array.from(image_decoded, c => c.charCodeAt(0));
        const image_blob = new Blob([image_array.buffer]);
        const image_decompressed = image_blob.stream().pipeThrough(new DecompressionStream('deflate'));
        const image_reader = image_decompressed.getReader();

        let image_read_array = null;

        let this_engine = this;

        image_reader.read().then(function process({ done, value }) {
            if (!done) {
                if (image_read_array === null) {
                    image_read_array = value;
                } else {
                    let merged_array = new Uint8Array(image_read_array.length + value.length);
                    merged_array.set(image_read_array);
                    merged_array.set(value, image_read_array.length);
                    image_read_array = merged_array;
                }
                return image_reader.read().then(process);
            } else {
                this_engine.spriteArrays[image_name] = { array:image_read_array, size:image_info.size };
                this_engine.resizeSpriteImage(image_name);
            }
        });
    }

    resizeSpriteImage(image_name) {
        let this_engine = this;
        const image_array = this_engine.spriteArrays[image_name];
        const image_data = this_engine.arrayToImageData(image_array.array, image_array.size[0], image_array.size[1], this_engine.cell_size, this_engine.cell_size);
        let img_promise = createImageBitmap(image_data);
        img_promise.then((img_loaded) => this_engine.spriteImages[image_name] = img_loaded);
    }

    resizeAllSpriteImages() {
        if (this.spriteImages !== null) {
            for (const image_name of Object.keys(this.spriteArrays)) {
                this.spriteImages[image_name] = null;
                this.resizeSpriteImage(image_name);
            }
        }
    }

    setState(state) {
        super.setState(state);
        this.stateSetUpdate(false);
    }

    stateSetUpdate(useDelay) {
        this.gameResultFrames = null;

        this.mouseChoice = null;
        this.mouseAlt = false;

        if (this.state.displayWait && useDelay) {
            this.delayUntil = Date.now() + 1000;
        } else {
            this.delayUntil = null;
        }

        this.updateEditor();

        this.requestDraw();
    }

    updateEditor() {
        if (this.editor !== null) {
            this.editor.updatePositionsAndDraw();
        }
        this.updateLayersDiv();
    }

    updateEngineEditor() {
        if (this.engineDiv === null) {
            return;
        }

        const ed = this.engineDiv;

        ed.innerHTML = '';

        appendText(ed, 'Engine', true, true);
        appendText(ed, ' ');
        appendText(ed, '(Hover for additional info)', false, false, true);
        appendBr(ed, true);

        appendButton(ed, 'restart-engine', 'Restart', 'Restart game.', null, bind0(this, 'onLoad'));
        appendText(ed, ' ');
        this.gameResultText = document.createElement('span');
        this.gameResultText.style.color = '#4444cc';
        this.gameResultText.innerHTML = '';
        this.gameResultText.title = 'Game is over.  Restart to play again.';
        this.gameResultText.style.display = 'none';
        ed.appendChild(this.gameResultText);
        appendBr(ed);

        /*
        // slider doesn't seem to work well when things move around on resize, isn't vertically centered
        appendText(ed, ' Size: ');
        let sizeSlider = document.createElement('input');
        sizeSlider.type = 'range';
        sizeSlider.min = ENG_CELL_SIZE_MIN;
        sizeSlider.max = ENG_CELL_SIZE_MAX;
        sizeSlider.step =ENG_CELL_SIZE_STEP;
        sizeSlider.value = this.cell_size;
        sizeSlider.oninput = bind1(this, 'onCellSize', sizeSlider);
        ed.appendChild(sizeSlider);
        */
        appendButton(ed, 'engine-smallest', 'Smallest', 'Make game smallest.', null, bind1(this, 'onCellSize', -999));
        appendButton(ed, 'engine-smaller', 'Smaller', 'Make game smaller.', null, bind1(this, 'onCellSize', -1));
        appendButton(ed, 'engine-larger', 'Larger', 'Make game larger.', null, bind1(this, 'onCellSize', 1));
        appendButton(ed, 'engine-largest', 'Largest', 'Make game largest.', null, bind1(this, 'onCellSize', 999));

        appendBr(ed, true);

        appendButton(ed, 'engine-breakresume', 'Break/Resume', 'Toggle between break/running mode.', null, bind0(this, 'onBreakResume'));
        appendText(ed, ' ');
        this.breakResumeText = document.createElement('span');
        this.breakResumeText.style.color = '#fc5d5d';
        this.breakResumeText.innerHTML = 'In break mode (resume or restart).';
        this.breakResumeText.title = 'Game is currently in break mode, where you must manually step. Resume or restart to play as normal.';
        this.breakResumeText.style.display = 'none';
        ed.appendChild(this.breakResumeText);
        appendBr(ed);

        appendButton(ed, 'engine-undo-move', 'Undo Move', 'Undo to last choice or display.', null, bind1(this, 'onUndo', 'move'));
        appendButton(ed, 'engine-undo-choice', 'Undo Choice', 'Undo to last player choice.', null, bind1(this, 'onUndo', 'choice'));
        appendButton(ed, 'engine-undo-step', 'Undo Step', 'Undo a single step.', null, bind1(this, 'onUndo', 'step'));
        appendBr(ed);

        appendButton(ed, 'engine-next-move', 'Next Move', 'Run to next choice or display.', null, bind1(this, 'onNext', 'move'));
        appendButton(ed, 'engine-next-choice', 'Next Choice', 'Run to next player choice.', null, bind1(this, 'onNext', 'choice'));
        appendButton(ed, 'engine-next-step', 'Next Step', 'Run a single step.', null, bind1(this, 'onNext', 'step'));
        appendBr(ed);

        this.layersDiv = document.createElement('div');
        ed.appendChild(this.layersDiv);
        this.updateLayersDiv()
    }

    resizeCanvas() {
        const desiredWidth = this.tocvsx(Math.max(1, this.state.cols)) + this.padding;
        const desiredHeight = this.tocvsy(Math.max(1, this.state.rows)) + this.padding;
        if (this.canvas.width != desiredWidth || this.canvas.height != desiredHeight) {
            const ratio = window.devicePixelRatio;
            this.canvas.width = desiredWidth * ratio;
            this.canvas.height = desiredHeight * ratio;
            this.canvas.style.width = desiredWidth + 'px';
            this.canvas.style.height = desiredHeight + 'px';
            this.ctx.scale(ratio, ratio);

            const parent = this.canvas.parentElement;
            if (parent) {
                this.width = Math.max(this.width, desiredWidth);
                parent.style['width'] = this.width + 'px';
            }
        }
    }

    requestDraw() {
        if (!this.drawRequested) {
            this.drawRequested = true;
            window.requestAnimationFrame(bind0(this, 'onDraw'));
        }
    }

    onDraw() {
        this.drawRequested = false;

        if (this.spriteImages !== null) {
            for (let [imgName, img] of Object.entries(this.spriteImages)) {
                if (img === null) {
                    this.requestDraw();
                    return;
                }
            }
        }

        if (!this.stepManual) {
            if (this.stepToWait() > 0) {
                this.updateEditor();
            }

            if (this.state.displayWait) {
                this.requestDraw();
                if (this.delayUntil === null) {
                    if (this.stepManual) {
                        this.delayUntil = 0;
                    } else {
                        this.delayUntil = Date.now() + 1000 * this.state.displayDelay;
                    }
                } else {
                    if (Date.now() >= this.delayUntil) {
                        this.delayUntil = null;
                        this.clearDisplayWait(true);
                    }
                }
            }
        }

        this.resizeCanvas();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#eeeeee';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const TEXT_YOFFSET  = 0.05;
        const EMOJI_YOFFSET = 0.17;

        for (let rr = 0; rr < this.state.rows; rr += 1) {
            for (let cc = 0; cc < this.state.cols; cc += 1) {
                let all_invis = true;
                for (const [layer, pattern] of Object.entries(this.state.board)) {
                    if (pattern[rr][cc] !== '.') {
                        all_invis = false;
                    }
                }
                if (!all_invis) {
                    if (this.back !== null) {
                        const brows = this.back.length;
                        const bcols = this.back[0].length;

                        const back_tile = this.back[rr % brows][cc % bcols];
                        if (this.spriteTiles !== null && Object.hasOwn(this.spriteTiles, back_tile)) {
                            const img = this.spriteImages[this.spriteTiles[back_tile]];
                            this.ctx.drawImage(img, this.tocvsx(cc), this.tocvsy(rr));
                        }
                    } else {
                        this.ctx.fillStyle = '#cccccc';
                        this.ctx.fillRect(this.tocvsx(cc), this.tocvsy(rr), this.cell_size, this.cell_size);
                    }
                }
            }
        }

        let choiceOverwrite = null;
        if (this.mouseChoice !== null && !this.mouseAlt) {
            choiceOverwrite = { rct: this.mouseChoice.rct, rhs: this.state.choices[this.state.choicesByRct[JSON.stringify(this.mouseChoice.rct)].choices[this.mouseChoice.idx]].rhs };
        }

        this.ctx.fillStyle = '#000000';

        for (let rr = 0; rr < this.state.rows; rr += 1) {
            for (let cc = 0; cc < this.state.cols; cc += 1) {
                let tiles = [];
                let overwrites = [];
                if (choiceOverwrite !== null &&
                    choiceOverwrite.rct.row <= rr && rr < choiceOverwrite.rct.row + choiceOverwrite.rct.rows &&
                    choiceOverwrite.rct.col <= cc && cc < choiceOverwrite.rct.col + choiceOverwrite.rct.cols) {
                    for (const [layer, pattern] of Object.entries(this.state.board)) {
                        if (Object.hasOwn(this.hiddenLayers, layer)) {
                            continue;
                        }
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
                    for (const [layer, pattern] of Object.entries(this.state.board)) {
                        if (Object.hasOwn(this.hiddenLayers, layer)) {
                            continue;
                        }
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
                        if (this.spriteTiles !== null && Object.hasOwn(this.spriteTiles, tile)) {
                            const imgName = this.spriteTiles[tile];
                            if (imgName !== null) {
                                const img = this.spriteImages[imgName];
                                this.ctx.drawImage(img, this.tocvsx(cc), this.tocvsy(rr));
                            }
                        } else {
                            if (tile.length > 0 && tile[0] === '_') {
                                // pass
                            } else {
                                function isASCII(str) { return /^[\x00-\x7F]*$/.test(str); }
                                const offset = isASCII(tile) ? TEXT_YOFFSET : EMOJI_YOFFSET;
                                this.ctx.font = (this.cell_size / graphemeLength(tile)) + ENG_FONTNAME;
                                this.ctx.fillText(tile, this.tocvsx(cc + 0.5), this.tocvsy(rr + 0.5 + offset));
                            }
                        }
                    }
                }
            }
        }

        if (this.state.choicesByRct !== null) {
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 1.0;

            const colork = String(this.state.choicePlayer);
            if (!Object.hasOwn(this.player_id_colors, colork)) {
                let color_num = Object.keys(this.player_id_colors).length % 5;
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
                this.player_id_colors[colork] = next_color;
            }

            let player_color = this.player_id_colors[colork];

            if (this.mouseChoice !== null) {
                let rct = this.mouseChoice.rct;
                let idx = this.mouseChoice.idx;

                let rct_choices = this.state.choicesByRct[JSON.stringify(rct)].choices;
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

                    for (const [rctk, rctChoices] of Object.entries(this.state.choicesByRct)) {
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
            this.ctx.lineWidth = 11;
            this.ctx.strokeStyle = '#ffdddd';
            this.ctx.strokeRect(0, 0, this.canvas.width / PIXEL_RATIO, this.canvas.height / PIXEL_RATIO);
        }

        if (this.state.gameResult !== null) {
            this.ctx.lineWidth = 5;
            this.ctx.strokeStyle = '#4444cc';
            this.ctx.strokeRect(0, 0, this.canvas.width / PIXEL_RATIO, this.canvas.height / PIXEL_RATIO);
        }

        if (this.gameResultFrames !== null && this.gameResultFrames > 0) {
            this.gameResultFrames -= 1;
            if (this.gameResultFrames === 0) {
                //alert(this.gameResultText.innerHTML);
                this.gameResultFrames = null;
            }
            this.requestDraw();
        }

        if (this.gameResultText.style.display === 'none') {
            if (this.state.gameResult !== null) {
                let gameOverText = null;
                this.gameResultText.style.display = 'inline';
                if (this.state.gameResult.result === 'win') {
                    let player = this.state.gameResult.player;
                    gameOverText = 'Game over, player ' + player + ' wins!';
                } else if (this.state.gameResult.result === 'lose') {
                    let player = this.state.gameResult.player;
                    gameOverText = 'Game over, player ' + player + ' loses!';
                } else if (this.state.gameResult.result === 'draw') {
                    gameOverText = 'Game over, draw!';
                } else if (this.state.gameResult.result === 'stalemate') {
                    gameOverText = 'Game over, stalemate!';
                } else if (this.state.gameResult.result === 'stepout') {
                    gameOverText = 'Game over, too many steps before move!';
                } else {
                    gameOverText = 'Game over, unknown result: ' + this.state.gameResult.result + '!';
                }
                this.gameResultText.innerHTML = gameOverText;
                this.gameResultFrames = 10;
                this.requestDraw();
            }
        } else {
            if (this.state.gameResult === null) {
                this.gameResultText.style.display = 'none';
                this.gameResultText.innerHTML = '';
            }
        }
        this.updateLayersDiv();
    }

    updateStepManual(setting) {
        if (setting != this.stepManual) {
            this.stepManual = setting;
            if (this.breakResumeText !== null) {
                if (this.stepManual) {
                    this.breakResumeText.style.display = 'inline';
                } else {
                    this.breakResumeText.style.display = 'none';
                }
            }
        }
    }

    updateLayersDiv() {
        this.layersDiv.innerHTML = '';

        if (this.state.board !== null) {
            appendBr(this.layersDiv);
            appendText(this.layersDiv, 'Layers', true, true);
            appendBr(this.layersDiv);
            for (let layer in this.state.board) {
                const layerHidden = Object.hasOwn(this.hiddenLayers, layer);
                const input = document.createElement('input');
                input.id = 'layer_' + layer;
                input.type = 'checkbox';
                input.checked = !layerHidden;
                input.onclick = () => {
                    if (layerHidden) {
                        delete this.hiddenLayers[layer];
                    } else {
                        this.hiddenLayers[layer] = true;
                    }
                    this.requestDraw();
                };

                const label = document.createElement('label');
                label.innerHTML = layer;
                label.htmlFor = 'layer_' + layer;;

                const span = document.createElement('span');
                span.appendChild(input);
                span.appendChild(label);
                appendBr(span);
                this.layersDiv.appendChild(span);
            }
        }
    }

    onCellSize(by) {
        this.cell_size = Math.max(ENG_CELL_SIZE_MIN, Math.min(ENG_CELL_SIZE_MAX, this.cell_size + by * ENG_CELL_SIZE_STEP));
        this.resizeAllSpriteImages();
        this.requestDraw();
    }

    onBreakResume() {
        this.updateStepManual(!this.stepManual);
        this.requestDraw();
    }

    onUndo(toWhat) {
        this.undoPop();
        if (toWhat === 'move') {
            while (!this.undoEmpty() && this.state.choiceWait === false && this.state.displayWait === false) {
                this.undoPop();
            }
        } else if (toWhat === 'choice') {
            while (!this.undoEmpty() && this.state.choiceWait === false) {
                this.undoPop();
            }
        } else {
            this.updateStepManual(true);
        }

        this.stateSetUpdate(true);
    }

    onNext(toWhat) {
        if (this.state.displayWait) {
            this.clearDisplayWait(true);
        }

        if (this.stepReady()) {
            this.step();
            if (toWhat === 'move') {
                this.stepToWait();
            } else if (toWhat === 'choice') {
                while (true) {
                    this.stepToWait();
                    if (this.state.displayWait) {
                        this.clearDisplayWait(false);
                    } else {
                        break;
                    }
                }
            } else {
                this.updateStepManual(true);
            }
            this.updateEditor();
        }

        this.requestDraw();
    }

    onKeyDown(evt) {
        let key = evt.key;

        if (!this.keysDown.has(key)) {
            this.keysDown.add(key);

            if (key === 'b' || key === 'B') {
                this.onBreakResume();
            } else if (key === 'n' || key === 'N') {
                this.onNext(key === 'n');
            } else if (key === 'p' || key === 'P') {
                this.onUndo(key === 'p');
            }

            if (this.state.choiceWait === true) {
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
                    keyp = 'action1';
                } else if (key === 'x') {
                    keyp = 'action2';
                }
                if (keyp !== null && Object.hasOwn(this.state.choicesByBtn, keyp)) {
                    const choiceIndex = this.state.choicesByBtn[keyp];
                    this.clearChoiceWait(true, choiceIndex);
                    this.mouseChoice = null;
                }
            }
        }

        evt.preventDefault();
        this.requestDraw();
    }

    onKeyUp(evt) {
        let key = evt.key;

        this.keysDown.delete(key);

        evt.preventDefault();
    }

    onMouseDown(evt) {
        this.canvas.focus();

        const mouseButton = evt.button;

        if (mouseButton === BUTTON_LEFT) {
            if (this.mouseChoice !== null) {
                if (this.state.choiceWait === true) {
                    const choiceIndex = this.state.choicesByRct[JSON.stringify(this.mouseChoice.rct)].choices[this.mouseChoice.idx];
                    this.clearChoiceWait(true, choiceIndex);
                    this.mouseChoice = null;
                }
            }
        } else if (mouseButton === BUTTON_RIGHT) {
            this.mouseAlt = true;
        }

        evt.preventDefault();
        this.requestDraw();
    }

    onMouseUp(evt) {
        const mouseButton = evt.button;

        if (mouseButton === BUTTON_RIGHT) {
            this.mouseAlt = false;
        }

        evt.preventDefault();
        this.requestDraw();
    }

    onMouseMove(evt) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = evt.clientX - rect.left;
        const mouseY = evt.clientY - rect.top;

        this.mouseChoice = null;
        if (this.state.choicesByRct !== null) {
            const mr = this.fromcvsy(mouseY);
            const mc = this.fromcvsx(mouseX);
            if (0 <= mr && mr < this.state.rows && 0 <= mc && mc < this.state.cols) {
                let best_choices = [];
                let best_dist_sqr = null;

                for (const [rctk, rctChoices] of Object.entries(this.state.choicesByRct)) {
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
                                best_choices.push({ rct: rct, idx: ii });
                            }
                        } else if (dist_sqr < best_dist_sqr + 0.001) {
                            for (let ii = 0; ii < choices.length; ii += 1) {
                                best_choices.push({ rct: rct, idx: ii });
                            }
                        }
                    }
                }

                if (best_choices.length > 0) {
                    const choice_idx = Math.max(0, Math.min(best_choices.length - 1, Math.floor(best_choices.length * (mc - Math.floor(mc)))));
                    this.mouseChoice = { rct: best_choices[choice_idx].rct, idx: best_choices[choice_idx].idx }
                }
            }
        }

        evt.preventDefault();
        this.requestDraw();
    }

    onMouseOut(evt) {
        this.mouseChoice = null;

        evt.preventDefault();
        this.requestDraw();
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
};
