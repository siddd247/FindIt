export default function Loading(){return <main className="shell" aria-label="Loading" aria-busy="true">{[1,2,3].map(i=><div key={i} className="skeleton"/>)}</main>;}
