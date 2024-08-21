import argparse
import base64
import json
import os

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Copy JSON game to JSON.')
    parser.add_argument('appendfile', type=str, help='File to append game to.')
    parser.add_argument('gamefolder', type=str, help='Folder with game files.')
    parser.add_argument('filename', type=str, help='Filename to process.')
    args = parser.parse_args()

    game_file = os.path.splitext(args.filename)[0]
    with open(os.path.join(args.gamefolder, args.filename), 'rt') as f:
        game_json = json.load(f)

    game_entry = 'GAME_SETUPS[\'' + game_file + '\'] = ' + json.dumps(game_json) + ';\n'

    with open(args.appendfile, 'at') as f:
        f.write(game_entry);
