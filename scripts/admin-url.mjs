import {readFileSync} from 'node:fs';import path from 'node:path';
const settings=JSON.parse(readFileSync(path.resolve(process.env.LOCAL_DATA_DIR||'.local','security.json'),'utf8'));
const origin=process.env.RENDER_EXTERNAL_URL||'http://127.0.0.1:'+(process.env.PORT||3000);
console.log(process.env.RENDER_EXTERNAL_URL?'Private admin URL (deployed service):':'Private admin URL (local computer only):');console.log(origin+settings.adminPath+(settings.setupToken?'?setup='+settings.setupToken:''));console.log(settings.setupToken?'Choose your own email and password in first-run setup. The setup token expires when the account is created.':'Sign in with your chosen administrator email and password.');
