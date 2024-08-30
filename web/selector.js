window.addEventListener('load', SEL_onLoad, false);

var GAME_SETUPS = {}

function SEL_onLoad() {
    let div = document.getElementById('selectordiv');

    if (typeof onSelectGame !== 'undefined' && div) {
        appendText(div, 'Select Game', true, true);
        appendBr(div);

        if (false) {
            for (const game of Object.getOwnPropertyNames(GAME_SETUPS)) {
                appendButton(div, game, function() {onSelectGame(GAME_SETUPS[game]);});
            }
        } else {
            const select = document.createElement('select');
            select.type = 'select';
            select.onchange = function() {
                const game = select.options[select.selectedIndex].value;
                select.selectedIndex = 0;
                window.location.hash = game;
                onSelectGame(GAME_SETUPS[game]);
            };
            div.appendChild(select);

            var option = document.createElement('option');
            option.value = '';
            option.innerHTML = '--';
            select.add(option);

            for (const game of Object.getOwnPropertyNames(GAME_SETUPS)) {
                var option = document.createElement('option');
                option.value = game;
                option.innerHTML = game;
                select.add(option);
            }
        }
    }
}

function SEL_startingGame() {
    const hash = window.location.hash.substring(1);
    if (hash !== '' && GAME_SETUPS.hasOwnProperty(hash)) {
        return GAME_SETUPS[hash];
    }
    return emptyGame();
}

function SEL_getGameTree(game) {
    if (GAME_SETUPS.hasOwnProperty(game)) {
        return GAME_SETUPS[game].tree;
    }
    return null;
}
