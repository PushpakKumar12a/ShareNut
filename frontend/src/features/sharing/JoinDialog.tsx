"use client";

import React, { useState } from "react";
import { UserPlus, ArrowRight, QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface JoinTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (sessionCode: string) => void;
  onOpenQrScanner?: () => void;
}

export function JoinTransferDialog({
  isOpen,
  onClose,
  onJoin,
  onOpenQrScanner,
}: JoinTransferDialogProps) {
  const [sessionCode, setSessionCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionCode.trim()) {
      onJoin(sessionCode.trim().toUpperCase());
      setSessionCode("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Join Transfer Session
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Enter the session code or scan QR code shared by your peer.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500 block mb-1.5">
              Room Session Code
            </label>
            <Input
              type="text"
              placeholder="e.g. NUT-XNCWV"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              className="font-mono text-sm uppercase tracking-wider h-11 px-4 bg-slate-50 border-slate-200"
              autoFocus
            />
          </div>

          {onOpenQrScanner && (
            <Button
              type="button"
              variant="outline"
              onClick={onOpenQrScanner}
              className="w-full text-xs h-9 font-semibold gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <QrCode className="h-4 w-4 text-purple-600" />
              <span>Scan QR Code with Camera</span>
            </Button>
          )}

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!sessionCode.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 cursor-pointer"
            >
              <span>Connect</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
