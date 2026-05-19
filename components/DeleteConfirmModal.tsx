"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

type DeleteConfirmModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  itemName?: string;
  itemLabel?: string;
  onConfirm: () => void;
  isDeleting: boolean;
};

export function DeleteConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  itemLabel = "item",
  onConfirm,
  isDeleting,
}: DeleteConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold text-gray-900">
                {title ?? `Move to Trash`}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-gray-500 leading-relaxed">
                {description ?? (
                  <>
                    Are you sure you want to move{" "}
                    {itemName ? (
                      <>
                        <span className="font-semibold text-gray-700">&ldquo;{itemName}&rdquo;</span>{" "}
                      </>
                    ) : (
                      `this ${itemLabel} `
                    )}
                    to trash? You can restore it later from the Trash section.
                  </>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-xl gap-2"
          >
            {isDeleting ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {isDeleting ? "Moving to Trash…" : "Move to Trash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
