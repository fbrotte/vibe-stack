import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

export const createCheckpointer = async (
  databaseUrl: string,
): Promise<PostgresSaver> => {
  const checkpointer = PostgresSaver.fromConnString(databaseUrl);
  await checkpointer.setup();
  return checkpointer;
};
