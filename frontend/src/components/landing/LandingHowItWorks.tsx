"use client";

import React, { useState } from "react";
import Image from "next/image";

import { FileUp, QrCode, Network, DownloadCloud } from "lucide-react";

interface StepItem {
  number: string;
  stepName: string;
  title: string;
  description: string;
  techSpec: string;
  icon: React.ElementType;
}

const WORKFLOW_STEPS: StepItem[] = [
  {
    number: "01",
    stepName: "Choose Your Files",
    title: "Pick What You Want to Share",
    description:
      "Select one or more files from your device. Your files stay on your device and are prepared for a fast, reliable transfer.",
    techSpec: "Your files stay private",
    icon: FileUp,
  },

  {
    number: "02",
    stepName: "Share the Link",
    title: "Send a Link or Scan the QR",
    description:
      "A simple sharing link and QR code are created for you. Send the link to the other person or let them scan the code.",
    techSpec: "No account needed",
    icon: QrCode,
  },

  {
    number: "03",
    stepName: "Connect Directly",
    title: "Your Devices Connect",
    description:
      "Once the other person joins, your devices connect directly to each other. Your files don't need to be uploaded to a cloud server.",
    techSpec: "Direct device-to-device",
    icon: Network,
  },

  {
    number: "04",
    stepName: "Start Sharing",
    title: "Fast, Reliable Transfer",
    description:
      "Your files are sent directly between the two devices. The other person gets the complete file ready to use when the transfer finishes.",
    techSpec: "Fast & verified",
    icon: DownloadCloud,
  },
];

export function LandingHowItWorks() {
  const [activeStep, setActiveStep] = useState<number>(0);

  return (
    <section
      id="how-it-works"
      className="relative border-t border-slate-200 bg-white px-4 py-14 sm:px-6 sm:py-20"
    >
      <div className="mx-auto max-w-6xl space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 text-xs font-mono text-amber-800 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            <span>Workflow &amp; Mechanics</span>
          </div>

          <h2 className="font-heading text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            How Peer-to-Peer Transfer Works
          </h2>

          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            No accounts, no cloud relays, and zero upload wait times. A direct
            hardware-to-hardware data tunnel between browsers from start to
            finish.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="relative w-full overflow-hidden rounded-lg border border-slate-100 bg-[#faf8f5] sm:rounded-xl">
          <Image
            src="/images/arch.png"
            alt="ShareNut Direct Mesh vs Centralized Cloud Relay Architecture"
            width={1920}
            height={1080}
            className="h-auto w-full object-contain"
            priority
          />
        </div>

        {/* Process Pipeline */}
        <div className="space-y-7 pt-2 sm:space-y-8 sm:pt-4">
          {/* Pipeline Header */}
          <div className="space-y-1 text-center">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
              Step-by-Step Execution
            </span>

            <h3 className="font-heading text-lg font-bold text-slate-900 sm:text-xl">
              The 4-Stage Transfer Pipeline
            </h3>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Desktop Connecting Line */}
            <div className="absolute left-[12%] right-[12%] top-7 hidden h-0.5 bg-slate-200 md:block" />

            {/* Mobile Vertical Line */}
            <div className="absolute bottom-8 left-[27px] top-8 w-0.5 bg-slate-200 md:hidden" />

            <div className="relative grid grid-cols-1 gap-7 md:grid-cols-4 md:gap-6">
              {WORKFLOW_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = activeStep === idx;

                return (
                  <div
                    key={step.number}
                    onClick={() => setActiveStep(idx)}
                    className="group relative flex cursor-pointer items-start gap-4 text-left md:flex-col md:items-center md:gap-0 md:space-y-3 md:text-center"
                  >
                    {/* Icon */}
                    <div
                      className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300
                        ${
                          isActive
                            ? "scale-105 border-amber-600 bg-amber-600 text-white shadow-md ring-4 ring-amber-100"
                            : "border-slate-300 bg-white text-slate-700 shadow-2xs group-hover:border-amber-500 group-hover:text-amber-600"
                        }
                      `}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 space-y-2 md:flex-none">
                      {/* Step Meta */}
                      <span
                        className={`
                          block
                          font-mono
                          text-[10px]
                          font-bold
                          uppercase
                          tracking-wider
                          transition-colors
                          sm:text-[11px]
                          ${
                            isActive
                              ? "font-extrabold text-amber-600"
                              : "text-slate-400 group-hover:text-slate-700"
                          }
                        `}
                      >
                        Step {step.number} • {step.stepName}
                      </span>

                      {/* Title */}
                      <h4 className="font-heading text-base font-bold text-slate-900">
                        {step.title}
                      </h4>

                      {/* Description */}
                      <p className="max-w-xs text-xs leading-relaxed text-slate-600">
                        {step.description}
                      </p>

                      {/* Tech Spec */}
                      <span
                        className={`
                          inline-block
                          rounded-full
                          border
                          px-2.5
                          py-0.5
                          font-mono
                          text-[10px]
                          transition-colors
                          sm:text-[11px]
                          ${
                            isActive
                              ? "border-amber-200 bg-amber-50 font-semibold text-amber-800"
                              : "border-slate-200 bg-slate-100 text-slate-500"
                          }
                        `}
                      >
                        {step.techSpec}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Technical Specs */}
        <div className="border-t border-slate-200 pt-5 sm:pt-6">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center font-mono text-[10px] text-slate-600 sm:gap-x-4 sm:text-xs lg:gap-x-6">
            <span className="flex items-center gap-1.5 font-medium text-slate-800">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              Direct SCTP Transport
            </span>

            <span className="text-slate-300">•</span>

            <span>DTLS 1.3 (AES-GCM)</span>

            <span className="text-slate-300">•</span>

            <span>SHA-256 Root Verification</span>

            <span className="text-slate-300">•</span>

            <span>0 Bytes Stored on Server</span>

            <span className="text-slate-300">•</span>

            <span>Full Hardware Throughput</span>
          </div>
        </div>
      </div>
    </section>
  );
}
