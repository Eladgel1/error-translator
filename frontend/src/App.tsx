import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { AnalyzerPage } from "./pages/AnalyzerPage";
import { AnalysisDetailsPage } from "./pages/AnalysisDetailsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<AnalyzerPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/analyses/:id" element={<AnalysisDetailsPage />} />
      </Routes>
    </AppShell>
  );
}

export default App;
