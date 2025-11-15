
export interface DiseasePrediction {
  diseaseName: string;
  confidence: number;
  description: string;
  possibleCauses: string[];
  suggestedTreatments: string[];
}

export interface HistoryEntry {
  id: string;
  plantName: string;
  thumbnailUrl: string;
  date: string;
  reportMarkdown: string;
}
