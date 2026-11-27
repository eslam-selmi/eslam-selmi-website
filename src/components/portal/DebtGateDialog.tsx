import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";

export function DebtGateDialog({ open, onClose, isAr }: { open: boolean; onClose: () => void; isAr: boolean; contentLeft?: boolean }) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <AlertDialogContent dir={isAr ? "rtl" : "ltr"}>
        <AlertDialogHeader>
          <AlertDialogTitle>{isAr ? "الشهادة تتطلب سداد كامل رسوم الكورس" : "Your certificate needs the course fully paid"}</AlertDialogTitle>
          <AlertDialogDescription>
            {isAr
              ? "لإصدار الشهادة لازم يكون الكورس مسدداً بالكامل، بما فيها الأقساط القادمة، وتكون أنهيت كل محتوى الكورس المطلوب."
              : "To issue your certificate the course must be fully paid, including future installments."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter><AlertDialogAction onClick={onClose}>{isAr ? "حاضر" : "OK"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
