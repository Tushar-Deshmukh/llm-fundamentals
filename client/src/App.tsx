import { useState, type FormEvent } from "react";
import { sendChatRequest } from "./services/llmService";

function App() {
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful assistant",
  );
  const [prompt, setPrompt] = useState("Explain embeddings");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    setError("");
    setResponse("");

    try {
      const result = await sendChatRequest({ prompt, systemPrompt });
      setResponse(result.data.response);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 sm:py-16">
      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-9">
        <header className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Prompt playground
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            LLM Playground
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Shape your prompt and see what the model says.
          </p>
        </header>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-800"
              htmlFor="system-prompt"
            >
              System prompt
            </label>
            <textarea
              className="min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              id="system-prompt"
              onChange={(event) => setSystemPrompt(event.target.value)}
              placeholder="Set instructions for the assistant..."
              value={systemPrompt}
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-slate-800"
              htmlFor="user-prompt"
            >
              User prompt
            </label>
            <textarea
              className="min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              id="user-prompt"
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="What would you like to ask?"
              required
              value={prompt}
            />
          </div>

          <div className="flex justify-center pt-1">
            <button
              className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSending || !prompt.trim()}
              type="submit"
            >
              {isSending && (
                <span
                  aria-hidden="true"
                  className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
              )}
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>

        <section
          aria-live="polite"
          className="mt-9 border-t border-slate-100 pt-6"
        >
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            Response
          </h2>
          <div className="min-h-28 rounded-xl bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
            {error ? (
              <p className="text-rose-600">{error}</p>
            ) : response ? (
              <p className="whitespace-pre-wrap">{response}</p>
            ) : isSending ? (
              <p className="text-slate-400">Waiting for the response...</p>
            ) : (
              <p className="text-slate-400">Your response will appear here.</p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

export default App;
