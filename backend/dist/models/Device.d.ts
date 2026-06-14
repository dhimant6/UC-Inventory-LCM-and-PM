export interface Device {
    id: string;
    name: string;
    type: 'teams' | 'webex' | 'polycom' | 'other';
    model: string;
    serialNumber: string;
    ipAddress: string;
    macAddress: string;
    status: 'active' | 'inactive' | 'maintenance' | 'expired';
    purchaseDate: string;
    expiryDate: string;
    assignedTo?: string;
    location: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}
export declare const DeviceModel: {
    create: (device: Device) => Device;
    findAll: () => any;
    findById: (id: string) => any;
    update: (id: string, updates: Partial<Device>) => void;
    delete: (id: string) => void;
    getByTeam: (teamId: string) => any;
};
//# sourceMappingURL=Device.d.ts.map