# Direction artistique : MG Nail Studio

Monde visuel : un atelier rustique et chaleureux. Lin, kraft, fleurs de pampa séchées, points de couture.
Fil rouge : **l’arche** (la forme d’un ongle) et le **feston** (bord dentelle). Rose, blanc, beige imposés.

## Palette (`:root` dans `assets/css/style.css`)

| Token | Valeur | Rôle |
|---|---|---|
| `--lin` | `#FBF6EF` | fond principal, blanc lin |
| `--sable` | `#EBDDCB` | beige, fonds secondaires (prestations, galerie) |
| `--kraft` | `#D6BFA3` | beige foncé, étiquettes, ruban adhésif |
| `--rose-pale` | `#F4D9D1` | rose lait, fonds doux (avis) |
| `--rose` | `#E6B0A6` | rose poudré, aplats (marquee, CTA) |
| `--rose-deep` | `#94424E` | rose bois : texte accent, survol (5,3:1 sur lin) |
| `--ink` | `#3A2326` | cacao : texte et fonds sombres (13,5:1 sur lin) |
| `--ink-soft` | `#6A4A4B` | texte secondaire |
| `--neon` | `#FF8FB3` | l’enseigne du studio, uniquement dans le loader |

`--rose-deep` ne s’utilise pas en texte sur sable ou rose pâle (contraste insuffisant).

## Typographie

- **Young Serif** : titres, très grands (jusqu’à 8 rem), chiffres, nom géant du pied de page.
- **Karla** : texte courant, 18 px, interligne 1,6.
- **La Belle Aurore** : annotations manuscrites (« Une photo en tête ? », signatures des avis), toujours en grand corps.

## Motifs

- Arche : photos du hero, cadre du storytelling, tuiles de galerie, carte, tips de l’éventail, ongles des chiffres.
- Feston : bord haut du marquee, rideau du loader, bord haut du pied de page. Arcade : bord haut du storytelling. Dôme : bord haut de l’appel à l’action.
- Point de couture : traits en pointillés (avis, horaires, rail du storytelling, contour du hero).
- Pampa : tracés générés en JavaScript (graine fixe) : hero, storytelling, appel à l’action.
- Grain : `assets/img/grain.png`, posé une fois, opacité 0,5.

## Mouvement

Une mise en scène par section, jamais la même deux fois :
loader néon (DrawSVG) puis rideau festonné · hero (mots masqués, arches révélées, parallax multicouche, souris) ·
marquee réactif à la vitesse du scroll · storytelling pinné en 4 temps · prestations en défilement horizontal avec tilt 3D et reflet ·
éventail de teintes interactif · phrase à compteurs · galerie (masques cercle/rideau, image qui bouge dans son cadre) ·
pile de cartes postales (glisser) · numéro de téléphone et nom du pied de page qui réagissent au survol.

Courbes `expo.out` / `power3`, jamais linéaires. `prefers-reduced-motion` : version statique complète.

## À éviter

Cartes identiques icône + titre + texte, surtitres au-dessus des titres, dégradés sur texte, ombres dures,
verre dépoli décoratif, emoji ou glyphes à la place d’icônes (icônes SVG au tracé unique), polices par défaut.
