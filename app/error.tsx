'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="shell empty"><h1>We couldn’t load this page.</h1><p>Your connection or our service may be temporarily unavailable.</p><button onClick={reset}>Try again</button><a href="/">Back home</a></main>;}
