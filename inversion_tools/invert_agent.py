import subprocess
import json
import argparse
from invert_tree import format_win_board

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('filename', type=str, help='Game filename to process.')
    parser.add_argument('inverted_filename', type=str, help='New file to write to inverted tree')
    parser.add_argument('starting_board', type=str, help='starting board')
    parser.add_argument('n', type=str, help='number of random executions of reverse rewrites')
    args = parser.parse_args()

    #run normal game to get winning board
    solve_for_board = subprocess.run(["python3", "game_agent.py", args.filename, "--board", args.starting_board], stdout=subprocess.PIPE, text=True)
    board_result = json.loads(solve_for_board.stdout)
    if (board_result.get("result")):
        winning_board= format_win_board(board_result.get("board"))
        print(winning_board + f"\n winning board for {args.filename} above\n") 

        #run invert_tree 
        subprocess.run(["python3", "inversion_tools/invert_tree.py", args.filename, args.inverted_filename, args.n], stdout=subprocess.PIPE, text=True)
        print(f"tree inverted and written to {args.inverted_filename}")

        #run game agent on inverted tree to enumerate all boards reachable in n moves from solved board
        
        enum = subprocess.run(["python3", "game_agent.py", args.inverted_filename, "--board", str(winning_board), "--enum"], stdout=subprocess.PIPE, text=True)
        enum_str = enum.stdout
        enum_boards = enum_str.split("\n")
        enum_boards.pop()

        print(f"possible starting boards for {args.filename} enumerated\n")

        failed = False
        
        for board in enum_boards:
            board_dict = (json.loads(board)).get("board")
            board_str = format_win_board(board_dict)
            forward_run = subprocess.run(["python3", "game_agent.py", args.filename, "--board", board_str], stdout=subprocess.PIPE, text=True)
            forward_result = json.loads(forward_run.stdout)
            
            if (not(forward_result.get("result"))): 
                print(f"failed forward run for board\n", board_str)
                failed = True
                
        if not failed:
            print("all enumerated boards passed game_agent.py forward solver")
        else:
            print("failed forward run for at least one board")  
        

    else:
        print("given game failed forward run")
    
