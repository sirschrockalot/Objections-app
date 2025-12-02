export interface Response {
  id: string;
  text: string;
  isCustom: boolean;
  createdAt?: string;
  createdBy?: string;
}

export interface Objection {
  id: string;
  text: string;
  defaultResponses: Response[];
  customResponses: Response[];
}

