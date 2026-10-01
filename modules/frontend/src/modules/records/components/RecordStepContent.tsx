import { Step1Patient } from "./steps/Step1Patient";
import { Step2Facial } from "./steps/Step2Facial";
import { Step3Functional } from "./steps/Step3Functional";
import { Step4Occlusal } from "./steps/Step4Occlusal";
import { Step5Radiographic } from "./steps/Step5Radiographic";
import { Step6Diagnosis } from "./steps/Step6Diagnosis";
import { Step7Signatures } from "./steps/Step7Signatures";

interface RecordStepContentProps {
  step: number;
  recordNumber?: string;
}

/** Contenido del paso actual. */
export function RecordStepContent({ step, recordNumber }: RecordStepContentProps) {
  switch (step) {
    case 2:
      return <Step2Facial />;
    case 3:
      return <Step3Functional />;
    case 4:
      return <Step4Occlusal />;
    case 5:
      return <Step5Radiographic />;
    case 6:
      return <Step6Diagnosis />;
    case 7:
      return <Step7Signatures />;
    default:
      return <Step1Patient recordNumber={recordNumber} />;
  }
}
