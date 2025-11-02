# Unraid Docker Modern Cards (Plugin)

Ce projet transforme votre script Tampermonkey en un plugin Unraid qui remplace l’affichage en table des conteneurs Docker par des cartes modernes.

## Contenu
- `plugin/*.plg` — fichier d’installation du plugin (format Unraid)
- `plugin/usr/local/emhttp/plugins/unraid-docker-modern-cards/` — payload installé sur le serveur
  - `include/docker.cards.include.php` — injecte JS/CSS sur la page Docker
  - `javascript/docker.cards.js` — logique DOM pour construire les cartes
  - `css/docker.cards.css` — styles des cartes

## Installation
1. Zippez le dossier `plugin/` ou poussez le `.plg` sur une URL HTTP(S) accessible.
2. Dans Unraid: Plugins > Install Plugin
   - Collez l’URL du `.plg` ou uploadez le fichier.
3. Rechargez l’onglet Docker.

## Désinstallation
- Plugins > Installed > Unraid Docker Modern Cards > Remove

## Compatibilité
- Testé avec Unraid 6.12+ (DOM susceptible d’évoluer). Le plugin embarque des garde‑fous.

## Développement local
- Modifiez les fichiers JS/CSS/PHP puis réinstallez le plugin ou copiez-les vers `/usr/local/emhttp/plugins/unraid-docker-modern-cards/` pour tester.

## Support
- Ce plugin n’est pas officiel. Ouvrez une issue dans ce repo pour toute question.
