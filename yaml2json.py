import argparse
import util

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Convert game YAML to JSON.')
    parser.add_argument('filename', type=str, help='Filename to process.')
    parser.add_argument('--xform', action='store_true', help='Apply xforms.')
    args = parser.parse_args()

    util.game_print_json(util.yaml2bt(args.filename, args.xform))
