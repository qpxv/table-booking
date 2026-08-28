export type EventParticipantInfo = {
  userId: string;
  name: string;
};

export type ClubEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start: Date;
  end: Date | null;
  createdById: string;
  createdByName: string;
  participants: EventParticipantInfo[];
};
