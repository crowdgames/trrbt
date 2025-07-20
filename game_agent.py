import argparse, json
import util



def agent_game(filename, enum):
    game = util.yaml2bt(filename, True, True)

    engine = util.new_engine(game, 'UNDO_NONE')

    max_tile_width = util.node_max_tile_width(game.tree)

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
                        print(json.dumps({'board':dict(nextState.board)}), flush=True)
                    queue.append(nextState)
                    seen[nextStateStr] = None

    if not enum:
        print(json.dumps({'result':False}), flush=True)



if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run agent on game YAML.')
    parser.add_argument('filename', type=str, help='Filename to process.')
    parser.add_argument('--enum', action='store_true', help='Enumerate states rather than find winning state.')
    args = parser.parse_args()

    agent_game(args.filename, args.enum)
