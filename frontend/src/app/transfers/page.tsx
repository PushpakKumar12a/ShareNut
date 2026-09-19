"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEngineState } from "@/features/transfer/engine/EngineContext";

function TransfersRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const engineState = useEngineState();

  useEffect(() => {
    const sessionCode =
      searchParams.get("session") || engineState.sessionCode || "";
    const activeFile = engineState.activeFiles[0];

    if (activeFile && activeFile.isSender) {
      router.replace(
        `/transfers/${activeFile.fileId}${sessionCode ? `?session=${sessionCode}` : ""}`,
      );
    } else {
      router.replace(
        `/dashboard${sessionCode ? `?session=${sessionCode}` : ""}`,
      );
    }
  }, [router, searchParams, engineState]);

  return <div className="min-h-screen bg-[#faf8f5]" />;
}

export default function TransfersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf8f5]" />}>
      <TransfersRedirect />
    </Suspense>
  );
}
