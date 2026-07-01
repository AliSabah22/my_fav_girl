export interface StageLine {
  text: string;
  time: number; // seconds into the song this line appears
  emphasis?: boolean; // renders larger/italic and holds longer in StageText
}

export interface Stage {
  id: string;
  title: string;
  windowStart: number; // seconds
  windowEnd: number; // seconds
  lines: StageLine[];
}

export interface PhotoItem {
  src: string;
  caption: string;
}

export interface PhotoInterludeData {
  windowStart: number;
  windowEnd: number;
  photos: PhotoItem[];
}
