import {readFileSync} from 'node:fs';
import path from 'node:path';
const file=path.resolve(process.env.LOCAL_DATA_DIR||'.local','security.json');
try{
 const settings=JSON.parse(readFileSync(file,'utf8'));
 if(!settings.setupToken)throw Error('Setup is complete. Use the private admin sign-in or password-change screen.');
 if(!process.env.ADMIN_EMAIL||!process.env.ADMIN_PASSWORD)throw Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in this process, or use node scripts/admin-url.mjs to choose them in the browser.');
 const base='http://127.0.0.1:'+(process.env.PORT||3000);
 const response=await fetch(base+'/api/admin/setup',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({token:settings.setupToken,email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD})});
 const result=await response.json();if(!response.ok)throw Error(result.error);
 console.log('Administrator created. Run node scripts/admin-url.mjs for the private sign-in URL.');
}catch(error){console.error(error.message);process.exitCode=1;}
