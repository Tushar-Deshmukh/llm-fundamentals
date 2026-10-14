import { useEffect, useRef, useState, type FormEvent } from "react";
import { streamChatResponse } from "./services/llmService";

const textareaClasses =
  "w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100";

function App() {
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful assistant",
  );
  const [prompt, setPrompt] = useState("Explain embeddings");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [useSystemPrompt, setUseSystemPrompt] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [status, setStatus] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!prompt.trim() || isStreaming) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setResponse("");
    setError("");
    setStatus("Generating response...");
    setIsStreaming(true);

    try {
      await streamChatResponse({
        prompt: prompt.trim(),
        systemPrompt: useSystemPrompt ? systemPrompt : undefined,
        signal: controller.signal,
        onDelta: (text) => {
          setResponse((previous) => previous + text);
        },
      });

      setStatus("Response completed.");
    } catch (err) {
      if (controller.signal.aborted) {
        setStatus("Response cancelled.");
      } else {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred.",
        );
        setStatus("Response failed.");
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }

      setIsStreaming(false);
    }
  }

  function handleCancel() {
    abortControllerRef.current?.abort();
  }

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Stream response
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 sm:py-16">
      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-9">
        <header className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Streaming playground
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            LLM Playground
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Send a prompt and watch the response arrive as it is generated.
          </p>
        </header>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-800"
              htmlFor="prompt"
            >
              User prompt
            </label>
            <textarea
              className={`${textareaClasses} min-h-28`}
              id="prompt"
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="What would you like to ask?"
              required
              value={prompt}
            />
          </div>

          <div className="space-y-4">
            <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-slate-700">
              <input
                checked={useSystemPrompt}
                className="size-4 rounded border-slate-300 accent-indigo-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
                onChange={(event) => setUseSystemPrompt(event.target.checked)}
                type="checkbox"
              />
              Use a system prompt
            </label>

            {useSystemPrompt && (
              <div>
                <label
                  className="mb-2 block text-sm font-medium text-slate-800"
                  htmlFor="system-prompt"
                >
                  System prompt
                </label>
                <textarea
                  className={`${textareaClasses} min-h-24`}
                  id="system-prompt"
                  onChange={(event) => setSystemPrompt(event.target.value)}
                  placeholder="Set instructions for the assistant..."
                  value={systemPrompt}
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <button
              className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isStreaming || !prompt.trim()}
              type="submit"
            >
              {isStreaming && (
                <span
                  aria-hidden="true"
                  className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
              )}
              {isStreaming ? "Generating..." : "Generate response"}
            </button>

            {isStreaming && (
              <button
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
                onClick={handleCancel}
                type="button"
              >
                Stop generation
              </button>
            )}
          </div>
        </form>

        <section
          aria-busy={isStreaming}
          aria-live="polite"
          className="mt-9 border-t border-slate-100 pt-6"
        >
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            Response
          </h2>
          <div className="min-h-28 overflow-x-auto rounded-xl bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
            {error ? (
              <p className="text-rose-600">{error}</p>
            ) : response ? (
              <p className="whitespace-pre-wrap">{response}</p>
            ) : isStreaming ? (
              <p className="text-slate-400">Waiting for text...</p>
            ) : (
              <p className="text-slate-400">
                Your streamed response will appear here.
              </p>
            )}
          </div>
        </section>

        {status && (
          <p className="mt-4 text-center text-sm text-slate-500" role="status">
            {status}
          </p>
        )}
      </section>
    </main>
  );
}

export default App;
