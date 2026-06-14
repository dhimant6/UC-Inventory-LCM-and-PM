export declare class ServiceNowService {
    private baseUrl;
    private apiKey;
    constructor(baseUrl: string, apiKey: string);
    syncTimeEntries(teamId: string): Promise<any[]>;
    createForecast(forecastData: any): Promise<any>;
    calculateTeamCapacity(teamId: string): Promise<any>;
}
//# sourceMappingURL=ServiceNowService.d.ts.map