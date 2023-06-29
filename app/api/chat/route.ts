
import { LangChainStream, OpenAIStream, StreamingTextResponse, Message } from 'ai'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { AIChatMessage, HumanChatMessage } from 'langchain/schema'
import { auth } from '@/auth'

export const runtime = 'edge'

export async function POST(req: Request) {
  const json = await req.json()
  const { messages, previewToken, previewBasePath } = json
  const userId = (await auth())?.user.id

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  const { stream, handlers } = LangChainStream();
  
  const llm = new ChatOpenAI({
    openAIApiKey: !previewToken ? process.env.OPENAI_API_KEY : previewToken,
    streaming: true,
    callbacks: [handlers]
  }, {
    basePath: !previewBasePath ? process.env.API_BASE_PATH : previewBasePath
  });

  llm.call(
    (messages as Message[]).map((m: Message) => {
      return m.role == 'user' ? new HumanChatMessage(m.content) : new AIChatMessage(m.content)
    }),
  ).catch(console.error)

  return new StreamingTextResponse(stream)
}
