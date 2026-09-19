"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Infinity as InfinityIcon,
  HardDrive,
  Wifi,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingAbout() {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-20 max-w-4xl mx-auto space-y-16">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-mono shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
          <span>Origin &amp; Mission</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight font-heading">
          Why We Built ShareNut
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          How a frustrating workplace deadline and a 5 GB file led to creating a zero-cloud peer-to-peer file mesh.
        </p>
      </div>

      {/* Story Narrative Article */}
      <div className="space-y-10 text-slate-700 text-base leading-relaxed">
        {/* Section 1: The Breaking Point */}
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
            The Breaking Point
          </h2>
          <p>
            I was sitting right next to a colleague at work. We had to meet a tight deadline, and in order to finish our work, he had to share a large project file with me.
          </p>
          <p>
            The file was too large to email, we didn&apos;t have a USB stick with us, and only one of us had a MacBook, so we couldn&apos;t use AirDrop. Ultimately, the file had to be split and sent via a third-party cloud transfer service.
          </p>

          {/* Quote Callout */}
          <div className="p-5 sm:p-6 rounded-xl border border-amber-200 bg-amber-50/50 text-slate-800 space-y-2 relative">
            <Quote className="h-6 w-6 text-amber-500/40 absolute top-4 right-4" />
            <p className="text-base sm:text-lg font-medium italic text-slate-900">
              “It was an incredibly frustrating experience. I could hand my colleague a coffee or a snack from the table in two seconds, but the only way I could send him a file was by literally sending it to another continent first.”
            </p>
          </div>

          {/* ShareNut File Transfer Comic */}
          <div className="flex justify-center my-6">
            <div className="border-2 border-black rounded-xl overflow-hidden max-w-[380px] w-full shadow-xs">
              <Image
                src="/images/sharenut-comic.png"
                alt="ShareNut File Transfer Dilemma Comic"
                width={1054}
                height={1272}
                className="w-full h-auto object-contain block"
                priority
              />
            </div>
          </div>
        </div>

        {/* Section 2: There Had to Be Another Way */}
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
            There Had to Be Another Way
          </h2>
          <p>
            This wasn&apos;t the first time this had happened. Sending large files via email or with third-party tools such as WhatsApp or Slack is practically impossible. It forces you to rely on yet another service with annoying limitations:
          </p>
          <ul className="space-y-2 list-disc pl-5 text-slate-600">
            <li>Arbitrary file size limits and artificial bandwidth caps</li>
            <li>Required account registrations, spam newsletters, and tracking</li>
            <li>Slow upload and download times even when sitting right next to each other</li>
            <li>Files stored on an unknown third-party server somewhere on the internet</li>
          </ul>
          <p>
            There&apos;s always a catch, and no matter which service you use, your sensitive data ends up residing in the cloud on someone else&apos;s hardware.
          </p>
        </div>

        {/* Section 3: Building the Solution */}
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
            Building the Solution: ShareNut
          </h2>
          <p>
            It simply had to change, so I started working on a solution: <strong>ShareNut</strong>.
          </p>
          <p>
            With ShareNut, nothing is ever stored online. You send your files directly from your computer or mobile phone through native in-browser WebRTC DataChannels. There are no file size limits, no speed limits, and if you&apos;re on the same local network, your data doesn&apos;t even have to leave the building.
          </p>

          {/* Core Guarantees 3-Column Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <HardDrive className="h-4 w-4 text-amber-600" />
                <span>Zero Cloud Storage</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Nothing is ever saved on a server. Files stream directly peer-to-peer from memory to disk.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <InfinityIcon className="h-4 w-4 text-emerald-600" />
                <span>No File Size Limits</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Whether 500 MB, 10 GB, or 100 GB, your transfer is bounded only by your local storage.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Wifi className="h-4 w-4 text-indigo-600" />
                <span>Local Network Speeds</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                When on the same Wi-Fi or LAN, your transfer speeds match your physical router wire speed.
              </p>
            </div>
          </div>

          <p className="pt-2 text-slate-900 font-medium">
            In our opinion: <em>file transfer as it always should have been.</em>
          </p>
        </div>
      </div>

      {/* Bottom CTA Box */}
      <div className="p-8 sm:p-10 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-4 shadow-xs">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
          Ready to experience direct file transfer?
        </h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          No signups. No cloud upload waits. Drop a file and start streaming immediately.
        </p>
        <div className="pt-2">
          <Link href="/dashboard">
            <Button size="lg" className="h-11 px-8 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm gap-2 shadow-xs shadow-amber-600/20 cursor-pointer transition-colors">
              Launch Station Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
