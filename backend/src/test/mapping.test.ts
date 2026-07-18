import { describe, expect, it } from 'vitest';
import {
  mapTeamsDevice,
  mapTeamsDeviceHealth,
  mapTeamsDeviceStatus,
  mapTeamsUserNumbers,
} from '../providers/mapping/teams';
import {
  mapWebexDevice,
  mapWebexDeviceStatus,
  mapWebexNumber,
} from '../providers/mapping/webex';
import { mapPolyDevice, mapPolyDeviceStatus } from '../providers/mapping/poly';

describe('Teams mapping', () => {
  it('maps healthStatus to normalized device status', () => {
    expect(mapTeamsDeviceStatus('healthy')).toBe('online');
    expect(mapTeamsDeviceStatus('critical')).toBe('degraded');
    expect(mapTeamsDeviceStatus('nonUrgent')).toBe('degraded');
    expect(mapTeamsDeviceStatus('offline')).toBe('offline');
    expect(mapTeamsDeviceStatus('unknown')).toBe('offline');
  });

  it('maps a teamwork device into the internal model', () => {
    const device = mapTeamsDevice(
      {
        id: 'abc-123',
        deviceType: 'teamsRoom',
        healthStatus: 'healthy',
        activityState: 'idle',
        lastModifiedDateTime: '2026-07-01T10:00:00Z',
        currentUser: { displayName: 'Boardroom' },
        hardwareDetail: {
          serialNumber: 'SN1',
          macAddresses: ['AA:BB:CC:DD:EE:FF'],
          model: 'MTR-W',
        },
      },
      'teams:tenant',
    );
    expect(device.id).toBe('teams:abc-123');
    expect(device.vendor).toBe('teams');
    expect(device.model).toBe('MTR-W');
    expect(device.macAddress).toBe('AA:BB:CC:DD:EE:FF');
    expect(device.status).toBe('online');
    expect(device.siteId).toBe('teams:tenant');
  });

  it('extracts only E.164-looking business phones', () => {
    const numbers = mapTeamsUserNumbers({
      id: 'u1',
      businessPhones: ['+44 20 7946 0958', '020 7946 0958'],
    });
    expect(numbers).toHaveLength(1);
    expect(numbers[0].e164).toBe('+442079460958');
    expect(numbers[0].assignedUserId).toBe('teams:u1');
  });

  it('scores device health from reported issues', () => {
    const health = mapTeamsDeviceHealth('teams:abc', {
      connection: { connectionStatus: 'disconnected' },
      peripheralsHealth: {
        camera: { connection: { connectionStatus: 'disconnected' } },
      },
    });
    expect(health.issues).toHaveLength(2);
    expect(health.score).toBe(60);
  });
});

describe('Webex mapping', () => {
  it('maps connectionStatus to normalized device status', () => {
    expect(mapWebexDeviceStatus('connected')).toBe('online');
    expect(mapWebexDeviceStatus('connected_with_issues')).toBe('degraded');
    expect(mapWebexDeviceStatus('disconnected')).toBe('offline');
    expect(mapWebexDeviceStatus(undefined)).toBe('offline');
  });

  it('maps a device and prefixes vendor ids', () => {
    const device = mapWebexDevice(
      {
        id: 'w1',
        displayName: 'Huddle Bar',
        product: 'Cisco Room Bar',
        serial: 'FOC1234',
        mac: '11:22:33:44:55:66',
        ip: '10.0.0.4',
        software: 'RoomOS 11.14.1.5',
        connectionStatus: 'connected_with_issues',
        workspaceId: 'ws9',
      },
      'webex:org',
    );
    expect(device.id).toBe('webex:w1');
    expect(device.roomId).toBe('webex:ws9');
    expect(device.status).toBe('degraded');
    expect(device.firmwareVersion).toBe('RoomOS 11.14.1.5');
  });

  it('maps numbers with owner/state to normalized status', () => {
    expect(
      mapWebexNumber({ phoneNumber: '+1 212 555 0100', owner: { id: 'p1', type: 'PEOPLE' }, state: 'ACTIVE' })?.status,
    ).toBe('assigned');
    expect(mapWebexNumber({ phoneNumber: '+12125550101', state: 'ACTIVE' })?.status).toBe('unassigned');
    expect(mapWebexNumber({ phoneNumber: '+12125550102', state: 'INACTIVE' })?.status).toBe('reserved');
    expect(mapWebexNumber({})).toBeNull();
  });
});

describe('Poly mapping', () => {
  it('derives status from connected + peripheral alerts', () => {
    expect(mapPolyDeviceStatus({ id: 'p', connected: true })).toBe('online');
    expect(mapPolyDeviceStatus({ id: 'p', connected: true, hasPeripheralAlert: true })).toBe('degraded');
    expect(mapPolyDeviceStatus({ id: 'p', connected: false })).toBe('offline');
  });

  it('maps a Lens device with site/room references', () => {
    const device = mapPolyDevice(
      {
        id: 'lens1',
        name: 'Studio X70 — Boardroom',
        hardwareModel: 'Poly Studio X70',
        hardwareFamily: 'Studio',
        serialNumber: '8L21AB',
        macAddress: 'AA:AA:AA:BB:BB:BB',
        softwareVersion: '4.2.1-411057',
        connected: true,
        lastDetected: '2026-07-17T22:00:00Z',
        room: { id: 'r1', name: 'Boardroom' },
        site: { id: 's1', name: 'London' },
      },
      'poly:account',
    );
    expect(device.id).toBe('poly:lens1');
    expect(device.siteId).toBe('poly:s1');
    expect(device.roomId).toBe('poly:r1');
    expect(device.tags).toEqual(['Studio']);
  });

  it('falls back to the account site when Lens has no site', () => {
    const device = mapPolyDevice({ id: 'lens2', connected: false }, 'poly:account');
    expect(device.siteId).toBe('poly:account');
    expect(device.status).toBe('offline');
  });
});
