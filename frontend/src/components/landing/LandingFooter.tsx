"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-amber-900/10 bg-[#f7f4ee]/80 py-7 text-xs text-stone-600 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-5 px-4 sm:px-6">

        {/* Main Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          {/* Brand */}
          <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left">
            <Link href="/" className="flex items-center">
              <div className="flex h-7 w-7 items-center justify-center">
                <Image
                  src="/sharenut-logo.png"
                  alt="ShareNut Logo"
                  width={24}
                  height={24}
                  className="h-5 w-5 object-contain"
                />
              </div>

              <span className="font-heading text-base font-bold text-stone-900">
                Share<span className="text-amber-600">Nut</span>
              </span>
            </Link>

            <p className="text-[11px] text-slate-500 sm:text-xs">
              Decentralized in-browser WebRTC file mesh
            </p>
          </div>

          {/* GitHub + Open Source */}
          <div className="flex items-center justify-center gap-2.5 sm:justify-end">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-700 shadow-2xs transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <GithubIcon className="h-3.5 w-3.5 text-slate-800" />

              <span>GitHub</span>

              <ArrowUpRight className="h-3 w-3 text-slate-400" />
            </a>

            <div className="flex h-8 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 font-mono text-[10px] text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Open Source</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center gap-3 border-t border-slate-200/70 pt-4 text-center font-mono text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:text-left sm:text-[11px]">

          {/* Copyright */}
          <div>
            © {new Date().getFullYear()} ShareNut. Zero server storage by design.
          </div>

          {/* Legal / Policy Navigation */}
          <nav className="flex items-center gap-4 text-slate-500">
            <Link
              href="/privacy"
              className="transition-colors hover:text-slate-900"
            >
              Privacy Policy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}