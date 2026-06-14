export interface Forecast {
    id: string;
    teamId: string;
    period: 'monthly' | 'quarterly' | 'yearly';
    startDate: string;
    endDate: string;
    expectedHours: number;
    actualHours?: number;
    variance?: number;
    notes?: string;
    createdAt: string;
}
export declare const ForecastModel: {
    create: (forecast: Forecast) => Forecast;
    findAll: () => any;
    findByTeam: (teamId: string) => any;
    update: (id: string, updates: Partial<Forecast>) => void;
};
//# sourceMappingURL=Forecast.d.ts.map