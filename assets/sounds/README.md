# Sons

Le jeu **fonctionne sans aucun fichier son** : tous les bruitages sont synthétisés
en direct par la Web Audio API dans `script.js` (bourdonnement, statique, growl,
carillon, bips de terminal, cliquetis de l'analyse).

## Brancher de vrais samples (optionnel)

1. Déposer ici quatre fichiers courts, libres de droits (freesound.org) :

   | fichier             | usage                                        |
   |---------------------|----------------------------------------------|
   | `hum.mp3`           | bourdonnement mécanique de fond, en boucle   |
   | `glitch.mp3`        | statique / interférence                      |
   | `growl.mp3`         | growl distordu du rejet (jump scare)         |
   | `accept-chime.mp3`  | ding métallique de l'acceptation             |

2. Dans `script.js`, passer la constante `USE_FILES` à `true`
   (section « 2. SON », repérée par un commentaire `TODO SONS`).

Les samples remplacent alors la synthèse ; le reste du jeu est inchangé.
