# MicroTrack

MicroTrack est une solution logicielle conçue pour optimiser le cycle de vie du microcrédit. Elle agit comme une extension intelligente du système PowerCARD, permettant de gérer l'enrôlement des prospects, l'octroi de crédits sécurisés par IA et le suivi rigoureux du recouvrement.

## Table des matières
1. Description du projet
2. Fonctionnalités principales
3. Acteurs du système
4. Architecture technique
5. Installation et configuration

## 1. Description du projet
Le projet vise à moderniser les institutions de microfinance en automatisant les processus de décision. MicroTrack réduit les risques opérationnels grâce à une évaluation précise des dossiers et offre une vision consolidée des données clients.

## 2. Fonctionnalités principales
- Gestion des Prospects : Création de fiches KYC et simulation de prêts.
- Gestion des Clients : Passage du statut prospect à client après décaissement et Vision 360.
- Scoring par Intelligence Artificielle : Analyse prédictive du risque de défaut lors de la simulation et de l'octroi.
- Suivi du Recouvrement : Monitoring des échéances, identification des retards et gestion des impayés.
- Transfert de Portefeuille : Réattribution fluide de clients entre agents de crédit.

## 3. Acteurs du système
- Agent de Crédit : Responsable de la prospection, des simulations et du suivi de terrain.
- Analyste de Risque : Valide les demandes de crédit en s'appuyant sur les scores fournis par l'IA.
- Caissier : Gère les flux financiers (décaissements et encaissements des remboursements).

## 4. Architecture technique
- Backend : Langage Java avec le framework Spring Boot.
- Frontend : Framework Angular pour une interface utilisateur réactive.
- Base de données : Intégration avec le système central PowerCARD (PostgreSQL/Oracle).
- Moteur IA : Service dédié à l'analyse de données historiques et au scoring.

## 5. Installation et configuration
### Prérequis
- Java JDK 17 ou supérieur
- Node.js et Angular CLI
- Maven

### Étapes
1. Cloner le dépôt : git clone https://github.com/HasnaeBOUZEKRAOUI/MicroFinance.git
2. Configuration du backend : 
   - Naviguer vers le dossier backend.
   - Modifier le fichier application.properties pour la connexion DB.
   - Exécuter : mvn clean install puis mvn spring-boot:run
3. Configuration du frontend :
   - Naviguer vers le dossier frontend.
   - Exécuter : npm install
   - Lancer l'application : ng serve
