"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-orange-900/10 bg-white/85 backdrop-blur-md sticky top-0 z-50 select-none">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group focus:outline-none">
          <div className="flex h-9 w-9 items-center justify-center">
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
              Share <span className="text-orange-600">Nut</span>
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-6 text-xs font-medium text-slate-600">
            <Link href="/#how-it-works" className="hover:text-slate-900 transition-colors">
              Workflow
            </Link>
            <Link href="/#architecture" className="hover:text-slate-900 transition-colors">
              Architecture
            </Link>
            <Link href="/#security" className="hover:text-slate-900 transition-colors">
              Security
            </Link>
            <Link href="/#faq" className="hover:text-slate-900 transition-colors">
              FAQ
            </Link>
            <Link href="/about" className="hover:text-slate-900 transition-colors">
              About
            </Link>
          </nav>

          <Link href="/dashboard">
            <Button size="sm" className="h-9 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs gap-1.5 shadow-xs shadow-orange-600/20 cursor-pointer">
              <span>Launch Station</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <Button
          type="button"
          id="landing-mobile-menu-toggle"
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="md:hidden h-9 w-9 rounded-xl border-slate-200 bg-slate-50 text-slate-700 hover:bg-orange-50 hover:text-orange-900 hover:border-orange-200 transition-colors cursor-pointer"
          aria-label="Toggle Navigation Menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <X className="h-4.5 w-4.5" />
          ) : (
            <Menu className="h-4.5 w-4.5" />
          )}
        </Button>
      </div>

      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 top-16 bg-slate-950/20 backdrop-blur-xs z-40 animate-in fade-in duration-150"
          aria-hidden="true"
        />
      )}

      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 inset-x-0 bg-white/95 backdrop-blur-md border-b border-orange-900/10 shadow-xl z-50 px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-1">
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-900 transition-colors"
            >
              Workflow &amp; Mechanics
            </Link>
            <Link
              href="/#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-900 transition-colors"
            >
              Architecture
            </Link>
            <Link
              href="/#security"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-900 transition-colors"
            >
              Security
            </Link>
            <Link
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-900 transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-900 transition-colors"
            >
              About
            </Link>
          </nav>

          <div className="pt-2 border-t border-slate-100">
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full h-10 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm rounded-lg gap-2 shadow-xs shadow-orange-600/20 cursor-pointer">
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