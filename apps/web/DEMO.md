# Mode Démo

Ce système permet de créer des démos interactives pour présenter une application à un client, avec des fausses données et des interactions simulées.

## Activation

1. Créer un fichier `.env` dans `apps/web/` :

```env
VITE_DEMO_MODE=true
```

2. Lancer l'app :

```bash
cd apps/web
bun run dev
```

L'app démarre sans backend, avec le `DemoProvider` à la place de tRPC.

## Structure des fichiers

```
apps/web/src/demo/
├── config.ts        # Configuration et délais
├── data.ts          # Fausses données du projet
├── hooks.ts         # Hooks utilitaires
├── DemoProvider.tsx # État global de la démo
└── index.ts         # Exports
```

## Comment créer une démo

### 1. Définir les données mockées

Dans `demo/data.ts`, ajoute tes types et données :

```typescript
// Types
export interface Project {
  id: string
  name: string
  status: 'draft' | 'active' | 'completed'
}

// Données
export const projects: Project[] = [
  { id: '1', name: 'Projet Alpha', status: 'active' },
  { id: '2', name: 'Projet Beta', status: 'draft' },
]
```

### 2. Étendre le DemoProvider si nécessaire

Dans `demo/DemoProvider.tsx`, ajoute les états et actions nécessaires :

```typescript
interface DemoState {
  user: DemoUser | null
  isAuthenticated: boolean
  // Ajouter ici
  projects: Project[]
  selectedProject: Project | null
}

const initialState: DemoState = {
  user: null,
  isAuthenticated: false,
  projects: projects, // import depuis data.ts
  selectedProject: null,
}
```

### 3. Créer les pages de démo

Les pages utilisent les hooks démo au lieu de tRPC :

```typescript
import { useDemo, useDemoMutation } from '@/demo'

function ProjectsPage() {
  const { projects, updateState } = useDemo()

  // Simule l'ajout d'un projet avec délai
  const addProject = useDemoMutation(
    (name: string) => {
      const newProject = { id: generateId(), name, status: 'draft' }
      updateState('projects', [...projects, newProject])
      return newProject
    },
    { delay: 'medium' }
  )

  return (
    <div>
      <button
        onClick={() => addProject.mutate('Nouveau projet')}
        disabled={addProject.isLoading}
      >
        {addProject.isLoading ? 'Création...' : 'Ajouter'}
      </button>

      {projects.map(p => <ProjectCard key={p.id} project={p} />)}
    </div>
  )
}
```

## Hooks disponibles

### `useDemo()`

Accès à l'état global de la démo.

```typescript
const {
  user, // Utilisateur connecté
  isAuthenticated, // true/false
  login, // Connecte l'utilisateur démo
  logout, // Déconnecte
  updateState, // Met à jour n'importe quel état
  reset, // Remet tout à zéro
} = useDemo()
```

### `useDemoMutation(handler, options?)`

Simule une action avec délai (création, modification, suppression).

```typescript
const save = useDemoMutation(
  (data) => {
    // Logique de mise à jour
    return updatedData
  },
  {
    delay: 'medium',  // 'short' (300ms), 'medium' (800ms), 'long' (1500ms)
    onSuccess: (result) => console.log('Saved:', result)
  }
)

// Utilisation
<button onClick={() => save.mutate(formData)} disabled={save.isLoading}>
  {save.isLoading ? 'Enregistrement...' : 'Enregistrer'}
</button>
```

### `useDemoQuery(fetcher, options?)`

Simule un chargement de données au mount.

```typescript
const { data, isLoading, refetch } = useDemoQuery(
  () => projects.filter(p => p.status === 'active'),
  { delay: 'short' }
)

if (isLoading) return <Spinner />
return <ProjectList projects={data} />
```

### `useDemoFlow(steps, options?)`

Gère un flow linéaire (wizard, tutoriel).

```typescript
const {
  currentStep, // Étape actuelle
  next, // Passer à l'étape suivante
  previous, // Revenir
  progress, // Pourcentage (0-100)
  isLast, // true si dernière étape
} = useDemoFlow(['info', 'form', 'confirm', 'done'])

// currentStep = 'info'
// next() → currentStep = 'form'
```

### `useDemoTypewriter(text, options?)`

Effet "machine à écrire" pour remplir un champ automatiquement.

```typescript
const { displayedText, isComplete } = useDemoTypewriter(
  'Ceci est un exemple de texte qui s\'écrit tout seul',
  { speed: 50, startDelay: 500 }
)

<input value={displayedText} readOnly />
```

### `useDemoAutoAction(action, options?)`

Déclenche une action après un délai.

```typescript
useDemoAutoAction(() => updateState('showModal', true), {
  delay: 2000,
  enabled: currentStep === 'intro',
})
```

## Délais configurables

Dans `demo/config.ts` :

```typescript
export const DEMO_DELAYS = {
  short: 300, // Chargement rapide
  medium: 800, // Action utilisateur
  long: 1500, // Opération lourde
}
```

## Pattern recommandé pour les pages

```typescript
import { DEMO_MODE, useDemo, useDemoMutation } from '@/demo'
import { trpc } from '@/lib/trpc'

function MyPage() {
  // Mode démo : utilise le contexte démo
  if (DEMO_MODE) {
    return <MyPageDemo />
  }

  // Mode normal : utilise tRPC
  return <MyPageReal />
}

function MyPageDemo() {
  const { data, updateState } = useDemo()
  // ... logique démo
}

function MyPageReal() {
  const { data } = trpc.myRouter.myQuery.useQuery()
  // ... logique réelle
}
```

## Transition vers la production

Quand le client signe et qu'on veut passer en mode réel (avec backend) :

### Étape 1 : Désactiver le mode démo

Supprimer `VITE_DEMO_MODE=true` du fichier `.env` (ou mettre `false`).

### Étape 2 : Convertir les pages

Chaque page démo doit être convertie pour utiliser tRPC au lieu des hooks démo.

**Avant (mode démo) :**

```typescript
import { useDemo, useDemoMutation } from '@/demo'

function ProjectsPage() {
  const { projects, updateState } = useDemo()

  const addProject = useDemoMutation((name: string) => {
    const newProject = { id: generateId(), name, status: 'draft' }
    updateState('projects', [...projects, newProject])
    return newProject
  })

  return (
    <div>
      <button onClick={() => addProject.mutate('Test')}>Ajouter</button>
      {projects.map(p => <ProjectCard key={p.id} project={p} />)}
    </div>
  )
}
```

**Après (mode production) :**

```typescript
import { trpc } from '@/lib/trpc'

function ProjectsPage() {
  const { data: projects } = trpc.projects.list.useQuery()
  const addProject = trpc.projects.create.useMutation()

  return (
    <div>
      <button onClick={() => addProject.mutate({ name: 'Test' })}>Ajouter</button>
      {projects?.map(p => <ProjectCard key={p.id} project={p} />)}
    </div>
  )
}
```

### Étape 3 : Ce qu'il faut garder vs supprimer

| Garder                                  | Supprimer                                 |
| --------------------------------------- | ----------------------------------------- |
| Composants UI (boutons, cards, layouts) | Imports de `@/demo`                       |
| Styles et classes Tailwind              | Appels à `useDemo()`, `useDemoMutation()` |
| Structure des pages                     | Fausses données dans `demo/data.ts`       |
| Navigation et routes                    | États locaux spécifiques à la démo        |

### Étape 4 : Nettoyage (optionnel)

Si le dossier `demo/` n'est plus utilisé :

```bash
rm -rf apps/web/src/demo/
```

Et retirer les imports/références dans `main.tsx` et `App.tsx`.

### Checklist de conversion

Pour chaque page :

- [ ] Remplacer `useDemo()` par les queries tRPC appropriées
- [ ] Remplacer `useDemoMutation()` par les mutations tRPC
- [ ] Remplacer `updateState()` par l'invalidation de cache tRPC (`utils.xxx.invalidate()`)
- [ ] Vérifier que les types correspondent (Zod schemas dans `packages/shared`)
- [ ] Tester avec le backend lancé (`make dev`)

## Exemple complet

Voir le prompt initial du projet pour un exemple de flow complet avec :

- Écrans listés
- Interactions décrites
- Données mockées définies
