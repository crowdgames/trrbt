import argparse
import os
import sys
import util
import webutil

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Convert sprite YAML to JSON.')
    parser.add_argument('sprites', type=str, help='Sprite file.')
    args = parser.parse_args()

    sprite_data = webutil.get_sprite_data(args.sprites)

    util.print_json(sprite_data)
