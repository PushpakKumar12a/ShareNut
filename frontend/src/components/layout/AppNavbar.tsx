"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Laptop,
  QrCode,
  Copy,
  Check,
  RotateCcw,
  User as UserIcon,
  Menu,
  X,
} from "lucide-react";
import { usePeerStore } from "@/features/mesh/peerStore";
import { useEngineState } from "@/features/transfer/engine/EngineContext";
import { ShareSessionDialog } from "@/features/sharing/ShareDialog";
import { cn } from "@/lib/utils";

interface AppNavbarProps {
  signalingConnected?: boolean;
  sessionCode?: string;
  onOpenShare?: () => void;
}

export function AppNavbar({
  signalingConnected,
  sessionCode,
  onOpenShare,
}: AppNavbarProps) {
  const pathname = usePathname();
  const { user, device, logout } = usePeerStore();
  const engineState = useEngineState();

  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [internalShareOpen, setInternalShareOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        !(event.target as HTMLElement).closest("#mobile-menu-toggle")
      ) {
        setMobileMenuOpen(false);
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside, { passive: true });
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isConnected =
    signalingConnected !== undefined
      ? signalingConnected
      : engineState.signalingConnected;

  const currentSessionCode = mounted
    ? (sessionCode !== undefined ? sessionCode : engineState.sessionCode || "NUT-ROOM1")
    : (sessionCode || "NUT-ROOM1");

  const connectedPeersCount = engineState.peers ? engineState.peers.size : 0;

  const handleCopySession = () => {
    if (currentSessionCode) {
      navigator.clipboard.writeText(currentSessionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareClick = () => {
    if (onOpenShare) {
      onOpenShare();
    } else {
      setInternalShareOpen(true);
    }
  };

  const handleResetNode = async (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setMobileMenuOpen(false);
    await logout();
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    {
      label: "Devices",
      href: "/devices",
      icon: Laptop,
      badge: connectedPeersCount > 0 ? connectedPeersCount : undefined,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md select-none transition-all">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-7 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus:outline-none"
            >
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
              <span className="text-lg font-black tracking-tight text-slate-900 font-heading">
                Share <span className="text-amber-600">Nut</span>
              </span>
            </Link>

            <div className="hidden md:block h-5 w-[1px] bg-slate-200" />

            <nav className="hidden md:flex items-center gap-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all",
                      isActive
                        ? "bg-amber-50 text-amber-800 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-amber-600 text-white text-[10px] font-bold leading-none">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">

            <div className="hidden lg:inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/90 px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span className="text-[11px]">
                {isConnected ? "Signaling: Connected" : "Connecting..."}
              </span>
            </div>

            {currentSessionCode && (
              <div className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-amber-200 bg-amber-50/80 px-2 sm:px-3 py-1 shadow-2xs whitespace-nowrap">
                <span className="hidden sm:inline text-[9px] font-extrabold text-amber-700 uppercase tracking-wider">
                  Room
                </span>
                <span
                  className="font-mono text-[11px] sm:text-xs font-extrabold text-amber-900 tracking-wider whitespace-nowrap"
                  suppressHydrationWarning
                >
                  {currentSessionCode}
                </span>

                <button
                  onClick={handleCopySession}
                  className="flex h-5 w-5 items-center justify-center rounded-md text-amber-700 hover:text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                  title="Copy Room Code"
                  type="button"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>

                <button
                  onClick={handleShareClick}
                  className="flex h-5 w-5 items-center justify-center rounded-md text-amber-700 hover:text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                  title="Share QR Code"
                  type="button"
                >
                  <QrCode className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              type="button"
              className={cn(
                "md:hidden flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer",
                mobileMenuOpen
                  ? "bg-slate-100 border-slate-300 text-slate-900"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              )}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="h-4.5 w-4.5" />
              ) : (
                <Menu className="h-4.5 w-4.5" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 top-16 bg-slate-950/40 backdrop-blur-xs z-40 animate-in fade-in duration-150"
            aria-hidden="true"
          />
        )}

        {mobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden fixed top-16 inset-x-0 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain bg-white border-b border-slate-200/90 shadow-2xl z-50 px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-150"
          >

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Navigation
              </span>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors border",
                        isActive
                          ? "bg-amber-50 border-amber-200 text-amber-800 shadow-2xs font-bold"
                          : "bg-slate-50/70 border-slate-200/70 text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="inline-flex items-center justify-center min-w-4 h-4 px-1.5 rounded-full bg-amber-600 text-white text-[10px] font-bold">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white font-bold text-xs shadow-2xs">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {mounted ? user?.username || "Local Peer Node" : "Local Peer Node"}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {mounted ? device?.device_name || "Web Browser" : "Web Browser"}
                    </div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 text-[11px] font-medium shrink-0">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                    }`}
                  />
                  <span className={isConnected ? "text-emerald-700 text-[10px] font-bold" : "text-amber-700 text-[10px] font-bold"}>
                    {isConnected ? "Connected" : "Connecting"}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  Device Identity
                </span>
                <button
                  onClick={handleResetNode}
                  type="button"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="h-3 w-3 text-slate-500" />
                  <span>Regenerate ID</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <ShareSessionDialog
        isOpen={internalShareOpen}
        onClose={() => setInternalShareOpen(false)}
        sessionCode={currentSessionCode}
      />
    </>
  );
}
