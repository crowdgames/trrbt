import argparse, json
import util



def game_agent(filename, enum, board_init, random_seed):
    game = util.yaml2bt(filename, True, True)
    engine, max_tile_width, rng = util.setup_engine(game, 'UNDO_NONE', board_init, random_seed)

    queue = []
    seen = {}
    enum_seen = {}

    engine.stepToWaitChoiceOrResult()
    state = engine.getState()
    stateStr = str(state)

    queue.append((state, 0))
    seen[stateStr] = None

    while len(queue) > 0:
        state, steps = queue[0]
        queue = queue[1:]

        engine.setState(state)
        stateBoard = dict(state.board)
        stateResult = dict(state.gameResult) if engine.gameOver() else None

        if enum:
            enum_key = str((stateBoard, stateResult))
            if enum_key not in enum_seen:
                enum_seen[enum_key] = None
                print(json.dumps({'board':stateBoard, 'steps':steps, 'game_result':stateResult}), flush=True)

        if stateResult is not None:
            if stateResult['result'] == 'win':
                if not enum:
                    print(json.dumps({'board':stateBoard, 'steps':steps, 'game_result':stateResult, 'success':True}), flush=True)
                    return
            else:
                continue

        else:
            if state.displayWait:
                raise RuntimeError('At display wait.')
            if not state.choiceWait:
                raise RuntimeError('Not at choice wait.')

            for choiceIndex in range(len(state.choices)):
                engine.setState(state)
                engine.clearChoiceWait(True, choiceIndex)
                engine.stepToWaitChoiceOrResult()
                nextState = engine.getState()
                nextStateStr = str(nextState)
                if nextStateStr not in seen:
                    queue.append((nextState, steps + 1))
                    seen[nextStateStr] = None

    if not enum:
        print(json.dumps({'success':False}), flush=True)



if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run agent on game YAML.')
    parser.add_argument('filename', type=str, help='Filename to process.')
    parser.add_argument('--enum', action='store_true', help='Enumerate boards rather than find winning board.')
    parser.add_argument('--board', type=str, help='Initial board configuration.')
    parser.add_argument('--seed', type=int, help='Random seed.')
    args = parser.parse_args()

    board_init = None if args.board is None else json.loads(args.board)

    game_agent(args.filename, args.enum, board_init, args.seed)
