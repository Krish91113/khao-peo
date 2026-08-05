import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Linkedin,
  Check,
  ChevronRight,
  Utensils,
  Coffee,
  Sandwich,
  CookingPot,
  Croissant,
  LayoutGrid,
  ClipboardList,
  Receipt,
  Users2,
  BookOpen,
  ArrowRight,
  Circle,
} from "lucide-react";

import khaoPeeoLogo from "@/assets/khao-peeo-logo.jpeg";
import netbroLogo from "@/assets/netbro-logo.jpeg";
import overviewDashboardImage from "@/assets/overview-dashboard.png";
import tableManagementImage from "@/assets/table-management.png";
import heroChef from "@/assets/hero-chef.png";
/* ------------------------------------------------------------------ */
/*  Fonts + design tokens                                              */
/* ------------------------------------------------------------------ */

const FontsAndTokens = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

    :root {
      --kp-orange: #E85D25;
      --kp-orange-dark: #C94E1C;
      --kp-ink: #1A1A1A;
      --kp-ink-soft: #5B5551;
      --kp-cream: #FAF8F5;
      --kp-line: #E9E2D8;
      --kp-charcoal: #1C1815;
      --kp-charcoal-soft: #8A8078;
    }

    .kp-root { font-family: 'Inter', sans-serif; color: var(--kp-ink); }
    .kp-display { font-family: 'Sora', sans-serif; }
  `}</style>
);

/* ------------------------------------------------------------------ */
/*  Reusable: stylised Khao Peeo product frame                         */
/*  (stands in for real product screenshots throughout the page)       */
/* ------------------------------------------------------------------ */

type FrameVariant = "hero" | "billing" | "tables" | "showcase";

const StatusDot = ({ tone }: { tone: "free" | "occupied" | "billing" }) => {
  const map = {
    free: "bg-emerald-500",
    occupied: "bg-[var(--kp-orange)]",
    billing: "bg-amber-500",
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${map[tone]}`} />;
};

const ProductFrame = ({ variant = "hero" }: { variant?: FrameVariant }) => {
  const tableStates: Array<"free" | "occupied" | "billing"> = [
    "occupied", "free", "billing", "free",
    "occupied", "occupied", "free", "billing",
    "free", "occupied", "free", "occupied",
  ];

  return (
    <div className="rounded-[14px] border border-[var(--kp-line)] bg-white shadow-[0_20px_60px_-25px_rgba(26,26,26,0.35)] overflow-hidden">
      {/* app chrome */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--kp-line)] bg-[#FDFCFA]">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-[var(--kp-orange)] flex items-center justify-center">
            <span className="text-white text-[11px] font-bold kp-display">K</span>
          </div>
          <span className="text-sm font-semibold kp-display text-[var(--kp-ink)]">Khao Peeo</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[11px] text-[var(--kp-ink-soft)] font-medium">
          <span className="text-[var(--kp-orange)] border-b-2 border-[var(--kp-orange)] pb-1">Tables</span>
          <span>Orders</span>
          <span>Billing</span>
          <span>Menu</span>
          <span>Staff</span>
        </div>
        <div className="h-6 w-6 rounded-full bg-[var(--kp-cream)] border border-[var(--kp-line)]" />
      </div>

      {/* body */}
      {variant === "billing" ? (
        <div className="grid grid-cols-5">
          <div className="col-span-3 p-4 space-y-2 border-r border-[var(--kp-line)]">
            <p className="text-[10px] uppercase tracking-wide text-[var(--kp-ink-soft)] mb-1">Order · Table 06</p>
            {[
              ["Butter Chicken", "1", "₹320"],
              ["Garlic Naan x3", "3", "₹150"],
              ["Paneer Tikka", "1", "₹260"],
              ["Masala Soda", "2", "₹120"],
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between text-[12px] py-1.5 border-b border-dashed border-[var(--kp-line)]">
                <span className="text-[var(--kp-ink)]">{row[0]}</span>
                <span className="text-[var(--kp-ink-soft)]">×{row[1]}</span>
                <span className="font-medium">{row[2]}</span>
              </div>
            ))}
          </div>
          <div className="col-span-2 p-4 bg-[var(--kp-cream)] flex flex-col justify-between">
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between text-[var(--kp-ink-soft)]"><span>Subtotal</span><span>₹850</span></div>
              <div className="flex justify-between text-[var(--kp-ink-soft)]"><span>CGST 2.5%</span><span>₹21.25</span></div>
              <div className="flex justify-between text-[var(--kp-ink-soft)]"><span>SGST 2.5%</span><span>₹21.25</span></div>
              <div className="h-px bg-[var(--kp-line)] my-2" />
              <div className="flex justify-between font-semibold kp-display text-[var(--kp-ink)]"><span>Total</span><span>₹892.50</span></div>
            </div>
            <button className="w-full mt-4 rounded-lg bg-[var(--kp-orange)] text-white text-[12px] font-semibold py-2">
              Generate Bill
            </button>
          </div>
        </div>
      ) : variant === "showcase" ? (
        <div className="grid grid-cols-4">
          <div className="col-span-3 p-5 grid grid-cols-4 gap-2.5">
            {tableStates.map((s, i) => (
              <div key={i} className="rounded-lg border border-[var(--kp-line)] p-2.5 bg-[#FDFCFA]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-[var(--kp-ink)]">T-{String(i + 1).padStart(2, "0")}</span>
                  <StatusDot tone={s} />
                </div>
                <div className="text-[9px] text-[var(--kp-ink-soft)]">
                  {s === "free" ? "Available" : s === "billing" ? "Bill due" : "4 guests"}
                </div>
              </div>
            ))}
          </div>
          <div className="col-span-1 p-4 border-l border-[var(--kp-line)] bg-[var(--kp-cream)] space-y-3">
            <p className="text-[10px] uppercase tracking-wide text-[var(--kp-ink-soft)]">Today</p>
            <div>
              <p className="text-lg font-bold kp-display text-[var(--kp-ink)]">₹45,250</p>
              <p className="text-[10px] text-[var(--kp-ink-soft)]">Net sales</p>
            </div>
            <div>
              <p className="text-lg font-bold kp-display text-[var(--kp-ink)]">127</p>
              <p className="text-[10px] text-[var(--kp-ink-soft)]">Bills generated</p>
            </div>
            <div className="pt-1">
              <p className="text-[10px] text-[var(--kp-ink-soft)] mb-1">Staff on shift</p>
              <div className="flex -space-x-1.5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-5 w-5 rounded-full bg-white border border-[var(--kp-line)]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : variant === "tables" ? (
        <div className="p-5 grid grid-cols-4 gap-3">
          {tableStates.slice(0, 8).map((s, i) => (
            <div key={i} className="rounded-lg border border-[var(--kp-line)] p-3 bg-[#FDFCFA]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[12px] font-semibold text-[var(--kp-ink)]">Table {i + 1}</span>
                <StatusDot tone={s} />
              </div>
              <div className="text-[10px] text-[var(--kp-ink-soft)]">
                {s === "free" ? "Available" : s === "billing" ? "Awaiting bill" : "Order in progress"}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // hero
        <div className="grid grid-cols-5">
          <div className="col-span-3 p-4 grid grid-cols-3 gap-2">
            {tableStates.slice(0, 9).map((s, i) => (
              <div key={i} className="rounded-md border border-[var(--kp-line)] p-2 bg-[#FDFCFA]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold">T{i + 1}</span>
                  <StatusDot tone={s} />
                </div>
              </div>
            ))}
          </div>
          <div className="col-span-2 p-4 bg-[var(--kp-cream)] border-l border-[var(--kp-line)] space-y-2">
            <p className="text-[10px] uppercase tracking-wide text-[var(--kp-ink-soft)]">Order · Table 04</p>
            {["Veg Biryani", "Butter Naan", "Cold Coffee"].map((item, i) => (
              <div key={i} className="flex justify-between text-[11px] border-b border-dashed border-[var(--kp-line)] pb-1.5">
                <span>{item}</span>
                <span className="text-[var(--kp-ink-soft)]">×1</span>
              </div>
            ))}
            <div className="pt-2 flex justify-between text-[12px] font-semibold kp-display">
              <span>Total</span>
              <span>₹540</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Reusable: real product screenshot presentation                     */
/* ------------------------------------------------------------------ */

type ScreenshotShowcaseProps = {
  image: string;
  alt: string;
  className?: string;
  priority?: boolean;
};

const ScreenshotShowcase = ({ image, alt, className = "", priority = false }: ScreenshotShowcaseProps) => (
  <motion.div
    whileHover={{ y: -6, scale: 1.01 }}
    transition={{ type: "spring", stiffness: 220, damping: 22 }}
    className={`relative overflow-hidden rounded-2xl border border-[var(--kp-line)] bg-white p-2 sm:p-3 shadow-[0_28px_80px_-34px_rgba(26,26,26,0.38)] ${className}`}
  >
    <div className="pointer-events-none absolute inset-x-8 top-0 h-24 rounded-full bg-[var(--kp-orange)]/10 blur-3xl" />
    <img
      src={image}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      className="relative z-10 block w-full rounded-xl object-cover transition-transform duration-700 hover:scale-[1.015]"
    />
  </motion.div>
);


/* ------------------------------------------------------------------ */
/*  Data                                                                */
/* ------------------------------------------------------------------ */

const navLinks = ["Product", "Solutions", "Pricing", "Resources", "About"];

const restaurantTypes = [
  { icon: Utensils, label: "Restaurant" },
  { icon: Coffee, label: "Café" },
  { icon: Sandwich, label: "QSR" },
  { icon: CookingPot, label: "Cloud Kitchen" },
  { icon: Croissant, label: "Bakery" },
];

const features = [
  {
    icon: LayoutGrid,
    title: "Table Management",
    description: "Track tables and restaurant-floor activity in real time, from a single connected view.",
    size: "large",
  },
  {
    icon: ClipboardList,
    title: "Order Management",
    description: "Keep every order organised through service, from the first ticket to the last.",
    size: "small",
  },
  {
    icon: Receipt,
    title: "Billing",
    description: "Handle restaurant billing through one connected workflow — quick, clear, accurate.",
    size: "small",
  },
  {
    icon: BookOpen,
    title: "Menu Management",
    description: "Manage the restaurant's menu, pricing and availability from the platform.",
    size: "small",
  },
  {
    icon: Users2,
    title: "Staff Management",
    description: "Support daily operations with role-based access for every member of the team.",
    size: "small",
  },
];

const whyItems = [
  {
    title: "Easy to use",
    description: "An interface designed for everyday restaurant operations, not IT departments.",
  },
  {
    title: "Built around restaurant workflows",
    description: "Tables, orders, staff and billing organised around how service actually happens.",
  },
  {
    title: "Role-based experience",
    description: "Give each team member access to the tools relevant to their work — nothing more.",
  },
  {
    title: "Everything connected",
    description: "Keep essential restaurant operations within one system, not five different apps.",
  },
];

const testimonials = [
  {
    name: "Aarav Mehta",
    role: "Restaurant Owner",
    city: "Mumbai",
    quote:
      "Khao Peeo has made our daily table and billing workflow much easier for the team. The interface is simple, and new staff can understand it quickly.",
    featured: true,
  },
  {
    name: "Neha Sharma",
    role: "Café Owner",
    city: "Pune",
    quote:
      "We wanted something straightforward for managing everyday restaurant operations. Khao Peeo gives our team a much cleaner workflow during busy hours.",
  },
  {
    name: "Rohan Patel",
    role: "Restaurant Manager",
    city: "Ahmedabad",
    quote:
      "The biggest improvement for us is having tables, orders, and billing organised in one place instead of jumping between different processes.",
  },
];

const footerColumns = [
  { title: "Product", links: ["Overview", "Features", "Pricing"] },
  { title: "Solutions", links: ["Restaurants", "Cafés", "QSRs", "Cloud Kitchens"] },
  { title: "Company", links: ["About", "Contact"] },
  { title: "Support", links: ["Help", "Login"] },
];

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[12px] tracking-[0.14em] uppercase font-semibold text-[var(--kp-orange)] mb-3">
    {children}
  </p>
);

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="kp-root min-h-screen bg-white">
      <FontsAndTokens />

      {/* ---------------------------------------------------------- */}
      {/* NAVIGATION                                                   */}
      {/* ---------------------------------------------------------- */}
      <header
        className={`sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[var(--kp-line)] transition-shadow ${scrolled ? "shadow-[0_2px_12px_-8px_rgba(26,26,26,0.25)]" : ""
          }`}
      >
        <div className="max-w-[1240px] mx-auto px-6 h-[68px] flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <img
              src={khaoPeeoLogo}
              alt="Khao Peeo logo"
              className="h-11 w-11 rounded-xl object-cover shadow-sm"
            />
            <div className="leading-tight">
              <span className="block kp-display font-bold text-[17px] text-[var(--kp-ink)]">Khao Peeo</span>
              <span className="block text-[10px] uppercase tracking-[0.16em] text-[var(--kp-ink-soft)]">Smart Restaurant POS</span>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-9">
            {navLinks.map((item) => (
              <a
                key={item}
                href="#"
                className="text-[14.5px] font-medium text-[var(--kp-ink)]/80 hover:text-[var(--kp-orange)] transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link to="/auth" className="text-[14.5px] font-medium text-[var(--kp-ink)]/80 hover:text-[var(--kp-orange)] transition-colors px-2">
              Login
            </Link>
            <Link to="/auth">
              <Button className="bg-[var(--kp-orange)] hover:bg-[var(--kp-orange-dark)] text-white rounded-lg px-5 h-10 text-[14.5px] font-semibold shadow-none">
                Book a Demo
              </Button>
            </Link>
          </div>

          <button className="lg:hidden" onClick={() => setMobileMenuOpen((o) => !o)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden border-t border-[var(--kp-line)] bg-white overflow-hidden"
            >
              <div className="px-6 py-5 flex flex-col gap-4">
                {navLinks.map((item) => (
                  <a key={item} href="#" className="text-[15px] font-medium text-[var(--kp-ink)]">
                    {item}
                  </a>
                ))}
                <Link to="/auth" className="text-[15px] font-medium text-[var(--kp-ink)]/80">Login</Link>
                <Link to="/auth">
                  <Button className="w-full bg-[var(--kp-orange)] hover:bg-[var(--kp-orange-dark)] text-white rounded-lg h-11">
                    Book a Demo
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ---------------------------------------------------------- */}
      {/* HERO                                                         */}
      {/* ---------------------------------------------------------- */}
      <section className="max-w-[1240px] mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <Eyebrow>Restaurant POS &amp; Management Software</Eyebrow>
            <h1 className="kp-display font-bold text-[42px] leading-[1.12] lg:text-[56px] lg:leading-[1.1] text-[var(--kp-ink)] mb-6">
              Everything your restaurant needs to{" "}
              <span className="text-[var(--kp-orange)]">run smoothly.</span>
            </h1>
            <p className="text-[17px] lg:text-[18px] leading-[1.6] text-[var(--kp-ink-soft)] max-w-[480px] mb-8">
              Manage tables, orders, billing, staff, and everyday restaurant operations from one simple platform built for modern food businesses.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link to="/auth">
                <Button className="bg-[var(--kp-orange)] hover:bg-[var(--kp-orange-dark)] text-white rounded-lg h-12 px-7 text-[15px] font-semibold w-full sm:w-auto">
                  Book a Free Demo
                </Button>
              </Link>
              <Button
                variant="outline"
                className="rounded-lg h-12 px-7 text-[15px] font-semibold border-[var(--kp-line)] text-[var(--kp-ink)] hover:bg-[var(--kp-cream)] w-full sm:w-auto"
              >
                Explore Khao Peeo
              </Button>
            </div>
            <p className="text-[13.5px] text-[var(--kp-ink-soft)]">
              Built for restaurants, cafés, QSRs, bakeries and cloud kitchens.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative flex justify-center items-center"
          >
            {/* Background Glow */}
            <div className="absolute w-[520px] h-[520px] rounded-full bg-orange-100 blur-3xl opacity-70" />

            <img
              src={heroChef}
              alt="Khao Peeo Hero"
              className="relative z-10 w-full max-w-[560px] object-contain animate-float drop-shadow-2xl"
            />
          </motion.div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* TRUST STRIP — RESTAURANT TYPES                               */}
      {/* ---------------------------------------------------------- */}
      <section className="border-y border-[var(--kp-line)] bg-[var(--kp-cream)]">
        <div className="max-w-[1240px] mx-auto px-6 py-12">
          <p className="text-center text-[15px] font-semibold text-[var(--kp-ink)] mb-8">
            Built for every kind of food business
          </p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6">
            {restaurantTypes.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 text-[var(--kp-ink)]">
                <Icon className="h-5 w-5 text-[var(--kp-orange)]" strokeWidth={1.75} />
                <span className="text-[15px] font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* PRODUCT INTRODUCTION                                         */}
      {/* ---------------------------------------------------------- */}
      <section className="max-w-[1240px] mx-auto px-6 py-24 lg:py-32">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="max-w-[640px] mb-14"
        >
          <Eyebrow>One platform. Everyday operations.</Eyebrow>
          <h2 className="kp-display font-bold text-[32px] lg:text-[42px] leading-[1.2] text-[var(--kp-ink)] mb-5">
            Restaurant management shouldn't feel complicated.
          </h2>
          <p className="text-[16.5px] leading-[1.7] text-[var(--kp-ink-soft)]">
            Khao Peeo brings the everyday work of running a restaurant — tables, orders, billing, menu and staff — into one straightforward interface, so your team can focus on service instead of switching between tools.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="relative"
        >
          <div className="absolute -inset-6 -z-10 rounded-[32px] bg-[var(--kp-orange)]/5 blur-2xl" />
          <ProductFrame variant="showcase" />
        </motion.div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* POS & BILLING                                                */}
      {/* ---------------------------------------------------------- */}
      <section className="bg-[var(--kp-cream)] py-24 lg:py-28">
        <div className="max-w-[1240px] mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <ProductFrame variant="billing" />
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <Eyebrow>POS &amp; Billing</Eyebrow>
            <h2 className="kp-display font-bold text-[30px] lg:text-[38px] leading-[1.2] text-[var(--kp-ink)] mb-5">
              Fast billing when every second matters.
            </h2>
            <p className="text-[16px] leading-[1.7] text-[var(--kp-ink-soft)] mb-6 max-w-[440px]">
              Take orders, apply the right tax split, and generate a clean, GST-ready bill without leaving the table view — built for the pace of real service.
            </p>
            <ul className="space-y-3">
              {["Accurate CGST/SGST calculation on every bill", "Split, merge or transfer orders in a few taps", "Print or share bills the moment service ends"].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-[15px] text-[var(--kp-ink)]">
                  <Check className="h-[18px] w-[18px] text-[var(--kp-orange)] mt-0.5 flex-shrink-0" strokeWidth={2.25} />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* TABLE & ORDER MANAGEMENT                                     */}
      {/* ---------------------------------------------------------- */}
      <section className="py-24 lg:py-28">
        <div className="max-w-[1240px] mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="order-2 lg:order-1">
            <Eyebrow>Table Management</Eyebrow>
            <h2 className="kp-display font-bold text-[30px] lg:text-[38px] leading-[1.2] text-[var(--kp-ink)] mb-5">
              See your restaurant floor at a glance.
            </h2>
            <p className="text-[16px] leading-[1.7] text-[var(--kp-ink-soft)] mb-6 max-w-[440px]">
              Every table shows its live status — free, occupied, or awaiting a bill — so your staff always know where to focus next, without walking the floor to check.
            </p>
            <ul className="space-y-3">
              {["Real-time status for every table in the house", "Understand order and billing state from one screen", "Move faster during peak service hours"].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-[15px] text-[var(--kp-ink)]">
                  <Check className="h-[18px] w-[18px] text-[var(--kp-orange)] mt-0.5 flex-shrink-0" strokeWidth={2.25} />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="order-1 lg:order-2">
            <ScreenshotShowcase image={tableManagementImage} alt="Khao Peeo table management dashboard" />
          </motion.div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* OPERATIONS WORKFLOW                                          */}
      {/* ---------------------------------------------------------- */}
      <section className="bg-[var(--kp-cream)] py-24 lg:py-28">
        <div className="max-w-[1240px] mx-auto px-6">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="kp-display font-bold text-[28px] lg:text-[36px] leading-[1.25] text-[var(--kp-ink)] text-center max-w-[720px] mx-auto mb-16"
          >
            From table to bill, keep the entire service connected.
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="flex flex-col md:flex-row items-stretch md:items-center gap-0"
          >
            {[
              { label: "Select Table", icon: LayoutGrid },
              { label: "Take Order", icon: ClipboardList },
              { label: "Manage Order", icon: Circle },
              { label: "Billing", icon: Receipt },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex-1 flex items-center">
                <div className="flex-1 flex flex-col items-center text-center py-6 md:py-0">
                  <div className="h-12 w-12 rounded-full border border-[var(--kp-line)] bg-white flex items-center justify-center mb-3">
                    <step.icon className="h-5 w-5 text-[var(--kp-orange)]" strokeWidth={1.75} />
                  </div>
                  <span className="text-[14.5px] font-semibold text-[var(--kp-ink)]">{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="hidden md:block h-4 w-4 text-[var(--kp-orange)]/50 flex-shrink-0 mx-2" />
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* FEATURES                                                     */}
      {/* ---------------------------------------------------------- */}
      <section className="max-w-[1240px] mx-auto px-6 py-24 lg:py-28">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-[640px] mb-14">
          <Eyebrow>Core capabilities</Eyebrow>
          <h2 className="kp-display font-bold text-[30px] lg:text-[40px] leading-[1.2] text-[var(--kp-ink)]">
            Everything you need for everyday restaurant operations.
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid lg:grid-cols-3 gap-6"
        >
          <motion.div
            variants={fadeUp}
            className="lg:col-span-2 lg:row-span-2 border border-[var(--kp-line)] rounded-xl p-8 lg:p-10 bg-[var(--kp-cream)] flex flex-col justify-between min-h-[280px]"
          >
            <div>
              <LayoutGrid className="h-7 w-7 text-[var(--kp-orange)] mb-5" strokeWidth={1.75} />
              <h3 className="kp-display font-bold text-[22px] text-[var(--kp-ink)] mb-2.5">Table Management</h3>
              <p className="text-[15px] leading-[1.65] text-[var(--kp-ink-soft)] max-w-[420px]">
                {features[0].description}
              </p>
            </div>
          </motion.div>

          {features.slice(1).map((f) => (
            <motion.div key={f.title} variants={fadeUp} className="border border-[var(--kp-line)] rounded-xl p-7">
              <f.icon className="h-6 w-6 text-[var(--kp-orange)] mb-4" strokeWidth={1.75} />
              <h3 className="kp-display font-bold text-[18px] text-[var(--kp-ink)] mb-2">{f.title}</h3>
              <p className="text-[14.5px] leading-[1.6] text-[var(--kp-ink-soft)]">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* FOOD BUSINESS TYPES — dark section                           */}
      {/* ---------------------------------------------------------- */}
      <section className="bg-[var(--kp-charcoal)] py-24 lg:py-28">
        <div className="max-w-[1240px] mx-auto px-6">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="kp-display font-bold text-[30px] lg:text-[40px] leading-[1.2] text-white max-w-[560px] mb-14"
          >
            Made for the way food businesses actually work.
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4"
          >
            {[
              { icon: Utensils, label: "Restaurants", note: "Full-service dine-in" },
              { icon: Coffee, label: "Cafés", note: "All-day counters" },
              { icon: Sandwich, label: "QSRs", note: "High-speed service" },
              { icon: CookingPot, label: "Cloud Kitchens", note: "Delivery-first ops" },
              { icon: Croissant, label: "Bakeries", note: "Counter + orders" },
            ].map(({ icon: Icon, label, note }) => (
              <motion.div
                key={label}
                variants={fadeUp}
                className="border border-white/10 rounded-xl p-6 hover:border-[var(--kp-orange)]/50 transition-colors"
              >
                <Icon className="h-6 w-6 text-[var(--kp-orange)] mb-8" strokeWidth={1.5} />
                <p className="kp-display font-semibold text-white text-[16px] mb-1">{label}</p>
                <p className="text-[13px] text-white/50">{note}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* WHY KHAO PEEO                                                */}
      {/* ---------------------------------------------------------- */}
      <section className="max-w-[1240px] mx-auto px-6 py-24 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-14">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="kp-display font-bold text-[30px] lg:text-[38px] leading-[1.25] text-[var(--kp-ink)]"
          >
            Restaurant software should simplify operations — not add more work.
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="space-y-8"
          >
            {whyItems.map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} className="flex gap-5 pb-8 border-b border-[var(--kp-line)] last:border-0 last:pb-0">
                <span className="kp-display text-[13px] font-semibold text-[var(--kp-orange)] pt-1 w-6 flex-shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="kp-display font-bold text-[18px] text-[var(--kp-ink)] mb-1.5">{item.title}</h3>
                  <p className="text-[15px] leading-[1.65] text-[var(--kp-ink-soft)]">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* TESTIMONIALS                                                 */}
      {/* ---------------------------------------------------------- */}
      <section className="bg-[var(--kp-cream)] py-24 lg:py-28">
        <div className="max-w-[1240px] mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-14">
            <Eyebrow>Customer stories</Eyebrow>
            <h2 className="kp-display font-bold text-[30px] lg:text-[38px] leading-[1.2] text-[var(--kp-ink)]">
              Loved by restaurant teams using Khao Peeo.
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="bg-white rounded-2xl border border-[var(--kp-line)] p-10 flex flex-col justify-between"
            >
              <p className="kp-display text-[22px] leading-[1.5] text-[var(--kp-ink)] mb-8">
                "{testimonials[0].quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-[var(--kp-orange)]/10 flex items-center justify-center kp-display font-bold text-[var(--kp-orange)]">
                  {testimonials[0].name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-[15px] text-[var(--kp-ink)]">{testimonials[0].name}</p>
                  <p className="text-[13px] text-[var(--kp-ink-soft)]">{testimonials[0].role} · {testimonials[0].city}</p>
                </div>
              </div>
            </motion.div>

            <div className="flex flex-col gap-6">
              {testimonials.slice(1).map((t) => (
                <motion.div
                  key={t.name}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="bg-white rounded-2xl border border-[var(--kp-line)] p-7 flex-1"
                >
                  <p className="text-[14.5px] leading-[1.65] text-[var(--kp-ink)] mb-6">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[var(--kp-orange)]/10 flex items-center justify-center kp-display font-bold text-[13px] text-[var(--kp-orange)]">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-[14px] text-[var(--kp-ink)]">{t.name}</p>
                      <p className="text-[12px] text-[var(--kp-ink-soft)]">{t.role} · {t.city}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* PRODUCT GLIMPSE                                               */}
      {/* ---------------------------------------------------------- */}
      <section className="max-w-[1240px] mx-auto px-6 py-24 lg:py-28">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="rounded-3xl border border-[var(--kp-line)] bg-[var(--kp-cream)] px-8 py-14 text-center lg:px-16"
        >
          <Eyebrow>Meet Khao Peeo</Eyebrow>
          <h2 className="kp-display mx-auto max-w-[720px] font-bold text-[30px] leading-[1.2] text-[var(--kp-ink)] lg:text-[42px]">
            A focused workspace built for faster, clearer restaurant operations.
          </h2>
          <p className="mx-auto mt-5 max-w-[620px] text-[16px] leading-[1.7] text-[var(--kp-ink-soft)]">
            The website shows only a carefully selected glimpse of the product. Detailed operational screens remain inside the secure application.
          </p>
        </motion.div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* DEMO CTA                                                     */}
      {/* ---------------------------------------------------------- */}
      <section className="bg-[var(--kp-charcoal)] py-24">
        <div className="max-w-[1240px] mx-auto px-6 text-center">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="kp-display font-bold text-[32px] lg:text-[44px] leading-[1.2] text-white mb-4"
          >
            Ready to simplify your restaurant operations?
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-[17px] text-white/60 mb-9"
          >
            See how Khao Peeo can fit into your restaurant's everyday workflow.
          </motion.p>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link to="/auth">
              <Button className="bg-[var(--kp-orange)] hover:bg-[var(--kp-orange-dark)] text-white rounded-lg h-12 px-8 text-[15px] font-semibold">
                Book a Free Demo
              </Button>
            </Link>
            <Button variant="outline" className="rounded-lg h-12 px-8 text-[15px] font-semibold border-white/25 text-white hover:bg-white/10 bg-transparent">
              Contact Us
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* DEMO FORM                                                    */}
      {/* ---------------------------------------------------------- */}
      <section className="max-w-[1240px] mx-auto px-6 py-24 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-16">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="kp-display font-bold text-[30px] lg:text-[36px] leading-[1.25] text-[var(--kp-ink)] mb-5">
              Let's talk about your restaurant.
            </h2>
            <p className="text-[16px] leading-[1.7] text-[var(--kp-ink-soft)] max-w-[420px]">
              Share a few details and our team will reach out to schedule a short walkthrough of Khao Peeo, tailored to how your restaurant operates.
            </p>
          </motion.div>

          <motion.form
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="grid sm:grid-cols-2 gap-4"
            onSubmit={(e) => e.preventDefault()}
          >
            {[
              { label: "Full Name", type: "text" },
              { label: "Restaurant Name", type: "text" },
              { label: "Phone Number", type: "tel" },
              { label: "Email", type: "email" },
              { label: "City", type: "text" },
            ].map((field) => (
              <div key={field.label} className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[var(--kp-ink)]">{field.label}</label>
                <input
                  type={field.type}
                  className="h-11 rounded-lg border border-[var(--kp-line)] px-3.5 text-[14.5px] outline-none focus:border-[var(--kp-orange)] transition-colors"
                  placeholder={field.label}
                />
              </div>
            ))}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[var(--kp-ink)]">Restaurant Type</label>
              <select className="h-11 rounded-lg border border-[var(--kp-line)] px-3.5 text-[14.5px] outline-none focus:border-[var(--kp-orange)] transition-colors bg-white">
                {["Restaurant", "Café", "QSR", "Cloud Kitchen", "Bakery", "Other"].map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <Button className="sm:col-span-2 bg-[var(--kp-orange)] hover:bg-[var(--kp-orange-dark)] text-white rounded-lg h-12 text-[15px] font-semibold mt-2">
              Request Demo
            </Button>
          </motion.form>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* FOOTER                                                       */}
      {/* ---------------------------------------------------------- */}
      <footer className="border-t border-[var(--kp-line)]">
        <div className="max-w-[1240px] mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={khaoPeeoLogo} alt="Khao Peeo logo" className="h-12 w-12 rounded-xl object-cover" />
                <div>
                  <span className="block kp-display font-bold text-[17px] text-[var(--kp-ink)]">Khao Peeo</span>
                  <span className="block text-[10px] uppercase tracking-[0.14em] text-[var(--kp-ink-soft)]">Smart POS for smart restaurants</span>
                </div>
              </div>
              <p className="text-[14px] leading-[1.6] text-[var(--kp-ink-soft)] max-w-[280px] mb-5">
                Restaurant POS, billing and management software built for modern food businesses.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://www.linkedin.com/in/krish9113/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Khao Peeo on LinkedIn"
                  className="h-9 w-9 rounded-full border border-[var(--kp-line)] flex items-center justify-center text-[var(--kp-ink-soft)] hover:-translate-y-1 hover:text-[var(--kp-orange)] hover:border-[var(--kp-orange)] transition-all"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="https://www.instagram.com/netbro.india/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="NetBro India on Instagram"
                  className="h-9 w-9 rounded-full border border-[var(--kp-line)] flex items-center justify-center text-[var(--kp-ink-soft)] hover:-translate-y-1 hover:text-[var(--kp-orange)] hover:border-[var(--kp-orange)] transition-all"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </div>

              <motion.a
                href="https://www.instagram.com/netbro.india/"
                target="_blank"
                rel="noreferrer"
                whileHover={{ y: -3 }}
                className="mt-7 inline-flex flex-col items-start gap-2 rounded-xl border border-[var(--kp-line)] bg-[var(--kp-cream)] px-4 py-3"
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--kp-ink-soft)]">Built under NetBro</span>
                <img src={netbroLogo} alt="NetBro logo" className="h-9 w-auto object-contain" />
              </motion.a>
            </div>

            {footerColumns.map((col) => (
              <div key={col.title}>
                <h4 className="kp-display font-semibold text-[14px] text-[var(--kp-ink)] mb-4">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-[14px] text-[var(--kp-ink-soft)] hover:text-[var(--kp-orange)] transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--kp-line)] mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[13px] text-[var(--kp-ink-soft)]">© 2026 Khao Peeo · A NetBro product</p>
            <div className="flex gap-6 text-[13px]">
              <a href="#" className="text-[var(--kp-ink-soft)] hover:text-[var(--kp-orange)] transition-colors">Privacy Policy</a>
              <a href="#" className="text-[var(--kp-ink-soft)] hover:text-[var(--kp-orange)] transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;