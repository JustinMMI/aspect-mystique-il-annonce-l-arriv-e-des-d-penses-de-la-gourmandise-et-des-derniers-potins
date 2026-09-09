# LE DISTRIBUTEUR

Mini-jeu web d'horreur. Un distributeur automatique doté de trois yeux réclame un
**potin** en offrande, le juge, et selon son humeur du moment vous recale d'un
jump scare glitché… ou vous ouvre sa porte sur un paradis doré où tout le monde
papote, festoie et dépense sans compter.

Projet MMI — thème imposé : *« aspect mystique, il annonce l'arrivée des dépenses,
de la gourmandise et des derniers potins ».*

## Lancer

Ouvrir `index.html` dans un navigateur. C'est tout : HTML/CSS/JS pur, aucun
framework, aucune dépendance, aucun backend, aucun appel réseau (hormis les
Google Fonts, avec polices de repli si elles ne chargent pas).

Un serveur statique fonctionne aussi (`npx serve`, extension Live Server…).

Le premier écran demande d'appuyer pour allumer la machine : les navigateurs
interdisent de démarrer le son sans un geste de l'utilisateur.

## Mise en scène

La machine n'est pas l'interface : c'est un **objet planté dans un couloir
d'école la nuit** (mur carrelé, casiers, néon qui grésille, sol en fuite, halo
rouge au sol). Toute la parole passe par une **boîte de dialogue en bas de
l'écran**, écrite lettre par lettre — celle de la machine comme la vôtre, avec
son bip de frappe. Les instruments (jauge, paliers, codes hexadécimaux,
compteur) restent, eux, sur le distributeur.

## Boucle de jeu

`BOOT` → `WAITING_INPUT` → `JUDGING` → `REJETÉ` (jump scare, retour à la saisie)
ou `ACCEPTÉ` (ouverture d'iris sur le paradis, puis `RECOMMENCER`).

Tout tient dans une seule page : le paradis n'est pas un autre fichier, c'est un
changement de décor complet (palette, typo, animations, ambiance sonore).

### La montée de tension (phase d'analyse)

L'analyse dure 3,6 à 4,6 s et se joue en trois paliers, `ANALYSE` →
`RECOUPEMENT` → `VERDICT` : le cadrage se resserre lentement sur la machine,
l'image zoome, la carrosserie tremble de plus en plus vite, le néon grésille, la
jauge cale puis **recule**, le label passe du vert à l'ambre puis au rouge, un
cœur bat de plus en plus fort, une nappe monte en fréquence — et la machine
marmonne une phrase dans la boîte du bas. Puis **tout se coupe** : silence
complet, œil figé, trois points de suspension. C'est là que tombe le verdict.

## Le jugement (aucune IA)

`script.js`, section 5. Le potin reçoit un score :

- **+2** par mot fort distinct trouvé (`trompé`, `secret`, `dette`, `en cachette`…),
  plafonné à **+6** pour empêcher le spam d'un même mot ;
- **+1** si un nom propre semble visé (majuscule ailleurs qu'en début de phrase) ;
- **+1** si la phrase dépasse 10 mots ;
- **rejet automatique** sous 3 mots ou si la phrase contient « rien »,
  « je sais pas », « chépa »…

À chaque `BOOT`, la machine tire une **humeur** : un seuil d'exigence entre 3 et 5.
Le joueur ne le connaît jamais — la machine reste arbitraire, c'est le ressort
comique. Ni le score ni le seuil ne sont affichés.

## Compteur

`localStorage` conserve le nombre de tentatives et de rejets entre les parties
(clé `distributeur.v1`), affiché en bas de la vitrine façon compteur de morts
d'un jeu d'arcade — invisible tant qu'aucune tentative n'a eu lieu.

## Sons

Synthétisés en Web Audio, aucun fichier requis. Pour brancher de vrais samples,
voir `assets/sounds/README.md`.

## Fichiers

```
index.html         couloir, machine, yeux SVG, boîte de dialogue, paradis
style.css          les deux ambiances (couloir CRT / intérieur doré)
script.js          machine à états, jugement, sons, montée de tension
assets/sounds/     emplacement des samples optionnels
assets/img/        (vide : décor et textures sont générés en SVG/CSS)
```

Aucune image externe : les textures (crasse, grain, carrelage, lino) sont
générées en CSS et en SVG inline — rien à télécharger, rien qui casse si le
projet est déplacé ou rendu hors ligne.
