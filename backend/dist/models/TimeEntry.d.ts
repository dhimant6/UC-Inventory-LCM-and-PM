export interface TimeEntry {
    id: string;
    userId: string;
    date: string;
    hours: number;
    projectId?: string;
    description: string;
    teamId?: string;
    createdAt: string;
}
export declare const TimeEntryModel: {
    create: (entry: TimeEntry) => TimeEntry;
    findAll: () => any;
    findByUser: (userId: string) => any;
    getByDateRange: (startDate: string, endDate: string) => any;
};
//# sourceMappingURL=TimeEntry.d.ts.map