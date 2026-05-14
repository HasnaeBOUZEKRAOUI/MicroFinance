# MicroFinance

MicroTrack est une solution logicielle conçue pour optimiser le cycle de vie du microcrédit. Elle agit comme une plateforme intelligente permettant de gérer l’enrôlement des prospects, l’octroi de crédits et le suivi du recouvrement.

---

# Table des matières

1. Description du projet
2. Fonctionnalités principales
3. Acteurs du système
4. Architecture technique
5. Installation et configuration
6. Structure du projet

---

# 1. Description du projet

Le projet vise à moderniser les institutions de microfinance en automatisant les processus de gestion des crédits et du suivi client.

MicroTrack permet :
- La gestion des prospects et clients
- Le suivi des demandes de crédit
- Le contrôle des remboursements
- La gestion des utilisateurs et des rôles
- L’analyse et le suivi des opérations financières

---

# 2. Fonctionnalités principales

## Gestion des Prospects
- Création des fiches clients
- Collecte des informations KYC
- Simulation des crédits

## Gestion des Clients
- Transformation prospect → client
- Consultation des informations clients
- Vision 360 du client

## Gestion des Crédits
- Création des demandes de crédit
- Validation des crédits
- Historique des opérations

## Suivi du Recouvrement
- Gestion des échéances
- Détection des retards
- Gestion des impayés

## Administration
- Gestion des comptes utilisateurs
- Gestion des rôles et permissions

---

# 3. Acteurs du système

## Agent de Crédit
- Création des prospects
- Gestion des clients
- Suivi des remboursements

## Manager
- Validation des demandes de crédit
- Consultation des statistiques

## Administrateur
- Gestion des utilisateurs
- Gestion des rôles
- Configuration du système

---

# 4. Architecture technique

## Frontend
- React JS
- Tailwind CSS
- React Router DOM
- Axios

## Backend
- Laravel
- Laravel Sanctum (authentification API)
- REST API

## Base de données
- MySQL

---

# 5. Installation et configuration

## Prérequis

- PHP >= 8.2
- Composer
- Node.js
- MySQL
- Git

---

# Cloner le projet

```bash
git clone https://github.com/HasnaeBOUZEKRAOUI/MicroFinance.git
```

---

# Configuration du Backend (Laravel)

## Accéder au dossier backend

```bash
cd backend
```

## Installer les dépendances

```bash
composer install
```

## Copier le fichier .env

```bash
cp .env.example .env
```

## Générer la clé Laravel

```bash
php artisan key:generate
```

## Configurer la base de données

Modifier le fichier `.env` :

```env
DB_DATABASE=microfinance
DB_USERNAME=root
DB_PASSWORD=
```

## Exécuter les migrations

```bash
php artisan migrate
```

## Lancer le serveur Laravel

```bash
php artisan serve
```

Le backend sera disponible sur :

```txt
http://127.0.0.1:8000
```

---

# Configuration du Frontend (React)

## Accéder au dossier frontend

```bash
cd frontend
```

## Installer les dépendances

```bash
npm install
```

## Installer React Router DOM

```bash
npm install react-router-dom
```

## Installer Axios

```bash
npm install axios
```

## Lancer l’application

```bash
npm run dev
```

Le frontend sera disponible sur :

```txt
http://localhost:5173
```

---

# 6. Structure du projet

```txt
MicroFinance/
│
├── backend/
│   ├── app/
│   ├── routes/
│   ├── database/
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   └── router/
│   └── ...
│
└── README.md
```

---

# API REST

## Exemple d’API

| Méthode | Endpoint | Description |
|----------|-----------|-------------|
| GET | /api/clients | Liste des clients |
| POST | /api/clients | Ajouter un client |
| PUT | /api/clients/{id} | Modifier un client |
| DELETE | /api/clients/{id} | Supprimer un client |

---

# Technologies utilisées

## Frontend
- React JS
- Tailwind CSS
- Axios
- React Router DOM

## Backend
- Laravel
- MySQL
- Laravel Sanctum

---

# Auteur

Projet réalisé par Hasnae Bouzekraoui.
