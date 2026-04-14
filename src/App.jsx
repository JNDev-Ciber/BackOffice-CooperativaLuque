import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import CategoriesPage from "./pages/CategoriesPage";
import LoginPage from "./pages/LoginPage";
import NewsPage from "./pages/NewsPage";
import InternetPlansPage from "./pages/InternetPlansPage";
import ElectricityPlansPage from "./pages/ElectrityPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route
            index
            element={<Navigate to="/dashboard/categories" replace />}
          />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="internet" element={<InternetPlansPage />} />
          <Route path="electricidad" element={<ElectricityPlansPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
