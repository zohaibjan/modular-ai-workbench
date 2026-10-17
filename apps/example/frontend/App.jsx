import React, {useState} from 'react';
export default function ExampleApp() {
 const [text,setText]=useState('A synthetic demonstration sentence.');
 const [result,setResult]=useState(null);
 async function run(){const r=await fetch('/api/example/analyse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});setResult(await r.json());}
 return <section className="max-w-3xl mx-auto p-8"><h1 className="text-3xl mb-6">Text statistics</h1><textarea aria-label="Text to analyse" className="w-full border p-4" maxLength={10000} value={text} onChange={e=>setText(e.target.value)}/><button className="bg-blue-600 text-white p-3 rounded" onClick={run}>Analyse</button>{result && <pre>{JSON.stringify(result,null,2)}</pre>}</section>;
}
