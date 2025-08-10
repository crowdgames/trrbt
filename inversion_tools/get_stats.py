import argparse
import json
import statistics

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('games', type=str, help='List of games.')
    args = parser.parse_args()
    games = args.games
    games = games.split(",")

    with open("inversion_tools/stats.txt","wt") as f:
        for game in games:
            num_boards = 0
            steps_list = []
            with open(f"out_inversion/{game}/enum_boards.jsons", "r") as curr_file:
                for line in curr_file: 
                    print(line)
                    line_dict = json.loads(line)
                    steps_list.append(line_dict["result"]["steps"])
                    num_boards += 1
            mean = statistics.mean(steps_list)
            stdev = statistics.stdev(steps_list)
            maximum = max(steps_list)
        f.write(f"{game}: \n number of boards enumerated: {num_boards}. mean steps: {mean}. maximum: {maximum}. standard dev: {stdev}\n")    