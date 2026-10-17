import {mkdtempSync,rmSync} from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:net';

const scratch=path.resolve('.local');
function checked(value){
 const resolved=path.resolve(value),relative=path.relative(scratch,resolved);
 if(!relative||relative.startsWith('..')||path.isAbsolute(relative))throw Error('Temporary path must be inside the project .local directory.');
 return resolved;
}
export function temporaryDirectory(prefix){return mkdtempSync(checked(prefix));}
export function removeTemporaryDirectory(directory){rmSync(checked(directory),{recursive:true,force:true,maxRetries:6,retryDelay:80});}
export async function freePort(){
 const probe=createServer();
 await new Promise((resolve,reject)=>{probe.once('error',reject);probe.listen(0,'127.0.0.1',resolve);});
 const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));return port;
}
export async function stopServer(proc){
 if(proc.exitCode!==null||proc.signalCode!==null)return;
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{proc.kill();reject(Error('Server did not shut down cleanly.'));},5000);
  proc.once('exit',code=>{clearTimeout(timer);code===0?resolve():reject(Error('Server exited '+code));});
  if(proc.connected)proc.send({type:'shutdown'});else proc.kill('SIGTERM');
 });
}
