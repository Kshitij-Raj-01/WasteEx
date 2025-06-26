import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WasteListing from './pages/WasteListing';
import MaterialRequest from './pages/MaterialRequest';
import Listings from './pages/Listings';
import Negotiations from './pages/Negotiations';
import Contracts from './pages/Contracts';
import Logistics from './pages/Logistics';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import WasteListingDetail from './pages/WasteListingDetails';
import ContractDetails from './pages/ContractDetails';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/waste-listing" element={<WasteListing />} />
            <Route path="/material-request" element={<MaterialRequest />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/listings/:id" element={<WasteListingDetail />} />
            <Route path="/negotiations" element={<Negotiations />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/contracts/:id" element={<ContractDetails />} />
            <Route path="/logistics" element={<Logistics />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<Notifications />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;