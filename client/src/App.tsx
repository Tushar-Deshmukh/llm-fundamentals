import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Checking backend...");

  useEffect(() => {
    fetch("http://localhost:5000/health")
      .then((response) => response.json())
      .then((data) => {
        setMessage(data.message);
      })
      .catch(() => {
        setMessage("Backend connection failed");
      });
  }, []);

  return (
    <div>
      <h1>LLM Playground</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;