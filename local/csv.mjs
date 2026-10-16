export function parseCSV(source) {
  const rows=[];let row=[],field='',quoted=false;
  source=source.replace(/^\uFEFF/,'');
  for(let i=0;i<source.length;i++) { const c=source[i];
    if(c==='"'){if(quoted&&source[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(field.trim());field='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&source[i+1]==='\n')i++;row.push(field.trim());if(row.some(Boolean))rows.push(row);row=[];field='';}
    else field+=c;
  }
  if(quoted)throw new Error('Unclosed CSV quote.');row.push(field.trim());if(row.some(Boolean))rows.push(row);
  const headers=rows.shift();if(!headers||headers.some(h=>!h)||new Set(headers).size!==headers.length)throw new Error('Unique nonempty CSV headers are required.');
  return rows.map((cells,i)=>{if(cells.length!==headers.length)throw new Error(`Row ${i+2}: expected ${headers.length} columns, got ${cells.length}.`);return Object.fromEntries(headers.map((h,j)=>[h,cells[j]]));});
}
export function safeHttps(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}}
export function shopKey(name,pincode){return name.normalize('NFKC').toLowerCase().trim().replace(/\s+/g,' ')+'|'+String(pincode||'').trim();}
