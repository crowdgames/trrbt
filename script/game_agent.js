const args = parse_args({
    game: { type: 'string', required: true },
    board: { type: 'string' },
    enumerate: { type: 'boolean', default: false },
});

const game = load_game(args.game, true, true);

const board_init = args.board ? JSON.parse(args.board) : null;

const [engine, max_tile_width] = setup_engine(game, ENG_UNDO_NONE, board_init, 0);

let queue = [];
let seen = {};
let enum_seen = {};

engine.stepToWaitChoiceOrResult();
const stateInit = engine.getState();
const stateInitStr = JSON.stringify(stateInit);

queue.push([stateInit, 0]);
seen[stateInitStr] = null;

while (queue.length > 0) {
    const [state, steps] = queue.shift();

    if (args.enumerate) {
        const enum_key = JSON.stringify([state.board, state.gameResult]);
        if (!(enum_key in enum_seen)) {
            enum_seen[enum_key] = null;
            process.stdout.write(JSON.stringify({'board':state.board, 'steps':steps, 'game_result':state.gameResult}) + '\n')
        }
    }

    if (state.gameResult !== null) {
        if (state.gameResult.result === 'win') {
            if (!args.enumerate) {
                process.stdout.write(JSON.stringify({'board':state.board, 'steps':steps, 'game_result':state.gameResult, 'success':true}) + '\n');
                process.exit();
            } else {
                continue;
            }
        }
    } else {
        if (state.displayWait) {
            throw new Error('At display wait.');
        }
        if (!state.choiceWait) {
            throw new Error('Not at choice wait.');
        }

        for (const choiceIndex in state.choices) {
            engine.setState(state);
            engine.clearChoiceWait(true, choiceIndex);
            engine.stepToWaitChoiceOrResult();
            const nextState = engine.getState();
            const nextStateStr = JSON.stringify(nextState);
            if (!(nextStateStr in seen)) {
                queue.push([nextState, steps + 1]);
                seen[nextStateStr] = null;
            }
        }
    }
}

if (!args.enumerate) {
    process.stdout.write(JSON.stringify({'success':false}) + '\n');
}
