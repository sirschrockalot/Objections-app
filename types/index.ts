export interface Response {
  id: string;
  text: string;
  isCustom: boolean;
  createdAt?: string;
  createdBy?: string;
  upvotes?: number;
  upvotedBy?: string[];
}

export interface Objection {
  id: string;
  text: string;
  category: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  defaultResponses: Response[];
  customResponses: Response[];
  personalNote?: string;
}

export interface ConfidenceRating {
  objectionId: string;
  rating: number; // 1-5
  date: string;
}

export interface PracticeSession {
  id: string;
  date: string;
  objectionsPracticed: string[];
  duration: number; // in seconds
  challengeMode?: boolean;
  timeLimit?: number; // in seconds
  goal?: number; // number of objections to complete
}

export interface ObjectionNote {
  objectionId: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResponseTemplate {
  id: string;
  name: string;
  acknowledge: string;
  reframe: string;
  value: string;
  nextStep: string;
  createdAt: string;
}

