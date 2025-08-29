# Game Behaviour Trees Using Tile Rewrite Rules

## Web Interface

To start the web interface, run the following:
```
cd web
bash make_games.sh
open public/index.html
```

The introductory materials provided to the users are available on [OSF](https://osf.io/btqcj/).

Games included in the user study are in the dropdown with the prefix "(study)". The other games are example games that were not provided in the user study.

Note that advanced nodes and layers have limited view/editing support in the interface, though games using them should have accurate transformed trees and run correctly. 

Editing a game in the dropdown creates a local copy. You can also create an editable copy of any game using the "Use as Template" button. 

## CLI

To setup, you will need pipenv:

```
pip3 install pipenv
```

Then set up the environment for this project by running:
```
pipenv install
pipenv shell
```


### Game Description Visualization

To visualize game descriptions you will also need [GraphViz](https://graphviz.org/) installed.
Then run `make` to create visualizations in the `out` folder.


### Playing Games

To play a game in the terminal, run `python game.py games/NAME.yaml`.


## Node Behaviors

### Control Nodes

**order**: Executes children in order (regardless of their success or failure); if any child succeeds, returns success, otherwise returns failure.

**all**: Executes children in order, until any child fails; if any child fails, returns failure, otherwise returns success.

**none**: Executes children in order, until any child succeeds; if any child succeeds, returns failure, otherwise returns success.

**random-try**: Executes children in random order until one succeeds; if any child succeeds, returns success, otherwise returns failure.

**loop-until-all**: Repeatedly executes children in order, until all children fail on one loop; if any child succeeds, returns success, otherwise returns failure.

**loop-times**: Repeatedly executes children in order a fixed number of times; if any child succeeds, returns success, otherwise returns failure.

**match**: Returns success if pattern matches current board, otherwise returns failure.

**player**: *For now, assume all child nodes are **rewrite** nodes.* Displays the current board state, and player can choose which matching rewrite to apply. Returns success if there were any matches; otherwise, returns failure.

**win**, **lose**, **draw**: Executes children in order, until any child succeeds; if any child succeeds, the game ends with the given player winning (if a **win** node) or losing (if a **lose** node), or as a draw (if a **draw** node); otherwise returns failure.

### Transform Nodes

**x-ident**: Children are kept as is (the identity function).

**x-prune**: Children are deleted.

**x-mirror**: Children are mirrored left to right (option to keep or remove the original).

**x-flip**: Children are flipped up to down (option to keep or remove the original).

**x-skew**: Children are skewed along the columns (option to keep or remove the original).

**x-rotate**: Children are rotated 90 degrees clockwise (option to keep or remove the original).

**x-spin**: Children are rotated 90, 180, and 270 degrees (option to keep or remove the original). 

**x-swap**: Swap "what" with "with" in all childrens' patterns and player IDs, removing the original.

**x-replace**: Children are replaced at the leaf level with copies replacing the "what" with each of the "withs" in all patterns and player IDs.

**x-unroll-replace**: The entire subtree is copied as children of an order node, replacing the "what" with each of the "withs" in all patterns and player IDs. For an example comparing x-replace to x-unroll-replace, see the template game x_unroll_replace (web/games_web/x_unroll_replace.json).

**x-link**: Find the node with the target node id and copy it with its children to the location of the x-link, keeping the original.

**x-file**: Inside the given file, find the node with the target node id and copy it with its children to the location of the x-file.

## Tile Nodes

**display-board**: Display the current board state between player nodes.

**rewrite**: If there are any "lhs" pattern matches, randomly rewrites one of these matches with the "rhs" pattern. Returns success if a match is found, otherwise returns failure.

**set-board**: Set the gameboard to the given "pattern".

**layer-template**: Create a layer the same size as the gameboard filled with the "with" tile.

**append-rows**: Append "times" rows to the gameboard filled with the "pattern" tiles (one per layer).

**append-columns**: Append "times" columns to the gameboard filled with the "pattern" tiles (one per layer).