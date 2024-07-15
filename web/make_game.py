import argparse
import base64
import json
import os
import PIL.Image
import struct
import sys
import zlib
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
                img = PIL.Image.open(os.path.join(os.path.dirname(sprites), filename + '.png')).convert('RGBA')
                img_data = sum(img.getdata(), ())
                img_data = struct.pack('%dB' % len(img_data), *img_data)
                img_data = zlib.compress(img_data)
                img_data = base64.b64encode(img_data)
                img_data = img_data.decode('ascii')
                sprite_cache[filename] = { 'size':img.size, 'data': img_data }
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
        f.write('<!DOCTYPE html>\n')
        f.write('<html>\n')
        f.write('  <head>\n')
        f.write('    <script src="' + os.path.basename(args.outname) + '.js"></script>\n')
        f.write('    <script src="../common.js"></script>\n')
        f.write('    <script src="../engine.js"></script>\n')
        f.write('  </head>\n')
        f.write('  <body>\n')
        f.write('    <center>\n')
        f.write('      <canvas id="enginecanvas" width="600px" height="600px" tabindex="1">\n')
        f.write('        Browser does not support canvas.\n')
        f.write('      </canvas>\n')
        f.write('    </center>\n')
        f.write('  </body>\n')
        f.write('</html>\n')
