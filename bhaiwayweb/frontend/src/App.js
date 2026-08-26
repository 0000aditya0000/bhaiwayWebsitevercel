import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import axios from "axios";
import { submitWaitlistToGoogleSheet } from "@/lib/waitlistSheets";
import { 
  Shield, Sparkles, UserCheck, PhoneCall, ShieldAlert, Award, Clock, 
  ArrowRight, Star, ChevronDown, Send, MessageSquare, MapPin, 
  Navigation, Compass, Menu, X, Users, CheckCircle, Smartphone, 
  Eye, RefreshCw, Car, ChevronRight, Check, AlertCircle, Info, Download, Trash,
  Instagram, Linkedin, Twitter, Heart, Mail, Coins
} from "lucide-react";

// Get base URL for backend API from environment variables
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

// ----------------------------------------------------
// ANIMATED COUNTER COMPONENT (Statistics Section)
// ----------------------------------------------------
const AnimatedCounter = ({ value, suffix = "", duration = 1.5 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    
    // Parse numeric part
    const numericValue = parseInt(value.replace(/[^0-9]/g, "")) || 0;
    const nonNumericPrefix = value.replace(/[0-9]/g, "");
    
    let start = 0;
    const end = numericValue;
    if (start === end) {
      setCount(value);
      return;
    }

    let totalMiliseconds = duration * 1000;
    let incrementTime = Math.min(Math.max(Math.floor(totalMiliseconds / end), 10), 50);
    
    const timer = setInterval(() => {
      start += Math.ceil(end / (totalMiliseconds / incrementTime));
      if (start >= end) {
        clearInterval(timer);
        setCount(value);
      } else {
        setCount(`${nonNumericPrefix}${start}`);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-[#111827]">
      {count}{suffix}
    </span>
  );
};

// ----------------------------------------------------
// MAIN LANDING WEBSITE
// ----------------------------------------------------
export default function App() {
  // Navigation & Scroll status
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Waitlist Form State
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistRole, setWaitlistRole] = useState("both");
  const [waitlistCity, setWaitlistCity] = useState("Delhi NCR");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [submitMessage, setSubmitMessage] = useState("");

  // AI Chat Assistant State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSessionId, setChatSessionId] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [aiStreamingText, setAiStreamingText] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Admin View State
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState("");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  // Active feature scroll index (for Phone Mockup Feature section)
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  // Track scroll position to update navbar translucent state
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Initialize unique session ID for AI Chat Companion
  useEffect(() => {
    let sesId = localStorage.getItem("bhaiway_session_id");
    if (!sesId) {
      sesId = `session_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("bhaiway_session_id", sesId);
    }
    setChatSessionId(sesId);
    
    // Fetch chat history from server if it exists
    const fetchChatHistory = async () => {
      try {
        const response = await axios.get(`${API}/chat/history?session_id=${sesId}`);
        if (response.data && response.data.length > 0) {
          setChatMessages(response.data.map(m => ({
            sender: m.role === "user" ? "user" : "ai",
            text: m.content
          })));
        } else {
          // Default initial friendly message from Bhai
          setChatMessages([
            {
              sender: "ai",
              text: "Namaste! I'm Bhai, your smart BhaiWay Ride Companion. Looking to beat the traffic, find verified carpools, or travel securely? Ask me anything about BhaiWay or how to get started!"
            }
          ]);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
        setChatMessages([
          {
            sender: "ai",
            text: "Namaste! I'm Bhai, your smart BhaiWay Ride Companion. Ask me anything about our premium, women-first carpooling community!"
          }
        ]);
      }
    };
    fetchChatHistory();
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, aiStreamingText, chatOpen]);

  // Handle Waitlist Submission
  const handleJoinWaitlist = async (e) => {
    e.preventDefault();
    if (!waitlistEmail || !waitlistName) {
      setSubmitStatus("error");
      setSubmitMessage("Please enter your name and a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setSubmitMessage("");

    try {
      await submitWaitlistToGoogleSheet({
        name: waitlistName,
        email: waitlistEmail,
        role: waitlistRole,
        city: waitlistCity,
      });

      setSubmitStatus("success");
      setSubmitMessage("You will get 50 Bhaiway Coins as rewards.");
      setWaitlistEmail("");
      setWaitlistName("");
    } catch (err) {
      const errorMsg = err.message || "Something went wrong. Please try again.";
      setSubmitStatus("error");
      setSubmitMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle AI Chat Messages Submission
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message || isChatLoading) return;

    // Append User Message to local state
    setChatMessages(prev => [...prev, { sender: "user", text: message }]);
    setChatInput("");
    setIsChatLoading(true);
    setAiStreamingText("");

    try {
      // Use raw fetch for SSE Streaming
      const response = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          session_id: chatSessionId,
          message: message
        })
      });

      if (!response.ok) {
        throw new Error("Failed to reach AI Server");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let completedResponse = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Server outputs lines like: "data: {"delta": "..."}\n\n"
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") {
              break;
            }
            try {
              const dataObj = JSON.parse(dataStr);
              if (dataObj.delta) {
                completedResponse += dataObj.delta;
                setAiStreamingText(completedResponse);
              } else if (dataObj.error) {
                setAiStreamingText(prev => prev + `\n[Error: ${dataObj.error}]`);
              }
            } catch (pErr) {
              // Ignore partial chunk parse errors
            }
          }
        }
      }

      // Append completed AI response to Chat History list
      if (completedResponse) {
        setChatMessages(prev => [...prev, { sender: "ai", text: completedResponse }]);
      } else {
        setChatMessages(prev => [...prev, { sender: "ai", text: "I'm here to assist you! Feel free to ask about BhaiWay rides." }]);
      }
      setAiStreamingText("");

    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { sender: "ai", text: "Oops, looks like a minor route detour on my end! Please try sending again." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Admin Access Submission
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminError("");
    setAdminLoading(true);

    try {
      const response = await axios.get(`${API}/waitlist?token=${adminPasscode}`);
      setWaitlistEntries(response.data);
      setAdminLoggedIn(true);
    } catch (err) {
      setAdminError("Invalid Admin Passcode! Please try again.");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleRefreshAdminList = async () => {
    try {
      const response = await axios.get(`${API}/waitlist?token=${adminPasscode}`);
      setWaitlistEntries(response.data);
    } catch (err) {
      setAdminError("Failed to refresh waitlist.");
    }
  };

  const handleDeleteWaitlistEntry = async (id) => {
    if (!window.confirm("Are you sure you want to delete this waitlist entry?")) return;
    try {
      await axios.delete(`${API}/waitlist/${id}?token=${adminPasscode}`);
      setWaitlistEntries(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert("Failed to delete entry");
    }
  };

  // Scroll view helper
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setActiveSection(id);
      setMobileMenuOpen(false);
    }
  };

  // Bento features list
  const bentoFeatures = [
    {
      icon: <UserCheck className="w-6 h-6 text-[#335EEA]" />,
      title: "Government ID Verification",
      desc: "Every rider and driver undergoes rigorous Aadhaar & government ID cross-matching for maximum trust.",
      size: "col-span-1 md:col-span-4"
    },
    {
      icon: <Shield className="w-6 h-6 text-[#335EEA]" />,
      title: "Women-Only Preference",
      desc: "Travel safely. Women riders can choose to matching exclusively with verified women co-travelers and professional drivers.",
      size: "col-span-1 md:col-span-4"
    },
    {
      icon: <Smartphone className="w-6 h-6 text-[#335EEA]" />,
      title: "Live GPS & Safety Tracking",
      desc: "Real-time route coordinates are shared continuously with trusted family circles and our 24/7 Command Center.",
      size: "col-span-1 md:col-span-4"
    },
    {
      icon: <ShieldAlert className="w-6 h-6 text-[#335EEA]" />,
      title: "Instant SOS Emergencies",
      desc: "One-tap connection to active local law enforcement, medical responses, and on-ground safety agents.",
      size: "col-span-1 md:col-span-6"
    },
    {
      icon: <Award className="w-6 h-6 text-[#335EEA]" />,
      title: "Assured Ride Guarantee",
      desc: "Dynamic smart backup matches and instant credit checks ensure cancellations never disrupt your commute schedule.",
      size: "col-span-1 md:col-span-6"
    },
    {
      icon: <Users className="w-6 h-6 text-[#335EEA]" />,
      title: "Office & Corporate Commutes",
      desc: "Instantly discover and match with co-workers and colleagues traveling along identical tech park pathways.",
      size: "col-span-1 md:col-span-12"
    }
  ];

  // Steps list
  const steps = [
    {
      num: "01",
      title: "Create Profile",
      desc: "Sign up via our mobile web interface and input your daily office/home route markers."
    },
    {
      num: "02",
      title: "Verify Identity",
      desc: "Complete direct government-approved ID checks & optional corporate email pairing."
    },
    {
      num: "03",
      title: "Find or Offer Ride",
      desc: "Our automated smart matching pairs you with ideal professional companions on your map."
    },
    {
      num: "04",
      title: "Travel Together",
      desc: "Embark on a secure, affordable trip. Split fares automatically without awkward cash handovers."
    }
  ];

  // FAQs List
  const faqs = [
    {
      q: "What is BhaiWay?",
      a: "BhaiWay is a premium, high-trust carpooling startup in India designed specifically for daily office & metropolitan commuters. We pair riders and drivers traveling along identical corridors to share luxury commutes and slash travel costs."
    },
    {
      q: "How is BhaiWay different from traditional ride-sharing?",
      a: "Standard ride sharing suffers from constant driver cancellations, lack of security, and inflated pricing. BhaiWay is a private, verified-only community offering features like government ID cross-matching, women-first preferences, and our signature Assured Ride guarantee to prevent cancellations."
    },
    {
      q: "How is commuter safety ensured?",
      a: "Safety is built into our core DNA. All members must complete government-approved Aadhaar ID verification and optional corporate-email matching. In addition, we provide 24/7 command center tracking, automated live location sharing, and direct instant SOS emergency buttons."
    },
    {
      q: "What is the Assured Ride feature?",
      a: "Assured Ride is our premium reliability framework. If your matched carpool driver is forced to cancel due to unforeseen emergencies, BhaiWay automatically matches you with a verified priority backup ride immediately, guaranteeing you reach your destination on time."
    },
    {
      q: "Can women choose women-only commutes?",
      a: "Absolutely! Women safety is a major pillar of BhaiWay. Our app features a strict Women-First toggle allowing female commuters to search, match, and travel exclusively with other verified women."
    }
  ];

  const [faqOpenIndex, setFaqOpenIndex] = useState(null);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] font-body relative overflow-hidden selection:bg-[#335EEA]/15 selection:text-[#335EEA]">
      
      {/* Background Glowing Blobs */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-[#335EEA]/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[800px] right-[-200px] w-[600px] h-[600px] rounded-full bg-[#5B7CFF]/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[200px] left-[-300px] w-[700px] h-[700px] rounded-full bg-[#335EEA]/4 blur-[180px] pointer-events-none" />

      {/* ----------------------------------------------------
          1. CENTEERED CAPSULE NAVBAR
         ---------------------------------------------------- */}
      <nav 
        data-testid="navbar" 
        className={`fixed top-6 left-0 right-0 z-50 transition-all duration-500 max-w-7xl mx-auto px-4 sm:px-6`}
      >
        <div className={`glassmorphism-navbar rounded-full px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between transition-all duration-300 ${isScrolled ? "bg-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.06)] scale-[0.99] border-white/50" : ""}`}>
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection("home")}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#335EEA] to-[#5B7CFF] flex items-center justify-center shadow-md">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-[#111827]">
              BhaiWay
            </span>
          </div>

          {/* Desktop Capsule Navigation Links */}
          <div className="hidden lg:flex items-center gap-6">
            <button 
              data-testid="nav-link-home" 
              onClick={() => scrollToSection("home")} 
              className={`text-sm font-medium hover:text-[#335EEA] transition-colors ${activeSection === "home" ? "text-[#335EEA]" : "text-[#6B7280]"}`}
            >
              Home
            </button>
            <button 
              data-testid="nav-link-why" 
              onClick={() => scrollToSection("why-bhaiway")} 
              className={`text-sm font-medium hover:text-[#335EEA] transition-colors ${activeSection === "why-bhaiway" ? "text-[#335EEA]" : "text-[#6B7280]"}`}
            >
              Why BhaiWay
            </button>
            <button 
              data-testid="nav-link-features" 
              onClick={() => scrollToSection("features")} 
              className={`text-sm font-medium hover:text-[#335EEA] transition-colors ${activeSection === "features" ? "text-[#335EEA]" : "text-[#6B7280]"}`}
            >
              Features
            </button>
            <button 
              data-testid="nav-link-safety" 
              onClick={() => scrollToSection("safety")} 
              className={`text-sm font-medium hover:text-[#335EEA] transition-colors ${activeSection === "safety" ? "text-[#335EEA]" : "text-[#6B7280]"}`}
            >
              Safety
            </button>
            <button 
              data-testid="nav-link-how" 
              onClick={() => scrollToSection("how-it-works")} 
              className={`text-sm font-medium hover:text-[#335EEA] transition-colors ${activeSection === "how-it-works" ? "text-[#335EEA]" : "text-[#6B7280]"}`}
            >
              How It Works
            </button>
            <button 
              data-testid="nav-link-faq" 
              onClick={() => scrollToSection("faq")} 
              className={`text-sm font-medium hover:text-[#335EEA] transition-colors ${activeSection === "faq" ? "text-[#335EEA]" : "text-[#6B7280]"}`}
            >
              FAQ
            </button>
          </div>

          {/* Right CTA */}
          <div className="flex items-center gap-3">
            <button
              data-testid="nav-join-waitlist-btn"
              onClick={() => scrollToSection("waitlist")}
              className="bg-[#335EEA] text-white rounded-full px-5 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-semibold hover:bg-[#284BBA] transition-all duration-300 shadow-[0_4px_14px_0_rgba(51,94,234,0.25)] hover:-translate-y-0.5 active:translate-y-0"
            >
              Join Waitlist
            </button>

            {/* Mobile Menu Icon */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-2 mx-2 glassmorphism p-6 rounded-2xl flex flex-col gap-4 shadow-xl border border-slate-100 lg:hidden"
            >
              <button onClick={() => scrollToSection("home")} className="text-left py-2 text-base font-medium text-slate-700 hover:text-[#335EEA] border-b border-slate-100">Home</button>
              <button onClick={() => scrollToSection("why-bhaiway")} className="text-left py-2 text-base font-medium text-slate-700 hover:text-[#335EEA] border-b border-slate-100">Why BhaiWay</button>
              <button onClick={() => scrollToSection("features")} className="text-left py-2 text-base font-medium text-slate-700 hover:text-[#335EEA] border-b border-slate-100">Features</button>
              <button onClick={() => scrollToSection("safety")} className="text-left py-2 text-base font-medium text-slate-700 hover:text-[#335EEA] border-b border-slate-100">Safety</button>
              <button onClick={() => scrollToSection("how-it-works")} className="text-left py-2 text-base font-medium text-slate-700 hover:text-[#335EEA] border-b border-slate-100">How It Works</button>
              <button onClick={() => scrollToSection("faq")} className="text-left py-2 text-base font-medium text-slate-700 hover:text-[#335EEA] border-b border-slate-100">FAQ</button>
              <button onClick={() => scrollToSection("waitlist")} className="text-left py-2 text-base font-semibold text-[#335EEA]">Join Waitlist &rarr;</button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ----------------------------------------------------
          2. HERO SECTION
         ---------------------------------------------------- */}
      <section 
        id="home" 
        className="relative pt-32 pb-24 md:pt-48 md:pb-32 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-24"
      >
        {/* Left Side Content */}
        <div className="flex-1 text-left z-10 max-w-2xl">
          {/* Subtle Badge */}
          <div className="inline-flex items-center gap-2 bg-[#335EEA]/10 border border-[#335EEA]/20 px-4 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#335EEA]" />
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#335EEA] font-heading">
              India&apos;s Next Gen Carpooling Community
            </span>
          </div>

          <h1 className="font-heading font-bold text-5xl sm:text-6xl lg:text-7xl text-[#111827] leading-[1.05] tracking-tighter mb-6">
            Your Daily Commute, <br />
            <span className="bg-gradient-to-r from-[#335EEA] to-[#5B7CFF] bg-clip-text text-transparent">
              Reimagined.
            </span>
          </h1>

          <p className="font-body text-base sm:text-lg lg:text-xl text-[#6B7280] leading-relaxed mb-8 max-w-xl">
            The smarter, safer and more reliable way to share rides across India&apos;s busiest cities. Verified corporate professionals. Women-first route filtering. Guaranteed rides. Up to 70% cheaper than cabs.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              data-testid="hero-join-waitlist-btn"
              onClick={() => scrollToSection("waitlist")}
              className="bg-[#335EEA] text-white rounded-full px-8 py-4 font-semibold hover:bg-[#284BBA] transition-all duration-300 shadow-[0_12px_24px_rgba(51,94,234,0.3)] hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(51,94,234,0.4)] flex items-center gap-2 group text-base"
            >
              Secure Priority Pass
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              data-testid="hero-learn-more-btn"
              onClick={() => scrollToSection("why-bhaiway")}
              className="bg-white text-[#111827] border border-slate-200 rounded-full px-8 py-4 font-semibold hover:bg-slate-50 transition-all duration-300 hover:-translate-y-1 shadow-sm text-base"
            >
              Explore Features
            </button>
          </div>

          {/* Premium Trust Badges Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#335EEA]" />
              <span className="text-xs sm:text-sm font-medium text-slate-700">Verified Users</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#335EEA]" />
              <span className="text-xs sm:text-sm font-medium text-slate-700">Live GPS Link</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#335EEA]" />
              <span className="text-xs sm:text-sm font-medium text-slate-700">Women Safety</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#335EEA]" />
              <span className="text-xs sm:text-sm font-medium text-slate-700">Assured Ride</span>
            </div>
          </div>
        </div>

        {/* Right Side Visuals (Animated Map Route, SVG cars, Floating Glass Cards) */}
        <div className="flex-1 w-full relative h-[450px] sm:h-[500px] flex items-center justify-center">
          
          {/* Radial glow background spot */}
          <div className="absolute inset-0 bg-[#335EEA]/8 rounded-full filter blur-[80px] pointer-events-none scale-90" />

          {/* Main Visual Container */}
          <div className="w-full h-full glassmorphism rounded-[24px] p-6 relative overflow-hidden flex items-center justify-center border border-slate-100 shadow-[0_24px_50px_rgba(0,0,0,0.04)]">
            
            {/* Minimal Vector Map Illustration */}
            <svg viewBox="0 0 500 400" className="w-full h-full absolute inset-0 z-0 opacity-80 select-none">
              {/* Map grid lines */}
              <line x1="50" y1="0" x2="50" y2="400" stroke="#E2E8F0" strokeWidth="0.5" />
              <line x1="150" y1="0" x2="150" y2="400" stroke="#E2E8F0" strokeWidth="0.5" />
              <line x1="250" y1="0" x2="250" y2="400" stroke="#E2E8F0" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1="350" y1="0" x2="350" y2="400" stroke="#E2E8F0" strokeWidth="0.5" />
              <line x1="450" y1="0" x2="450" y2="400" stroke="#E2E8F0" strokeWidth="0.5" />
              
              <line x1="0" y1="80" x2="500" y2="80" stroke="#E2E8F0" strokeWidth="0.5" />
              <line x1="0" y1="180" x2="500" y2="180" stroke="#E2E8F0" strokeWidth="0.5" />
              <line x1="0" y1="280" x2="500" y2="280" stroke="#E2E8F0" strokeWidth="0.5" strokeDasharray="3 3" />

              {/* Major arterial highway route */}
              <path 
                d="M 50 320 C 120 320, 180 120, 280 120 C 380 120, 400 250, 450 250" 
                fill="none" 
                stroke="#E2E8F0" 
                strokeWidth="6" 
                strokeLinecap="round"
              />
              {/* Active illuminated route line with dashing */}
              <path 
                d="M 50 320 C 120 320, 180 120, 280 120 C 380 120, 400 250, 450 250" 
                fill="none" 
                stroke="url(#blue-gradient)" 
                strokeWidth="4" 
                strokeLinecap="round"
                className="animate-route-line"
              />

              {/* SVG Gradients */}
              <defs>
                <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#335EEA" />
                  <stop offset="100%" stopColor="#5B7CFF" />
                </linearGradient>
                <radialGradient id="dot-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#335EEA" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#335EEA" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Start & End Points (Glow) */}
              <circle cx="50" cy="320" r="16" fill="url(#dot-glow)" />
              <circle cx="50" cy="320" r="5" fill="#335EEA" />
              
              <circle cx="450" cy="250" r="16" fill="url(#dot-glow)" />
              <circle cx="450" cy="250" r="5" fill="#5B7CFF" />
            </svg>

            {/* Custom Interactive Floating Cards */}
            {/* Card 1: Active Match Finder */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute top-12 left-6 w-[180px] p-3 rounded-2xl bg-white/90 border border-white/60 shadow-[0_12px_24px_rgba(0,0,0,0.04)] backdrop-blur-md text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-heading">Matching live...</span>
              </div>
              <div className="flex items-center gap-2">
                <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=srgb&fm=jpg&q=80&w=60" className="w-8 h-8 rounded-full border border-slate-100 object-cover" alt="match user" />
                <div>
                  <h4 className="text-xs font-bold text-[#111827] leading-none">Meera Sen</h4>
                  <span className="text-[10px] text-slate-400">Match Accuracy: 98%</span>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Commuter Metrics */}
            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute bottom-12 right-6 w-[170px] p-3 rounded-2xl bg-white/90 border border-white/60 shadow-[0_12px_24px_rgba(0,0,0,0.04)] backdrop-blur-md text-left"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 rounded-lg bg-indigo-50">
                  <Award className="w-3.5 h-3.5 text-[#335EEA]" />
                </div>
                <span className="text-xs font-bold text-slate-700 font-heading">Assured Match</span>
              </div>
              <p className="text-[11px] text-slate-500">Cancellations Protected by Backup Guarantee</p>
            </motion.div>

            {/* Floating Car Indicator on Route */}
            <motion.div 
              animate={{ 
                x: [-150, 150], 
                y: [80, -20, 45],
                scale: [0.95, 1.05, 0.95]
              }}
              transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
              className="absolute flex items-center justify-center p-2 rounded-full bg-[#335EEA] text-white shadow-lg pointer-events-none"
            >
              <Car className="w-5 h-5" />
            </motion.div>

            {/* Floating Live Navigation Icon */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10"
            >
              <Compass className="w-48 h-48 text-[#335EEA]" />
            </motion.div>

            {/* Map Pins */}
            <div className="absolute top-[280px] left-[110px] flex flex-col items-center gap-1">
              <div className="px-2 py-1 bg-[#111827] text-white text-[9px] rounded-lg font-bold shadow-sm font-heading">Rajiv Chowk</div>
              <MapPin className="w-4 h-4 text-[#335EEA]" />
            </div>
            
            <div className="absolute top-[80px] right-[180px] flex flex-col items-center gap-1">
              <div className="px-2 py-1 bg-[#111827] text-white text-[9px] rounded-lg font-bold shadow-sm font-heading">Cyber City</div>
              <MapPin className="w-4 h-4 text-[#5B7CFF]" />
            </div>

          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          3. ABOUT BHAIWAY
         ---------------------------------------------------- */}
      <section 
        id="why-bhaiway" 
        className="py-24 md:py-32 px-6 max-w-7xl mx-auto border-t border-slate-100 text-left"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center mb-16">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#335EEA] font-heading block mb-3">Our Core Vision</span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-[#111827] leading-tight">
              More Than Ride Sharing. <br />
              <span className="bg-gradient-to-r from-[#335EEA] to-[#5B7CFF] bg-clip-text text-transparent">A High-Trust Community.</span>
            </h2>
          </div>
          <div>
            <p className="font-body text-base sm:text-lg text-[#6B7280] leading-relaxed">
              BhaiWay is built on the radical premise that commuting shouldn&apos;t be stressful, unpredictable, or lonely. By leveraging rigorous ID verification and intelligent matching algorithms, we bring you an premium community built to make daily commuting exceptionally affordable, safe, and pleasant.
            </p>
          </div>
        </div>

        {/* Vision/Mission Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-[24px] p-8 border border-slate-100 hover-lift hover:border-[#335EEA]/30">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-[#335EEA]" />
            </div>
            <h3 className="font-heading font-bold text-xl mb-3 text-[#111827]">Affordable Commutes</h3>
            <p className="font-body text-sm text-slate-500 leading-relaxed">
              Cut daily travel fuel and cab costs by up to 70%. Fair split calculation done instantly in-app.
            </p>
          </div>

          <div className="bg-white rounded-[24px] p-8 border border-slate-100 hover-lift hover:border-[#335EEA]/30">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-[#335EEA]" />
            </div>
            <h3 className="font-heading font-bold text-xl mb-3 text-[#111827]">High Security</h3>
            <p className="font-body text-sm text-slate-500 leading-relaxed">
              Mandatory Aadhaar verifications ensure you travel only with trusted and authenticated professionals.
            </p>
          </div>

          <div className="bg-white rounded-[24px] p-8 border border-slate-100 hover-lift hover:border-[#335EEA]/30">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
              <Clock className="w-6 h-6 text-[#335EEA]" />
            </div>
            <h3 className="font-heading font-bold text-xl mb-3 text-[#111827]">Ultimate Reliability</h3>
            <p className="font-body text-sm text-slate-500 leading-relaxed">
              Never worry about sudden cancellations with our signature Assured Match backup transport.
            </p>
          </div>

          <div className="bg-white rounded-[24px] p-8 border border-slate-100 hover-lift hover:border-[#335EEA]/30">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6 text-[#335EEA]" />
            </div>
            <h3 className="font-heading font-bold text-xl mb-3 text-[#111827]">Community Driven</h3>
            <p className="font-body text-sm text-slate-500 leading-relaxed">
              Meet like-minded professionals from leading firms. Build deep tech network ties as you commute.
            </p>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          4. WHY CHOOSE BHAIWAY (Asymmetric Bento Grid)
         ---------------------------------------------------- */}
      <section 
        id="features" 
        className="py-24 md:py-32 bg-[#F1F5F9]/50 px-6 border-y border-slate-100 text-left relative"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#335EEA] font-heading block mb-3">Our Core Ecosystem</span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-[#111827] leading-tight">
              Designed For High-Performance. <br />
              <span className="bg-gradient-to-r from-[#335EEA] to-[#5B7CFF] bg-clip-text text-transparent">Crafted For Ultimate Safety.</span>
            </h2>
          </div>

          {/* ASYMMETRIC BENTO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
            {bentoFeatures.map((feat, idx) => (
              <div 
                key={idx} 
                className={`${feat.size} bg-white rounded-[24px] p-8 border border-slate-100 hover-lift flex flex-col justify-between`}
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                    {feat.icon}
                  </div>
                  <h3 className="font-heading font-bold text-xl lg:text-2xl text-[#111827] mb-3">{feat.title}</h3>
                  <p className="font-body text-sm lg:text-base text-slate-500 leading-relaxed">{feat.desc}</p>
                </div>
                
                {/* Visual Accent */}
                <div className="mt-6 flex items-center gap-2 text-xs font-bold text-[#335EEA] font-heading cursor-pointer hover:underline">
                  <span>Learn more</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          5. FEATURE HIGHLIGHT SECTION (Sticky / Scroll-reveal & Phone mockup)
         ---------------------------------------------------- */}
      <section className="py-24 md:py-32 px-6 max-w-7xl mx-auto text-left">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          
          {/* Left: Floating Phone Mockup */}
          <div className="lg:sticky lg:top-32 flex justify-center">
            <div className="relative w-[300px] h-[610px] bg-slate-900 rounded-[48px] p-3 shadow-2xl border-4 border-slate-800 flex items-center justify-center animate-float">
              
              {/* Phone Speaker & Camera Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-900 rounded-b-3xl z-30 flex items-center justify-center">
                <div className="w-12 h-1 bg-slate-800 rounded-full mb-1" />
              </div>

              {/* Inner Screen Surface */}
              <div className="w-full h-full bg-[#FAFAFA] rounded-[38px] overflow-hidden relative flex flex-col text-left">
                
                {/* Status Bar */}
                <div className="h-10 pt-4 px-6 flex justify-between items-center bg-white border-b border-slate-100">
                  <span className="text-xs font-bold font-heading text-slate-700">9:41 AM</span>
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 bg-slate-800 rounded-full" />
                    <div className="w-2.5 h-2.5 bg-slate-800 rounded-full" />
                  </div>
                </div>

                {/* Simulated App Content changing based on active Feature highlight scroll state */}
                <div className="p-4 flex-1 overflow-y-auto flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#335EEA] font-bold font-heading">Active Route</span>
                        <h4 className="text-sm font-bold text-[#111827]">Noida Sec 62 &rarr; Cyber City</h4>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <Navigation className="w-4 h-4 text-[#335EEA]" />
                      </div>
                    </div>

                    {/* Simulated Match Card */}
                    <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=srgb&fm=jpg&q=80&w=60" className="w-7 h-7 rounded-full object-cover" alt="driver" />
                          <div>
                            <p className="text-xs font-bold text-[#111827]">Ananya Deshmukh</p>
                            <span className="text-[9px] text-slate-400">PwC Financial Analyst</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded">Verified</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-100 pt-2 text-slate-500">
                        <div>
                          <p className="font-heading">ETA Match</p>
                          <p className="font-bold text-slate-700">8:15 AM</p>
                        </div>
                        <div>
                          <p className="font-heading">Seats Shared</p>
                          <p className="font-bold text-slate-700">2 Available</p>
                        </div>
                      </div>
                    </div>

                    {/* Security Badge */}
                    <div className="bg-[#335EEA]/5 border border-[#335EEA]/10 p-3 rounded-2xl mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-[#335EEA]" />
                        <span className="text-xs font-bold text-[#335EEA] font-heading">GPS Security Active</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Continuous 24/7 telemetry monitoring active.</p>
                    </div>
                  </div>

                  {/* Booking Confirmation Action */}
                  <div className="pt-4 border-t border-slate-100">
                    <button className="w-full bg-[#335EEA] text-white rounded-full py-2 text-xs font-bold shadow-md hover:bg-[#284BBA] transition-all">
                      Confirm Shared Ride
                    </button>
                    <p className="text-center text-[9px] text-slate-400 mt-2">BhaiWay Smart Ride Split Technology</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right: Key Feature explanations */}
          <div className="flex flex-col gap-12 lg:pt-16">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#335EEA] font-heading block mb-3">Feature Spotlight</span>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-[#111827] leading-tight mb-6">
                Premium Commuting, Just A Tap Away.
              </h2>
            </div>

            <div className="space-y-12">
              <div 
                className={`p-6 rounded-[24px] transition-all duration-300 ${activeFeatureIndex === 0 ? "bg-white border border-slate-100 shadow-sm" : ""}`}
                onClick={() => setActiveFeatureIndex(0)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center font-bold text-xs text-[#335EEA]">1</div>
                  <h3 className="font-heading font-bold text-lg text-[#111827]">Instant Matching</h3>
                </div>
                <p className="font-body text-sm text-slate-500 leading-relaxed pl-11">
                  Our hyper-local matchmaking logic identifies and pairs riders with optimal commuter drivers, ensuring zero detours and maximum savings.
                </p>
              </div>

              <div 
                className={`p-6 rounded-[24px] transition-all duration-300 ${activeFeatureIndex === 1 ? "bg-white border border-slate-100 shadow-sm" : ""}`}
                onClick={() => setActiveFeatureIndex(1)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center font-bold text-xs text-[#335EEA]">2</div>
                  <h3 className="font-heading font-bold text-lg text-[#111827]">Safe-Circle Telemetry</h3>
                </div>
                <p className="font-body text-sm text-slate-500 leading-relaxed pl-11">
                  We match you only with government-verified professionals from verified offices. Real-time GPS paths are tracked by safety command networks.
                </p>
              </div>

              <div 
                className={`p-6 rounded-[24px] transition-all duration-300 ${activeFeatureIndex === 2 ? "bg-white border border-slate-100 shadow-sm" : ""}`}
                onClick={() => setActiveFeatureIndex(2)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center font-bold text-xs text-[#335EEA]">3</div>
                  <h3 className="font-heading font-bold text-lg text-[#111827]">Guaranteed Backup Support</h3>
                </div>
                <p className="font-body text-sm text-slate-500 leading-relaxed pl-11">
                  With Assured Ride, enjoy peace of mind. On-ground support is always standing by to guarantee backup transport if matched drivers delay.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ----------------------------------------------------
          6. HOW IT WORKS
         ---------------------------------------------------- */}
      <section 
        id="how-it-works" 
        className="py-24 md:py-32 px-6 bg-slate-50 text-left border-y border-slate-100"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-20">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#335EEA] font-heading block mb-3">Operational Timeline</span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-[#111827] leading-tight">
              Simplified Travel. <br />
              <span className="bg-gradient-to-r from-[#335EEA] to-[#5B7CFF] bg-clip-text text-transparent">From Doorstep to Tech-Park.</span>
            </h2>
          </div>

          {/* Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {steps.map((step, idx) => (
              <div key={idx} className="relative flex flex-col gap-6 text-left group">
                {/* Connector Line for Desktop */}
                {idx < 3 && (
                  <div className="hidden md:block absolute top-6 left-16 right-0 h-[1.5px] bg-slate-200 group-hover:bg-[#335EEA]/30 transition-colors z-0" />
                )}
                
                {/* Icon Circle */}
                <div className="w-12 h-12 rounded-full bg-white text-[#335EEA] font-heading font-bold text-lg flex items-center justify-center shadow-sm border border-slate-200 relative z-10 hover:bg-[#335EEA] hover:text-white transition-colors duration-300">
                  {step.num}
                </div>

                <div>
                  <h3 className="font-heading font-bold text-xl text-[#111827] mb-3">{step.title}</h3>
                  <p className="font-body text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          7. SAFETY FIRST SECTION
         ---------------------------------------------------- */}
      <section 
        id="safety" 
        className="py-24 md:py-32 px-6 max-w-7xl mx-auto text-left relative overflow-hidden"
      >
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#335EEA]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-center">
          
          {/* Left Content */}
          <div className="lg:col-span-7">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#335EEA] font-heading block mb-3">Our Core Philosophy</span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-[#111827] leading-tight mb-6">
              Women-First & Premium Security Protocols.
            </h2>
            <p className="font-body text-base text-[#6B7280] leading-relaxed mb-8">
              We understand commuting requires total trust. BhaiWay incorporates state-of-the-art live safety sharing and strict verification criteria. Women commuters have exclusive choices to filter, matches, and travel solely with trusted and vetted women co-travelers and corporate employees.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-[#335EEA]/5 rounded-xl">
                  <UserCheck className="w-5 h-5 text-[#335EEA]" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-lg text-[#111827] mb-1">Aadhaar Double-Checks</h4>
                  <p className="font-body text-xs text-slate-500 leading-relaxed">Mandatory double ID match checking to eliminate identity fraud.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-3 bg-[#335EEA]/5 rounded-xl">
                  <PhoneCall className="w-5 h-5 text-[#335EEA]" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-lg text-[#111827] mb-1">Command SOS Hotline</h4>
                  <p className="font-body text-xs text-slate-500 leading-relaxed">Immediate direct linkages to legal emergency responder panels 24/7.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content: Animated Shield SVG / Shield card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative p-8 rounded-[32px] bg-gradient-to-b from-blue-50 to-white border border-blue-100/50 shadow-lg text-center max-w-sm w-full">
              
              {/* Animated Shield Shield */}
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
                <Shield className="w-12 h-12 text-[#335EEA]" />
              </div>

              <h3 className="font-heading font-bold text-xl text-[#111827] mb-2">High Safety Threshold</h3>
              <p className="font-body text-sm text-slate-500 leading-relaxed mb-6">
                Active live coordinates monitoring of every ride matches.
              </p>

              <div className="py-2.5 px-4 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold inline-flex items-center gap-1.5 font-heading">
                <Check className="w-4 h-4" />
                100% Verified Community
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ----------------------------------------------------
          8. ASSURED RIDE (Pricing-style Feature Card)
         ---------------------------------------------------- */}
      <section className="py-24 md:py-32 bg-[#FAFAFA] px-6 text-center border-y border-slate-100">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#335EEA] font-heading block mb-3">The Reliability Revolution</span>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-[#111827] leading-tight mb-8">
            Introducing: <span className="bg-gradient-to-r from-[#335EEA] to-[#5B7CFF] bg-clip-text text-transparent font-extrabold">Assured Ride™</span>
          </h2>
          <p className="font-body text-base sm:text-lg text-[#6B7280] leading-relaxed mb-12 max-w-2xl mx-auto">
            Sudden driver cancellations are the worst part of daily carpooling. That&apos;s why we built Assured Ride—a premium safety net guaranteeing matching and rapid backup support.
          </p>

          {/* Premium Glassmorphism Pricing-Style Card */}
          <div className="glassmorphism-premium rounded-[32px] p-8 md:p-12 text-left relative overflow-hidden max-w-2xl mx-auto border border-blue-100 shadow-xl tracing-beam">
            
            {/* Soft Glowing Dots */}
            <div className="absolute top-[-20px] right-[-20px] w-24 h-24 rounded-full bg-[#335EEA]/10 blur-xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100 mb-8">
              <div>
                <span className="px-3 py-1 bg-[#335EEA]/10 text-[#335EEA] text-xs font-bold rounded-full font-heading uppercase tracking-wider">Premium Mode</span>
                <h3 className="font-heading font-bold text-2xl text-[#111827] mt-3">Assured Ride</h3>
              </div>
              <div className="text-left md:text-right">
                <span className="text-sm text-slate-400 font-heading block">Greater reliability</span>
                <span className="font-heading font-bold text-xl text-[#335EEA]">Priority Matching</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#335EEA] shrink-0 mt-0.5" />
                <p className="font-body text-sm md:text-base text-[#111827]">
                  <strong className="font-bold">Guaranteed Match:</strong> Automated routing prioritizes matching logic for passholders.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#335EEA] shrink-0 mt-0.5" />
                <p className="font-body text-sm md:text-base text-[#111827]">
                  <strong className="font-bold">Cancellations Protected:</strong> Match failures automatically dispatch backup verification codes.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#335EEA] shrink-0 mt-0.5" />
                <p className="font-body text-sm md:text-base text-[#111827]">
                  <strong className="font-bold">Dedicated Priority Support:</strong> Immediate on-call assistance round the clock.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <button 
                onClick={() => scrollToSection("waitlist")}
                className="w-full bg-[#335EEA] text-white rounded-full py-4 text-center font-bold font-heading hover:bg-[#284BBA] transition-all duration-300 shadow-md"
              >
                Claim Priority Access &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          9. STATISTICS SECTION
         ---------------------------------------------------- */}
      <section className="py-24 md:py-32 px-6 max-w-7xl mx-auto text-center">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          
          <div className="flex flex-col items-center">
            <AnimatedCounter value="100%" suffix="" />
            <span className="font-heading font-bold text-xs uppercase tracking-widest text-[#6B7280] mt-3">Verified Community</span>
          </div>

          <div className="flex flex-col items-center">
            <AnimatedCounter value="24/7" suffix="" />
            <span className="font-heading font-bold text-xs uppercase tracking-widest text-[#6B7280] mt-3">Safety Support</span>
          </div>

          <div className="flex flex-col items-center">
            <AnimatedCounter value="70%" suffix="" />
            <span className="font-heading font-bold text-xs uppercase tracking-widest text-[#6B7280] mt-3">Lower Commute Costs</span>
          </div>

          <div className="flex flex-col items-center">
            <AnimatedCounter value="98%" suffix="" />
            <span className="font-heading font-bold text-xs uppercase tracking-widest text-[#6B7280] mt-3">Match Accuracy</span>
          </div>

        </div>
      </section>

      {/* ----------------------------------------------------
          10. APP PREVIEW
         ---------------------------------------------------- */}
      <section className="py-24 md:py-32 bg-slate-50 px-6 border-y border-slate-100 text-center relative overflow-hidden">
        
        <div className="max-w-4xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#335EEA] font-heading block mb-3">Coming Soon</span>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-[#111827] leading-tight">
            Designed for Simplicity. <br />
            <span className="bg-gradient-to-r from-[#335EEA] to-[#5B7CFF] bg-clip-text text-transparent">Optimized for Commuters.</span>
          </h2>
        </div>

        {/* Floating Phones Mockup Row */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 max-w-5xl mx-auto pt-6">
          
          {/* Driver Preview App Screen */}
          <div className="w-[280px] h-[520px] bg-slate-900 rounded-[38px] p-2.5 shadow-xl border-4 border-slate-800 relative">
            <div className="w-full h-full bg-white rounded-[28px] overflow-hidden flex flex-col justify-between text-left p-4">
              
              {/* Maps Preview Top */}
              <div className="flex-1 rounded-2xl bg-blue-50 relative overflow-hidden flex items-center justify-center border border-slate-100">
                
                {/* Dynamic path */}
                <svg viewBox="0 0 100 100" className="w-full h-full opacity-60 absolute">
                  <path d="M 10 90 Q 50 10, 90 20" fill="none" stroke="#335EEA" strokeWidth="3" />
                  <circle cx="10" cy="90" r="4" fill="#335EEA" />
                  <circle cx="90" cy="20" r="4" fill="#5B7CFF" />
                </svg>
                
                {/* Floating details */}
                <div className="absolute top-3 left-3 bg-white/95 px-2 py-1 rounded-lg border border-slate-100 text-[8px] font-bold shadow-sm font-heading">
                  NH-48 Corridor matched
                </div>
              </div>

              {/* Passenger Card Details Bottom */}
              <div className="pt-3">
                <h4 className="text-xs font-bold text-[#111827] mb-2 font-heading">Matched Passengers</h4>
                <div className="flex items-center gap-2 mb-2 p-2 bg-slate-50 rounded-xl">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=srgb&fm=jpg&q=80&w=150" className="w-6 h-6 rounded-full object-cover" alt="driver avatar" />
                  <div>
                    <p className="text-[10px] font-bold">Rohan Mehta</p>
                    <p className="text-[8px] text-slate-400">Razorpay • Match: 96%</p>
                  </div>
                </div>
                <div className="text-[9px] text-slate-400 leading-relaxed mb-3">
                  Match savings dynamic offset: ₹420 today
                </div>
                <button className="w-full bg-[#111827] text-white rounded-full py-1.5 text-[10px] font-bold font-heading hover:bg-slate-800">
                  Accept Ride Split
                </button>
              </div>

            </div>
          </div>

          {/* Map Preview App Screen */}
          <div className="w-[280px] h-[520px] bg-slate-900 rounded-[38px] p-2.5 shadow-xl border-4 border-slate-800 relative md:-translate-y-8">
            <div className="w-full h-full bg-white rounded-[28px] overflow-hidden flex flex-col justify-between text-left p-4">
              
              {/* Search destination */}
              <div className="p-3 bg-slate-50 rounded-xl mb-4 border border-slate-100">
                <div className="text-[9px] uppercase font-bold text-[#335EEA] font-heading">Where are you heading?</div>
                <div className="text-xs font-bold text-[#111827] mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Manyata Tech Park, BLR</span>
                </div>
              </div>

              {/* Simulated Map Illustration */}
              <div className="flex-1 bg-slate-100 rounded-2xl relative overflow-hidden flex items-center justify-center">
                
                {/* Active radar ripples */}
                <span className="absolute flex h-12 w-12">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-25"></span>
                  <span className="relative inline-flex rounded-full h-12 w-12 bg-blue-500/10"></span>
                </span>
                
                <div className="text-center z-10 px-4">
                  <div className="text-[10px] font-bold text-[#111827] font-heading">Finding matching cars...</div>
                  <p className="text-[8px] text-slate-400 mt-1">3 co-workers driving identical routes.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3">
                <button className="w-full bg-[#335EEA] text-white rounded-full py-2 text-[10px] font-bold font-heading shadow-md">
                  Enable Assured Matching
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ----------------------------------------------------
          12. FAQ (Premium Custom Accordion)
         ---------------------------------------------------- */}
      <section 
        id="faq" 
        className="py-24 md:py-32 bg-slate-50 px-6 border-y border-slate-100 text-left"
      >
        <div className="max-w-4xl mx-auto">
          <div className="mb-16 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#335EEA] font-heading block mb-3">Common Questions</span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-[#111827] leading-tight">
              Frequently Asked Queries.
            </h2>
          </div>

          {/* Custom Accordion Grid */}
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm transition-all duration-300"
              >
                <button
                  onClick={() => setFaqOpenIndex(faqOpenIndex === idx ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-heading font-bold text-base sm:text-lg text-[#111827] hover:text-[#335EEA] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${faqOpenIndex === idx ? "rotate-180 text-[#335EEA]" : ""}`} />
                </button>
                
                <AnimatePresence initial={false}>
                  {faqOpenIndex === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="p-6 pt-0 border-t border-slate-50 font-body text-sm sm:text-base text-slate-500 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          13. WAITLIST CTA (Email signup, MongoDB & Google Sheets)
         ---------------------------------------------------- */}
      <section 
        id="waitlist" 
        className="py-24 md:py-32 px-6 max-w-7xl mx-auto text-center relative"
      >
        <div className="glow-spot top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-70" />

        <div className="glassmorphism-premium rounded-[32px] p-8 md:p-16 max-w-3xl mx-auto relative z-10 border border-slate-100 shadow-2xl">
          
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#335EEA] font-heading block mb-3">Exclusive Priority Launch</span>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-[#111827] tracking-tight leading-none mb-6">
            Be Among The First <br className="hidden sm:block" />
            To Experience Smarter Carpooling.
          </h2>
          <p className="font-body text-base text-slate-500 leading-relaxed mb-10 max-w-xl mx-auto">
            Secure early priority access to BhaiWay. Get subsidized pricing, priority matches on your commute pathway, and verified credentials instantly.
          </p>

          {/* Waitlist Sign Up Form */}
          <form onSubmit={handleJoinWaitlist} className="space-y-4 max-w-md mx-auto text-left">
            
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="text-xs font-bold text-slate-700 font-heading block mb-2">Name</label>
              <input 
                id="name"
                type="text"
                placeholder="Amit Sharma"
                value={waitlistName}
                onChange={(e) => setWaitlistName(e.target.value)}
                data-testid="waitlist-name-input"
                className="w-full px-4 py-3 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#335EEA]/50 focus:border-[#335EEA] text-sm bg-white"
                required
              />
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="text-xs font-bold text-slate-700 font-heading block mb-2">Email Address</label>
              <input 
                id="email"
                type="email"
                placeholder="amit.sharma@company.com"
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                data-testid="waitlist-email-input"
                className="w-full px-4 py-3 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#335EEA]/50 focus:border-[#335EEA] text-sm bg-white"
                required
              />
            </div>

            {/* Role selection row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="role" className="text-xs font-bold text-slate-700 font-heading block mb-2">Your Commute Preference</label>
                <select 
                  id="role"
                  value={waitlistRole}
                  onChange={(e) => setWaitlistRole(e.target.value)}
                  data-testid="waitlist-role-select"
                  className="w-full px-4 py-3 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#335EEA]/50 focus:border-[#335EEA] text-sm bg-white"
                >
                  <option value="rider">Rider (Find Carpools)</option>
                  <option value="driver">Driver (Offer Rides)</option>
                  <option value="both">Both (Flexible)</option>
                </select>
              </div>

              <div>
                <label htmlFor="city" className="text-xs font-bold text-slate-700 font-heading block mb-2">Primary City</label>
                <select 
                  id="city"
                  value={waitlistCity}
                  onChange={(e) => setWaitlistCity(e.target.value)}
                  data-testid="waitlist-city-select"
                  className="w-full px-4 py-3 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#335EEA]/50 focus:border-[#335EEA] text-sm bg-white"
                >
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Pune">Pune</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="waitlist-submit"
              type="submit"
              disabled={isSubmitting}
              data-testid="waitlist-submit-btn"
              className="w-full bg-[#335EEA] text-white rounded-full py-4 font-semibold font-heading hover:bg-[#284BBA] transition-all duration-300 shadow-[0_4px_14px_0_rgba(51,94,234,0.39)] disabled:opacity-50 flex items-center justify-center gap-2 mt-6 text-base"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Securing early priority...
                </>
              ) : "Join Exclusive Waitlist"}
            </button>
            <p className="text-center text-xs text-slate-400 pt-1 flex items-center justify-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              Join now and get 50 Bhaiway Coins as rewards
            </p>
          </form>

          {/* Form Feedbacks */}
          <AnimatePresence>
            {submitStatus && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                data-testid="waitlist-success-message"
                className={`mt-6 p-4 rounded-2xl flex items-start gap-3 max-w-md mx-auto text-left text-sm ${submitStatus === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-rose-50 text-rose-800 border border-rose-100"}`}
              >
                {submitStatus === "success" ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
                <div>
                  <p className="font-heading font-bold mb-1">{submitStatus === "success" ? "Early Pass Secured!" : "Registration detour"}</p>
                  {submitStatus === "success" ? (
                    <p className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                      {submitMessage}
                    </p>
                  ) : (
                    <p>{submitMessage}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </section>

      {/* ----------------------------------------------------
          14. FLOATING AI ASSISTANT PANEL (Witty, real-time)
         ---------------------------------------------------- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-[320px] sm:w-[380px] h-[480px] rounded-[24px] glassmorphism p-4 shadow-2xl border border-slate-100 flex flex-col justify-between mb-4 text-left overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#335EEA] to-[#5B7CFF] flex items-center justify-center shadow-sm">
                    <Car className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#111827] font-heading flex items-center gap-1.5">
                      Ask Bhai
                      <span className="px-1.5 py-0.5 bg-indigo-50 text-[#335EEA] text-[8px] font-bold uppercase rounded font-heading">Online Companion</span>
                    </h3>
                    <p className="text-[10px] text-slate-400">BhaiWay Smart Commute Engine</p>
                  </div>
                </div>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Chat Message List */}
              <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
                {chatMessages.map((msg, index) => (
                  <div 
                    key={index} 
                    data-testid="chat-message"
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${msg.sender === "user" ? "bg-[#335EEA] text-white rounded-br-none" : "bg-white text-[#111827] border border-slate-100 shadow-sm rounded-bl-none"}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {/* AI Streaming Event */}
                {aiStreamingText && (
                  <div className="flex justify-start">
                    <div className="p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed bg-white text-[#111827] border border-slate-100 shadow-sm rounded-bl-none">
                      {aiStreamingText}
                    </div>
                  </div>
                )}

                {isChatLoading && !aiStreamingText && (
                  <div className="flex justify-start">
                    <div className="p-3 rounded-2xl bg-white text-slate-400 border border-slate-100 shadow-sm rounded-bl-none flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-[10px] font-bold uppercase font-heading tracking-wide">Bhai is typing...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100/50 flex gap-2">
                <input 
                  type="text"
                  placeholder="Ask Bhai about safety, passes, routes..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  data-testid="chat-input"
                  disabled={isChatLoading}
                  className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#335EEA] text-xs bg-white"
                  required
                />
                <button 
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  data-testid="chat-submit-btn"
                  className="p-2.5 rounded-full bg-[#335EEA] text-white hover:bg-[#284BBA] disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Bubble Icon */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          data-testid="chat-floating-bubble"
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#335EEA] to-[#5B7CFF] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 hover:shadow-xl transition-all duration-300"
          aria-label="Open commuter chat help"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      </div>

      {/* ----------------------------------------------------
          15. SECURE ADMIN WAITLIST MODAL VIEW
         ---------------------------------------------------- */}
      <AnimatePresence>
        {adminOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setAdminOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] p-6 shadow-2xl border border-slate-100 max-w-3xl w-full max-h-[85vh] flex flex-col justify-between relative z-10 text-left"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="font-heading font-bold text-xl text-[#111827]">BhaiWay Early Waitlist Panel</h3>
                  <p className="text-xs text-slate-400">Manage priority registrations securely.</p>
                </div>
                <button onClick={() => setAdminOpen(false)} className="p-2 rounded-full hover:bg-slate-100">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Login Check */}
              {!adminLoggedIn ? (
                <form onSubmit={handleAdminLogin} className="space-y-4 max-w-sm mx-auto py-12 text-center w-full">
                  <p className="text-sm text-slate-500 mb-4">Input secure admin passcode to fetch submissions.</p>
                  <input 
                    type="password"
                    placeholder="Enter Admin Passcode"
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    data-testid="admin-passcode-input"
                    className="w-full px-4 py-3 rounded-full border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#335EEA] text-sm text-center"
                    required
                  />
                  {adminError && <p className="text-xs text-rose-600 font-bold">{adminError}</p>}
                  
                  <button
                    type="submit"
                    data-testid="admin-login-btn"
                    disabled={adminLoading}
                    className="w-full bg-[#111827] text-white rounded-full py-3 font-semibold font-heading hover:bg-slate-800 transition-all shadow"
                  >
                    {adminLoading ? "Authenticating..." : "Authenticate Admin"}
                  </button>
                </form>
              ) : (
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  
                  {/* Operations bar */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-500 font-medium">Total entries: <strong className="text-slate-900 font-bold">{waitlistEntries.length}</strong></span>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleRefreshAdminList}
                        className="p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-xs font-bold inline-flex items-center gap-1 text-slate-700"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refresh
                      </button>
                    </div>
                  </div>

                  {/* Submission Table list */}
                  <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl bg-slate-50 p-2">
                    {waitlistEntries.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-12">No waitlist entries yet.</p>
                    ) : (
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase font-heading tracking-wider">
                            <th className="p-3">Name</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Preference</th>
                            <th className="p-3">City</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {waitlistEntries.map((item) => (
                            <tr key={item.id} data-testid="admin-waitlist-entry" className="border-b border-slate-100 hover:bg-white transition-colors">
                              <td className="p-3 font-bold text-slate-800">{item.name}</td>
                              <td className="p-3 font-medium text-slate-600">{item.email}</td>
                              <td className="p-3"><span className="px-2 py-0.5 bg-indigo-50 text-[#335EEA] rounded font-bold uppercase text-[9px]">{item.role}</span></td>
                              <td className="p-3 text-slate-500">{item.city}</td>
                              <td className="p-3 text-right">
                                <button 
                                  onClick={() => handleDeleteWaitlistEntry(item.id)}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                                  title="Delete entry"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Footer options */}
                  <div className="pt-4 border-t border-slate-100 mt-4 flex justify-between">
                    <span className="text-[10px] text-slate-400">Authenticated via token verification successfully</span>
                    <button 
                      onClick={() => {
                        setAdminLoggedIn(false);
                        setAdminPasscode("");
                        setWaitlistEntries([]);
                      }}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      Logout Panel
                    </button>
                  </div>

                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------
          16. FOOTER
         ---------------------------------------------------- */}
      <footer className="bg-white border-t border-slate-100 py-16 px-6 text-left relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          
          {/* Logo & description column */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection("home")}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#335EEA] to-[#5B7CFF] flex items-center justify-center shadow-md">
                <Car className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-xl tracking-tight text-[#111827]">
                BhaiWay
              </span>
            </div>
            <p className="font-body text-sm text-slate-400 leading-relaxed max-w-sm">
              India&apos;s premium, high-trust carpooling platform designed specifically for professional daily commutes. Lowering commute costs, improving reliability and maximizing security.
            </p>
          </div>

          {/* Quick links */}
          <div className="md:col-span-3 flex flex-col gap-3 text-sm">
            <h4 className="font-heading font-bold text-slate-800 uppercase tracking-wider text-xs mb-1">Company</h4>
            <button onClick={() => scrollToSection("why-bhaiway")} className="text-left text-slate-500 hover:text-[#335EEA] transition-colors">Why BhaiWay</button>
            <button onClick={() => scrollToSection("features")} className="text-left text-slate-500 hover:text-[#335EEA] transition-colors">Features</button>
            <button onClick={() => scrollToSection("safety")} className="text-left text-slate-500 hover:text-[#335EEA] transition-colors">Safety Protocols</button>
            <button onClick={() => scrollToSection("how-it-works")} className="text-left text-slate-500 hover:text-[#335EEA] transition-colors">How It Works</button>
          </div>

          {/* Legal */}
          <div className="md:col-span-3 flex flex-col gap-3 text-sm">
            <h4 className="font-heading font-bold text-slate-800 uppercase tracking-wider text-xs mb-1">Resources & Legal</h4>
            <a href="#privacy" className="text-slate-500 hover:text-[#335EEA] transition-colors">Privacy Policy</a>
            <a href="#terms" className="text-slate-500 hover:text-[#335EEA] transition-colors">Terms of Service</a>
            <button onClick={() => scrollToSection("faq")} className="text-left text-slate-500 hover:text-[#335EEA] transition-colors">FAQ</button>
          </div>

          {/* Contact Details */}
          <div className="md:col-span-2 flex flex-col gap-2 text-sm text-slate-400">
            <h4 className="font-heading font-bold text-slate-800 uppercase tracking-wider text-xs mb-2">Contact</h4>
            <a 
              href="mailto:info@bhaiway.com" 
              data-testid="footer-contact-email"
              className="flex items-center gap-2 text-slate-500 hover:text-[#335EEA] transition-colors"
            >
              <Mail className="w-4 h-4" />
              info@bhaiway.com
            </a>
          </div>

        </div>

        {/* Copywrite */}
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <p className="flex items-center gap-1.5" data-testid="footer-credit">
            Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> at KodenzoLabs
          </p>
          <div className="flex items-center gap-3">
            <a 
              href="https://instagram.com" target="_blank" rel="noopener noreferrer"
              data-testid="footer-social-instagram" aria-label="Instagram"
              className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#335EEA] hover:border-[#335EEA]/40 transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a 
              href="https://x.com" target="_blank" rel="noopener noreferrer"
              data-testid="footer-social-x" aria-label="X"
              className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#335EEA] hover:border-[#335EEA]/40 transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a 
              href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
              data-testid="footer-social-linkedin" aria-label="LinkedIn"
              className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#335EEA] hover:border-[#335EEA]/40 transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
