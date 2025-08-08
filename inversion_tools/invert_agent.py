import argparse
import json
import os
import shutil
import invert_util

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('game_name', type=str, help='Name of the game.')
    args = parser.parse_args()

    gameloop_filename = f'inversion_tools/inputs/{args.game_name}-gameloop.yaml'
    board_filename = f'inversion_tools/inputs/{args.game_name}-board.json'

    out_folder = f'out_inversion/{args.game_name}'
    print(f'setting up folder {out_folder}\n')
    shutil.rmtree(f'{out_folder}')
    os.makedirs(f'{out_folder}', exist_ok=True)

    forward_filename = f'{out_folder}/tree_forward.json'
    inverted_filename = f'{out_folder}/tree_inverted.json'

    # transform to forward game
    invert_util.script_output('yaml2bt.py', gameloop_filename, '--out', forward_filename, '--resolve', '--xform', '--fmt', 'json')
    print(f'transformed forward game to {forward_filename}\n')

    # run forward game to get winning board
    with open(board_filename) as f:
        starting_board_str = json.dumps(json.load(f))
    print(f'starting board for {forward_filename}:\n{starting_board_str}\n')

    board_result = invert_util.script_output_json('game_agent.py', forward_filename, '--board', starting_board_str)
    if not board_result['success']:
        raise RuntimeError('given game failed forward run')

    winning_board_str = json.dumps(board_result['board'])
    print(f'winning board for {forward_filename}:\n{winning_board_str}\n')

    # run invert_tree
    invert_util.script_output('inversion_tools/invert_tree.py', forward_filename, inverted_filename)
    print(f'tree inverted and written to {inverted_filename}\n')

    # run game agent on inverted tree to enumerate all boards reachable from solved board
    enum_results = invert_util.script_output_jsons('game_agent.py', inverted_filename, '--board', winning_board_str, '--enum')
    enum_boards = [result['board'] for result in enum_results if not (result['game_result'] != None and result['game_result']['result'] == 'lose')]
    print(f'enumerated {len(enum_boards)} possible starting boards of {len(enum_results)} results for {forward_filename}\n')

    # check enumerated boards
    with open(f'{out_folder}/enum_boards.jsons', 'wt') as f:
        print('checking enumerated boards')
        for enum_board in enum_boards:
            enum_board_str = json.dumps(enum_board)
            forward_result = invert_util.script_output_json('game_agent.py', forward_filename, '--board', enum_board_str)

            if not forward_result['success']:
                raise RuntimeError(f'failed forward run for board:\n{enum_board_str}')

            json.dump({'board':enum_board, 'result':forward_result}, f)
            f.write(f'\n')
            print('.', end='', flush=True)

    print()
    print('all enumerated boards passed game_agent.py forward solver')
