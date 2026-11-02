
# FOODY MINIARDISE

## Product Vision & Technical Specification

**Nom du produit :** FOODY Miniardise
**Type :** E-commerce de boissons artisanales et mini-pâtisseries
**Marché cible :** Côte d'Ivoire – Abidjan
**Stack :** Next.js + FastAPI + PostgreSQL
**Authentification :** WhatsApp OTP

---

# 1. VISION DU PROJET

FOODY Miniardise est une boutique en ligne spécialisée dans la vente de jus artisanaux, de boissons naturelles et de petites pâtisseries.

La marque souhaite proposer une expérience d'achat moderne, élégante, intuitive et immersive.

L'objectif est de transformer une activité familiale de miniardise en une véritable marque commerciale disposant de sa propre boutique numérique.

FOODY doit transmettre trois valeurs :

- Fraîcheur.
- Qualité artisanale.
- Gourmandise et plaisir.

Le site doit être suffisamment professionnel pour accompagner la croissance de la marque et l'ajout futur de nouveaux produits.

# 2. IDENTITÉ VISUELLE

## Direction artistique

Créer une interface premium, lumineuse, minimaliste et chaleureuse.

L'identité graphique doit être basée sur le blanc, le jaune clair et les nuances crème.

### Palette de couleurs

| Couleur      | Code    | Utilisation              |
| ------------ | ------- | ------------------------ |
| Blanc crème | #FFFDF5 | Fond principal           |
| Jaune pastel | #FDE9A8 | Sections secondaires     |
| Jaune soleil | #F4C94E | Boutons et accents       |
| Jaune doux   | #FFF6D9 | Cartes et arrière-plans |
| Brun profond | #493D26 | Titres                   |
| Gris doux    | #888888 | Textes secondaires       |

### Typographie

Utiliser une typographie moderne et arrondie :

- Poppins pour les titres.
- Inter pour les textes.
- Graisses 400, 500, 600 et 700.

### Principes UI

- Coins arrondis.
- Ombres discrètes.
- Espaces généreux.
- Animations fluides.
- Icônes minimalistes.
- Images de produits de haute qualité.
- Responsive design mobile-first.

Éviter les interfaces surchargées, les dégradés excessifs et les animations inutiles.

# 3. EXPÉRIENCE 3D

La 3D constitue un élément distinctif de FOODY.

Elle doit renforcer l'expérience commerciale sans ralentir le site.

### Technologies

- Three.js.
- React Three Fiber.
- @react-three/drei.
- Framer Motion.

### Éléments 3D

Créer une scène principale présentant :

- Une bouteille de jus de bissap.
- Une bouteille de jus de citron.
- Des citrons frais.
- Des fleurs d'hibiscus.
- Des glaçons.
- Des mini-cakes.

### Animations

- Rotation légère des bouteilles.
- Objets flottants.
- Apparition progressive des éléments.
- Interactions au survol.
- Animations au défilement.

### Contraintes

- Modèles 3D au format GLB/GLTF.
- Chargement différé des scènes.
- Compression des modèles.
- Fallback en image statique sur les appareils peu performants.
- Respect de prefers-reduced-motion.

La 3D ne doit jamais empêcher un utilisateur de consulter les produits ou de passer commande.

# 4. STRUCTURE DU SITE

## 4.1 Page d'accueil

Route : `/`

Sections :

1. Navbar FOODY.
2. Hero section immersive avec scène 3D.
3. Présentation de la marque.
4. Catégories de produits.
5. Produits populaires.
6. Section promotionnelle.
7. Présentation du savoir-faire artisanal.
8. Témoignages clients.
9. Call-to-action.
10. Footer.

Hero :

Titre principal :

« Une petite douceur pour illuminer votre journée. »

Description :

« Découvrez nos jus frais et nos gourmandises préparés avec amour. »

Boutons :

- Découvrir nos produits.
- Commander maintenant.

## 4.2 Boutique

Route : `/boutique`

Fonctionnalités :

- Affichage de tous les produits.
- Filtrage par catégorie.
- Recherche de produits.
- Tri par prix.
- Filtre disponibilité.
- Cartes produits.
- Ajout rapide au panier.

Catégories initiales :

- Jus de bissap.
- Jus de citron.
- Autres boissons.
- Mini-cakes.
- Coffrets gourmands.

## 4.3 Détails du produit

Route : `/produit/[slug]`

Afficher :

- Galerie d'images.
- Nom du produit.
- Description.
- Prix en FCFA.
- Disponibilité.
- Composition.
- Volume ou quantité.
- Variantes éventuelles.
- Quantité souhaitée.
- Bouton Ajouter au panier.

Prévoir une visionneuse 3D lorsque le produit possède un modèle disponible.

## 4.4 Panier

Route : `/panier`

Fonctionnalités :

- Liste des produits.
- Modification des quantités.
- Suppression d'un produit.
- Calcul du sous-total.
- Frais de livraison.
- Total en FCFA.
- Bouton Continuer la commande.

## 4.5 Authentification

Route : `/auth`

L'authentification repose sur WhatsApp OTP.

Parcours :

1. Saisie du numéro WhatsApp.
2. Demande de code OTP.
3. Réception du code.
4. Vérification du code.
5. Création ou récupération du compte.
6. Redirection vers la commande.

Ne jamais exposer les secrets OTP côté frontend.

## 4.6 Commande

Route : `/checkout`

Informations :

- Nom du client.
- Numéro WhatsApp.
- Adresse de livraison.
- Commune.
- Instructions de livraison.
- Mode de récupération : livraison ou retrait.
- Récapitulatif de commande.

Le client doit pouvoir confirmer sa commande.

Prévoir les statuts :

- En attente.
- Confirmée.
- En préparation.
- Prête.
- En livraison.
- Livrée.
- Annulée.

Le paiement pourra être effectué à la livraison ou par Mobile Money selon les moyens activés.

## 4.7 Compte client

Route : `/mon-compte`

Fonctionnalités :

- Profil.
- Numéro WhatsApp.
- Historique des commandes.
- Détails des commandes.
- Statut des commandes.

# 5. ESPACE ADMINISTRATION

Route : `/admin`

L'administration doit être protégée par des permissions spécifiques.

### Dashboard

Afficher :

- Nombre de commandes.
- Chiffre d'affaires.
- Commandes en attente.
- Produits disponibles.
- Produits les plus vendus.

### Gestion des produits

- Ajouter un produit.
- Modifier un produit.
- Supprimer un produit.
- Gérer les images.
- Gérer les prix.
- Gérer les catégories.
- Gérer les stocks.
- Activer ou désactiver un produit.

### Gestion des commandes

- Consulter les commandes.
- Voir les informations clients.
- Modifier le statut.
- Consulter les détails.
- Filtrer par période.
- Suivre les ventes.

# 6. ARCHITECTURE TECHNIQUE

## Frontend

- Next.js.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Framer Motion.
- React Three Fiber.
- Zustand pour le panier si nécessaire.
- TanStack Query pour les requêtes API.

Architecture indicative :

```text
frontend/
├── app/
│   ├── page.tsx
│   ├── boutique/
│   ├── produit/[slug]/
│   ├── panier/
│   ├── checkout/
│   ├── auth/
│   ├── mon-compte/
│   └── admin/
├── components/
│   ├── layout/
│   ├── ui/
│   ├── products/
│   ├── cart/
│   ├── checkout/
│   └── 3d/
├── hooks/
├── lib/
├── services/
├── store/
├── types/
└── public/
    ├── images/
    └── models/
```

## Backend

- FastAPI.
- Pydantic.
- SQLAlchemy.
- Alembic.
- PostgreSQL.
- JWT ou sessions sécurisées.

Architecture indicative :

```text
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── auth/
│   │       ├── products/
│   │       ├── categories/
│   │       ├── orders/
│   │       ├── customers/
│   │       └── admin/
│   ├── core/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── repositories/
│   ├── db/
│   └── main.py
├── alembic/
├── tests/
└── pyproject.toml
```

# 7. MODÈLE DE DONNÉES

Entités principales :

### User

- id
- full_name
- whatsapp_number
- role
- is_active
- created_at

### Category

- id
- name
- slug
- description
- image_url
- is_active

### Product

- id
- category_id
- name
- slug
- description
- price
- stock
- image_url
- model_3d_url
- volume
- ingredients
- is_available
- created_at

### Order

- id
- user_id
- order_number
- subtotal
- delivery_fee
- total
- delivery_address
- delivery_commune
- delivery_method
- payment_method
- payment_status
- status
- notes
- created_at

### OrderItem

- id
- order_id
- product_id
- quantity
- unit_price
- subtotal

Les prix sont stockés en nombres entiers représentant les FCFA.

Les prix et quantités doivent être recalculés et validés côté backend au moment de la commande.

# 8. API REST

Préfixe : `/api/v1`

### Produits

```http
GET    /products
GET    /products/{slug}
POST   /products
PATCH  /products/{id}
DELETE /products/{id}
```

### Catégories

```http
GET    /categories
POST   /categories
PATCH  /categories/{id}
```

### Authentification

```http
POST /auth/whatsapp/request-otp
POST /auth/whatsapp/verify-otp
GET  /auth/me
POST /auth/logout
```

Réutiliser le système WhatsApp OTP déjà existant.

### Commandes

```http
POST  /orders
GET   /orders/me
GET   /orders/{id}
GET   /admin/orders
PATCH /admin/orders/{id}/status
```

# 9. SÉCURITÉ

- Validation stricte des données.
- Protection des routes administrateur.
- Contrôle des permissions.
- Vérification OTP côté backend.
- Limitation des tentatives OTP.
- Protection contre les commandes avec prix falsifiés.
- Calcul des montants côté serveur.
- Vérification des stocks avant confirmation.
- Validation des transitions de statut.
- Protection CORS.
- Gestion sécurisée des tokens.
- Journalisation des opérations sensibles.

# 10. EXPÉRIENCE MOBILE

Le mobile est prioritaire.

La boutique doit être parfaitement utilisable depuis un smartphone.

Exigences :

- Navigation simple.
- Images optimisées.
- Boutons suffisamment grands.
- Panier facilement accessible.
- Checkout rapide.
- Chargement progressif des ressources 3D.
- Possibilité de commander sans devoir explorer toute la scène 3D.

# 11. STRATÉGIE DE DÉVELOPPEMENT

Construire FOODY progressivement.

### Phase 1 — Identité et interface

- Design system.
- Logo et branding.
- Navbar.
- Hero section.
- Boutique.
- Cartes produits.
- Responsive design.

### Phase 2 — Expérience 3D

- Scène principale.
- Modèles 3D.
- Animations.
- Interactions.

### Phase 3 — Backend

- Produits.
- Catégories.
- Authentification WhatsApp.
- Gestion des clients.
- Commandes.

### Phase 4 — E-commerce

- Panier.
- Checkout.
- Livraison.
- Confirmation de commande.

### Phase 5 — Administration

- Dashboard.
- Gestion des produits.
- Gestion des stocks.
- Gestion des commandes.

### Phase 6 — Production

- Tests.
- Optimisation.
- SEO.
- Déploiement.
- Monitoring.

# 12. PRINCIPES NON NÉGOCIABLES

1. Ne pas créer une interface générique de template e-commerce.
2. Respecter strictement l'identité blanche et jaune de FOODY.
3. Donner une sensation premium et artisanale.
4. La 3D doit être réellement interactive lorsqu'elle est proposée.
5. Ne pas sacrifier les performances au profit des animations.
6. Prioriser la conversion commerciale.
7. Ne pas reconstruire les services FastAPI et WhatsApp déjà existants sans nécessité.
8. Éviter les fonctionnalités inutiles dans le MVP.
9. Tous les montants doivent être en FCFA.
10. Le site doit être entièrement responsive.

---

# OBJECTIF FINAL

Construire une boutique e-commerce FOODY Miniardise moderne, immersive et professionnelle, capable de présenter les produits artisanaux, recevoir des commandes et accompagner le développement d'une marque familiale de boissons et de gourmandises en Côte d'Ivoire.
