import base64
import os
import PIL.Image
import struct
import sys
import zlib
sys.path += ['.', '..']
import util

def get_sprite_data(spritefile):
    sprite_data = {}

    sprite_info = util.yamlload(spritefile)

    sprite_map = {}
    sprite_cache = {}
    for tile, filename in sprite_info['sprites'].items():
        if filename == '.':
            sprite_map[tile] = None
        else:
            if filename not in sprite_cache:
                img = PIL.Image.open(os.path.join(os.path.dirname(spritefile), filename + '.png')).convert('RGBA')
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
