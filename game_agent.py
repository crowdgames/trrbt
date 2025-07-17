import argparse, json, os, random, sys, time
import util



def agent_game(filename):
    game = util.yaml2bt(filename, True, True)

    engine = util.new_engine(game, False)

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
                print(json.dumps({'result':True, 'board':dict(state.board)}))
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
                    queue.append(nextState)
                    seen[nextStateStr] = None

    print(json.dumps({'result':False}))



if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run agent on game YAML.')
    parser.add_argument('filename', type=str, help='Filename to process.')
    args = parser.parse_args()

    agent_game(args.filename)
