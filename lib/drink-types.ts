export type DrinkWidgetGuest = {
  id: string;
  name: string;
};

export type DrinkWidgetData = {
  ownCount: number;
  guests: DrinkWidgetGuest[];
};

export type DrinkReportRow = {
  userId: string;
  name: string;
  memberId: string | null;
  count: number;
};
