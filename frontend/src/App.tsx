import { Route, Routes } from "react-router-dom";
import { AnalyzerPage } from "./pages/AnalyzerPage";
import { AnalysisDetailsPage } from "./pages/AnalysisDetailsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<AnalyzerPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/analyses/:id" element={<AnalysisDetailsPage />} />
    </Routes>
  );
}

export default App;