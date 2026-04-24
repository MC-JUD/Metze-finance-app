import { useState, useMemo } from "react"
import { TRANSACTIONS } from "./data/transactions"
import { SHAREPOINT_FILES } from "./data/sharepoint"
import {
  ENCOURS_MAX, ENCOURS_HEBDO,
  REGLEMENTS_BNP, REGLEMENTS_CIC,
  STATS_BNP, STATS_CIC,
  CA_BNP, CA_CIC,
} from "./data/encours"

// ─── PALETTE ──────────────────────────────────────────────────────────────────
const T = {
  bg:"#0d1117", sidebar:"#0a0e13", surface:"#161b22", elevated:"#1c2230",
  border:"#21293a", borderHi:"#2d3f55",
  accent:"#2563eb", accentHi:"#3b82f6", accentGlow:"rgba(37,99,235,0.15)",
  green:"#22c55e", greenDim:"rgba(34,197,94,0.12)",
  red:"#ef4444",   redDim:"rgba(239,68,68,0.12)",
  amber:"#f59e0b", amberDim:"rgba(245,158,11,0.12)",
  purple:"#a78bfa",purpleDim:"rgba(167,139,250,0.12)",
  teal:"#2dd4bf",  tealDim:"rgba(45,212,191,0.12)",
  text:"#e6edf3", muted:"#7d8fa8", dim:"#2d3a4a", tag:"#1a2236",
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Outfit:wght@400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body,#root{height:100%}
  body{background:${T.bg};color:${T.text};font-family:'Outfit',sans-serif;font-size:14px;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:${T.border};border-radius:99px}
  button,input,select{font-family:inherit}
  a{color:inherit;text-decoration:none}
  @keyframes up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
  .up{animation:up 0.22s ease both}
`

// ─── UTILS ────────────────────────────────────────────────────────────────────
function inferCategory(tx) {
  const cats = tx.categories || [], lbl = tx.label.toLowerCase()
  if (cats.length) {
    const r = cats[0].label.trim()
    if (r.includes("HORS UE"))    return {label:"Achats Hors UE",  color:T.red,    dim:T.redDim,    icon:"🌏"}
    if (r.includes("UE"))         return {label:"Achats UE",       color:T.amber,  dim:T.amberDim,  icon:"🇪🇺"}
    if (r.includes("LOGISTIQUE")) return {label:"Logistique",      color:T.purple, dim:T.purpleDim, icon:"🚚"}
    return {label:r.replace(/^\d+ - /,"").substring(0,22), color:T.accentHi, dim:T.accentGlow, icon:"📂"}
  }
  if (lbl.includes("eurusd")||lbl.includes("acheté usd")) return {label:"Change USD",    color:T.accentHi, dim:T.accentGlow, icon:"💱"}
  if (lbl.includes("retourné"))                           return {label:"Remboursement", color:T.green,    dim:T.greenDim,  icon:"↩️"}
  return {label:"Non classé", color:T.muted, dim:"rgba(125,143,168,0.1)", icon:"❓"}
}
const fmtEur = n => { const v=parseFloat(n); return (v>=0?"+":"")+Math.abs(v).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" €" }
const fmtK   = n => n>=1000?(n/1000).toFixed(0)+"k":n.toLocaleString("fr-FR")
const fmtDate= iso => new Date(iso).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"})
const fileIcon= t => t==="xlsx"?"📊":t==="docx"?"📄":t==="pptx"?"📑":"📁"
const pct = (v,max) => Math.min(100, Math.round(v/max*100))

// ─── REUSABLE UI ──────────────────────────────────────────────────────────────
function Tag({icon,label,color,dim}){
  return <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:600,background:dim,color,border:`1px solid ${color}30`}}>{icon} {label}</span>
}
function Mono({children,style={}}){
  return <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,...style}}>{children}</span>
}
function Pill({children,color,dim}){
  return <span style={{padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:600,background:dim,color,border:`1px solid ${color}28`}}>{children}</span>
}
function ProgressBar({value,max,color,height=6}){
  const p=pct(value,max)
  return (
    <div style={{background:T.elevated,borderRadius:99,height,overflow:"hidden",position:"relative"}}>
      <div style={{width:`${p}%`,height:"100%",background:color,borderRadius:99,transition:"width .5s ease"}}/>
      {p>80 && <div style={{position:"absolute",right:4,top:"50%",transform:"translateY(-50%)",fontSize:9,color:"#fff",fontWeight:700}}>{p}%</div>}
    </div>
  )
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function Topbar({title,sub,right}){
  return (
    <div style={{height:52,flexShrink:0,background:T.sidebar,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",padding:"0 20px",justifyContent:"space-between",gap:12}}>
      <div>
        <div style={{fontWeight:700,fontSize:15}}>{title}</div>
        {sub&&<div style={{fontSize:11,color:T.muted}}>{sub}</div>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        {right}
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",background:T.elevated,borderRadius:99,border:`1px solid ${T.border}`}}>
          <span style={{color:T.muted,fontSize:12}}>🔍</span>
          <span style={{fontSize:11,color:T.dim,fontFamily:"'JetBrains Mono',monospace"}}>Rechercher... (Ctrl+K)</span>
        </div>
      </div>
    </div>
  )
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({label,value,sub,color=T.text,accentTop}){
  return (
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
      {accentTop&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:accentTop}}/>}
      <div style={{fontSize:10,color:T.muted,letterSpacing:"1.2px",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginBottom:8}}>{label}</div>
      <div style={{fontSize:26,fontWeight:700,color,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"-1px",lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:T.muted,marginTop:5}}>{sub}</div>}
    </div>
  )
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
function SCard({title,icon,right,children,style={}}){
  return (
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden",...style}}>
      <div style={{padding:"12px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,fontWeight:600,fontSize:13}}><span>{icon}</span>{title}</div>
        {right}
      </div>
      <div style={{padding:"16px 18px"}}>{children}</div>
    </div>
  )
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV = [
  {id:"dashboard",     icon:"🏠", label:"Dashboard",     sub:"Vue globale"},
  {id:"encours-bnp",   icon:"🏦", label:"Encours BNP",   sub:"Échus & règlements"},
  {id:"encours-cic",   icon:"🏛️", label:"Encours CIC",   sub:"Échus & règlements"},
  {id:"budget",        icon:"📊", label:"Budget 2026",   sub:"P&L · Tréso · BFR"},
  {id:"transactions",  icon:"💸", label:"Transactions",  sub:"Pennylane"},
  {id:"sharepoint",    icon:"📁", label:"Documents",     sub:"SharePoint"},
  {id:"parametres",    icon:"⚙️", label:"Paramètres",    sub:""},
]

function Sidebar({page,setPage}){
  return (
    <aside style={{width:210,flexShrink:0,background:T.sidebar,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0}}>
      <div style={{padding:"16px 14px 14px",borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${T.accent},${T.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0,fontWeight:700}}>M</div>
          <div>
            <div style={{fontWeight:700,fontSize:13}}>Metze Care</div>
            <div style={{fontSize:10,color:T.muted,letterSpacing:"0.5px"}}>COMPTA MANAGER</div>
          </div>
        </div>
      </div>
      <nav style={{flex:1,padding:"10px 8px",overflowY:"auto"}}>
        {NAV.map(n=>{
          const on=page===n.id
          return (
            <button key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 10px",borderRadius:8,marginBottom:2,background:on?T.accentGlow:"transparent",border:on?`1px solid rgba(37,99,235,0.3)`:"1px solid transparent",color:on?T.accentHi:T.muted,cursor:"pointer",textAlign:"left",transition:"all 0.12s"}}
              onMouseEnter={e=>{if(!on){e.currentTarget.style.background=T.elevated;e.currentTarget.style.color=T.text}}}
              onMouseLeave={e=>{if(!on){e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.muted}}}>
              <span style={{fontSize:16,width:20,textAlign:"center",flexShrink:0}}>{n.icon}</span>
              <div>
                <div style={{fontSize:13,fontWeight:on?600:400,lineHeight:1.2}}>{n.label}</div>
                {n.sub&&<div style={{fontSize:10,color:on?T.accentHi:T.dim,letterSpacing:"0.5px"}}>{n.sub}</div>}
              </div>
            </button>
          )
        })}
      </nav>
      <div style={{padding:"12px 14px",borderTop:`1px solid ${T.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:T.green,animation:"pulse 2s infinite",display:"inline-block"}}/>
          <span style={{fontSize:10,color:T.muted,fontFamily:"'JetBrains Mono',monospace"}}>En ligne</span>
        </div>
        <div style={{fontSize:9,color:T.dim,fontFamily:"'JetBrains Mono',monospace",lineHeight:1.7}}>
          MAJ : {new Date().toLocaleDateString("fr-FR")}<br/>v1.0.0
        </div>
      </div>
    </aside>
  )
}

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({data,color,height=40}){
  if(!data?.length) return null
  const vals = data.map(d=>d.montant)
  const max = Math.max(...vals), min = Math.min(...vals)
  const w=200, h=height
  const pts = vals.map((v,i)=>{
    const x = (i/(vals.length-1))*w
    const y = h - ((v-min)/(max-min||1))*(h-4)-2
    return `${x},${y}`
  }).join(" ")
  return (
    <svg width={w} height={h} style={{display:"block"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.8"/>
    </svg>
  )
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
function DashboardPage(){
  const totalBNP  = ENCOURS_HEBDO.at(-1)?.bnp  || 0
  const totalCIC  = ENCOURS_HEBDO.at(-1)?.cic  || 0
  const totalOut  = TRANSACTIONS.filter(t=>parseFloat(t.amount)<0).reduce((s,t)=>s+Math.abs(parseFloat(t.amount)),0)
  const totalIn   = TRANSACTIONS.filter(t=>parseFloat(t.amount)>0).reduce((s,t)=>s+parseFloat(t.amount),0)
  const dernierBNP= REGLEMENTS_BNP.at(-1)
  const dernierCIC= REGLEMENTS_CIC.at(-1)

  const moisBNP = [...new Map(STATS_BNP.map(s=>[s.mois,s])).values()]
  const moisCIC = [...new Map(STATS_CIC.map(s=>[s.mois,s])).values()]

  return (
    <div className="up" style={{padding:"26px 28px",overflowY:"auto",flex:1}}>
      <div style={{marginBottom:24}}>
        <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:22,marginBottom:3}}>Dashboard Finance</div>
        <div style={{color:T.muted,fontSize:12}}>Données temps réel · Pennylane + Airtable + SharePoint · {new Date().toLocaleDateString("fr-FR")}</div>
      </div>

      {/* KPIs globaux */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22}}>
        <StatCard label="Encours BNP" value={`${fmtK(totalBNP)} €`} sub={`max ${fmtK(ENCOURS_MAX.bnp)} €`} color={pct(totalBNP,ENCOURS_MAX.bnp)>85?T.red:T.text} accentTop={T.accentHi}/>
        <StatCard label="Encours CIC" value={`${fmtK(totalCIC)} €`} sub={`max ${fmtK(ENCOURS_MAX.cic)} €`} color={pct(totalCIC,ENCOURS_MAX.cic)>85?T.red:T.text} accentTop={T.teal}/>
        <StatCard label="Flux sortants Mars" value={`${fmtK(totalOut)} €`} sub={`${TRANSACTIONS.filter(t=>parseFloat(t.amount)<0).length} paiements`} color={T.red} accentTop={T.red}/>
        <StatCard label="Flux entrants Mars" value={`${fmtK(totalIn)} €`} sub={`${TRANSACTIONS.filter(t=>parseFloat(t.amount)>0).length} crédits`} color={T.green} accentTop={T.green}/>
      </div>

      {/* Encours vs max */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:22}}>
        <SCard title="Encours BNP — utilisation" icon="🏦" right={<Pill color={T.accentHi} dim={T.accentGlow}>{pct(totalBNP,ENCOURS_MAX.bnp)}%</Pill>}>
          <ProgressBar value={totalBNP} max={ENCOURS_MAX.bnp} color={pct(totalBNP,ENCOURS_MAX.bnp)>85?T.red:T.accentHi} height={8}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
            <Mono style={{color:T.text}}>{totalBNP.toLocaleString("fr-FR")} €</Mono>
            <Mono style={{color:T.muted}}>max {ENCOURS_MAX.bnp.toLocaleString("fr-FR")} €</Mono>
          </div>
          <div style={{marginTop:16}}>
            <Sparkline data={REGLEMENTS_BNP.slice(-15)} color={T.accentHi}/>
            <div style={{fontSize:11,color:T.muted,marginTop:4}}>Règlements BNP — 15 derniers jours</div>
          </div>
        </SCard>
        <SCard title="Encours CIC — utilisation" icon="🏛️" right={<Pill color={T.teal} dim={T.tealDim}>{pct(totalCIC,ENCOURS_MAX.cic)}%</Pill>}>
          <ProgressBar value={totalCIC} max={ENCOURS_MAX.cic} color={pct(totalCIC,ENCOURS_MAX.cic)>85?T.red:T.teal} height={8}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
            <Mono style={{color:T.text}}>{totalCIC.toLocaleString("fr-FR")} €</Mono>
            <Mono style={{color:T.muted}}>max {ENCOURS_MAX.cic.toLocaleString("fr-FR")} €</Mono>
          </div>
          <div style={{marginTop:16}}>
            <Sparkline data={REGLEMENTS_CIC.slice(-15)} color={T.teal}/>
            <div style={{fontSize:11,color:T.muted,marginTop:4}}>Règlements CIC — 15 derniers jours</div>
          </div>
        </SCard>
      </div>

      {/* Stats recouvrement */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:22}}>
        <SCard title="Recouvrement BNP — Q1 2026" icon="📈">
          {moisBNP.map(s=>(
            <div key={s.mois} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:55,fontSize:12,color:T.muted}}>{s.mois}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:11,color:T.text}}>{s.nbre} fact. · {fmtK(s.montant)} €</span>
                  <Pill color={s.taux_retard>70?T.amber:T.green} dim={s.taux_retard>70?T.amberDim:T.greenDim}>{s.taux_retard}% retard</Pill>
                </div>
                <ProgressBar value={s.retard} max={s.montant} color={s.taux_retard>70?T.amber:T.green} height={4}/>
              </div>
            </div>
          ))}
        </SCard>
        <SCard title="Recouvrement CIC — Q1 2026" icon="📈">
          {moisCIC.map(s=>(
            <div key={s.mois} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:55,fontSize:12,color:T.muted}}>{s.mois}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:11,color:T.text}}>{s.nbre} fact. · {fmtK(s.montant)} €</span>
                  <Pill color={s.taux_retard>70?T.amber:T.green} dim={s.taux_retard>70?T.amberDim:T.greenDim}>{s.taux_retard}% retard</Pill>
                </div>
                <ProgressBar value={s.retard} max={s.montant} color={s.taux_retard>70?T.amber:T.green} height={4}/>
              </div>
            </div>
          ))}
        </SCard>
      </div>

      {/* Docs récents */}
      <SCard title="Documents récents — SharePoint" icon="📁">
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10}}>
          {SHAREPOINT_FILES.slice(0,4).map(f=>(
            <a key={f.id} href={f.webUrl} target="_blank" rel="noopener noreferrer"
              style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:T.elevated,borderRadius:8,border:`1px solid ${T.border}`,transition:"all .12s",cursor:"pointer"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accentHi}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border}}>
              <span style={{fontSize:20}}>{fileIcon(f.type)}</span>
              <div style={{overflow:"hidden"}}>
                <div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div>
                <Mono style={{color:T.muted}}>{fmtDate(f.lastModified)}</Mono>
              </div>
            </a>
          ))}
        </div>
      </SCard>
    </div>
  )
}

// ─── ENCOURS PAGE (générique BNP / CIC) ───────────────────────────────────────
function EncoursPage({banque}){
  const isBnp = banque==="BNP"
  const color  = isBnp ? T.accentHi : T.teal
  const dim    = isBnp ? T.accentGlow : T.tealDim
  const regl   = isBnp ? REGLEMENTS_BNP : REGLEMENTS_CIC
  const stats  = isBnp ? STATS_BNP      : STATS_CIC
  const ca     = isBnp ? CA_BNP         : CA_CIC
  const encCur = ENCOURS_HEBDO.at(-1)?.[isBnp?"bnp":"cic"] || 0
  const max    = isBnp ? ENCOURS_MAX.bnp : ENCOURS_MAX.cic

  const [moisFilter, setMoisFilter] = useState("all")
  const mois = [...new Set(regl.map(r=>r.date.substring(0,7)))]

  const filtered = useMemo(()=>
    moisFilter==="all" ? regl : regl.filter(r=>r.date.startsWith(moisFilter))
  ,[regl,moisFilter])

  const totalFiltered = filtered.reduce((s,r)=>s+r.montant,0)

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <Topbar title={`Encours Client ${banque}`} sub={`Source : ANALYSE COMPTA 2026.xlsx · Airtable ANALYSE FINANCE & COMPTA`}
        right={<Pill color={color} dim={dim}>{pct(encCur,max)}% utilisé</Pill>}/>

      <div style={{flex:1,overflowY:"auto",padding:"22px 24px"}} className="up">

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22}}>
          <StatCard label={`Encours actuel ${banque}`} value={`${encCur.toLocaleString("fr-FR")} €`} sub={`semaine du ${ENCOURS_HEBDO.at(-1)?.semaine}`} color={pct(encCur,max)>85?T.red:color} accentTop={color}/>
          <StatCard label="Encours max autorisé" value={`${max.toLocaleString("fr-FR")} €`} sub="Limite contractuelle" accentTop={T.muted}/>
          <StatCard label={`CA ${banque} Q1`} value={`${ca.reduce((s,m)=>s+m.ca,0).toLocaleString("fr-FR")} €`} sub={`${ca.reduce((s,m)=>s+m.factures,0)} factures`} color={color} accentTop={color}/>
          <StatCard label="Taux de litige moyen" value={`${(ca.reduce((s,m)=>s+m.taux_litige,0)/ca.length*100).toFixed(1)}%`} sub="Seuil mauvais > 10%" color={ca.reduce((s,m)=>s+m.taux_litige,0)/ca.length>0.05?T.red:T.green} accentTop={T.amber}/>
        </div>

        {/* Encours utilisation */}
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"16px 20px",marginBottom:22}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontWeight:600,fontSize:13}}>📊 Utilisation encours {banque}</div>
            <Mono style={{color:T.muted}}>{encCur.toLocaleString("fr-FR")} / {max.toLocaleString("fr-FR")} €</Mono>
          </div>
          <ProgressBar value={encCur} max={max} color={pct(encCur,max)>85?T.red:color} height={12}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
            {ENCOURS_HEBDO.map(h=>(
              <div key={h.semaine} style={{textAlign:"center"}}>
                <Mono style={{color:T.muted,display:"block",marginBottom:2}}>{h.semaine}</Mono>
                <Mono style={{color:color,fontWeight:500}}>{(isBnp?h.bnp:h.cic).toLocaleString("fr-FR")} €</Mono>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:22}}>
          {/* Stats recouvrement */}
          <SCard title={`Recouvrement mensuel ${banque}`} icon="📋">
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr>
                  {["Mois","Fact.","Montant","Retard","Attente","Tps moy."].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"6px 8px",fontSize:10,color:T.muted,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"1px",textTransform:"uppercase",borderBottom:`1px solid ${T.border}`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.map(s=>(
                  <tr key={s.mois} style={{borderBottom:`1px solid rgba(33,41,58,.5)`}}>
                    <td style={{padding:"8px 8px",fontWeight:500}}>{s.mois}</td>
                    <td style={{padding:"8px 8px"}}><Mono>{s.nbre}</Mono></td>
                    <td style={{padding:"8px 8px"}}><Mono style={{color:color}}>{fmtK(s.montant)} €</Mono></td>
                    <td style={{padding:"8px 8px"}}><Pill color={s.taux_retard>70?T.amber:T.green} dim={s.taux_retard>70?T.amberDim:T.greenDim}>{s.taux_retard}%</Pill></td>
                    <td style={{padding:"8px 8px"}}><Mono style={{color:T.muted}}>{fmtK(s.attente)} €</Mono></td>
                    <td style={{padding:"8px 8px"}}><Mono style={{color:Math.abs(s.temps_moyen)>100?T.red:T.amber}}>{s.temps_moyen}j</Mono></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SCard>

          {/* CA mensuel */}
          <SCard title={`CA mensuel ${banque}`} icon="💰">
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr>
                  {["Mois","Factures","CA","Avoirs","Litige"].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"6px 8px",fontSize:10,color:T.muted,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"1px",textTransform:"uppercase",borderBottom:`1px solid ${T.border}`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ca.map(m=>(
                  <tr key={m.mois} style={{borderBottom:`1px solid rgba(33,41,58,.5)`}}>
                    <td style={{padding:"8px 8px",fontWeight:500}}>{m.mois}</td>
                    <td style={{padding:"8px 8px"}}><Mono>{m.factures}</Mono></td>
                    <td style={{padding:"8px 8px"}}><Mono style={{color:color}}>{fmtK(m.ca)} €</Mono></td>
                    <td style={{padding:"8px 8px"}}><Mono style={{color:T.amber}}>{m.montant_avoirs.toLocaleString("fr-FR")} €</Mono></td>
                    <td style={{padding:"8px 8px"}}><Pill color={m.taux_litige>0.05?T.red:T.green} dim={m.taux_litige>0.05?T.redDim:T.greenDim}>{(m.taux_litige*100).toFixed(0)}%</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SCard>
        </div>

        {/* Règlements journaliers */}
        <SCard title={`Règlements journaliers ${banque} — Q1 2026`} icon="📅"
          right={
            <select value={moisFilter} onChange={e=>setMoisFilter(e.target.value)} style={{background:T.elevated,border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 8px",color:T.text,fontSize:11,outline:"none"}}>
              <option value="all">Tous les mois</option>
              {mois.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          }>
          <div style={{marginBottom:12,display:"flex",gap:16}}>
            <div><Mono style={{color:color}}>{totalFiltered.toLocaleString("fr-FR")} €</Mono><span style={{fontSize:11,color:T.muted,marginLeft:6}}>total période</span></div>
            <div><Mono style={{color:T.muted}}>{filtered.length}</Mono><span style={{fontSize:11,color:T.muted,marginLeft:6}}>jours</span></div>
            <div><Mono style={{color:T.muted}}>{filtered.length?Math.round(totalFiltered/filtered.length).toLocaleString("fr-FR"):0} €</Mono><span style={{fontSize:11,color:T.muted,marginLeft:6}}>moyenne/jour</span></div>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr>
                  {["Date","Montant règlement"].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"6px 10px",fontSize:10,color:T.muted,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"1px",textTransform:"uppercase",borderBottom:`1px solid ${T.border}`,background:T.elevated}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r=>(
                  <tr key={r.date} style={{borderBottom:`1px solid rgba(33,41,58,.4)`}}
                    onMouseEnter={e=>e.currentTarget.style.background=T.elevated}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"9px 10px"}}><Mono style={{color:T.muted}}>{r.date}</Mono></td>
                    <td style={{padding:"9px 10px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:`${Math.min(200,r.montant/200)}px`,height:4,background:color,borderRadius:99,opacity:.7,flexShrink:0}}/>
                        <Mono style={{color:T.text,fontWeight:500}}>{r.montant.toLocaleString("fr-FR",{minimumFractionDigits:2})} €</Mono>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SCard>
      </div>
    </div>
  )
}

// ─── TRANSACTIONS PAGE — TEMPS RÉEL via Make Webhook ─────────────────────────
const MAKE_WEBHOOK = "https://hook.eu1.make.com/dloxwtt4hstc5t7r2ob6ebukjdi6ahfw"

function normalizeTransaction(tx) {
  return {
    id:                  tx.id,
    date:                tx.date,
    label:               tx.label || tx.description || "",
    amount:              tx.amount?.toString() || "0",
    currency:            tx.currency || "EUR",
    currency_amount:     tx.currency_amount?.toString() || tx.amount?.toString() || "0",
    attachment_required: tx.attachment_required || false,
    categories:          tx.categories || [],
  }
}

function TransactionsPage(){
  const [txData,    setTxData]  = useState([])
  const [loading,   setLoading] = useState(false)
  const [error,     setError]   = useState(null)
  const [loaded,    setLoaded]  = useState(false)
  const [search,    setSearch]  = useState("")
  const [tab,       setTab]     = useState("toutes")
  const [cat,       setCat]     = useState("all")
  const [sortCol,   setSort]    = useState("date")
  const [sortDir,   setDir]     = useState("desc")
  const [page,      setPage]    = useState(0)
  const [lastSync,  setLastSync]= useState(null)
  const PER = 15

  async function loadTransactions() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(MAKE_WEBHOOK, {
        method: "GET",
        mode: "cors",
      })
      const text = await res.text()

      let list = []
      try {
        const data = JSON.parse(text)
        // Pennylane API retourne { items: [...], has_more, next_cursor }
        if (data.items)        list = data.items
        else if (data.transactions) list = data.transactions
        else if (Array.isArray(data)) list = data
        else if (data.body?.items)    list = data.body.items
      } catch(e) {
        throw new Error("Réponse Make non valide : " + text.substring(0, 100))
      }

      if (list.length > 0) {
        setTxData(list.map(normalizeTransaction))
        setLastSync(new Date())
        setLoaded(true)
      } else {
        throw new Error("Aucune transaction reçue")
      }
    } catch(e) {
      setError("Impossible de charger : " + e.message)
      setLoaded(true)
    }
    setLoading(false)
  }

  const tabs    = ["toutes","débits","crédits","non classés"]
  const allCats = [...new Set(txData.map(t=>inferCategory(t).label))]

  function toggleSort(col){
    if(sortCol===col) setDir(d=>d==="asc"?"desc":"asc")
    else{setSort(col);setDir("asc")}
    setPage(0)
  }

  const filtered = useMemo(()=>txData
    .filter(t=>{
      const v=parseFloat(t.amount), c=inferCategory(t)
      if(tab==="débits"      && v>=0)                   return false
      if(tab==="crédits"     && v<0)                    return false
      if(tab==="non classés" && c.label!=="Non classé") return false
      if(cat!=="all"         && c.label!==cat)          return false
      if(search && !t.label.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a,b)=>{
      let av=a[sortCol],bv=b[sortCol]
      if(sortCol==="amount"){av=parseFloat(a.amount);bv=parseFloat(b.amount)}
      const r=av<bv?-1:av>bv?1:0
      return sortDir==="asc"?r:-r
    })
  ,[txData,search,tab,cat,sortCol,sortDir])

  const paged = filtered.slice(page*PER,(page+1)*PER)

  const Th=({col,children,align="left",w})=>(
    <th onClick={()=>toggleSort(col)} style={{textAlign:align,padding:"9px 12px",fontSize:10,fontWeight:600,letterSpacing:"1.1px",textTransform:"uppercase",color:T.muted,fontFamily:"'JetBrains Mono',monospace",background:T.elevated,borderBottom:`1px solid ${T.border}`,cursor:"pointer",userSelect:"none",whiteSpace:"nowrap",width:w}}>
      {children}{sortCol===col?<span style={{color:T.accentHi}}> {sortDir==="asc"?"↑":"↓"}</span>:<span style={{color:T.dim}}> ↕</span>}
    </th>
  )

  // Écran de chargement initial
  if (!loaded) {
    return (
      <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
        <Topbar title="Transactions Pennylane" sub="Temps réel · Make 'Anthropic CLAUDE V3'"/>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:20}}>
          <div style={{fontSize:40}}>💸</div>
          <div style={{fontWeight:700,fontSize:16}}>Transactions Pennylane</div>
          <div style={{color:T.muted,fontSize:13,textAlign:"center",maxWidth:400}}>
            Chargez toutes les transactions en temps réel depuis Pennylane via Make.<br/>
            <span style={{color:T.accentHi}}>Toutes les transactions — sans filtre de date.</span>
          </div>
          {error && <div style={{padding:"10px 16px",background:T.redDim,border:`1px solid ${T.red}30`,borderRadius:8,fontSize:12,color:T.red,maxWidth:400,textAlign:"center"}}>{error}</div>}
          <button onClick={loadTransactions} disabled={loading} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 24px",background:T.accent,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1}}>
            {loading ? "⏳ Chargement…" : "⚡ Charger les transactions"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <Topbar title="Transactions Pennylane" sub={`Temps réel · Make 'Anthropic CLAUDE V3'${lastSync?" · Sync : "+lastSync.toLocaleTimeString("fr-FR"):""}`}
        right={
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {loading && <Mono style={{color:T.amber}}>⏳ Chargement…</Mono>}
            <button onClick={loadTransactions} disabled={loading} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 12px",background:T.accentGlow,border:`1px solid rgba(37,99,235,0.3)`,borderRadius:7,color:T.accentHi,fontSize:12,fontWeight:600,cursor:loading?"not-allowed":"pointer"}}>
              🔄 Rafraîchir
            </button>
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:T.green}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:T.green,animation:"pulse 2s infinite",display:"inline-block"}}/>
              Live
            </div>
          </div>
        }/>

      {error && <div style={{padding:"10px 16px",background:T.redDim,border:`1px solid ${T.red}30`,fontSize:12,color:T.red,flexShrink:0}}>{error}</div>}

      {/* Compteurs */}
      <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,background:T.surface,flexShrink:0}}>
        {[
          {count:txData.length,                                                           label:"Total",       color:T.text},
          {count:txData.filter(t=>parseFloat(t.amount)<0).length,                        label:"Débits",      color:T.red},
          {count:txData.filter(t=>parseFloat(t.amount)>0).length,                        label:"Crédits",     color:T.green},
          {count:txData.filter(t=>!t.categories||t.categories.length===0).length,        label:"Non classés", color:T.amber},
        ].map((c,i)=>(
          <div key={i} style={{flex:1,textAlign:"center",padding:"12px 0",borderRight:i<3?`1px solid ${T.border}`:"none"}}>
            <div style={{fontSize:22,fontWeight:700,color:c.color,fontFamily:"'JetBrains Mono',monospace",lineHeight:1}}>{c.count}</div>
            <div style={{fontSize:10,color:T.muted,letterSpacing:"1.2px",marginTop:3,textTransform:"uppercase"}}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Onglets + filtres */}
      <div style={{borderBottom:`1px solid ${T.border}`,background:T.surface,display:"flex",alignItems:"center",padding:"0 12px 0 0",flexShrink:0}}>
        {tabs.map(t=>(
          <button key={t} onClick={()=>{setTab(t);setPage(0)}} style={{padding:"10px 12px",fontSize:12,fontWeight:tab===t?600:400,color:tab===t?T.accentHi:T.muted,borderBottom:tab===t?`2px solid ${T.accentHi}`:"2px solid transparent",background:"transparent",border:"none",cursor:"pointer",textTransform:"capitalize",marginBottom:-1,transition:"color .12s"}}>{t}</button>
        ))}
        <div style={{flex:1}}/>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,background:T.elevated,border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 10px"}}>
            <span style={{color:T.muted,fontSize:12}}>🔍</span>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} placeholder="Libellé, fournisseur…"
              style={{background:"none",border:"none",outline:"none",color:T.text,fontSize:12,width:200}}/>
          </div>
          <select value={cat} onChange={e=>{setCat(e.target.value);setPage(0)}} style={{background:T.elevated,border:`1px solid ${T.border}`,borderRadius:7,padding:"5px 9px",color:T.text,fontSize:11,cursor:"pointer",outline:"none"}}>
            <option value="all">Catégorie</option>
            {allCats.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <Mono style={{color:T.muted}}>{filtered.length} résultats</Mono>
        </div>
      </div>

      {/* Table */}
      <div style={{flex:1,overflowY:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead style={{position:"sticky",top:0,zIndex:1}}>
            <tr>
              <Th col="date" w={100}>Date</Th>
              <Th col="label">Libellé</Th>
              <Th col="cat">Catégorie</Th>
              <Th col="amount" align="right" w={140}>Montant EUR</Th>
              <Th col="currency_amount" align="right" w={120}>Devise</Th>
              <th style={{padding:"9px 12px",fontSize:10,color:T.muted,fontFamily:"'JetBrains Mono',monospace",background:T.elevated,borderBottom:`1px solid ${T.border}`,width:90}}>JUSTIF.</th>
            </tr>
          </thead>
          <tbody>
            {paged.length===0?(
              <tr><td colSpan={6} style={{padding:"48px",textAlign:"center",color:T.muted}}>
                <div style={{fontSize:28,marginBottom:10,opacity:.5}}>🔍</div>
                <div style={{fontWeight:600,color:T.text}}>Aucune transaction</div>
              </td></tr>
            ):paged.map(tx=>{
              const c=inferCategory(tx), pos=parseFloat(tx.amount)>=0
              return (
                <tr key={tx.id} style={{borderBottom:`1px solid rgba(33,41,58,.5)`}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.elevated}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"11px 12px"}}><Mono style={{color:T.muted}}>{tx.date}</Mono></td>
                  <td style={{padding:"11px 12px",maxWidth:360}}>
                    <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:13}} title={tx.label}>{tx.label}</div>
                  </td>
                  <td style={{padding:"11px 12px"}}><Tag icon={c.icon} label={c.label} color={c.color} dim={c.dim}/></td>
                  <td style={{padding:"11px 12px",textAlign:"right"}}><Mono style={{color:pos?T.green:T.red,fontWeight:500,fontSize:13}}>{fmtEur(tx.amount)}</Mono></td>
                  <td style={{padding:"11px 12px",textAlign:"right"}}><Mono style={{color:T.muted}}>{parseFloat(tx.currency_amount||tx.amount||0).toLocaleString("fr-FR",{minimumFractionDigits:2})} {tx.currency}</Mono></td>
                  <td style={{padding:"11px 12px",textAlign:"center"}}>{tx.attachment_required?<span style={{fontSize:11,color:T.amber}}>📎</span>:<span style={{fontSize:11,color:T.green}}>✓</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:8,padding:"10px 16px",borderTop:`1px solid ${T.border}`,background:T.surface,flexShrink:0}}>
        <Mono style={{color:T.muted}}>{Math.min(page*PER+1,filtered.length)}–{Math.min((page+1)*PER,filtered.length)} / {filtered.length}</Mono>
        <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{padding:"5px 12px",background:T.elevated,border:`1px solid ${T.border}`,borderRadius:6,color:page===0?T.dim:T.muted,cursor:page===0?"not-allowed":"pointer",fontSize:12}}>← Préc.</button>
        <button onClick={()=>setPage(p=>p+1)} disabled={(page+1)*PER>=filtered.length} style={{padding:"5px 12px",background:T.elevated,border:`1px solid ${T.border}`,borderRadius:6,color:(page+1)*PER>=filtered.length?T.dim:T.muted,cursor:(page+1)*PER>=filtered.length?"not-allowed":"pointer",fontSize:12}}>Suiv. →</button>
      </div>
    </div>
  )
}

// ─── SHAREPOINT PAGE ──────────────────────────────────────────────────────────
function SharePointPage(){
  const [search,setSearch]=useState("")
  const [filter,setFilter]=useState("all")
  const types=[...new Set(SHAREPOINT_FILES.map(f=>f.type))]
  const filtered=SHAREPOINT_FILES.filter(f=>{
    if(filter!=="all"&&f.type!==filter) return false
    if(search&&!f.name.toLowerCase().includes(search.toLowerCase())&&!f.path.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <Topbar title="Documents SharePoint" sub="metzecarecom.sharepoint.com · METZECARE"/>
      <div style={{padding:"14px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",gap:8,flexShrink:0,background:T.surface}}>
        <div style={{display:"flex",alignItems:"center",gap:6,background:T.elevated,border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 10px",flex:1}}>
          <span style={{color:T.muted,fontSize:12}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filtrer…"
            style={{background:"none",border:"none",outline:"none",color:T.text,fontSize:12,flex:1}}/>
        </div>
        <select value={filter} onChange={e=>setFilter(e.target.value)} style={{background:T.elevated,border:`1px solid ${T.border}`,borderRadius:7,padding:"6px 9px",color:T.text,fontSize:11,cursor:"pointer",outline:"none"}}>
          <option value="all">Tous</option>
          {types.map(t=><option key={t} value={t}>.{t.toUpperCase()}</option>)}
        </select>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:20}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
          {filtered.map(f=>(
            <a key={f.id} href={f.webUrl} target="_blank" rel="noopener noreferrer"
              style={{display:"flex",flexDirection:"column",gap:10,padding:16,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,transition:"all .12s",cursor:"pointer"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accentHi;e.currentTarget.style.transform="translateY(-2px)"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="none"}}>
              <span style={{fontSize:26}}>{fileIcon(f.type)}</span>
              <div style={{fontSize:13,fontWeight:600,lineHeight:1.4}}>{f.name}</div>
              <div style={{fontSize:11,color:T.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.path}</div>
              <div style={{fontSize:11,color:T.muted,borderTop:`1px solid ${T.border}`,paddingTop:8}}>{f.summary}</div>
              <Mono style={{color:T.dim}}>{fmtDate(f.lastModified)}</Mono>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── BUDGET PAGE ──────────────────────────────────────────────────────────────
const CR_MOIS = [
  { mois:"Jan", budget:170000, reel:184520.58, cf_b:75645, cf_r:87615.71, ebitda_b:2555, ebitda_r:-32281.45, taux_r:30 },
  { mois:"Fév", budget:170000, reel:195533.00, cf_b:75645, cf_r:98304.11, ebitda_b:2555, ebitda_r:-24235.04, taux_r:46 },
  { mois:"Mar", budget:170000, reel:184415.10, cf_b:75645, cf_r:85851.26, ebitda_b:2555, ebitda_r:86389.33,  taux_r:93 },
  { mois:"Avr", budget:170000, reel:null, cf_b:75645, cf_r:null, ebitda_b:2555, ebitda_r:null, taux_r:null },
  { mois:"Mai", budget:170000, reel:null, cf_b:75645, cf_r:null, ebitda_b:2555, ebitda_r:null, taux_r:null },
  { mois:"Jun", budget:170000, reel:null, cf_b:75645, cf_r:null, ebitda_b:2555, ebitda_r:null, taux_r:null },
  { mois:"Jul", budget:170000, reel:null, cf_b:75645, cf_r:null, ebitda_b:2555, ebitda_r:null, taux_r:null },
  { mois:"Aoû", budget:170000, reel:null, cf_b:75645, cf_r:null, ebitda_b:2555, ebitda_r:null, taux_r:null },
  { mois:"Sep", budget:170000, reel:null, cf_b:75645, cf_r:null, ebitda_b:2555, ebitda_r:null, taux_r:null },
  { mois:"Oct", budget:170000, reel:null, cf_b:75645, cf_r:null, ebitda_b:2555, ebitda_r:null, taux_r:null },
  { mois:"Nov", budget:170000, reel:null, cf_b:75645, cf_r:null, ebitda_b:2555, ebitda_r:null, taux_r:null },
  { mois:"Déc", budget:170000, reel:null, cf_b:75645, cf_r:null, ebitda_b:2555, ebitda_r:null, taux_r:null },
]

const CHARGES_FIXES = [
  { label:"Communication & Marketing", budget:2000,  jan:583.91,   fev:682.33,   mar:112.74  },
  { label:"Centrale d'achat",          budget:2300,  jan:568.66,   fev:568.66,   mar:0       },
  { label:"Télécommunication",         budget:20,    jan:8.99,     fev:8.99,     mar:8.99    },
  { label:"Informatique",              budget:1000,  jan:1511.11,  fev:653.99,   mar:1523.80 },
  { label:"Assurance",                 budget:500,   jan:467.79,   fev:292.20,   mar:253.50  },
  { label:"Véhicules",                 budget:2000,  jan:1256.73,  fev:1794.30,  mar:1571.04 },
  { label:"Location bureau",           budget:2025,  jan:2313.34,  fev:1865.31,  mar:230.87  },
  { label:"Frais administratifs",      budget:0,     jan:2345.91,  fev:0,        mar:1769.96 },
  { label:"Sous-traitance",            budget:1000,  jan:6080.00,  fev:2767.76,  mar:0       },
  { label:"Personnel chargé",          budget:50000, jan:53040.82, fev:70606.32, mar:57439.10},
  { label:"NDF Autres",                budget:3500,  jan:5053.43,  fev:2998.00,  mar:16.00   },
  { label:"NDF Déplacements",          budget:0,     jan:811.15,   fev:964.00,   mar:3297.29 },
  { label:"NDF Restaurant",            budget:0,     jan:992.61,   fev:542.44,   mar:495.34  },
  { label:"Frais bancaires",           budget:2500,  jan:1264.02,  fev:1569.36,  mar:0       },
  { label:"Autres charges",            budget:1000,  jan:2251.93,  fev:1390.00,  mar:6255.32 },
]

const TRESORERIE = [
  { mois:"Déc-25", debut:262639.08, encaiss:244595.15, decaiss:254307.14, fin:253750.65 },
  { mois:"Jan-26", debut:253750.65, encaiss:206892.51, decaiss:269953.50, fin:190689.66 },
  { mois:"Fév-26", debut:190689.66, encaiss:176447.31, decaiss:238596.56, fin:128540.41 },
  { mois:"Mar-26", debut:128540.41, encaiss:229550.01, decaiss:282637.44, fin:75452.98  },
  { mois:"Avr-26", debut:75452.98,  encaiss:0,         decaiss:0,         fin:75452.98  },
]

const BFR_DATA = [
  { mois:"Jan-26", stock:557063, bnp_ne:11298,   cic_ne:14378,   bnp_e:47447,  cic_e:70919,  dettes:17561,  bfr:191321  },
  { mois:"Fév-26", stock:550420, bnp_ne:59222,   cic_ne:48846,   bnp_e:63470,  cic_e:94997,  dettes:28539,  bfr:680348  },
  { mois:"Mar-26", stock:538672, bnp_ne:126325,  cic_ne:140186,  bnp_e:64030,  cic_e:96226,  dettes:53045,  bfr:912394  },
]

function BudgetPage(){
  const [tab, setTab] = useState("pl")
  const tabs = [
    {id:"pl",    label:"P&L mensuel"},
    {id:"cf",    label:"Charges fixes"},
    {id:"treso", label:"Trésorerie"},
    {id:"bfr",   label:"BFR & Créances"},
  ]

  const ytdCA    = CR_MOIS.filter(m=>m.reel).reduce((s,m)=>s+m.reel,0)
  const ytdBudget= CR_MOIS.filter(m=>m.reel).reduce((s,m)=>s+m.budget,0)
  const ytdEBITDA= CR_MOIS.filter(m=>m.ebitda_r!==null).reduce((s,m)=>s+m.ebitda_r,0)
  const nMois    = CR_MOIS.filter(m=>m.reel).length

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <Topbar title="Budget 2026" sub="Source : BUDGET 2026.xlsx · SharePoint METZECARE · Dernière MAJ : 21/04/2026"
        right={
          <a href="https://metzecarecom.sharepoint.com/sites/METZECARE/Shared%20Documents/General/COMPTABILITE/Rapports%20comptables%20et%20financiers/2026/BUDGET%202026.xlsx"
            target="_blank" rel="noopener noreferrer"
            style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",background:T.accentGlow,border:`1px solid rgba(37,99,235,0.3)`,borderRadius:7,color:T.accentHi,fontSize:12,fontWeight:600}}>
            📊 Ouvrir Excel ↗
          </a>
        }
      />

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,padding:"20px 24px 0",flexShrink:0}}>
        <StatCard label={`CA Réel YTD (${nMois} mois)`} value={`${fmtK(ytdCA)} €`} sub={`Budget : ${fmtK(ytdBudget)} €`} color={ytdCA>=ytdBudget?T.green:T.amber} accentTop={T.accentHi}/>
        <StatCard label="EBITDA YTD" value={`${fmtK(Math.abs(ytdEBITDA))} €`} sub={ytdEBITDA<0?"Déficitaire":"Bénéficiaire"} color={ytdEBITDA>=0?T.green:T.red} accentTop={ytdEBITDA>=0?T.green:T.red}/>
        <StatCard label="Tréso Fin Mars" value={`${TRESORERIE.find(t=>t.mois==="Mar-26")?.fin.toLocaleString("fr-FR",{maximumFractionDigits:0})} €`} sub={`Début déc-25 : ${TRESORERIE[0]?.debut.toLocaleString("fr-FR",{maximumFractionDigits:0})} €`} color={TRESORERIE.find(t=>t.mois==="Mar-26")?.fin > TRESORERIE[0]?.debut ? T.green : T.red} accentTop={TRESORERIE.find(t=>t.mois==="Mar-26")?.fin > TRESORERIE[0]?.debut ? T.green : T.red}/>
        <StatCard label="BFR Mars 2026" value="912 k€" sub="↑ vs Jan : 191k€" color={T.amber} accentTop={T.amber}/>
      </div>

      {/* Onglets */}
      <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,margin:"16px 24px 0",flexShrink:0}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 16px",fontSize:12,fontWeight:tab===t.id?600:400,color:tab===t.id?T.accentHi:T.muted,borderBottom:tab===t.id?`2px solid ${T.accentHi}`:"2px solid transparent",background:"transparent",border:"none",cursor:"pointer",transition:"color .12s",marginBottom:-1}}>{t.label}</button>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}} className="up">

        {/* P&L */}
        {tab==="pl" && (
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr>
                  {["Mois","CA Budget","CA Réel","Écart CA","Charges Fixes Budget","Charges Fixes Réel","EBITDA Budget","EBITDA Réel","Taux marge"].map(h=>(
                    <th key={h} style={{textAlign:h==="Mois"?"left":"right",padding:"9px 12px",fontSize:10,color:T.muted,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"1px",textTransform:"uppercase",background:T.elevated,borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CR_MOIS.map(m=>{
                  const ecart = m.reel ? m.reel - m.budget : null
                  return (
                    <tr key={m.mois} style={{borderBottom:`1px solid rgba(33,41,58,.5)`}}
                      onMouseEnter={e=>e.currentTarget.style.background=T.elevated}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{padding:"10px 12px",fontWeight:600}}>{m.mois}</td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:T.muted}}>{m.budget.toLocaleString("fr-FR")} €</Mono></td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:m.reel?T.text:T.dim}}>{m.reel?m.reel.toLocaleString("fr-FR",{maximumFractionDigits:0})+" €":"—"}</Mono></td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:ecart===null?T.dim:ecart>=0?T.green:T.red}}>{ecart===null?"—":(ecart>=0?"+":"")+ecart.toLocaleString("fr-FR",{maximumFractionDigits:0})+" €"}</Mono></td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:T.muted}}>{m.cf_b.toLocaleString("fr-FR")} €</Mono></td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:m.cf_r?m.cf_r>m.cf_b?T.red:T.green:T.dim}}>{m.cf_r?m.cf_r.toLocaleString("fr-FR",{maximumFractionDigits:0})+" €":"—"}</Mono></td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:T.muted}}>{m.ebitda_b.toLocaleString("fr-FR")} €</Mono></td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:m.ebitda_r===null?T.dim:m.ebitda_r>=0?T.green:T.red}}>{m.ebitda_r===null?"—":(m.ebitda_r>=0?"+":"")+m.ebitda_r.toLocaleString("fr-FR",{maximumFractionDigits:0})+" €"}</Mono></td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}>{m.taux_r!==null?<Pill color={m.taux_r>=46?T.green:T.amber} dim={m.taux_r>=46?T.greenDim:T.amberDim}>{m.taux_r}%</Pill>:<Mono style={{color:T.dim}}>—</Mono>}</td>
                    </tr>
                  )
                })}
                <tr style={{borderTop:`2px solid ${T.borderHi}`,background:T.elevated}}>
                  <td style={{padding:"10px 12px",fontWeight:700}}>TOTAL YTD</td>
                  <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:T.muted,fontWeight:700}}>{ytdBudget.toLocaleString("fr-FR",{maximumFractionDigits:0})} €</Mono></td>
                  <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:T.accentHi,fontWeight:700}}>{ytdCA.toLocaleString("fr-FR",{maximumFractionDigits:0})} €</Mono></td>
                  <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:ytdCA>=ytdBudget?T.green:T.red,fontWeight:700}}>{(ytdCA-ytdBudget>=0?"+":"")+(ytdCA-ytdBudget).toLocaleString("fr-FR",{maximumFractionDigits:0})} €</Mono></td>
                  <td colSpan={5}/>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* CHARGES FIXES */}
        {tab==="cf" && (
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr>
                  {["Poste de charge","Budget/mois","Janvier","Février","Mars","Écart cumulé"].map(h=>(
                    <th key={h} style={{textAlign:h==="Poste de charge"?"left":"right",padding:"9px 12px",fontSize:10,color:T.muted,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"1px",textTransform:"uppercase",background:T.elevated,borderBottom:`1px solid ${T.border}`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CHARGES_FIXES.map(c=>{
                  const cumul = c.jan+c.fev+c.mar
                  const budgetCumul = c.budget*3
                  const ecart = cumul - budgetCumul
                  return (
                    <tr key={c.label} style={{borderBottom:`1px solid rgba(33,41,58,.5)`}}
                      onMouseEnter={e=>e.currentTarget.style.background=T.elevated}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{padding:"10px 12px",fontWeight:500}}>{c.label}</td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:T.muted}}>{c.budget.toLocaleString("fr-FR")} €</Mono></td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:c.jan>c.budget?T.amber:T.text}}>{c.jan.toLocaleString("fr-FR",{minimumFractionDigits:2})} €</Mono></td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:c.fev>c.budget?T.amber:T.text}}>{c.fev.toLocaleString("fr-FR",{minimumFractionDigits:2})} €</Mono></td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:c.mar>c.budget?T.amber:T.text}}>{c.mar.toLocaleString("fr-FR",{minimumFractionDigits:2})} €</Mono></td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:ecart>0?T.red:T.green,fontWeight:600}}>{(ecart>=0?"+":"")+ecart.toLocaleString("fr-FR",{maximumFractionDigits:0})} €</Mono></td>
                    </tr>
                  )
                })}
                <tr style={{borderTop:`2px solid ${T.borderHi}`,background:T.elevated}}>
                  <td style={{padding:"10px 12px",fontWeight:700}}>TOTAL</td>
                  <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{fontWeight:700,color:T.muted}}>{CHARGES_FIXES.reduce((s,c)=>s+c.budget,0).toLocaleString("fr-FR")} €</Mono></td>
                  <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{fontWeight:700}}>{CHARGES_FIXES.reduce((s,c)=>s+c.jan,0).toLocaleString("fr-FR",{maximumFractionDigits:0})} €</Mono></td>
                  <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{fontWeight:700}}>{CHARGES_FIXES.reduce((s,c)=>s+c.fev,0).toLocaleString("fr-FR",{maximumFractionDigits:0})} €</Mono></td>
                  <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{fontWeight:700}}>{CHARGES_FIXES.reduce((s,c)=>s+c.mar,0).toLocaleString("fr-FR",{maximumFractionDigits:0})} €</Mono></td>
                  <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{fontWeight:700,color:T.red}}>+{(CHARGES_FIXES.reduce((s,c)=>s+c.jan+c.fev+c.mar,0)-CHARGES_FIXES.reduce((s,c)=>s+c.budget*3,0)).toLocaleString("fr-FR",{maximumFractionDigits:0})} €</Mono></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* TRÉSORERIE */}
        {tab==="treso" && (
          <div style={{overflowX:"auto"}}>
            <div style={{marginBottom:16,display:"flex",gap:20}}>
              <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 20px",flex:1}}>
                <div style={{fontSize:10,color:T.muted,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"1px",marginBottom:6}}>TRÉSORERIE DÉBUT</div>
                <div style={{fontSize:22,fontWeight:700,color:T.text,fontFamily:"'JetBrains Mono',monospace"}}>262 639 €</div>
                <div style={{fontSize:11,color:T.muted}}>Déc-25</div>
              </div>
              <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 20px",flex:1}}>
                <div style={{fontSize:10,color:T.muted,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"1px",marginBottom:6}}>TRÉSORERIE FIN MARS</div>
                <div style={{fontSize:22,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:TRESORERIE.find(t=>t.mois==="Mar-26")?.fin>0?T.green:T.red}}>
                  {TRESORERIE.find(t=>t.mois==="Mar-26")?.fin.toLocaleString("fr-FR",{maximumFractionDigits:0})} €
                </div>
                <div style={{fontSize:11,color:T.muted}}>
                  {((TRESORERIE.find(t=>t.mois==="Mar-26")?.fin/TRESORERIE[0]?.debut-1)*100).toFixed(0)}% vs Déc-25
                </div>
              </div>
              <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 20px",flex:1}}>
                <div style={{fontSize:10,color:T.muted,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"1px",marginBottom:6}}>VARIATION NETTE</div>
                <div style={{fontSize:22,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:(TRESORERIE.find(t=>t.mois==="Mar-26")?.fin-TRESORERIE[0]?.debut)>=0?T.green:T.red}}>
                  {((TRESORERIE.find(t=>t.mois==="Mar-26")?.fin-TRESORERIE[0]?.debut)>=0?"+":"")}
                  {(TRESORERIE.find(t=>t.mois==="Mar-26")?.fin-TRESORERIE[0]?.debut).toLocaleString("fr-FR",{maximumFractionDigits:0})} €
                </div>
                <div style={{fontSize:11,color:T.muted}}>Sur 3 mois</div>
              </div>
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr>
                  {["Mois","Tréso début","Encaissements","Décaissements","Variation","Tréso fin"].map(h=>(
                    <th key={h} style={{textAlign:h==="Mois"?"left":"right",padding:"9px 12px",fontSize:10,color:T.muted,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"1px",textTransform:"uppercase",background:T.elevated,borderBottom:`1px solid ${T.border}`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRESORERIE.map(t=>{
                  const variation = t.encaiss - t.decaiss
                  return (
                    <tr key={t.mois} style={{borderBottom:`1px solid rgba(33,41,58,.5)`}}
                      onMouseEnter={e=>e.currentTarget.style.background=T.elevated}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{padding:"10px 12px",fontWeight:600}}>{t.mois}</td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono>{t.debut.toLocaleString("fr-FR",{maximumFractionDigits:0})} €</Mono></td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:t.encaiss>0?T.green:T.dim}}>{t.encaiss>0?t.encaiss.toLocaleString("fr-FR",{maximumFractionDigits:0})+" €":"—"}</Mono></td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:t.decaiss>0?T.red:T.dim}}>{t.decaiss>0?t.decaiss.toLocaleString("fr-FR",{maximumFractionDigits:0})+" €":"—"}</Mono></td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:variation>=0?T.green:T.red,fontWeight:600}}>{t.encaiss>0?(variation>=0?"+":"")+variation.toLocaleString("fr-FR",{maximumFractionDigits:0})+" €":"—"}</Mono></td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:T.accentHi,fontWeight:600}}>{t.fin.toLocaleString("fr-FR",{maximumFractionDigits:0})} €</Mono></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* BFR */}
        {tab==="bfr" && (
          <div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr>
                    {["Mois","Stock","BNP non échu","CIC non échu","Encours BNP","Encours CIC","Dettes fourn.","BFR Total"].map(h=>(
                      <th key={h} style={{textAlign:h==="Mois"?"left":"right",padding:"9px 12px",fontSize:10,color:T.muted,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"1px",textTransform:"uppercase",background:T.elevated,borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BFR_DATA.map(b=>(
                    <tr key={b.mois} style={{borderBottom:`1px solid rgba(33,41,58,.5)`}}
                      onMouseEnter={e=>e.currentTarget.style.background=T.elevated}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{padding:"10px 12px",fontWeight:600}}>{b.mois}</td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:T.text}}>{b.stock.toLocaleString("fr-FR")} €</Mono></td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:T.accentHi}}>{b.bnp_ne.toLocaleString("fr-FR")} €</Mono></td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:T.teal}}>{b.cic_ne.toLocaleString("fr-FR")} €</Mono></td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:T.amber}}>{b.bnp_e.toLocaleString("fr-FR")} €</Mono></td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:T.amber}}>{b.cic_e.toLocaleString("fr-FR")} €</Mono></td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:T.red}}>{b.dettes.toLocaleString("fr-FR")} €</Mono></td>
                      <td style={{padding:"10px 12px",textAlign:"right"}}><Mono style={{color:b.bfr>500000?T.red:T.amber,fontWeight:700}}>{b.bfr.toLocaleString("fr-FR")} €</Mono></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{marginTop:16,padding:"14px 16px",background:T.elevated,border:`1px solid ${T.border}`,borderRadius:8,fontSize:12,color:T.muted}}>
              💡 <strong style={{color:T.text}}>BFR = Stocks + Créances clients − Dettes fournisseurs</strong> · Le BFR de mars (912k€) reflète la forte croissance des créances non échues BNP/CIC liée à l'affacturage.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


function ParametresPage(){
  const items=[
    {titre:"Pennylane",     desc:"Make · Connexion 'Anthropic CLAUDE V3' · Mars 2026",                    badge:"Actif",     color:T.green},
    {titre:"Airtable",      desc:"ANALYSE FINANCE & COMPTA (appiVkaYynmh9t8Wl) · Encours BNP/CIC",        badge:"Configuré", color:T.amber},
    {titre:"SharePoint",    desc:"metzecarecom.sharepoint.com/sites/METZECARE · COMPTABILITE",             badge:"Actif",     color:T.green},
    {titre:"Déploiement",   desc:"GitHub Pages · Option A — données statiques (src/data/)",               badge:"Static",    color:T.accentHi},
    {titre:"Mise à jour",   desc:"git push origin main → GitHub Actions → rebuild automatique en ~2 min", badge:"Auto",      color:T.purple},
  ]
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <Topbar title="Paramètres" sub="Sources de données & configuration"/>
      <div style={{flex:1,overflowY:"auto",padding:"24px"}}>
        <div style={{maxWidth:600}}>
          {items.map((item,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 18px",marginBottom:10,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10}}>
              <div>
                <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>{item.titre}</div>
                <Mono style={{color:T.muted}}>{item.desc}</Mono>
              </div>
              <Pill color={item.color} dim={`${item.color}18`}>{item.badge}</Pill>
            </div>
          ))}
          <div style={{marginTop:20,padding:"16px 18px",background:T.elevated,border:`1px solid ${T.border}`,borderRadius:10}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:10,color:T.amber}}>⚠️ Pour mettre à jour les données</div>
            <div style={{fontSize:12,color:T.muted,lineHeight:1.8}}>
              1. Modifie les fichiers dans <Mono style={{color:T.text}}>src/data/</Mono> (transactions.js, encours.js, sharepoint.js)<br/>
              2. Puis : <Mono style={{color:T.accentHi}}>git add . && git commit -m "MAJ données" && git push</Mono><br/>
              3. GitHub Actions rebuild et publie automatiquement en ~2 min
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App(){
  const [page,setPage]=useState("dashboard")
  const render = ()=>{
    if(page==="dashboard")    return <DashboardPage/>
    if(page==="encours-bnp")  return <EncoursPage banque="BNP"/>
    if(page==="encours-cic")  return <EncoursPage banque="CIC"/>
    if(page==="budget")       return <BudgetPage/>
    if(page==="transactions") return <TransactionsPage/>
    if(page==="sharepoint")   return <SharePointPage/>
    if(page==="parametres")   return <ParametresPage/>
    return <DashboardPage/>
  }
  return (
    <>
      <style>{CSS}</style>
      <div style={{display:"flex",height:"100vh",overflow:"hidden"}}>
        <Sidebar page={page} setPage={setPage}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          {render()}
        </div>
      </div>
    </>
  )
}
