declare module "openai" {
  interface EmbeddingResponseDataItem {
    embedding: number[];
  }

  interface EmbeddingResponse {
    data: EmbeddingResponseDataItem[];
  }

  interface ChatCompletionChoice {
    message?: { content?: string };
  }

  interface ChatCompletionResponse {
    choices: ChatCompletionChoice[];
  }

  interface EmbeddingCreateParams {
    model: string;
    input: string | string[];
  }

  interface ChatCompletionCreateParams {
    model: string;
    temperature?: number;
    messages: Array<{ role: string; content: string }>;
  }

  class OpenAI {
    constructor(config: { apiKey?: string });

    embeddings: {
      create(params: EmbeddingCreateParams): Promise<EmbeddingResponse>;
    };

    chat: {
      completions: {
        create(params: ChatCompletionCreateParams): Promise<ChatCompletionResponse>;
      };
    };
  }

  export default OpenAI;
}
