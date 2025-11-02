
export interface DiseasePrediction {
  diseaseName: string;
  confidence: number;
  description: string;
  possibleCauses: string[];
  suggestedTreatments: string[];
}
