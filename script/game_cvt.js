const args = parse_args({
    game: { type: 'string', required: true },
    fmt: { type: 'string', required: true },
    gamefolder: { type: 'string' },
    sprites: { type: 'string' },
    out: { type: 'string' },
    resolve: { type: 'boolean', default: false },
    xform: { type: 'boolean', default: false },
});

const gamefilename = args.gamefolder ? path.join(args.gamefolder, args.game) : args.game;

const game = load_game(gamefilename, args.resolve, args.xform);

if (args.sprites) {
    game.sprites = load_sprites(args.sprites);
}

let out_str = null;
if (args.fmt === 'gv') {
    out_str = gv_print_game(game);
} else if (args.fmt === 'json') {
    out_str = JSON.stringify(game) + '\n';
} else if (args.fmt === 'js-entry') {
    const parse = path.parse(args.game);
    const game_name = path.join(parse.dir, parse.name);
    out_str = 'GAME_SETUPS[\'' + game_name + '\'] = ' + JSON.stringify(game) + '\n';
}

if (args.out) {
    fs.writeFileSync(args.out, out_str);
} else {
    process.stdout.write(out_str);
}
