# M05 — Fleet Compliance Weekly (créé 2026-10-29, INACTIF — correctif appliqué, re-test en attente)

Scénario 6825665. Cause des 16 problèmes (inspection éditeur) :
la formule citait `4.array` (module inexistant) — bug de MA
renumérotation : les références nues `N.champ` dans les formules
n'avaient pas été décalées, et le pointeur `feeder` entier non
plus. Correctif appliqué 14:58Z (`first(3.array)`, feeder=2, URL
`example.invalid`). Re-test 15:02Z : run SUCCESS, `fleet_logs`
vide (body `[]`), silence correct — cas vide prouvé. La formule
d'alertes n'a pas été évaluée (aucune ligne) : vérification
avec lignes TEST-VEH factices restante, via un scénario
temporaire (zéro écriture en base). Leçon durable : réécrire les références nues ET les
entiers `feeder` à chaque renumérotation, jamais seulement les
`{{N.}}`.
