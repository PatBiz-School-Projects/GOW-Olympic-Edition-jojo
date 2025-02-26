# "Climbing Over It" by ~JOJO~

### <ins/>Participants :
- Lucah Patel
- Roman Lokman
- Patrick Bizot


--------------------------------------------------------------------------------


### <ins/>Description du jeu:
  _Plongez dans l'univers palpitant de l'escalade avec JOJO, un jeu captivant développé avec BabylonJS. L'objectif est simple mais exigeant : grimpez aussi haut que possible sans tomber._


--------------------------------------------------------------------------------


### <ins/>Caractéristiques :
  - Graphismes Immersifs : Profitez d'un environnement 3D réaliste et détaillé, grâce à la puissance de BabylonJS.
  - Contrôles Fluides : Des contrôles intuitifs qui vous permettent de vous concentrer sur l'action et la stratégie.
  - Défis Variés : Affrontez différents types d'obstacles, chacun nécessitant des compétences et des approches uniques.
  - Progression Dynamique : Plus vous grimpez, plus les défis deviennent complexes, testant vos limites à chaque étape.


--------------------------------------------------------------------------------


### <ins/>Télécharger le jeu :

#### Version sans gravité (afin de visiter la carte sans diffiulté) :
>[!Note]
>Cette version permet de visiter la carte sans diffiulté.

>**Etape 1 : Cloner le repo :**
>  ```sh
>  git clone https://github.com/PatBiz-School-Projects/GOW-Olympic-Edition-jojo
>  ```
>
>**Etape 2 : Installer les paquet `node` :**
>  ```sh
>  cd gow-olympic-edition-jojo
>
>  npm i
>
>  #To install BabylonJS Core and Loaders
>  npm i @babylonjs/core @babylonjs/loaders
>
>  #To install Cannon for the animations
>  npm i cannon @types/cannon
>  ```
>
>**Etape 3 : Récupérer les assets trops volumineux pour GitHub :**
>Téléchargez le dossier `models` [ici](https://unice-my.sharepoint.com/:f:/g/personal/lucah_patel_etu_unice_fr/EpmIUdbOUJRHmc_xoas6KVABHa0wQENFyDl5oQp_kidFXQ?e=ezJjC3).
>Puis mettez dans le dossier `assets`.

#### Version avec gravité (buggée :disappointed: ) :
>**Etape 1 : Cloner le repo :**
>  ```sh
>  git clone https://github.com/bogwee/GamesOnWeb
>  ```
>
>**Etape 2 : Installer les paquet `node` :**
>  ```sh
>  cd gow-olympic-edition-jojo
>
>  npm i
>
>  #To install BabylonJS Core and Loaders
>  npm i @babylonjs/core @babylonjs/loaders
>
>  #To install Cannon for the animations
>  npm i cannon @types/cannon
>  ```
>
> >[!Caution]
> >Cette version comporte plusieur bugs majeurs que nous n'avons pas pu patch avant la deadline du concours.
> >De ce fait vous risquez de rencontrer les problèmes suivants :
> > - Le 1er obstacle (qui n'en était pas un à la base) est impossible à passer.
> >   En effet, la vérification pour tester si le joueur est accroché au mur est en échec
> >   à partir du moment ou un bout du personnage n'est plus en face du mur.
> >
> > - Il faut relancer la page lorsqu'on tombe.
> >   En effet, nous avons oublié de mettre un sol à la scene, si bien que lorque le joueur tombe,
> >   il tombe à l'infini.


--------------------------------------------------------------------------------


### <ins/>Lancer le jeu :

```sh
cd gow-olympic-edition-jojo

# Start the game locally
npm run dev
```


--------------------------------------------------------------------------------


### Lien vers la vidéo (trailer du jeu) :
https://youtu.be/4Yc9bS60HdU
