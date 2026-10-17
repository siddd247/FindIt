import {after} from 'node:test';
import {temporaryDirectory,removeTemporaryDirectory} from '../../scripts/runtime-checks.mjs';
export {stopServer,freePort} from '../../scripts/runtime-checks.mjs';
const directories=[];
export function makeTestDirectory(prefix){const directory=temporaryDirectory(prefix);directories.push(directory);return directory;}
after(()=>{for(const directory of directories)removeTemporaryDirectory(directory);});
