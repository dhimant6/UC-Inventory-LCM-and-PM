"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedCommunicationService = exports.PolycomConnector = exports.WebexConnector = exports.TeamsConnector = void 0;
const Device_1 = require("../models/Device");
const Team_1 = require("../models/Team");
class TeamsConnector {
    async syncDevices(tenantId, apiKey) {
        try {
            const response = await fetch(`https://graph.microsoft.com/v1.0/me/devices`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`Teams API error: ${response.status}`);
            }
            const teamsDevices = await response.json();
            const devices = teamsDevices.map((device) => {
                const team = Team_1.TeamModel.findById(tenantId);
                return {
                    id: device.id || Math.random().toString(36).substring(7),
                    name: device.displayName || `Teams Device - ${device.id}`,
                    type: 'teams',
                    model: device.model || 'Unknown',
                    serialNumber: device.serialNumber || '',
                    ipAddress: device.physicalAddress || '',
                    macAddress: device.physicalAddress || '',
                    status: this.mapTeamsStatus(device.operatingSystem) || 'active',
                    purchaseDate: device.purchaseDate || new Date().toISOString(),
                    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    assignedTo: tenantId,
                    location: device.location || 'Unknown',
                    notes: `Synced from Teams tenant: ${tenantId}`,
                };
            });
            devices.forEach(device => Device_1.DeviceModel.create(device));
            return devices;
        }
        catch (error) {
            console.error('Teams sync error:', error);
            throw error;
        }
    }
    mapTeamsStatus(os) {
        if (!os)
            return 'active';
        if (os.toLowerCase().includes('windows'))
            return 'active';
        if (os.toLowerCase().includes('android'))
            return 'active';
        if (os.toLowerCase().includes('ios'))
            return 'active';
        return 'maintenance';
    }
}
exports.TeamsConnector = TeamsConnector;
class WebexConnector {
    async syncDevices(tenantId, apiKey) {
        try {
            const response = await fetch(`https://api.cisco.com/v1/devices`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`Webex API error: ${response.status}`);
            }
            const webexDevices = await response.json();
            const devices = webexDevices.map((device) => {
                const team = Team_1.TeamModel.findById(tenantId);
                return {
                    id: device.id || Math.random().toString(36).substring(7),
                    name: device.name || `Webex Device - ${device.id}`,
                    type: 'webex',
                    model: device.model || 'Unknown',
                    serialNumber: device.serialNumber || '',
                    ipAddress: device.ipAddress || '',
                    macAddress: device.macAddress || '',
                    status: this.mapWebexStatus(device.status) || 'active',
                    purchaseDate: device.purchaseDate || new Date().toISOString(),
                    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    assignedTo: tenantId,
                    location: device.location || 'Unknown',
                    notes: `Synced from Webex tenant: ${tenantId}`,
                };
            });
            devices.forEach(device => Device_1.DeviceModel.create(device));
            return devices;
        }
        catch (error) {
            console.error('Webex sync error:', error);
            throw error;
        }
    }
    mapWebexStatus(status) {
        if (!status)
            return 'active';
        if (status.toLowerCase() === 'active')
            return 'active';
        if (status.toLowerCase() === 'inactive')
            return 'inactive';
        if (status.toLowerCase() === 'maintenance')
            return 'maintenance';
        return 'expired';
    }
}
exports.WebexConnector = WebexConnector;
class PolycomConnector {
    async syncDevices(tenantId, apiKey) {
        try {
            const response = await fetch(`https://api.polycom.com/v1/devices`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`Polycom API error: ${response.status}`);
            }
            const polycomDevices = await response.json();
            const devices = polycomDevices.map((device) => {
                const team = Team_1.TeamModel.findById(tenantId);
                return {
                    id: device.id || Math.random().toString(36).substring(7),
                    name: device.name || `Polycom Device - ${device.id}`,
                    type: 'polycom',
                    model: device.model || 'Unknown',
                    serialNumber: device.serialNumber || '',
                    ipAddress: device.ipAddress || '',
                    macAddress: device.macAddress || '',
                    status: this.mapPolycomStatus(device.status) || 'active',
                    purchaseDate: device.purchaseDate || new Date().toISOString(),
                    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    assignedTo: tenantId,
                    location: device.location || 'Unknown',
                    notes: `Synced from Polycom tenant: ${tenantId}`,
                };
            });
            devices.forEach(device => Device_1.DeviceModel.create(device));
            return devices;
        }
        catch (error) {
            console.error('Polycom sync error:', error);
            throw error;
        }
    }
    mapPolycomStatus(status) {
        if (!status)
            return 'active';
        if (status.toLowerCase() === 'active')
            return 'active';
        if (status.toLowerCase() === 'inactive')
            return 'inactive';
        if (status.toLowerCase() === 'service')
            return 'maintenance';
        if (status.toLowerCase() === 'retired')
            return 'expired';
        return 'maintenance';
    }
}
exports.PolycomConnector = PolycomConnector;
class UnifiedCommunicationService {
    constructor() {
        this.teamsConnector = new TeamsConnector();
        this.webexConnector = new WebexConnector();
        this.polycomConnector = new PolycomConnector();
    }
    async syncAllDevices(teamId, integrations) {
        const results = {
            teams: null,
            webex: null,
            polycom: null,
            errors: []
        };
        if (integrations.teams?.enabled && integrations.teams.apiKey) {
            try {
                results.teams = await this.teamsConnector.syncDevices(teamId, integrations.teams.apiKey);
            }
            catch (error) {
                results.errors.push(`Teams sync failed: ${error}`);
            }
        }
        if (integrations.webex?.enabled && integrations.webex.apiKey) {
            try {
                results.webex = await this.webexConnector.syncDevices(teamId, integrations.webex.apiKey);
            }
            catch (error) {
                results.errors.push(`Webex sync failed: ${error}`);
            }
        }
        if (integrations.polycom?.enabled && integrations.polycom.apiKey) {
            try {
                results.polycom = await this.polycomConnector.syncDevices(teamId, integrations.polycom.apiKey);
            }
            catch (error) {
                results.errors.push(`Polycom sync failed: ${error}`);
            }
        }
        return results;
    }
}
exports.UnifiedCommunicationService = UnifiedCommunicationService;
//# sourceMappingURL=UnifiedCommunicationService.js.map