import subprocess
import json
import argparse
from invert_tree import format_win_board

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('filename', type=str, help='Game filename to process.')
    parser.add_argument('game_name', type=str, help='name of the game')
    parser.add_argument('starting_board', type=str, help='starting board')
    parser.add_argument('n', type=str, help='number of random executions of reverse rewrites')
    args = parser.parse_args()
    
    inverted_filename = f"inversion_tools/inverted_trees/{args.game_name}_inverted.yaml"
    
    #run normal game to get winning board
    solve_for_board = subprocess.run(["python", "game_agent.py", args.filename, "--board", args.starting_board], stdout=subprocess.PIPE, text=True)
    board_result = json.loads(solve_for_board.stdout)
    if (board_result.get("result")):
        winning_board= format_win_board(board_result.get("board"))
        print(winning_board + f"\n winning board for {args.filename} above\n") 

        #run invert_tree 
        subprocess.run(["python", "inversion_tools/invert_tree.py", args.filename, inverted_filename, args.n], stdout=subprocess.PIPE, text=True)
        print(f"tree inverted and written to {inverted_filename}")

        #run game agent on inverted tree to enumerate all boards reachable in n moves from solved board
        
        enum = subprocess.run(["python", "game_agent.py", inverted_filename, "--board", str(winning_board), "--enum"], stdout=subprocess.PIPE, text=True)
        enum_str = enum.stdout
        enum_boards = enum_str.split("\n")
        enum_boards.pop()

        print(f"possible starting boards for {args.filename} enumerated\n")

        failed = False
        
        f = open(f"inversion_tools/outputs/{args.game_name}_{args.n}moves.txt", "a")
        for board in enum_boards:
            forward_run = subprocess.run(["python", "game_agent.py", args.filename, "--board", board], stdout=subprocess.PIPE, text=True)
            forward_result = json.loads(forward_run.stdout)
            
            if (not(forward_result.get("result"))): 
                print(f"failed forward run for board\n", board)
                failed = True
            else: 
                f.write(board)
                f.write("\n")
                f.write(str(forward_result))
                f.write("\n")
                f.write("\n")

        
        if not failed:
            print("all enumerated boards passed game_agent.py forward solver")
        
        else:
            print("failed forward run for at least one board") 
            f = open("filename", "w")
            f.write("failed!") 
        

    else:
        print("given game failed forward run")
    
