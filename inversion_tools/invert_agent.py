import argparse
import json
import os
import shutil
import threading
import time
import queue

import invert_util

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('game_name', type=str, help='Name of the game.')
    parser.add_argument('--forward', action='store_true', help='Enumerate forward rather than inverted.')
    parser.add_argument('--parallel', type=int, help='Number of enumerated boards to check in parallel.')
    args = parser.parse_args()

    gameloop_filename = f'inversion_tools/inputs/{args.game_name}-gameloop.yaml'
    board_filename = f'inversion_tools/inputs/{args.game_name}-board.json'

    start_time = time.time()

    summary = {}

    out_folder = f'out_inversion/{args.game_name}'
    if args.forward:
        out_folder += '/forward'
    else:
        out_folder += '/inverted'

    print(f'setting up folder {out_folder}')
    print()
    if os.path.exists(out_folder):
        shutil.rmtree(out_folder)
    os.makedirs(out_folder, exist_ok=True)

    forward_filename = f'{out_folder}/game_forward.json'
    inverted_filename = f'{out_folder}/game_inverted.json'

    # transform to forward game
    invert_util.script_output('yaml2bt.py', gameloop_filename, '--out', forward_filename, '--resolve', '--xform', '--fmt', 'json', '--name', args.game_name + '-forward')
    print(f'transformed forward game to {forward_filename}')
    print()

    with open(board_filename) as f:
        starting_board = json.load(f)
    starting_board_str = json.dumps(starting_board)
    summary['starting_board'] = starting_board

    if args.forward:
        print(f'enumerating boards')
        enum_results = invert_util.script_output_jsons('game_agent.py', forward_filename, '--board', starting_board_str, '--enum')
        enum_boards = [result['board'] for result in enum_results if result['game_result'] == None]
        print(f'enumerated {len(enum_boards)} possible starting boards for {forward_filename}')
        print()
        summary['num_result_boards'] = len(enum_results)
        summary['num_enum_boards'] = len(enum_boards)

    else:
        print(f'starting board for {forward_filename}:\n{starting_board_str}')
        print()

        # run forward game to get solved board
        print(f'finding solved board')
        board_result = invert_util.script_output_json('game_agent.py', forward_filename, '--board', starting_board_str)
        if not board_result['success']:
            raise RuntimeError('given game failed forward run')
        solved_board = board_result['board']

        summary['solved_board'] = solved_board
        solved_board_str = json.dumps(solved_board)
        print(f'solved board for {forward_filename}:\n{solved_board_str}')
        print()

        # run invert_tree
        print(f'inverting tree')
        invert_util.script_output('inversion_tools/invert_tree.py', args.game_name + '-inverted', forward_filename, inverted_filename)
        print(f'tree inverted and written to {inverted_filename}')
        print()

        # run game agent on inverted tree to enumerate all boards reachable from solved board
        print(f'enumerating boards')
        enum_results = invert_util.script_output_jsons('game_agent.py', inverted_filename, '--board', solved_board_str, '--enum')
        enum_boards = [result['board'] for result in enum_results if result['steps'] > 0 and not (result['game_result'] != None and result['game_result']['result'] != 'stalemate')]
        summary['num_enum_boards'] = len(enum_boards)
        summary['num_result_boards'] = len(enum_results)
        print(f'enumerated {len(enum_boards)} possible starting boards of {len(enum_results)} results for {inverted_filename}')
        print()

    # check enumerated boards
    q_in = queue.Queue()
    q_out = queue.Queue()
    complete = 0
    print_lock = threading.Lock()

    def process_enum():
        global complete

        while not q_in.empty():
            enum_ii, enum_board = q_in.get()
            enum_board_str = json.dumps(enum_board)
            forward_result = invert_util.script_output_json('game_agent.py', forward_filename, '--board', enum_board_str)

            success = forward_result['success']
            q_out.put((success, enum_ii, {'board':enum_board, 'forward_result':forward_result}))

            with print_lock:
                print('.' if success else '!', end='', flush=True)
                complete += 1
                if complete % 50 == 0:
                    print(f'{complete}/{len(enum_boards)}', flush=True)

            q_in.task_done()

    print(f'checking enumerated boards')
    for enum_ii, enum_board in enumerate(enum_boards):
        q_in.put((enum_ii, enum_board))

    nthreads = args.parallel if args.parallel is not None else 1
    for ii in range(nthreads):
        threading.Thread(target=process_enum, daemon=True).start()
    q_in.join()

    enum_results = []
    while not q_out.empty():
        okay, enum_ii, enum_result = q_out.get()
        if okay:
            enum_results.append((enum_ii, enum_result))
        elif not args.forward:
            raise RuntimeError(f'failed forward run for board:\n{json.dumps(enum_result)}')
        q_out.task_done()
    enum_results = sorted(enum_results)
    summary['num_okay_boards'] = len(enum_results)
    print()
    print()

    enum_boards_filename = f'{out_folder}/enum_boards.jsons'
    print(f'writing enumerated boards to {enum_boards_filename}')
    print()
    with open(enum_boards_filename, 'wt') as f:
        for enum_ii, enum_result in enum_results:
            json.dump(enum_result, f)
            f.write(f'\n')

    total_time = time.time() - start_time
    summary['total_time'] = total_time

    summary_filename = f'{out_folder}/summary.json'
    print(f'writing summary to {summary_filename}')
    with open(summary_filename, 'wt') as f:
        json.dump(summary, f)
        f.write(f'\n')
