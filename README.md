# LE DISTRIBUTEUR

Expérience web interactive de thriller horrifique. Un distributeur automatique
doté de trois yeux réclame un potin, le juge selon son humeur, puis déclenche
un rejet brutal ou ouvre un paradis aussi étrange que somptueux.

Projet MMI autour du thème : « aspect mystique, il annonce l'arrivée des
dépenses, de la gourmandise et des derniers potins ».

## Lancer le projet

Le jeu charge son dictionnaire depuis `data/potin.json`. Il faut donc le lancer
avec un serveur statique, par exemple avec Live Server ou :

```bash
npx serve .
```

Ouvrir ensuite l'adresse locale fournie par le serveur, généralement
`http://localhost:3000`.

Le premier écran demande une interaction avant de lancer la machine. Cette
étape est nécessaire pour permettre la lecture des sons dans les navigateurs.

## Pages

### Accueil et jeu

`index.html` contient l'expérience principale :

- écran d'allumage de la machine ;
- couloir d'école nocturne, effets VHS et ambiance bio-mécanique ;
- distributeur animé avec yeux, produits et interface de commande ;
- saisie d'un potin dans la boîte de dialogue ;
- jugement, tension progressive, jump scare et paradis final ;
- bouton fixe permettant d'ouvrir la page d'information.

### Page d'information

`information.html` présente LE DISTRIBUTEUR dans un dossier éditorial :

- affiche du film ;
- bande-annonce vidéo ;
- synopsis et informations principales ;
- équipe du film ;
- avis de la communauté ;
- FAQ interactive.

## Fonctionnement du jeu

La boucle principale suit ce déroulement :

`BOOT` → `WAITING_INPUT` → `JUDGING` → `REJETÉ` ou `ACCEPTÉ`

Le rejet déclenche un jump scare et renvoie vers la saisie. L'acceptation ouvre
le paradis, puis permet de recommencer.

Le jugement est entièrement déterministe et local. Le texte reçoit un score
selon plusieurs critères :

- présence de mots forts liés aux secrets, aux mensonges ou aux dettes ;
- présence probable d'un nom propre ;
- longueur de la phrase ;
- rejet automatique des réponses trop courtes ou trop vagues.

À chaque partie, la machine choisit un seuil d'exigence entre 3 et 5. Ce seuil
n'est jamais affiché au joueur.

## Audio et stockage

Les sons sont synthétisés avec la Web Audio API dans `js/script.js`. Aucun
fichier audio n'est nécessaire pour jouer.

Le compteur de tentatives et de rejets est conservé dans `localStorage` sous la
clé `distributeur.v1`.

## Arborescence utile

```text
index.html                 Page principale et jeu
information.html           Page d'information du film
css/style.css              Styles du jeu principal
css/information.css        Styles de la page d'information
js/script.js               Logique du jeu, jugement et sons
data/potin.json            Dictionnaire et règles du jugement
files/affiche.png          Affiche de LE DISTRIBUTEUR
files/bande-annonce.mp4    Bande-annonce du film
assets/img/                Produits et éléments graphiques de la machine
assets/sounds/             Documentation des sons optionnels
fonts/                     Polices locales du projet
```

Le projet fonctionne sans framework, backend ou dépendance JavaScript. Les
Google Fonts sont utilisées par la page principale avec des polices de repli.
