import argparse, os, random, sys, time
import util



DEFAULT_DISPLAY_DELAY = 0.5



def cls():
    sys.stdout.flush()
    sys.stderr.flush()
    os.system('cls' if os.name == 'nt' else 'clear')

def delay(seconds):
    sys.stdout.flush()
    sys.stderr.flush()
    time.sleep(seconds)



def run_game(filename, choice_order, random_players, clear_screen, board_init):
    game = util.yaml2bt(filename, True, True)

    if board_init is not None:
        game.tree = {'type':'order', 'children':[{'type':'set-board', 'pattern':board_init}, {'type':'display-board'}, game.tree]}

    engine = util.new_engine(game, False)

    saved_state = None

    previous_moves = {}
    max_tile_width = util.node_max_tile_width(game.tree)

    def displayBoard():
        if clear_screen is not None:
            cls()

        print('Current board is:')
        print(util.layer_pattern_to_string(engine.state.board, None, '-', '-\n', '\n', '', '', ' ', '\n', max_tile_width))
        print()

    while True:
        engine.stepToWait()

        displayBoard()

        if engine.gameOver():
            go = engine.state.gameResult
            if go.result == 'win':
                print('Game over, player', go.player, 'wins')
            elif go.result == 'lose':
                print('Game over, player', go.player, 'loses')
            elif go.result == 'draw':
                print('Game over, draw')
            elif go.result == 'stalemate':
                print('Game over, stalemate')
            elif go.result == 'stepout':
                print('Game over, too many steps before player input!')
            else:
                print('Game over, unrecognized game result:', go.result)
            break

        elif engine.state.displayWait:
            delay(engine.state.displayDelay)

            engine.clearDisplayWait(True)

        elif engine.state.choiceWait:
            player_id = util.intify(engine.state.choicePlayer)

            if player_id in random_players:
                choiceIndex = random.randint(0, len(engine.state.choices) - 1)
                choice = engine.state.choices[choiceIndex]

                lhs = util.layer_pattern_to_string(choice.lhs, None, '-', '-:', '&', '', '', ' ', '; ')
                rhs = util.layer_pattern_to_string(choice.rhs, None, '-', '-:', '&', '', '', ' ', '; ')
                row = round(choice.row)
                col = round(choice.col)

                print(f'Player {player_id} choice: {lhs} → {rhs} at {row},{col}')

                engine.clearChoiceWait(True, choiceIndex)
                print()

                if clear_screen is not None:
                    delay(clear_screen)

            else:
                inputToChoiceIndex = {}

                for choiceIndex, choice in enumerate(engine.state.choices):
                    if choice_order:
                        inputIndex = choiceIndex + 1

                    else:
                        inputIndex = None

                        choice_keys = [(str(choice.lhs), choice.row, choice.col, str(choice.rhs)), (str(choice.lhs), choice.row, choice.col), (str(choice.lhs))]
                        for choice_key in choice_keys:
                            if choice_key in previous_moves:
                                inputIndex = previous_moves[choice_key]
                                break

                        if inputIndex is None:
                            inputIndex = 1 + (max(previous_moves.values()) if len(previous_moves) > 0 else 0)

                        while inputIndex in inputToChoiceIndex:
                            inputIndex += 1

                        for choice_key in choice_keys:
                            previous_moves[choice_key] = inputIndex

                    inputToChoiceIndex[inputIndex] = choiceIndex

                print(f'Choices for player {player_id} are:')
                for inputIndex, choiceIndex in inputToChoiceIndex.items():
                    choice = engine.state.choices[choiceIndex]

                    lhs = util.layer_pattern_to_string(choice.lhs, None, '-', '-:', '&', '', '', ' ', '; ')
                    rhs = util.layer_pattern_to_string(choice.rhs, None, '-', '-:', '&', '', '', ' ', '; ')
                    row = round(choice.row)
                    col = round(choice.col)

                    desc = f'({choice.desc}) ' if choice.desc is not None else ''

                    print(f'{desc}{inputIndex}: {lhs} → {rhs} at {row},{col}')

                print(f's: save state')
                if saved_state is not None:
                    print(f'r: restore state')

                while True:
                    try:
                        user_input = input(f'Please enter your choice: ')
                        if user_input == 's':
                            saved_state = engine.getState()
                        elif user_input == 'r' and saved_state is not None:
                            engine.setState(saved_state)
                        else:
                            user_input = int(user_input)
                            if user_input not in inputToChoiceIndex:
                                raise ValueError('Number out of range.')
                            else:
                                choiceIndex = inputToChoiceIndex[user_input]
                                engine.clearChoiceWait(True, choiceIndex)
                        break
                    except ValueError:
                        print('Error: Please enter a valid choice.')

                print()



if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Play game YAML.')
    parser.add_argument('filename', type=str, help='Filename to process.')
    parser.add_argument('--player-random', type=str, nargs='+', help='Player IDs to play randomly.', default=[])
    parser.add_argument('--choice-order', action='store_true', help='Keep move choices in order.')
    parser.add_argument('--cls', type=float, nargs='?', const=DEFAULT_DISPLAY_DELAY, default=None, help='Clear screen before moves, optionally providing move delay.')
    parser.add_argument('--board', type=str, help='Initial board configuration.')
    args = parser.parse_args()

    board_init = None if args.board is None else {'main': util.string_to_pattern(args.board)}

    run_game(args.filename, args.choice_order, args.player_random, args.cls, board_init)
