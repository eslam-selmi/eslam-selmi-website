import { CertificatePreview } from "@/components/certificates/CertificateDocument";
export type CertificateData = {
  certificateId: string; traineeName: string; courseName: string; trainingHours: string; issueDate: string; verificationUrl: string;
};
export function CertificateTemplate({ data }: { data: CertificateData }) {
  return <CertificatePreview payload={{ certificateId: data.certificateId, studentName: data.traineeName, courseTitle: data.courseName, totalHours: Number.parseFloat(data.trainingHours) || 0, issueDate: new Date(data.issueDate), lang: "en" }} />;
}
export default CertificateTemplate;
