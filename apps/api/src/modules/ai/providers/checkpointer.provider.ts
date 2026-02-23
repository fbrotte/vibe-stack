import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'

/**
 * Cree un checkpointer PostgreSQL pour LangGraph
 * Utilise un schema separe "langgraph" pour isoler les tables de Prisma
 */
export const createCheckpointer = async (databaseUrl: string): Promise<PostgresSaver> => {
  const checkpointer = PostgresSaver.fromConnString(databaseUrl, {
    schema: 'langgraph',
  })
  await checkpointer.setup()
  return checkpointer
}
