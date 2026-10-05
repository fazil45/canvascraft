"use client";
import { Button } from "@/components/ButtonComponent";
import { Card } from "@/components/CardComponent";
import CTA from "@/components/LandingPage/CTA";
import Features from "@/components/LandingPage/Features";
import Footer from "@/components/LandingPage/Footer";
import Hero from "@/components/LandingPage/Hero";
import NavBar from "@/components/NavBar";
import ThemeToggle from "@/components/ThemeToggleComponent";
import {
  ArrowRight,
  Download,
  Layers,
  MousePointer2,
  Palette,
  PenTool,
  Shapes,
  Share2,
  Sparkles,
  User,
  Zap,
  ZoomIn,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LandingPage() {
  return (
    <main>
      <div>
        <div className="min-h-screen bg-gray-50 text-slate-900 opacity-80 transition-colors dark:bg-[#0a0a0f] dark:text-slate-100">
          <NavBar />
          <Hero />
          <Features />
          <CTA />
          <Footer />
        </div>
      </div>
    </main>
  );
}
