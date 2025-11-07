# Game Behaviour Trees Using Tile Rewrite Rules

## Abstract
Game creation tools that minimize required resources and
knowledge to use them have transformed the practice of learn-
ing and prototyping game design, especially in hobbyist and
indie development contexts. However, little is known about
how the different programming models found underlying these
tools affect their expressiveness and usability. A recently pro-
posed programming model allows creators to author the logic
of the entire game using a single “game behaviour tree” with
tile-grid rewrite rules at the leaves. We contribute to this body
of knowledge by studying this recently proposed programming
model. We have used it to make clones of popular games as
case studies, from which we extracted a number of design pat-
terns. To gain formative information about usability, we also
conducted a small user study with people who have varying
levels of experience authoring games with other tools. We find
game behaviour trees capable of expressing a wide variety of
2D turn-based games. Study participants are quick to grasp
the underlying concepts, but further research is needed to un-
derstand discrepancies with user intuitions that may arise from
their familiarity with different programming models.

## Live Editor
[Explore the live editor!](/edengine.html)

## Code
Explore the code on [GitHub](https://github.com/crowdgames/trrbt).

## Study Data
The study materials and full text of the paper are on [OSF](https://osf.io/btqcj/).

## Node Behaviors

### Control Nodes

**order**: Executes children in order (regardless of their success or failure); if any child succeeds, returns success, otherwise returns failure.

**all**: Executes children in order, until any child fails; if any child fails, returns failure, otherwise returns success.

**none**: Executes children in order, until any child succeeds; if any child succeeds, returns failure, otherwise returns success.

**random-try**: Executes children in random order until one succeeds; if any child succeeds, returns success, otherwise returns failure.

**loop-until-all**: Repeatedly executes children in order, until all children fail on one loop; if any child succeeds, returns success, otherwise returns failure.

**loop-times**: Repeatedly executes children in order a fixed number of times; if any child succeeds, returns success, otherwise returns failure.

**match**: Returns success if pattern matches current board, otherwise returns failure.

**match-times**: Succeeds if the pattern is found on the current board the given number of times, otherwise fails.

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

**rewrite-all**: If the "lhs" pattern is found anywhere on the board, rewrite as many as possible in random order with the "rhs" pattern. Succeeds if there were any matches, otherwise, fails.

**set-board**: Set the gameboard to the given "pattern".

**layer-template**: Create a layer the same size as the gameboard filled with the "with" tile.

**append-rows**: Append "times" rows to the gameboard filled with the "pattern" tiles (one per layer).

**append-columns**: Append "times" columns to the gameboard filled with the "pattern" tiles (one per layer).