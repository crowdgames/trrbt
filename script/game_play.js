const args = parse_args({
    game: { type: 'string', required: true },
});

const game = load_game(args.game, true, true);

const [engine, max_tile_width] = setup_engine(game, ENG_UNDO_NONE, null, 0);

let saved_state = null;

while (true) {
    engine.stepToWait();
    process.stdout.write(patternToString(engine.state.board, max_tile_width, '\n', '\n') + '\n\n');

    if (engine.gameOver()) {
        const go = engine.state.gameResult;
        if (go.result === 'win') {
            process.stdout.write(`Game over, player ${go.player} wins\n`);
        } else if (go.result === 'lose') {
            process.stdout.write(`Game over, player ${go.player} loses\n`);
        } else if (go.result === 'draw') {
            process.stdout.write('Game over, draw\n');
        } else if (go.result === 'stalemate') {
            process.stdout.write('Game over, stalemate\n');
        } else if (go.result === 'stepout') {
            process.stdout.write('Game over, too many steps before player input!\n');
	} else {
            process.stdout.write(`Game over, unrecognized game result: ${go.result}\n`);
	}
        break;
    } else if (engine.state.displayWait) {
        await sleep(engine.state.displayDelay);
        engine.clearDisplayWait(true);
    } else if (engine.state.choiceWait) {
	for (const choiceIndex in engine.state.choices) {
	    const choiceIndexMenu = Number(choiceIndex) + 1;
	    const choice = engine.state.choices[choiceIndex]
	    const choiceLhs = patternToString(choice.lhs, max_tile_width, ' ', ';');
	    const choiceRhs = patternToString(choice.rhs, max_tile_width, ' ', ';');
            const choiceRow = choice.row;
            const choiceCol = choice.col;
	    const choiceDesc = choice.desc ? ` (${choice.desc})` : '';
	    process.stdout.write(`${choiceIndexMenu}${choiceDesc}: ${choiceLhs} → ${choiceRhs} at ${choiceRow},${choiceCol}\n`);
	}
	process.stdout.write('s: save state\n');
        if (saved_state !== null) {
	    process.stdout.write('r: restore state\n');
	}
	while (true) {
	    const choiceIndexChosenMenu = await question(`Enter choice for player ${engine.state.choicePlayer}:`);
            if (choiceIndexChosenMenu === 's') {
                saved_state = engine.getState();
		break;
	    } else if (choiceIndexChosenMenu === 'r' && saved_state !== null) {
                engine.setState(saved_state);
		break;
	    } else {
		const choiceIndexChosen = choiceIndexChosenMenu - 1 ;
		if (choiceIndexChosen in engine.state.choices) {
		    engine.clearChoiceWait(true, choiceIndexChosen);
		    break;
		}
	    }
	    process.stdout.write('Please choose a provided option.\n');
	}
	process.stdout.write('\n');
    } else {
	throw new Error('Bad engine state.');
    }
}
