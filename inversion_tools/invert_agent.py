import argparse
import json
import invert_util

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('filename', type=str, help='Game filename to process.')
    parser.add_argument('game_name', type=str, help='name of the game')
    parser.add_argument('starting_board', type=str, help='starting board')
    args = parser.parse_args()

    inverted_filename = f'inversion_tools/inverted_trees/{args.game_name}_inverted.yaml'

    # run forard game to get winning board
    board_result = invert_util.script_output_json('game_agent.py', args.filename, '--board', args.starting_board)
    if not board_result['success']:
        raise RuntimeError('given game failed forward run')

    winning_board_str = json.dumps(board_result['board'])
    print(f'winning board for {args.filename}:\n{winning_board_str}\n')

    # run invert_tree
    invert_util.script_output('inversion_tools/invert_tree.py', args.filename, inverted_filename)
    print(f'tree inverted and written to {inverted_filename}\n')

    # run game agent on inverted tree to enumerate all boards reachable from solved board
    enum_results = invert_util.script_output_jsons('game_agent.py', inverted_filename, '--board', winning_board_str, '--enum')
    enum_boards = [result['board'] for result in enum_results if not (result['game_result'] != None and result['game_result']['result'] == 'lose')]
    print(f'enumerated {len(enum_boards)} possible starting boards of {len(enum_results)} results for {args.filename}\n')

    # check enumerated boards
    with open(f'inversion_tools/outputs/{args.game_name}_enum_boards.txt', 'wt') as f:
        for enum_board in enum_boards:
            enum_board_str = json.dumps(enum_board)
            forward_result = invert_util.script_output_json('game_agent.py', args.filename, '--board', enum_board_str)

            if not forward_result['success']:
                raise RuntimeError(f'failed forward run for board:\n{enum_board_str}')

            f.write(f'{enum_board_str}\n')
            f.write(f'{forward_result}\n\n')

    print('all enumerated boards passed game_agent.py forward solver')
