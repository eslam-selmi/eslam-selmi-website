import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";

export function DebtGateDialog({ open, onClose, isAr, contentLeft = false }: { open: boolean; onClose: () => void; isAr: boolean; contentLeft?: boolean }) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <AlertDialogContent dir={isAr ? "rtl" : "ltr"}>
        <AlertDialogHeader>
          <AlertDialogTitle>{isAr ? "الشهادة تتطلب سداد كامل رسوم الكورس" : "Your certificate needs the course fully paid"}</AlertDialogTitle>
          <AlertDialogDescription>
            {isAr
              ? "لإصدار الشهادة لازم يكون الكورس مسدداً بالكامل، بما فيها الأقساط القادمة، وتكون أنهيت كل محتوى الكورس المطلوب."
              : "To issue your certificate the course must be fully paid, including future installments, and you must have completed all required course content."}
            {" "}
            {contentLeft
              ? (isAr ? "حالياً: السداد غير مكتمل ولسه فيه محتوى مطلوب." : "Right now: payment is not complete and some required content is still open.")
              : (isAr ? "المحتوى مكتمل عندك. بمجرد اكتمال السداد تقدر تصدر الشهادة فوراً." : "Your content is complete. As soon as the course is fully paid you can issue it right away.")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter><AlertDialogAction onClick={onClose}>{isAr ? "حاضر" : "OK"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
