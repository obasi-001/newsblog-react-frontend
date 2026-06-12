import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Sports from "./pages/Sports";
import Crime from "./pages/Crime";
import Politics from "./pages/Politics";
import World from "./pages/World";
import Entertainment from "./pages/Entertainment";
import Business from "./pages/Business";
import Technology from "./pages/Technology";
import Education from "./pages/Education";
import Health from "./pages/Health";
import Environment from "./pages/Environment";
import ArticleDetail from "./pages/ArticleDetail";
import VideosHome from "./pages/VideosHome";
import VideoDetail from "./pages/VideoDetail";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import ResetPasswordConfirm from "./pages/ResetPasswordConfirm";
import Logout from "./pages/Logout";
import VerifyEmail from "./pages/VerifyEmail";
import SiteControls from "./components/SiteControls";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sports" element={<Sports />} />
        <Route path="/sports/:sportSlug" element={<Sports />} />
        <Route path="/crime" element={<Crime />} />
        <Route path="/politics" element={<Politics />} />
        <Route path="/world" element={<World />} />
        <Route path="/entertainment" element={<Entertainment />} />
        <Route path="/business" element={<Business />} />
        <Route path="/technology" element={<Technology />} />
        <Route path="/education" element={<Education />} />
        <Route path="/health" element={<Health />} />
        <Route path="/environment" element={<Environment />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ResetPassword />} />
        <Route path="/reset-password/:uidb64/:token" element={<ResetPasswordConfirm />} />
        <Route path="/password-reset/:uidb64/:token" element={<ResetPasswordConfirm />} />
        <Route path="/auth/reset-password/:uidb64/:token" element={<ResetPasswordConfirm />} />
        <Route path="/verify/:uidb64/:token" element={<VerifyEmail />} />
        <Route path="/verify-email/:uidb64/:token" element={<VerifyEmail />} />
        <Route path="/auth/verify/:uidb64/:token" element={<VerifyEmail />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/articles/:articleId" element={<ArticleDetail />} />
        <Route path="/videos" element={<VideosHome />} />
        <Route path="/videos/:videoSlug" element={<VideoDetail />} />
      </Routes>

      <SiteControls />
    </>
  );
}

export default App;
