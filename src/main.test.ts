import { src } from "@userfrosting/vinyl-fs-vpath";
import test from "ava";

test("Validate exports", t => {
    t.assert(typeof src === "function", "src named export is wrong type");
});
