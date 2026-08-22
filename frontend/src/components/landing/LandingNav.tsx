"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-amber-900/10 bg-white/85 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-1">
          <div className="flex h-8 w-8 items-center justify-center">
            <Image
              src="/sharenut-logo.png"
              alt="ShareNut Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              priority
            />
          </div>

          <div className="flex items-center">
            <span className="text-lg font-black tracking-tight text-slate-900 font-heading">
              Share <span className="text-amber-600">Nut</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
          <Link href="/#how-it-works" className="hover:text-slate-900 transition-colors">
            Workflow
          </Link>
          <Link href="/architecture" className="hover:text-slate-900 transition-colors">
            Architecture
          </Link>
          <Link href="/security" className="hover:text-slate-900 transition-colors">
            Security
          </Link>
          <Link href="/faq" className="hover:text-slate-900 transition-colors">
            FAQ
          </Link>
          <Link href="/about" className="hover:text-slate-900 transition-colors">
            About
          </Link>
        </nav>

        <button
          type="button"
          id="landing-mobile-menu-toggle"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-200 transition-colors cursor-pointer"
          aria-label="Toggle Navigation Menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <X className="h-4.5 w-4.5" />
          ) : (
            <Menu className="h-4.5 w-4.5" />
          )}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 top-14 bg-slate-950/20 backdrop-blur-xs z-40 animate-in fade-in duration-150"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-14 inset-x-0 bg-white/95 backdrop-blur-md border-b border-amber-900/10 shadow-xl z-50 px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-1">
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
            >
              Workflow &amp; Mechanics
            </Link>
            <Link
              href="/architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
            >
              Architecture
            </Link>
            <Link
              href="/security"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
            >
              Security
            </Link>
            <Link
              href="/faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
            >
              About
            </Link>
          </nav>

          <div className="pt-2 border-t border-slate-100">
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-lg gap-2 shadow-xs shadow-amber-600/20 cursor-pointer">
                <span>Launch Station</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}