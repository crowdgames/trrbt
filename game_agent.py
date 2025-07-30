import argparse, json
import util



def game_agent(filename, enum, board_init, random_seed):
    game = util.yaml2bt(filename, True, True)
    engine, max_tile_width, rng = util.setup_engine(game, 'UNDO_NONE', board_init, random_seed)

    queue = []
    seen = {}

    engine.stepToWaitChoiceOrResult()
    state = engine.getState()
    stateStr = str(state)

    queue.append(state)
    seen[stateStr] = None

    while len(queue) > 0:
        state = queue[0]
        queue = queue[1:]

        engine.setState(state)
        if engine.gameOver():
            if state.gameResult.result == 'win':
                if enum:
                    pass
                else:
                    print(json.dumps({'result':True, 'board':dict(state.board)}), flush=True)
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
                    if enum:
                        print(json.dumps(dict(nextState.board)), flush=True)
                    queue.append(nextState)
                    seen[nextStateStr] = None

    if not enum:
        print(json.dumps({'result':False}), flush=True)



if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run agent on game YAML.')
    parser.add_argument('filename', type=str, help='Filename to process.')
    parser.add_argument('--enum', action='store_true', help='Enumerate states rather than find winning state.')
    parser.add_argument('--board', type=str, help='Initial board configuration.')
    parser.add_argument('--seed', type=int, help='Random seed.')
    args = parser.parse_args()

    board_init = None if args.board is None else json.loads(args.board)

    game_agent(args.filename, args.enum, board_init, args.seed)
