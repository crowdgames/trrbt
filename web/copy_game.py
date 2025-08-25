import argparse
import base64
import json
import os

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
    parser = argparse.ArgumentParser(description='Copy JSON game to JSON.')
    parser.add_argument('appendfile', type=str, help='File to append game to.')
    parser.add_argument('gamefolder', type=str, help='Folder with game files.')
    parser.add_argument('filename', type=str, help='Filename to process.')
    parser.add_argument('--sprites', type=str, help='Sprite file.')
    args = parser.parse_args()

    game_file = os.path.splitext(args.filename)[0]
    with open(os.path.join(args.gamefolder, args.filename), 'rt') as f:
        game_json = json.load(f)

    sprite_data = get_sprite_data(os.path.join(args.gamefolder, args.sprites)) if args.sprites else None
    game_json['sprites'] = sprite_data

    game_entry = 'GAME_SETUPS[\'' + game_json['name'] + '\'] = ' + json.dumps(game_json) + ';\n'

    with open(args.appendfile, 'at') as f:
        f.write(game_entry);
