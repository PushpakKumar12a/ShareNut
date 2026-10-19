import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import LandingLayout from "@/components/layout/LandingLayout";

export default function NotFound() {
  return (
    <LandingLayout>
      <main className="flex min-h-[75vh] items-center px-6 py-20 sm:px-12 lg:px-20">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 border-y border-stone-200 py-16 md:grid-cols-[1.2fr_1fr] md:gap-16 md:py-24">
          <div className="min-w-0">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">
              Error <span className="text-stone-400">/</span> 404
            </p>

            <h1 className="font-heading text-[clamp(6rem,17vw,13rem)] font-bold leading-[0.8] tracking-[-0.09em] text-stone-900">
              404<span className="text-orange-600">.</span>
            </h1>
          </div>

          <div className="max-w-md md:border-l md:border-stone-200 md:pl-12">
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              Lost your way?
            </h2>

            <p className="mt-5 text-base leading-7 text-stone-500">
              This page isn&apos;t available. The link may not exist,
              or the page may have moved.
            </p>

            <Link
              href="/"
              className="mt-8 inline-flex h-12 items-center gap-3 rounded-lg bg-orange-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
            >
              Return to ShareNut
              <ArrowUpRight className="h-4 w-4" />
            </Link>

            <p className="mt-8 text-xs text-stone-400">
              Nothing to see here. Your files remain yours.
            </p>
          </div>
        </section>
      </main>
    </LandingLayout>
  );
}
