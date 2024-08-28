import argparse, sys
import util

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Process game YAML.')
    parser.add_argument('filename', type=str, help='Filename to process.')
    parser.add_argument('--out', type=str, help='Filename to write to.')
    parser.add_argument('--resolve', action='store_true', help='Resolve file nodes.')
    parser.add_argument('--xform', action='store_true', help='Apply xforms.')
    args = parser.parse_args()

    gv_str = util.game_print_gv(util.yaml2bt(args.filename, args.resolve, args.xform))
    if args.out is None:
        sys.stdout.write(gv_str)
    else:
        with open(args.out, 'wt') as f:
            f.write(gv_str)
