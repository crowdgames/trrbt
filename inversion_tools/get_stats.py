import argparse
import json
import statistics

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('games', type=str, nargs='+', help='List of games.')
    args = parser.parse_args()
    games = args.games

    for game in games:
        print(f'{game}:')
        for style in ['inverted', 'forward']:
            print(f' {style}:')
            num_boards = 0
            steps_list = []
            with open(f'inversion_tools/out/{game}/{style}/enum_boards.jsons', 'rt') as curr_file:
                for line in curr_file:
                    line_dict = json.loads(line)
                    steps_list.append(line_dict['forward_result']['steps'])
                    num_boards += 1
            if len(steps_list) > 0:
                mean = statistics.mean(steps_list)
                stdev = statistics.stdev(steps_list)
                maximum = max(steps_list)
            else:
                mean, stdev, maximum = 'NA', 'NA', 'NA'
            print(f'  number of boards enumerated: {num_boards}. mean steps: {mean}. maximum: {maximum}. standard dev: {stdev}')
