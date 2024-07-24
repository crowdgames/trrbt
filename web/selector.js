window.addEventListener('load', SEL_onLoad, false);

function SEL_onLoad() {
    let div = document.getElementById('selectordiv');
    if (typeof onSelectGame !== 'undefined' && div) {
        for (const game of Object.getOwnPropertyNames(GAME_SETUPS)) {
            appendButton(div, game, function() {onSelectGame(GAME_SETUPS[game]);});
        }
    }
}
