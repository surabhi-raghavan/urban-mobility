// src/App.jsx
import TopBar from "./components/layout/TopBar";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh" }}>
      <TopBar />
      <Dashboard />
    </div>
  );
}

export default App;