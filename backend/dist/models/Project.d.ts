export interface Project {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'completed' | 'on_hold' | 'cancelled';
    deviceId: string;
    jiraId?: string;
    startDate: string;
    endDate?: string;
    assignedTeam?: string;
    createdAt: string;
    updatedAt: string;
}
export declare const ProjectModel: {
    create: (project: Project) => Project;
    findAll: () => any;
    findById: (id: string) => any;
    update: (id: string, updates: Partial<Project>) => void;
    delete: (id: string) => void;
    getByDevice: (deviceId: string) => any;
};
//# sourceMappingURL=Project.d.ts.map