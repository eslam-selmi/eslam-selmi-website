import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";

export function DebtGateDialog({ open, onClose, isAr }: { open: boolean; onClose: () => void; isAr: boolean }) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <AlertDialogContent dir={isAr ? "rtl" : "ltr"}>
        <AlertDialogHeader>
          <AlertDialogTitle>{isAr ? "لازم تسدد المستحقات أولاً" : "Please pay what is due first"}</AlertDialogTitle>
          <AlertDialogDescription>
            {isAr ? "عليك رصيد غير مسدد في الكورس. بعد سداد كامل المستحقات (بما فيها الأقساط القادمة) تقدر تصدر شهادتك فوراً." : "The course is not fully paid yet (including future installments). Once it is fully paid you can issue your certificate right away."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter><AlertDialogAction onClick={onClose}>{isAr ? "حاضر" : "OK"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
