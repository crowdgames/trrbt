import argparse
import json
import os
import sys
import util
import webutil

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Convert game YAML to JSON.')
    parser.add_argument('appendfile', type=str, help='File to append game to.')
    parser.add_argument('gamefolder', type=str, help='Folder with game files.')
    parser.add_argument('filename', type=str, help='Filename to process.')
    parser.add_argument('--sprites', type=str, help='Sprite file.')
    parser.add_argument('--resolve', action='store_true', help='Resolve file nodes.')
    parser.add_argument('--xform', action='store_true', help='Apply xforms.')
    args = parser.parse_args()

    game = util.yaml2bt(os.path.join(args.gamefolder, args.filename), args.resolve, args.xform)

    sprite_data = webutil.get_sprite_data(os.path.join(args.gamefolder, args.sprites)) if args.sprites else None

    game_file = os.path.splitext(args.filename)[0]
    game_json = json.dumps({'name':game.name, 'tree':game.tree, 'sprites':sprite_data})
    game_entry = 'GAME_SETUPS[\'' + game_file + '\'] = ' + game_json + ';\n'

    with open(args.appendfile, 'at') as f:
        f.write(game_entry);
