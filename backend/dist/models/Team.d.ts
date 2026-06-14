export interface Team {
    id: string;
    name: string;
    department: string;
    managerId: string;
    location: string;
    contactEmail: string;
    contactPhone: string;
    devices?: string[];
    createdAt: string;
    updatedAt: string;
}
export declare const TeamModel: {
    create: (team: Team) => Team;
    findAll: () => any;
    findById: (id: string) => any;
    update: (id: string, updates: Partial<Team>) => void;
    delete: (id: string) => void;
};
//# sourceMappingURL=Team.d.ts.map