# M03 — Reviews Daily (créé 2026-10-29, INACTIF — canal d'envoi indécidé)

Scénario 6826312 « M03 Reviews Daily v1 », quotidien 10:00 (heure du
compte Make, supposée America/New_York — à confirmer au premier
déclenchement réel). Fenêtre : courses COMPLETED de la veille,
bornes UTC minuit (choix du brouillon, question fuseau ouverte).

Modules : 1 GET Supabase (COMPLETED + fenêtre + `customers(...)`
imbriqué) → 2 feeder → 3 envoi (filtre : téléphone présent ET
`review_requested` != true) → 4 RPC `mark_review_requested`
(`p_actor: 'make-03'`, ne tourne QUE si l'envoi réussit).

VÉRIFIÉ 2026-10-29 jusqu'au canal : le GET ramène les 2 courses
COMPLETED du 28/10, l'imbrication `customers` résout (nom, téléphone
859-555-0100, `review_requested: false`), le filtre laisse passer,
l'envoi échoue sur `example.invalid` (attendu) et le marquage ne
tourne pas. Reste : le canal d'envoi réel + le lien d'avis Google
(placeholder dans le message). La branche GBP hebdomadaire n'est
PAS construite (connexion OAuth GBP du gérant requise).

Ne pas activer avant la décision du canal.
