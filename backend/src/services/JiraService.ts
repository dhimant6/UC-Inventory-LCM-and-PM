import { ProjectModel } from '../models/Project';
import { DeviceModel } from '../models/Device';
import { TeamModel } from '../models/Team';

export class JiraService {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async createProject(projectData: any): Promise<any> {
    try {
      const device = DeviceModel.findById(projectData.deviceId);
      const team = projectData.assignedTeam ? TeamModel.findById(projectData.assignedTeam) : null;

      const jiraProject = {
        key: `UC-${projectData.deviceId.substring(0, 6)}`,
        name: projectData.name,
        description: projectData.description,
        projectTypeKey: 'software',
        lead: {
          accountId: 'jira-user-id',
          name: 'UC System'
        },
        issueTypes: [
          { name: 'Bug' },
          { name: 'Task' },
          { name: 'Story' }
        ],
        workflows: ['jira-software-workflow']
      };

      const response = await fetch(`${this.baseUrl}/rest/api/3/project`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jiraProject)
      });

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status}`);
      }

      const jiraResult = await response.json();

      const project = ProjectModel.findById(projectData.id);
      if (project) {
        ProjectModel.update(projectData.id, {
          jiraId: jiraResult.id,
          status: 'active'
        });
      }

      return jiraResult;
    } catch (error) {
      console.error('Jira create project error:', error);
      throw error;
    }
  }

  async updateProject(projectId: string, updates: any): Promise<any> {
    try {
      const project = ProjectModel.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      if (!project.jiraId) {
        throw new Error('Project not linked to Jira');
      }

      const jiraUpdates = {
        description: updates.description ? {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: updates.description
                }
              ]
            }
          ]
        } : undefined,
        leadAccountId: updates.leadAccountId || undefined,
        url: updates.url || undefined
      };

      const response = await fetch(`${this.baseUrl}/rest/api/3/project/${project.jiraId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jiraUpdates)
      });

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status}`);
      }

      const jiraResult = await response.json();

      ProjectModel.update(projectId, {
        name: updates.name || project.name,
        description: updates.description || project.description,
        status: updates.status || project.status,
        assignedTeam: updates.assignedTeam || project.assignedTeam,
        endDate: updates.endDate || project.endDate
      });

      return jiraResult;
    } catch (error) {
      console.error('Jira update project error:', error);
      throw error;
    }
  }

  async createIssue(projectId: string, issueData: any): Promise<any> {
    try {
      const project = ProjectModel.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const issue = {
        fields: {
          project: {
            id: project.jiraId
          },
          summary: issueData.summary,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: issueData.description || ''
                  }
                ]
              }
            ]
          },
          issuetype: {
            name: issueData.type || 'Task'
          },
          priority: {
            name: issueData.priority || 'Medium'
          },
          reporter: {
            accountId: 'jira-user-id',
            name: 'UC System'
          },
          assignee: issueData.assignee ? {
            accountId: issueData.assignee,
            name: issueData.assigneeName || 'User'
          } : undefined,
          labels: issueData.labels || ['uc-inventory']
        }
      };

      const response = await fetch(`${this.baseUrl}/rest/api/3/issue`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(issue)
      });

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status}`);
      }

      const jiraResult = await response.json();

      return jiraResult;
    } catch (error) {
      console.error('Jira create issue error:', error);
      throw error;
    }
  }

  async syncDeviceExpiry(deviceId: string): Promise<any> {
    try {
      const device = DeviceModel.findById(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      const project = ProjectModel.getByDevice(deviceId)[0];
      if (!project) {
        throw new Error('No project found for device');
      }

      const expiryDate = new Date(device.expiryDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let issueType = 'Task';
      let priority = 'Medium';

      if (daysUntilExpiry <= 30) {
        issueType = 'Bug';
        priority = 'High';
      } else if (daysUntilExpiry <= 90) {
        issueType = 'Task';
        priority = 'Medium';
      }

      const issueData = {
        summary: `Device ${device.name} expiry in ${daysUntilExpiry} days`,
        description: `Device ${device.name} (SN: ${device.serialNumber}) is expiring on ${device.expiryDate}. Please take appropriate action.

Device Details:
- Type: ${device.type}
- Location: ${device.location}
- Assigned To: ${device.assignedTo || 'Unassigned'}
- Days Until Expiry: ${daysUntilExpiry}`,
        type: issueType,
        priority: priority,
        labels: ['expiry', 'device-management', `expiry-${daysUntilExpiry <= 30 ? 'urgent' : 'normal'}`]
      };

      return await this.createIssue(project.id, issueData);
    } catch (error) {
      console.error('Jira sync expiry error:', error);
      throw error;
    }
  }
}
