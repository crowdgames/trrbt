import argparse
import json
import os
import sys
import webutil

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Convert sprite YAML to JSON.')
    parser.add_argument('sprites', type=str, help='Sprite file.')
    args = parser.parse_args()

    sprite_data = webutil.get_sprite_data(args.sprites)

    sys.stdout.write(json.dumps(sprite_data) + '\n')
