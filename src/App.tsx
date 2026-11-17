
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import AboutUs from "./pages/About";
import Projects from "./pages/Projects";
import Clients from "./pages/Clients";
import ContactUs from "./pages/Contact";
import Footer from "./components/Footer";
import { useHeadingEffects } from "./lib/headingEffects";
import ProjectDetail from "./pages/ProjectDetail";

function App() {
  useHeadingEffects();
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/contact" element={<ContactUs />} />
      </Routes>
      <Footer />
    </BrowserRouter>
    
  );
}

export default App;
