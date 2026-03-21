---
paths:
  - 'apps/api/src/modules/sse/**'
  - 'apps/web/src/stores/sse.store.ts'
  - 'apps/web/src/hooks/useSseEvent*'
  - 'apps/web/src/hooks/useEntityInvalidation*'
  - 'packages/shared/src/schemas/sse.schema.ts'
---

- Evenements custom en snake_case, toujours types dans sse.schema.ts (discriminatedUnion)
- Ne pas emettre manuellement pour les operations Prisma basiques (le middleware le fait via PrismaService.onMutation)
- Ajouter les nouveaux types d'evenements dans SseEventSchema (discriminatedUnion dans packages/shared)
- Mapping entity->router dans useEntityInvalidation.ts pour chaque nouveau module tRPC
- useSseEvent() pour ecouter des evenements custom dans les composants
- @Inject() explicite sur tous les parametres constructeur dans le backend
