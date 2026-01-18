"use strict";

const MIN_VER = 22;

const ver = Number(process.versions.node.split('.')[0]);
if (ver < MIN_VER) {
    console.error(`Please use Node version ${MIN_VER} or later.`);
    process.exit(-1);
}
