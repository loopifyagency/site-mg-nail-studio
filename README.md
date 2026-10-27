# MG Nail Studio : site vitrine

Site statique (HTML, CSS, JavaScript), sans étape de build. Prothésiste ongulaire à Brest, 230 Rue du Lanneuc.
Action principale : **prendre rendez-vous** (appel `tel:` ou SMS `sms:` au 07 82 87 72 77).

## Lancer en local

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

N’importe quel hébergement statique convient (GitHub Pages, Netlify, Vercel, OVH…) : déposer le dossier tel quel.

## Structure

```
index.html              page unique : contenu, SEO, données structurées LocalBusiness (NailSalon)
assets/css/style.css    design tokens (:root), sections, responsive, mouvement réduit
assets/js/main.js       animations (loader, parallax, pins, marquee, carrousel, nuancier…)
assets/img/             photos (jpg + webp), grain.png
assets/fonts/           Young Serif, Karla, La Belle Aurore (auto-hébergées, woff2 latin)
assets/vendor/          GSAP + ScrollTrigger + SplitText + DrawSVG, Lenis (versions fixes, en local)
```

## À compléter avant la mise en ligne

- **Tarifs** : chaque prestation affiche « Tarif sur demande » (étiquettes `.tag` dans la section `#prestations`). Remplacer par les vrais prix.
- **Prestations** : les 5 cartes (semi-permanent, pose gel & capsules, remplissage, nail art, mains & pieds) sont rédigées à partir du métier et des avis. À valider ou ajuster.
- **Chiffres** (section « chiffres ») : « 6 jours sur 7 », « 10 heures par jour en semaine » et « 100 % des avis lus recommandent » sont déduits des horaires et des 5 avis fournis. Ajouter des chiffres réels (années d’expérience, nombre de clientes) si disponibles.
- **Photos** : les 5 photos fournies font environ 200 × 300 px. Elles sont agrandies et étalonnées, mais restent douces sur grand écran. Les remplacer par les originaux haute résolution en gardant les mêmes noms de fichiers dans `assets/img/` (jpg + webp), et pour l’aperçu social ajouter une balise `og:image`.
- **Réseaux sociaux** : aucun lien fourni. Un emplacement est prévu en commentaire dans le pied de page.
- **Mentions légales / confidentialité** : non fournies, à ajouter (obligatoire en France).
- **Nom de domaine** : ajouter `<link rel="canonical">` et `url` dans les données structurées une fois le domaine connu.

## Horaires

Les horaires sont écrits à trois endroits : le tableau `.hours` du HTML, les données structurées JSON-LD (`<head>`) et l’objet `SCHEDULE` en tête de `assets/js/main.js` (qui pilote le badge « Ouvert maintenant » et la ligne « aujourd’hui »). Les modifier ensemble.

## Direction artistique

Voir [DESIGN.md](DESIGN.md).

## Accessibilité et performances

- `prefers-reduced-motion` : pas de loader, pas de défilement doux, pas de pins ; tout le contenu reste lisible.
- Sans JavaScript : le contenu est entièrement visible.
- Navigation clavier, lien d’évitement, focus visibles, éventail de teintes en `radiogroup`.
- Animations sur `transform` et `opacity` en priorité, images en `loading="lazy"` (sauf le hero), polices auto-hébergées.
