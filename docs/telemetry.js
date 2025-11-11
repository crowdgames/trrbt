var TELEMETRY_DATA = JSON.parse(localStorage.getItem("TELEMETRY_DATA")) || [];
const TELEMETRY_SESSION = TELEMETRY_DATA.length
TELEMETRY_DATA.push([]);

const TELEMETRY_START_TIME = Date.now();

telemetry("newSession");

function telemetry(action) {
    // let elapsed = Date.now() - TELEMETRY_START_TIME;
    // console.log(action + " at " + elapsed);
    // TELEMETRY_DATA[TELEMETRY_SESSION].push({"action": action, "time": elapsed});
    // localStorage.setItem("TELEMETRY_DATA", JSON.stringify(TELEMETRY_DATA));
}
