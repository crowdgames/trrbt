window.addEventListener('load', SEL_onLoad, false);

var GAME_SETUPS = {}

function SEL_onLoad() {
    let div = document.getElementById('selectordiv');

    appendText(div, 'Select Game', true, true);
    appendBr(div);

    if (typeof onSelectGame !== 'undefined' && div) {
        for (const game of Object.getOwnPropertyNames(GAME_SETUPS)) {
            appendButton(div, game, function() {onSelectGame(GAME_SETUPS[game]);});
        }
    }
}

function SEL_startingGame(useDefault) {
    const hash = window.location.hash.substring(1);
    if (hash !== '' && GAME_SETUPS.hasOwnProperty(hash)) {
        return GAME_SETUPS[hash];
    }
    if (useDefault) {
        for (const game of Object.getOwnPropertyNames(GAME_SETUPS)) {
            return GAME_SETUPS[game];
        }
    }
    return emptyGame();
}
