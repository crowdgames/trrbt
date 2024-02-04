import argparse
import base64
import json
import os
import sys
sys.path.append('..')
import util

def get_sprite_data(sprites):
    sprite_data = {}

    sprite_info = util.yamlload(sprites)

    sprite_map = {}
    sprite_cache = {}
    for tile, filename in sprite_info['sprites'].items():
        if filename == '.':
            sprite_map[tile] = None
        else:
            if filename not in sprite_cache:
                with open(os.path.join(os.path.dirname(sprites), filename + '.png'), 'rb') as f:
                    sprite_cache[filename] = base64.b64encode(f.read()).decode('utf-8')
            sprite_map[tile] = filename

    sprite_data['images'] = sprite_cache
    sprite_data['tiles'] = sprite_map

    if 'back' in sprite_info:
        sprite_data['back'] = util.string_to_pattern(sprite_info['back'])

    if 'players' in sprite_info:
        sprite_data['players'] = {}
        for pid, colors in sprite_info['players'].items():
            color = colors.split(';')[0]
            sprite_data['players'][pid] = [int(color[ii:ii+2], 16) for ii in (0, 2, 4)]

    return sprite_data

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Convert game YAML to JSON.')
    parser.add_argument('filename', type=str, help='Filename to process.')
    parser.add_argument('outname', type=str, help='Name for writing out files.')
    parser.add_argument('--sprites', type=str, help='Sprite file.')
    args = parser.parse_args()

    game = util.yaml2bt(args.filename, True)

    sprite_data = get_sprite_data(args.sprites) if args.sprites else None

    with open(args.outname + '.js', 'wt') as f:
        f.write('const GAME_SETUP = ' + json.dumps({'name':game.name, 'tree':game.tree, 'sprites':sprite_data}) + ';\n')

    with open(args.outname + '.html', 'wt') as f:
        f.write('<html>\n')
        f.write('  <head>\n')
        f.write('    <script src="https://cdn.jsdelivr.net/npm/p5@1.9.0/lib/p5.js"></script>\n')
        f.write('    <script src="' + os.path.basename(args.outname) + '.js"></script>\n')
        ndir = len(args.outname.split('/')) - 1
        f.write('    <script src="' + ('/'.join(['..'] * ndir) + '/' if ndir > 0 else '') + 'sketch.js"></script>\n')
        f.write('  </head>\n')
        f.write('  <body>\n')
        f.write('    <center>\n')
        f.write('      <main>\n')
        f.write('      </main>\n')
        f.write('    </center>\n')
        f.write('  </body>\n')
        f.write('</html>\n')
