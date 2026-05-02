# VS Code Extensions — Movie Night

## Installées (hors projet)

Ces extensions sont installées **en local** (côté Windows) et fonctionnent dans tous les contextes, y compris WSL.

| Extension | ID | Résumé |
|---|---|---|
| GitHub Theme | `GitHub.github-vscode-theme` | Thème visuel officiel GitHub |
| One Dark Pro | `zhuangtongfa.material-theme` | Thème visuel inspiré d'Atom |
| WSL | `ms-vscode-remote.remote-wsl` | Bridge entre VS Code Windows et l'environnement Linux WSL |
| Rainbow CSV | `mechatroner.rainbow-csv` | Coloration syntaxique des fichiers CSV colonne par colonne |

---

## Recommandées pour ce projet

### WSL: Ubuntu-24.04 (language servers, linters, formatters)

| Extension | ID | Résumé |
|---|---|---|
| Vue - Official | `Vue.volar` | **Indispensable.** Intellisense, TypeScript et autocomplétion dans les fichiers `.vue`. Gère les auto-imports Nuxt (composables, composants). |
| Prettier | `esbenp.prettier-vscode` | Formatage automatique à la sauvegarde pour `.vue`, `.ts` et `.css`. Élimine les débats de style. |
| ESLint | `dbaeumer.vscode-eslint` | Détection d'erreurs de logique et mauvaises pratiques en temps réel. Prêt à l'emploi dès qu'un `eslint.config.js` est ajouté. |
| CSS Variable Autocomplete | `vunguyentuan.vscode-css-variables` | Propose en autocomplétion toutes les custom properties `var(--...)` définies dans `main.css`. |

| Error Lens | `usernamehw.errorlens` | **Indispensable.** Affiche les erreurs et warnings TypeScript directement en fin de ligne, sans survol. |
| GitLens | `eamodio.gitlens` | **Indispensable.** Git blame inline, historique par fichier, comparaison de branches. |
| Thunder Client | `rangav.vscode-thunder-client` | Client REST intégré pour tester les routes Nitro (`server/`) et déboguer les appels TMDB/Supabase. |

### Local (coloration syntaxique, UI uniquement)

| Extension | ID | Résumé |
|---|---|---|
| Auto Rename Tag | `formulahendry.auto-rename-tag` | Renomme automatiquement la balise fermante quand on modifie la balise ouvrante dans les templates Vue. Installée en local car purement UI — fonctionne correctement en WSL. |
| DotENV | `mikestead.dotenv` | Coloration syntaxique pour les fichiers `.env` (clés Supabase, token TMDB). Installée en local car purement UI — fonctionne correctement en WSL. |

---

## Notes

- **TypeScript** : support natif VS Code (`vscode.typescript-language-features`), rien à installer pour les `.ts`
- **Vetur** (`octref.vetur`) : ancienne extension Vue 2 — ne pas installer, incompatible avec Vue 3
- Le fichier `extensions.json` dans ce dossier déclenche une notification de recommandation à l'ouverture du projet
