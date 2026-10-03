import { Step1Patient } from "./steps/Step1Patient";
import { Step2Facial } from "./steps/Step2Facial";
import { Step3Functional } from "./steps/Step3Functional";
import { Step4Occlusal } from "./steps/Step4Occlusal";
import { Step5Models } from "./steps/Step5Models";
import { Step6Radiographic } from "./steps/Step6Radiographic";
import { Step7Diagnosis } from "./steps/Step7Diagnosis";
import { Step8Signatures } from "./steps/Step8Signatures";

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
      return <Step5Models />;
    case 6:
      return <Step6Radiographic />;
    case 7:
      return <Step7Diagnosis />;
    case 8:
      return <Step8Signatures />;
    default:
      return <Step1Patient recordNumber={recordNumber} />;
  }
}
