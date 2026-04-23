// ─────────────────────────────────────────────────────────────────────────────
// ENCOURS BNP & CIC — Source : ANALYSE COMPTA 2026.xlsx (SharePoint)
// Base Airtable : ANALYSE FINANCE & COMPTA (appiVkaYynmh9t8Wl)
// Tables : ENCOURS CLIENT BNP - ECHUS / ENCOURS CLIENT CIC - ECHUS
// Dernière MAJ : 22/04/2026
// ─────────────────────────────────────────────────────────────────────────────

// KPI ENCOURS MAX
export const ENCOURS_MAX = { bnp: 150000, cic: 150000, total: 300000 }

// ENCOURS SEMAINE PAR SEMAINE (extrait réel du fichier ANALYSE COMPTA 2026)
export const ENCOURS_HEBDO = [
  { semaine:"26-Jan", bnp:102217, cic:80984,  total:183201 },
  { semaine:"05-Mar", bnp:70004,  cic:97372,  total:167376 },
  { semaine:"31-Mar", bnp:84126,  cic:93439,  total:177565 },
]

// RÈGLEMENTS JOURNALIERS BNP + CIC (extrait réel ANALYSE COMPTA 2026 — Q1 2026)
export const REGLEMENTS_BNP = [
  { date:"2026-01-02", montant:4457.82 },
  { date:"2026-01-05", montant:4488.41 },
  { date:"2026-01-06", montant:6153.64 },
  { date:"2026-01-07", montant:5993.91 },
  { date:"2026-01-08", montant:3153.97 },
  { date:"2026-01-09", montant:3742.50 },
  { date:"2026-01-12", montant:1749.88 },
  { date:"2026-01-13", montant:2238.00 },
  { date:"2026-01-14", montant:3018.06 },
  { date:"2026-01-15", montant:3608.50 },
  { date:"2026-01-16", montant:5191.86 },
  { date:"2026-01-19", montant:7338.20 },
  { date:"2026-01-20", montant:21104.00 },
  { date:"2026-01-21", montant:3716.00 },
  { date:"2026-01-22", montant:1349.00 },
  { date:"2026-01-23", montant:2372.00 },
  { date:"2026-01-26", montant:2818.20 },
  { date:"2026-01-27", montant:2977.00 },
  { date:"2026-01-28", montant:865.75 },
  { date:"2026-01-29", montant:2352.07 },
  { date:"2026-01-30", montant:7042.99 },
  { date:"2026-01-31", montant:7944.87 },
  { date:"2026-02-02", montant:6124.00 },
  { date:"2026-02-03", montant:4070.00 },
  { date:"2026-02-05", montant:7055.00 },
  { date:"2026-02-06", montant:6484.00 },
  { date:"2026-02-09", montant:6123.00 },
  { date:"2026-02-10", montant:5159.00 },
  { date:"2026-02-11", montant:3258.00 },
  { date:"2026-02-12", montant:3149.96 },
  { date:"2026-02-13", montant:4555.00 },
  { date:"2026-02-16", montant:5582.00 },
  { date:"2026-02-17", montant:12111.00 },
  { date:"2026-02-18", montant:1401.00 },
  { date:"2026-02-19", montant:845.00 },
  { date:"2026-02-20", montant:2578.82 },
  { date:"2026-02-23", montant:3097.00 },
  { date:"2026-02-24", montant:1218.00 },
  { date:"2026-02-25", montant:1952.00 },
  { date:"2026-02-26", montant:8347.00 },
  { date:"2026-02-27", montant:5988.00 },
  { date:"2026-03-03", montant:3508.00 },
  { date:"2026-03-04", montant:404.00 },
  { date:"2026-03-05", montant:8272.00 },
  { date:"2026-03-06", montant:2927.00 },
  { date:"2026-03-09", montant:7548.00 },
  { date:"2026-03-10", montant:1733.00 },
  { date:"2026-03-11", montant:2679.00 },
  { date:"2026-03-12", montant:2065.00 },
  { date:"2026-03-13", montant:7407.00 },
  { date:"2026-03-16", montant:5844.00 },
  { date:"2026-03-17", montant:8835.00 },
  { date:"2026-03-18", montant:1975.00 },
  { date:"2026-03-19", montant:6739.00 },
  { date:"2026-03-20", montant:467.00 },
  { date:"2026-03-23", montant:3316.00 },
  { date:"2026-03-24", montant:6263.00 },
  { date:"2026-03-25", montant:780.00 },
  { date:"2026-03-26", montant:1409.00 },
  { date:"2026-03-27", montant:8090.00 },
  { date:"2026-03-30", montant:801.00 },
  { date:"2026-03-31", montant:4903.49 },
]

export const REGLEMENTS_CIC = [
  { date:"2026-01-02", montant:5585.25 },
  { date:"2026-01-05", montant:1574.70 },
  { date:"2026-01-06", montant:3257.13 },
  { date:"2026-01-07", montant:2789.88 },
  { date:"2026-01-08", montant:3960.25 },
  { date:"2026-01-09", montant:2068.32 },
  { date:"2026-01-12", montant:8170.43 },
  { date:"2026-01-13", montant:2453.00 },
  { date:"2026-01-14", montant:12985.00 },
  { date:"2026-01-15", montant:3240.00 },
  { date:"2026-01-16", montant:9896.00 },
  { date:"2026-01-19", montant:2480.00 },
  { date:"2026-01-20", montant:13409.36 },
  { date:"2026-01-21", montant:3349.00 },
  { date:"2026-01-22", montant:578.00 },
  { date:"2026-01-23", montant:3139.00 },
  { date:"2026-01-26", montant:4804.62 },
  { date:"2026-01-27", montant:5995.14 },
  { date:"2026-01-28", montant:3505.00 },
  { date:"2026-01-29", montant:1117.53 },
  { date:"2026-01-30", montant:4474.94 },
  { date:"2026-02-02", montant:6825.00 },
  { date:"2026-02-03", montant:4956.00 },
  { date:"2026-02-04", montant:3768.00 },
  { date:"2026-02-05", montant:12896.00 },
  { date:"2026-02-06", montant:11027.00 },
  { date:"2026-02-09", montant:2400.00 },
  { date:"2026-02-10", montant:1351.00 },
  { date:"2026-02-11", montant:3875.00 },
  { date:"2026-02-12", montant:7602.48 },
  { date:"2026-02-13", montant:1745.00 },
  { date:"2026-02-16", montant:2402.00 },
  { date:"2026-02-17", montant:3203.00 },
  { date:"2026-02-18", montant:5497.00 },
  { date:"2026-02-19", montant:1745.00 },
  { date:"2026-02-20", montant:3527.00 },
  { date:"2026-02-23", montant:1975.00 },
  { date:"2026-02-24", montant:2366.00 },
  { date:"2026-02-25", montant:947.00 },
  { date:"2026-02-26", montant:1065.00 },
  { date:"2026-02-27", montant:8543.00 },
  { date:"2026-02-28", montant:5260.00 },
  { date:"2026-03-03", montant:1549.00 },
  { date:"2026-03-04", montant:7018.00 },
  { date:"2026-03-05", montant:5161.00 },
  { date:"2026-03-06", montant:4778.00 },
  { date:"2026-03-09", montant:3202.00 },
  { date:"2026-03-10", montant:3734.00 },
  { date:"2026-03-11", montant:5927.00 },
  { date:"2026-03-12", montant:6938.00 },
  { date:"2026-03-13", montant:7753.00 },
  { date:"2026-03-16", montant:2075.00 },
  { date:"2026-03-17", montant:967.00 },
  { date:"2026-03-18", montant:6477.00 },
  { date:"2026-03-19", montant:12670.00 },
  { date:"2026-03-20", montant:2324.00 },
  { date:"2026-03-23", montant:5714.00 },
  { date:"2026-03-24", montant:4998.00 },
  { date:"2026-03-25", montant:4699.00 },
  { date:"2026-03-26", montant:3008.00 },
  { date:"2026-03-27", montant:3689.00 },
  { date:"2026-03-30", montant:1634.00 },
  { date:"2026-03-31", montant:2750.00 },
]

// STATS MENSUELLES RECOUVREMENT (source : ANALYSE COMPTA 2026)
export const STATS_BNP = [
  { mois:"Janvier", nbre:182, montant:92010,  retard:66967, attente:25043, taux_retard:73, temps_moyen:-31 },
  { mois:"Février", nbre:81,  montant:88391,  retard:65302, attente:23089, taux_retard:74, temps_moyen:-37 },
  { mois:"Mars",    nbre:194, montant:108291, retard:72897, attente:35394, taux_retard:67, temps_moyen:-114 },
]

export const STATS_CIC = [
  { mois:"Janvier", nbre:208, montant:99993,  retard:81616, attente:18377,  taux_retard:82, temps_moyen:-60  },
  { mois:"Février", nbre:229, montant:139472, retard:77064, attente:62408,  taux_retard:55, temps_moyen:-217 },
  { mois:"Mars",    nbre:168, montant:97494,  retard:11561, attente:85933,  taux_retard:12, temps_moyen:-155 },
]

// CA MENSUEL
export const CA_BNP = [
  { mois:"Janvier", docs:215, factures:211, ca:122249, avoirs:3, montant_avoirs:1709, taux_litige:0.01 },
  { mois:"Février", docs:184, factures:177, ca:107645, avoirs:5, montant_avoirs:2536, taux_litige:0.02 },
  { mois:"Mars",    docs:185, factures:170, ca:90132,  avoirs:12, montant_avoirs:6752, taux_litige:0.07 },
]

export const CA_CIC = [
  { mois:"Janvier", docs:223, factures:212, ca:118365, avoirs:6, montant_avoirs:1492, taux_litige:0.01 },
  { mois:"Février", docs:156, factures:149, ca:115766, avoirs:6, montant_avoirs:1324, taux_litige:0.01 },
  { mois:"Mars",    docs:166, factures:155, ca:114435, avoirs:8, montant_avoirs:5216, taux_litige:0.05 },
]
