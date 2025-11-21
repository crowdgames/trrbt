import argparse
import base64
import os
import util

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Copy JSON game to JSON.')
    parser.add_argument('appendfile', type=str, help='File to append game to.')
    parser.add_argument('gamefolder', type=str, help='Folder with game files.')
    parser.add_argument('filename', type=str, help='Filename to process.')
    args = parser.parse_args()

    game_file = os.path.splitext(args.filename)[0]
    game_json = util.jsonload(os.path.join(args.gamefolder, args.filename))
    game_entry = 'GAME_SETUPS[\'' + game_json['name'] + '\'] = ' + util.str_json(game_json) + ';\n'

    with open(args.appendfile, 'at') as f:
        f.write(game_entry);
