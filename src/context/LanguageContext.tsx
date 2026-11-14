import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Text as NativeText,
    TextInput as NativeTextInput,
    StyleSheet,
    TextInputProps,
    TextProps,
    TextStyle,
    ActivityIndicator,
    Modal,
    TouchableOpacity,
    View,
} from 'react-native';

export type Language = 'en' | 'fr';

const LANGUAGE_STORAGE_KEY = '@zone-de-papy/language';

const frenchTranslations: Record<string, string> = {
    'Search electronics, brands, and more...': 'Rechercher des appareils électroniques, des marques et plus...',
    'Dismiss error': "Fermer le message d’erreur",
    'Select Currency': 'Choisir la devise',
    'View more': 'Voir plus',
    'Filters & Refinements': 'Filtres et options',
    'Product Type': 'Type de produit',
    Color: 'Couleur',
    'Product type': 'Type de produit',
    'Electronics Category': 'Catégorie électronique',
    'ALL PRODUCTS': 'TOUS LES PRODUITS',
    SMARTPHONES: 'SMARTPHONES',
    COMPUTERS: 'ORDINATEURS',
    AUDIO: 'AUDIO',
    ACCESSORIES: 'ACCESSOIRES',
    GAMING: 'JEUX VIDÉO',
    'Shop by electronics category': 'Acheter par catégorie électronique',
    'Discover useful technology for work, play, and everyday life.': 'Découvrez des appareils pratiques pour le travail, les loisirs et le quotidien.',
    'Technology for every day': 'La technologie au quotidien',
    'Explore smartphones, computers, audio, and accessories selected for you.': 'Découvrez notre sélection de smartphones, ordinateurs, produits audio et accessoires.',
    'Shop smartphones': 'Voir les smartphones',
    'Shop computers': 'Voir les ordinateurs',
    'Shop audio': 'Voir les produits audio',
    'Shop accessories': 'Voir les accessoires',
    'Computers': 'Ordinateurs',
    Smartphones: 'Smartphones',
    Audio: 'Audio',
    Accessories: 'Accessoires',
    'Headphones & Audio': 'Casques et audio',
    'Tablets & Laptops': 'Tablettes et ordinateurs',
    'Smart accessories': 'Accessoires connectés',
    'Explore our electronics and find your next favorite device.': 'Découvrez nos appareils électroniques et trouvez votre prochain favori.',
    'Technical Specifications': 'Caractéristiques techniques',
    Smartphone: 'Smartphone',
    Laptop: 'Ordinateur portable',
    Headphones: 'Casque audio',
    Smartwatch: 'Montre connectée',
    Tablet: 'Tablette',
    Speaker: 'Enceinte',
    Camera: 'Appareil photo',
    Gaming: 'Jeux vidéo',
    'Nova X Pro Smartphone': 'Smartphone Nova X Pro',
    'AirBook 14 Laptop': 'Ordinateur AirBook 14',
    'Studio Wireless Headphones': 'Casque sans fil Studio',
    'Pulse Smartwatch': 'Montre connectée Pulse',
    'Vision 11 Tablet': 'Tablette Vision 11',
    'Boom Portable Bluetooth Speaker': 'Enceinte Bluetooth portable Boom',
    'Capture 4K Digital Camera': 'Appareil photo numérique Capture 4K',
    'NextPlay Wireless Controller': 'Manette sans fil NextPlay',
    'Black': 'Noir',
    'Silver': 'Argent',
    'Blue': 'Bleu',
    'Space Gray': 'Gris sidéral',
    'White': 'Blanc',
    'Gray': 'Gris',
    'Red': 'Rouge',
    Accessory: 'Accessoire',
    Electronics: 'Électronique',
    'A powerful smartphone with a vivid display, pro-grade camera system, and all-day battery life.': 'Un smartphone puissant doté d’un écran lumineux, d’un appareil photo avancé et d’une batterie longue durée.',
    'A light, fast laptop designed for work, study, and creative projects on the go.': 'Un ordinateur portable léger et rapide, conçu pour travailler, étudier et créer partout.',
    'Enjoy immersive sound and comfortable listening with wireless noise isolation.': 'Profitez d’un son immersif et d’un confort d’écoute avec réduction de bruit sans fil.',
    'Track your activity, check notifications, and stay connected from your wrist.': 'Suivez votre activité, consultez vos notifications et restez connecté depuis votre poignet.',
    'A versatile tablet for video, reading, and productivity with a bright, spacious display.': 'Une tablette polyvalente pour regarder des vidéos, lire et travailler, avec un grand écran lumineux.',
    'Take your music anywhere with room-filling sound in a compact, portable speaker.': 'Emportez votre musique partout avec cette enceinte portable compacte au son puissant.',
    'Capture detailed photos and smooth video with a compact camera made for everyday adventures.': 'Prenez des photos détaillées et des vidéos fluides avec cet appareil compact conçu pour le quotidien.',
    'A responsive wireless controller with comfortable grips for gaming at home or on the go.': 'Une manette sans fil réactive et confortable pour jouer chez vous ou en déplacement.',
    '256 GB storage • 6.7-inch OLED display • 5G • 50 MP camera • USB-C fast charging': 'Stockage 256 Go • Écran OLED 6,7 pouces • 5G • Appareil photo 50 Mpx • Recharge rapide USB-C',
    '14-inch display • 16 GB RAM • 512 GB SSD • Wi-Fi 6 • Up to 15-hour battery': 'Écran 14 pouces • 16 Go de RAM • SSD 512 Go • Wi-Fi 6 • Jusqu’à 15 heures d’autonomie',
    'Bluetooth 5.3 • Active noise cancellation • 30-hour battery • Built-in microphone': 'Bluetooth 5.3 • Réduction active du bruit • 30 heures d’autonomie • Micro intégré',
    '1.8-inch touchscreen • Heart-rate tracking • Water resistant • 7-day battery': 'Écran tactile 1,8 pouce • Suivi du rythme cardiaque • Résistance à l’eau • 7 jours d’autonomie',
    '11-inch display • 128 GB storage • Wi-Fi • USB-C • All-day battery': 'Écran 11 pouces • Stockage 128 Go • Wi-Fi • USB-C • Batterie longue durée',
    'Bluetooth 5.2 • 12-hour battery • Water resistant • USB-C charging': 'Bluetooth 5.2 • 12 heures d’autonomie • Résistance à l’eau • Recharge USB-C',
    '24 MP sensor • 4K video • Wi-Fi • Rechargeable battery • SD card compatible': 'Capteur 24 Mpx • Vidéo 4K • Wi-Fi • Batterie rechargeable • Compatible carte SD',
    'Bluetooth wireless • Rechargeable • Ergonomic grip • USB-C charging': 'Bluetooth sans fil • Rechargeable • Prise ergonomique • Recharge USB-C',
    'Reset All': 'Tout réinitialiser',
    'Apply Filters': 'Appliquer les filtres',
    'No products found': 'Aucun produit trouvé',
    'Try clearing some filters or changing your search criteria.': 'Essayez de supprimer des filtres ou de modifier votre recherche.',
    'ZONE DE PAPY FLASH SALE:': 'VENTE FLASH ZONE DE PAPY :',
    '20% OFF': '20 % DE RÉDUCTION',
    'ENDS IN:': 'SE TERMINE DANS :',
    'With code: 20100': 'Avec le code : 20100',
    'Search by Order ID or Customer Name...': 'Rechercher par numéro de commande ou nom du client...',
    'No orders match the selected filter.': 'Aucune commande ne correspond au filtre sélectionné.',
    'Customer Details': 'Coordonnées du client',
    'Delivery Address (Leaflet Map Pin)': 'Adresse de livraison (carte)',
    'Total Amount': 'Montant total',
    'ADD NEW PRODUCT': 'AJOUTER UN PRODUIT',
    'Active Promo Coupons': 'Codes promo actifs',
    'Enter new code (e.g. SUMMER50)': 'Saisir un nouveau code (ex. SUMMER50)',
    'CREATE COUPON': 'CRÉER UN CODE PROMO',
    ACTIVE: 'ACTIF',
    'Add New Catalog Product': 'Ajouter un produit au catalogue',
    'Product Title': 'Nom du produit',
    Brand: 'Marque',
    'Price ($ USD)': 'Prix (USD $)',
    'Image URL': 'URL de l’image',
    'PUBLISH TO CATALOG': 'PUBLIER DANS LE CATALOGUE',
    'ZONE DE PAPY ADMIN PANEL': 'ESPACE ADMIN ZONE DE PAPY',
    'Operations & Fulfillment Center': 'Gestion des opérations et commandes',
    'VIEW CUSTOMER SHOP': 'VOIR LA BOUTIQUE',
    'Total Revenue': 'Chiffre d’affaires total',
    'this month': 'ce mois-ci',
    'Total Orders': 'Commandes totales',
    '2 pending delivery': '2 livraisons en attente',
    'Active Catalog': 'Catalogue actif',
    'In stock & available': 'En stock et disponible',
    'Promo Coupons': 'Codes promo',
    'Code: 20100, SALE20': 'Codes : 20100, SALE20',
    'Subtotal': 'Sous-total',
    'Order Summary': 'Récapitulatif de la commande',
    'Try code: 20100': 'Essayez le code : 20100',
    APPLY: 'APPLIQUER',
    'Estimated Total': 'Total estimé',
    'PROCEED TO CHECKOUT': 'PASSER AU PAIEMENT',
    'Continue Shopping': 'Continuer mes achats',
    'Shopping Bag': 'Panier',
    'Your bag is empty': 'Votre panier est vide',
    'SHOP NOW': 'ACHETER',
    'Promo Discount ($20 OFF)': 'Réduction promo (20 $)',
    Shipping: 'Livraison',
    'Paiement express': 'Paiement express',
    'Retour au panier': 'Retour au panier',
    'Adresse de livraison': 'Adresse de livraison',
    'Nom complet': 'Nom complet',
    'Ex: Kofi Mensah': 'Ex. : Kofi Mensah',
    Adresse: 'Adresse',
    'Rue, quartier...': 'Rue, quartier...',
    Ville: 'Ville',
    'Code postal': 'Code postal',
    'Téléphone de livraison': 'Téléphone de livraison',
    'Mode de paiement': 'Mode de paiement',
    'Numéro Mobile Money': 'Numéro Mobile Money',
    'Numéro de carte': 'Numéro de carte',
    "Date d'expiration": "Date d’expiration",
    'CVV / CVC': 'CVV / CVC',
    Récapitulatif: 'Récapitulatif',
    'Sous-total': 'Sous-total',
    'Réduction promo': 'Réduction promo',
    'Équivalent XOF': 'Équivalent en FCFA',
    'Saisis un numéro Togo valide de 8 chiffres pour recevoir la demande de paiement.': 'Saisissez un numéro togolais valide de 8 chiffres pour recevoir la demande de paiement.',
    'CONNEXION PAYDUNYA...': 'CONNEXION À PAYDUNYA...',
    'TRAITEMENT...': 'TRAITEMENT...',
    'CONFIRMER LA COMMANDE': 'CONFIRMER LA COMMANDE',
    'VALIDER LA COMMANDE': 'VALIDER LA COMMANDE',
    'Thank you for your order!': 'Merci pour votre commande !',
    'Order Status Tracker': 'Suivi de la commande',
    'Total Paid': 'Total payé',
    'CONTINUE SHOPPING': 'CONTINUER MES ACHATS',
    'No active order found.': 'Aucune commande en cours.',
    'RETURN TO SHOP': 'RETOURNER À LA BOUTIQUE',
    'Your wishlist is empty': 'Votre liste de souhaits est vide',
    'DISCOVER CATALOG': 'DÉCOUVRIR LE CATALOGUE',
    'VIP MEMBER': 'MEMBRE VIP',
    'LOG OUT': 'SE DÉCONNECTER',
    'Account Details & Overview': 'Informations et aperçu du compte',
    'Full Name': 'Nom complet',
    Email: 'E-mail',
    'Member Since': 'Membre depuis',
    'Reward Points': 'Points de fidélité',
    '1,450 PAPY Points ⭐': '1 450 points PAPY ⭐',
    'EXPLORE NEW ARRIVALS': 'DÉCOUVRIR LES NOUVEAUTÉS',
    'Order History & Live Tracking': 'Historique et suivi des commandes',
    'No orders placed yet.': 'Vous n’avez pas encore passé de commande.',
    'TRACK ORDER': 'SUIVRE LA COMMANDE',
    'Saved Shipping Address': 'Adresse de livraison enregistrée',
    'Recipient Name': 'Nom du destinataire',
    'Street Address': 'Adresse',
    City: 'Ville',
    'Postal Code': 'Code postal',
    Phone: 'Téléphone',
    'App Preferences & Language': 'Préférences et langue',
    'Display Language / Langue': 'Langue d’affichage',
    'Select your preferred interface language': 'Choisissez la langue de l’interface',
    'Customer Reviews & Ratings': 'Avis et notes des clients',
    'Based on': 'Basé sur',
    reviews: 'avis',
    'CANCEL REVIEW': 'ANNULER L’AVIS',
    'WRITE A VERIFIED REVIEW': 'ÉCRIRE UN AVIS VÉRIFIÉ',
    'Share your feedback with Zone de Papy buyers': 'Partagez votre avis avec les clients Zone de Papy',
    'Your Name': 'Votre nom',
    'Select Rating': 'Choisir une note',
    'Review Comment': 'Votre avis',
    'SUBMIT REVIEW': 'ENVOYER L’AVIS',
    'Verified Buyer': 'Acheteur vérifié',
    'No product selected.': 'Aucun produit sélectionné.',
    'Return to Shop': 'Retour à la boutique',
    'BUY IT NOW': 'ACHETER MAINTENANT',
    'ADD TO BAG': 'AJOUTER AU PANIER',
    'ADDED TO BAG ✓': 'AJOUTÉ AU PANIER ✓',
    'Product Description': 'Description du produit',
    'Free Delivery & 30-Day Returns': 'Livraison gratuite et retours sous 30 jours',
    'You Might Also Like': 'Vous aimerez aussi',
    'Pin exact location on Leaflet Map': 'Indiquer l’emplacement exact sur la carte',
    'Leaflet Address Location Picker': 'Choisir une adresse sur la carte',
    'Search street, city or postal code...': 'Rechercher une rue, une ville ou un code postal...',
    'Quick Presets:': 'Adresses rapides :',
    'CONFIRM PIN LOCATION': 'CONFIRMER L’EMPLACEMENT',
    'Always Zone de Papy': 'Toujours Zone de Papy',
    'Learn More': 'En savoir plus',
    'IT ALWAYS WILL BE': 'ET CE, POUR TOUJOURS',
    EXCLUSIVE: 'EXCLUSIF',
    Rewards: 'Récompenses',
    'FLX Members get exclusive savings and rewards.': 'Les membres FLX profitent d’offres et de récompenses exclusives.',
    'Learn more about FLX': 'En savoir plus sur FLX',
    'Join FLX for Free': 'Rejoindre FLX gratuitement',
    'LOG IN': 'SE CONNECTER',
    'CREATE ACCOUNT': 'CRÉER UN COMPTE',
    'OR WITH EMAIL': 'OU PAR E-MAIL',
    'Email Address': 'Adresse e-mail',
    'e.g. Alex Morgan': 'Ex. : Alex Morgan',
    'alex.morgan@gmail.com': 'alex.morgan@gmail.com',
    'Based on ': 'Basé sur ',
    SALE: 'PROMO',
    '$20 OFF $100 PLUS,': '20 $ DE RÉDUCTION DÈS 100 $,',
    'GET FREE NEXT-DAY DELIVERY': 'LIVRAISON GRATUITE LE LENDEMAIN',
    'CODE APPLIED ✓': 'CODE APPLIQUÉ ✓',
    EXPLORE: 'DÉCOUVRIR',
    ADMIN: 'ADMIN',
    Password: 'Mot de passe',
    'e.g. Sarah B.': 'Ex. : Sarah B.',
    'What did you love about the fit, fabric, or style?': 'Qu’avez-vous aimé dans le design, les matériaux ou le style ?',
    'NEW IN': 'NOUVEAUTÉ',
    'Choose delivery location': 'Choisir le lieu de livraison',
    'Search an address or move the map pin': 'Rechercher une adresse ou déplacer le repère',
    'Street, city or postal code': 'Rue, ville ou code postal',
    'Tap the map or drag the pin to adjust your delivery point.': 'Touchez la carte ou déplacez le repère pour ajuster le lieu de livraison.',
    'Finding address...': 'Recherche de l’adresse...',
    'Confirm this location': 'Confirmer ce lieu',
    'Close map': 'Fermer la carte',
    'Search address': 'Rechercher une adresse',
    'Use my current location': 'Utiliser ma position actuelle',
    'September 2026': 'Septembre 2026',
    '+18.4% this month': '+18,4 % ce mois-ci',
    'e.g. Wireless headphones': 'Ex. : Casque sans fil',
    'e.g. Smartphone, Laptop, Speaker': 'Ex. : Smartphone, ordinateur, enceinte',
    'Storage, connectivity, battery...': 'Stockage, connectivité, batterie...',
    'NEW ARRIVALS': 'NOUVEAUTÉS',
    'Price: Low-High': 'Prix : croissant',
    'Price: High-Low': 'Prix : décroissant',
    'Top Rated': 'Mieux notés',
    'Newest Arrivals': 'Nouveautés',
    Sort: 'Trier',
    'Product type:': 'Type de produit :',
    Colour: 'Couleur',
    'Price Range': 'Fourchette de prix',
    'Reset Filters': 'Réinitialiser les filtres',
    'All products': 'Tous les produits',
    'Code': 'Code',
    'Code applied': 'Code appliqué',
    'Promo discount': 'Réduction promotionnelle',
    'Promo Discount': 'Réduction promotionnelle',
    'Promo Code / Gift Voucher': 'Code promo / bon cadeau',
    'FREE Express': 'Express gratuit',
    'Free Express Delivery on orders over': 'Livraison express gratuite dès',
    'Standard delivery 2-4 business days.': 'Livraison standard sous 2 à 4 jours ouvrés.',
    'Code applied successfully': 'Code appliqué avec succès',
    'Invalid coupon code. Try code: PAPY20': 'Code promo invalide. Essayez le code : PAPY20',
    'discount applied!': 'de réduction appliquée !',
    'OFF ORDERS OVER': 'DE RÉDUCTION DÈS',
    'PLUS,': 'ET',
    '20% OFF ALL ITEMS': 'DES RÉDUCTIONS SUR LA BOUTIQUE',
    'CLAIM PAPY20': 'UTILISER PAPY20',
    'CLAIMED ✓': 'CODE UTILISÉ ✓',
    'REVIEW': 'AVIS',
    'review': 'avis',
    'Helpful': 'Utile',
    'Saved Wishlist': 'Liste de souhaits',
    'Order Placed': 'Commande passée',
    'Received & Confirmed': 'Reçue et confirmée',
    Processing: 'En préparation',
    'Preparing package': 'Préparation du colis',
    'Out for Delivery': 'En cours de livraison',
    'Courier on the way': 'Le livreur est en route',
    Delivered: 'Livrée',
    'Est: Tomorrow 5 PM': 'Prévue : demain à 17 h',
    'Order Items': 'Articles commandés',
    'Payment Method': 'Mode de paiement',
    'Mobile Money recommended in Togo 🇹🇬': 'Paiement Mobile Money recommandé au Togo 🇹🇬',
    'Selected payment method': 'Mode de paiement sélectionné',
    'PAPY Points': 'Points PAPY',
    'La boutique': 'Shop',
    'Tous les produits': 'All products',
    'Mon espace': 'My account',
    'Mon compte': 'My account',
    'Mes favoris': 'My wishlist',
    'Mon panier': 'My cart',
    'Une sélection technologique pour le quotidien': 'Thoughtfully selected technology for everyday life',
    'Paiement mobile simple et sécurisé': 'Simple and secure mobile payment',
    'Suivi de commande depuis votre compte': 'Track your order from your account',
    'Des produits technologiques soigneusement sélectionnés pour simplifier votre quotidien.': 'Technology products carefully selected to make everyday life easier.',
    'Tous droits réservés.': 'All rights reserved.',
    'Accueil Zone de Papy': 'Zone de Papy home',
    'Mini USB LED Light': 'Mini lampe LED USB',
    'A compact USB-powered LED light for a desk, laptop, or power bank.': 'Une mini lampe LED USB compacte pour bureau, ordinateur portable ou batterie externe.',
    'USB powered • Low energy LED • Compact portable design': 'Alimentation USB • LED basse consommation • Format portable compact',
    'Contact Us': 'Contactez-nous',
    'Order Status': 'Statut de commande',
    'Shipping Info': 'Infos livraison',
    'Store Pickup': 'Retrait en magasin',
    'Returns-Exchanges': 'Retours et échanges',
    Help: 'Aide',
    'MY PROFILE': 'MON PROFIL',
    'ADDRESSES': 'ADRESSES',
    'SETTINGS': 'PARAMÈTRES',
    'Maximum price:': 'Prix maximum :',
    'SAVE ADDRESS': 'ENREGISTRER L’ADRESSE',
    'SAVING...': 'ENREGISTREMENT...',
    'Phone:': 'Téléphone :',
    'Welcome Back!': 'Bon retour !',
    'Create Your Account': 'Créer votre compte',
    'Continue with Google': 'Continuer avec Google',
    'Sign up with Google': 'S’inscrire avec Google',
    'Please fill in all required fields.': 'Veuillez remplir tous les champs obligatoires.',
    'Please enter your full name.': 'Veuillez saisir votre nom complet.',
    'Check your email to confirm your account, then log in.': 'Vérifiez vos e-mails pour confirmer votre compte, puis connectez-vous.',
    'Order #': 'Commande n°',
    'Estimated Delivery:': 'Livraison estimée :',
    'Tap the heart icon on any product to save it here for later!': 'Touchez le cœur sur un produit pour l’enregistrer ici !',
};

const englishTranslations: Record<string, string> = {
    'ESPACE PRIVÉ EXCLUSIF': 'EXCLUSIVE PRIVATE AREA',
    'Votre abonnement est actif.': 'Your subscription is active.',
    'Un paiement PayDunya est en attente de vérification.': 'A PayDunya payment is pending verification.',
    'Vérification de l’accès...': 'Checking access...',
    'Reprendre mes vidéos': 'Continue watching',
    'Vérifier mon paiement': 'Check my payment',
    'Payer et accéder • 50 $ / mois': 'Pay and get access • $50 / month',
    'Accès 30 jours après confirmation • TMoney, Flooz': '30-day access after payment confirmation • TMoney, Flooz',
    'Votre code d’accès': 'Your access code',
    Copier: 'Copy',
    Télécharger: 'Download',
    'Vous avez un code d’accès ?': 'Have an access code?',
    'Saisissez votre code': 'Enter your code',
    'Activer mon code': 'Activate my code',
    'Accès Immédiat': 'Instant access',
    'Impossible de vérifier votre accès enregistré.': 'Unable to verify your saved access.',
    'Saisissez votre code d’accès.': 'Enter your access code.',
    'Ce code est invalide, expiré ou déjà utilisé sur un autre appareil.': 'This code is invalid, expired, or already used on another device.',
    'Impossible de vérifier le code. Vérifiez votre connexion et réessayez.': 'Unable to verify the code. Check your connection and try again.',
    'Code copié.': 'Code copied.',
    'Impossible de copier le code.': 'Unable to copy the code.',
    'Impossible de télécharger le code sur cet appareil.': 'Unable to download the code on this device.',
    'Impossible de reprendre la vérification du paiement.': 'Unable to resume payment verification.',
    'Impossible de vérifier le paiement auprès de PayDunya.': 'Unable to verify the payment with PayDunya.',
    'Le paiement est confirmé, mais le code d’accès n’a pas été retourné.': 'Payment is confirmed, but no access code was returned.',
    'Le paiement a été annulé sur votre téléphone ou le délai a expiré.': 'The payment was cancelled on your phone or has expired.',
    'Erreur lors de l’envoi de la demande de paiement PayDunya.': 'Unable to send the PayDunya payment request.',
    "Erreur lors de l'envoi de la demande de paiement PayDunya.": 'Unable to send the PayDunya payment request.',
    'PayDunya n’a pas retourné de référence de paiement valide.': 'PayDunya did not return a valid payment reference.',
    'Une erreur est survenue lors de l’initiation du paiement.': 'An error occurred while starting the payment.',
    "Une erreur est survenue lors de l'initiation du paiement.": 'An error occurred while starting the payment.',
    'Fichier du code préparé.': 'Access code file is ready.',
    'Impossible de télécharger le code.': 'Unable to download the code.',
    'Retour à l’accueil': 'Back to home',
    "Retour à l'accueil": 'Back to home',
    Payer: 'Pay',
    Renouveler: 'Renew',
    'Paiement 100% Sécurisé': '100% secure payment',
    'ABONNEMENT MENSUEL ILLIMITÉ': 'UNLIMITED MONTHLY SUBSCRIPTION',
    'Accès Intégral aux Vidéos': 'Full access to videos',
    'Valable 30 jours • Sans engagement': 'Valid for 30 days • No commitment',
    '/ mois': '/ month',
    'Soit': 'Only',
    'FCFA par mois': 'CFA francs per month',
    '1. Choisissez votre pays': '1. Choose your country',
    'Sénégal': 'Senegal',
    'Bénin': 'Benin',
    "Côte d'Ivoire": 'Côte d’Ivoire',
    'Wave Sénégal': 'Wave Senegal',
    '2. Choisissez votre opérateur Mobile Money': '2. Choose your Mobile Money provider',
    'Votre numéro de téléphone': 'Your phone number',
    'Une demande PayDunya sera envoyée sur votre mobile. L’accès sera ouvert uniquement après confirmation du paiement.': 'A PayDunya request will be sent to your phone. Access is granted only after payment is confirmed.',
    'Validation en cours...': 'Processing...',
    'Payer 50 $': 'Pay $50',
    'Validation sur votre Mobile': 'Confirm on your phone',
    'est en attente. Validez-la sur le téléphone utilisé pour le paiement.': 'is pending. Approve it on the phone used for payment.',
    'Confirmez avec votre code PIN secret sur votre téléphone pour finaliser l’opération.': 'Enter your PIN on your phone to complete the payment.',
    'Vérification du paiement...': 'Checking payment...',
    'En attente de votre code PIN...': 'Waiting for your PIN...',
    'J’ai validé mon code PIN, vérifier': 'I approved it with my PIN — check payment',
    'Annuler ou changer de numéro': 'Cancel or change phone number',
    'Paiement confirmé !': 'Payment confirmed!',
    'Votre code d’accès personnel est activé sur cet appareil.': 'Your personal access code is activated on this device.',
    'Accéder aux vidéos': 'Go to videos',
    'Le code reçu est expiré ou sa date de validité est invalide.': 'The code received has expired or has an invalid expiry date.',
    'Le paiement est confirmé, mais le code n’a pas pu être activé sur cet appareil.': 'Payment is confirmed, but the code could not be activated on this device.',
    'Temps d’accès écoulé !': 'Your access has expired!',
    "Temps d'accès écoulé !": 'Your access has expired!',
    'Votre abonnement mensuel de 30 jours est arrivé à expiration. Renouvelez votre pass pour continuer à visionner.': 'Your 30-day subscription has expired. Renew your pass to keep watching.',
    'Renouveler mon abonnement': 'Renew subscription',
    'Quitter vers l’accueil': 'Back to home',
    "Quitter vers l'accueil": 'Back to home',
    'ZONE VIDÉO PRIVÉE': 'PRIVATE VIDEO AREA',
    'Abonnement 50 $ / mois :': 'Subscription: $50 / month',
    'FLUX SÉCURISÉ & CHIFFRÉ': 'SECURE & ENCRYPTED STREAM',
    'Vidéos Exclusives': 'Exclusive videos',
    'Grille interactive en format portrait (9:16). Les serveurs d’encodage sont en cours de mise à jour.': 'Interactive portrait video grid (9:16). Video encoding servers are currently being updated.',
    "Grille interactive en format portrait (9:16). Les serveurs d'encodage sont en cours de mise à jour.": 'Interactive portrait video grid (9:16). Video encoding servers are currently being updated.',
    'Contenu Privé #02': 'Private content #02',
    'Archive Spéciale #06': 'Special archive #06',
    'Séance Complète #09': 'Full session #09',
    EXCLUSIF: 'EXCLUSIVE',
    ULTIME: 'ULTIMATE',
    'Vidéo indisponible': 'Video unavailable',
    'En maintenance': 'Under maintenance',
    'Abonnement VIP Actif :': 'Active VIP subscription:',
    'Accès illimité aux vidéos': 'Unlimited video access',
    'pendant toute la durée de validité de votre pass.': 'for the full duration of your pass.',
    'Zone de Papy • Espace Vidéo VIP': 'Zone de Papy • VIP video area',
    'Vidéos privées et confidentielles • Droits réservés aux membres VIP': 'Private, confidential videos • For VIP members only',
    'Retourner à la boutique': 'Back to shop',
    'Verrouiller la session': 'Lock session',
    'Adresse de livraison': 'Delivery address',
    'Nom complet': 'Full name',
    Adresse: 'Address',
    'Rue, quartier...': 'Street, neighborhood...',
    Ville: 'City',
    'Code postal': 'Postal code',
    'Téléphone de livraison': 'Delivery phone',
    'Mode de paiement': 'Payment method',
    'Paiement mobile money recommandé au Togo 🇹🇬': 'Mobile Money is recommended in Togo 🇹🇬',
    'Numéro Mobile Money': 'Mobile Money number',
    'Numéro de carte': 'Card number',
    Récapitulatif: 'Order summary',
    'Sous-total': 'Subtotal',
    'Réduction promo': 'Promo discount',
    'Retour au panier': 'Back to cart',
    'Paiement express': 'Express checkout',
    Livraison: 'Delivery',
    Paiement: 'Payment',
    'Remplis ton nom, ton adresse, ta ville et ton téléphone pour continuer.': 'Enter your name, address, city, and phone number to continue.',
    'Saisis un numéro Togo valide de 8 chiffres pour recevoir la demande de paiement.': 'Enter a valid 8-digit Togo number to receive the payment request.',
    'Erreur PayDunya. Veuillez réessayer.': 'PayDunya error. Please try again.',
    'PAYER VIA': 'PAY WITH',
    'GRATUIT Express': 'FREE Express',
    'La sélection technologique pour le quotidien': 'Technology selected for everyday life',
    'Paiement mobile simple et sécurisé': 'Simple and secure mobile payment',
    'Suivi de commande depuis votre compte': 'Track your orders from your account',
    'Des produits technologiques soigneusement sélectionnés pour simplifier votre quotidien.': 'Technology products carefully selected to make everyday life easier.',
    'La technologie, en toute simplicité.': 'Technology, made simple.',
    'La boutique': 'Shop',
    'Tous les produits': 'Shop all',
    'Mon espace': 'My account',
    'Mon compte': 'My account',
    'Mes favoris': 'My wishlist',
    'Mon panier': 'My cart',
    'Tous droits réservés.': 'All rights reserved.',
    'Accueil Zone de Papy': 'Zone de Papy home',
};

interface LanguageContextValue {
    language: Language;
    setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('en');
    const [languageReady, setLanguageReady] = useState(false);
    const [showLanguagePrompt, setShowLanguagePrompt] = useState(false);

    useEffect(() => {
        let mounted = true;
        AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
            .then((savedLanguage) => {
                if (!mounted) return;
                if (savedLanguage === 'en' || savedLanguage === 'fr') {
                    setLanguageState(savedLanguage);
                } else {
                    setShowLanguagePrompt(true);
                }
                setLanguageReady(true);
            })
            .catch((error: unknown) => {
                console.error('Unable to load saved language preference.', error);
                if (mounted) {
                    setShowLanguagePrompt(true);
                    setLanguageReady(true);
                }
            });
        return () => {
            mounted = false;
        };
    }, []);

    const setLanguage = (nextLanguage: Language) => {
        setLanguageState(nextLanguage);
        setShowLanguagePrompt(false);
        AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage).catch((error: unknown) => {
            console.error('Unable to save language preference.', error);
        });
    };

    const value = useMemo(() => ({ language, setLanguage }), [language]);
    return (
        <LanguageContext.Provider value={value}>
            {children}
            <Modal
                visible={!languageReady || showLanguagePrompt}
                transparent
                animationType="fade"
                onRequestClose={() => undefined}
            >
                <View style={languagePromptStyles.overlay}>
                    <View style={languagePromptStyles.card}>
                        {!languageReady ? (
                            <ActivityIndicator size="large" color="#a78bfa" />
                        ) : (
                            <>
                                <NativeText style={languagePromptStyles.title}>Choose your language</NativeText>
                                <NativeText style={languagePromptStyles.subtitle}>Choisissez votre langue</NativeText>
                                <TouchableOpacity
                                    accessibilityRole="button"
                                    style={languagePromptStyles.languageButton}
                                    onPress={() => setLanguage('en')}
                                >
                                    <NativeText style={languagePromptStyles.languageButtonText}>English</NativeText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    accessibilityRole="button"
                                    style={[languagePromptStyles.languageButton, languagePromptStyles.secondaryButton]}
                                    onPress={() => setLanguage('fr')}
                                >
                                    <NativeText style={languagePromptStyles.languageButtonText}>Français</NativeText>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </LanguageContext.Provider>
    );
};

const languagePromptStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(2, 6, 23, 0.88)',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        alignItems: 'center',
        backgroundColor: '#111827',
        borderColor: 'rgba(167, 139, 250, 0.45)',
        borderWidth: 1,
        borderRadius: 20,
        padding: 28,
    },
    title: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
    },
    subtitle: {
        color: '#cbd5e1',
        fontSize: 16,
        marginTop: 6,
        marginBottom: 22,
    },
    languageButton: {
        width: '100%',
        alignItems: 'center',
        backgroundColor: '#6366f1',
        borderRadius: 12,
        paddingVertical: 14,
        marginTop: 10,
    },
    secondaryButton: {
        backgroundColor: '#334155',
    },
    languageButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});

export const useLanguage = (): LanguageContextValue => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const translateText = (text: string, language: Language): string => {
    const leadingWhitespace = text.match(/^\s*/)?.[0] || '';
    const trailingWhitespace = text.match(/\s*$/)?.[0] || '';
    const content = text.trim();
    const translated = language === 'fr'
        ? frenchTranslations[content]
        : englishTranslations[content];
    return `${leadingWhitespace}${translated || content}${trailingWhitespace}`;
};

const translateChildren = (children: React.ReactNode, language: Language): React.ReactNode => {
    if (typeof children === 'string') return translateText(children, language);
    if (Array.isArray(children)) {
        return children.map((child, index) => (
            <React.Fragment key={index}>{translateChildren(child, language)}</React.Fragment>
        ));
    }
    return children;
};

const montserratFontByWeight: Record<string, string> = {
    '400': 'Montserrat_400Regular',
    '500': 'Montserrat_500Medium',
    '600': 'Montserrat_600SemiBold',
    '700': 'Montserrat_700Bold',
    '800': 'Montserrat_800ExtraBold',
    '900': 'Montserrat_900Black',
    normal: 'Montserrat_400Regular',
    bold: 'Montserrat_700Bold',
};

const getMontserratFont = (fontWeight: TextStyle['fontWeight']): string =>
    montserratFontByWeight[String(fontWeight)] || 'Montserrat_400Regular';

export const LocalizedText: React.FC<TextProps> = ({ children, ...props }) => {
    const { language } = useLanguage();
    return (
        <NativeText
            {...props}
            style={[{ fontFamily: getMontserratFont(StyleSheet.flatten(props.style)?.fontWeight) }, props.style]}
        >
            {translateChildren(children, language)}
        </NativeText>
    );
};

export const LocalizedTextInput: React.FC<TextInputProps> = ({ placeholder, ...props }) => {
    const { language } = useLanguage();
    return (
        <NativeTextInput
            {...props}
            style={[{ fontFamily: getMontserratFont(StyleSheet.flatten(props.style)?.fontWeight) }, props.style]}
            placeholder={typeof placeholder === 'string' ? translateText(placeholder, language) : placeholder}
        />
    );
};
