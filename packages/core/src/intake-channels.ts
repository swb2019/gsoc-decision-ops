/**
 * Intake Channel Configuration
 *
 * Defines how GSOC data arrives through various channels, with channel-faithful
 * metadata, urgency patterns, and UX treatment. Simulates real GSOC floor operations
 * without live integrations.
 *
 * Channels represent the SOURCE SYSTEMS that feed the GSOC:
 * - Physical security systems (ACS, VMS, Alarm)
 * - Cyber security systems (SIEM)
 * - Intelligence sources (OSINT, Vendor, LE)
 * - Human sources (Tip, Radio)
 * - Building systems (Facilities)
 */

import type {
  IntakeChannel,
  IntakeConfidence,
  IntakeCompleteness,
  IntakeMetadata,
} from './types.js';

/**
 * Channel display configuration
 */
export interface ChannelConfig {
  id: IntakeChannel;
  name: string;
  shortName: string;
  description: string;
  defaultPriority: 'IMMEDIATE' | 'URGENT' | 'ROUTINE';
  defaultConfidence: IntakeConfidence;
  typicalCompleteness: IntakeCompleteness;
  exampleSystems: string[];
  typicalAlertTypes: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: string;
  soundCue?: 'critical' | 'urgent' | 'routine' | 'none';
  queueWeight: number;
}

/**
 * Intake channel configurations
 * Ordered by typical GSOC priority weighting
 */
export const INTAKE_CHANNELS: Record<IntakeChannel, ChannelConfig> = {
  ACS: {
    id: 'ACS',
    name: 'Access Control System',
    shortName: 'ACS',
    description:
      'Badge reader events, door status, credential management, anti-passback violations',
    defaultPriority: 'URGENT',
    defaultConfidence: 'HIGH',
    typicalCompleteness: 'COMPLETE',
    exampleSystems: ['Enterprise ACS', 'Badge System', 'Access Control Panel'],
    typicalAlertTypes: [
      'Access granted',
      'Access denied - invalid credential',
      'Forced door alarm',
      'Door held open',
      'Anti-passback violation',
      'Visitor escort timeout',
      'Panel offline',
      'Reader offline',
      'Credential not in directory',
      'Cardholder lookup failed',
    ],
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    iconName: 'DoorOpen',
    soundCue: 'urgent',
    queueWeight: 85,
  },

  VMS: {
    id: 'VMS',
    name: 'Video Management System',
    shortName: 'VMS',
    description: 'Camera feeds, motion detection, video analytics, operator call-ups',
    defaultPriority: 'URGENT',
    defaultConfidence: 'MEDIUM',
    typicalCompleteness: 'PARTIAL',
    exampleSystems: ['Enterprise VMS', 'Camera System', 'Video Analytics'],
    typicalAlertTypes: [
      'Motion detected',
      'Line-cross analytics',
      'Loitering detected',
      'Object left behind',
      'Camera offline',
      'Connection lost',
      'Operator call-up request',
      'Perimeter breach',
      'Crowd density alert',
      'Video loss',
    ],
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    iconName: 'Video',
    soundCue: 'urgent',
    queueWeight: 80,
  },

  ALARM: {
    id: 'ALARM',
    name: 'Intrusion & Alarm',
    shortName: 'Alarm',
    description: 'Intrusion detection, duress alarms, panic buttons, supervisory signals',
    defaultPriority: 'IMMEDIATE',
    defaultConfidence: 'HIGH',
    typicalCompleteness: 'COMPLETE',
    exampleSystems: ['Intrusion Panel', 'Alarm System', 'Life Safety Panel'],
    typicalAlertTypes: [
      'Zone alarm',
      'Zone restore',
      'Duress code entered',
      'Panic activated',
      'Supervisory trouble',
      'Panel arm/disarm',
      '24-hour zone alarm',
      'Communication failure',
      'AC power loss',
      'Tamper alarm',
    ],
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    iconName: 'AlertTriangle',
    soundCue: 'critical',
    queueWeight: 95,
  },

  SIEM: {
    id: 'SIEM',
    name: 'SIEM / EDR',
    shortName: 'SIEM',
    description:
      'Cyber security alerts, phishing, identity anomalies, endpoint detection, VPN issues',
    defaultPriority: 'URGENT',
    defaultConfidence: 'MEDIUM',
    typicalCompleteness: 'PARTIAL',
    exampleSystems: ['Enterprise SIEM', 'EDR Platform', 'Identity Analytics'],
    typicalAlertTypes: [
      'Phishing - user report',
      'Phishing - gateway block',
      'Impossible travel',
      'MFA fatigue attempt',
      'Auth burst failures',
      'Endpoint behavioral alert',
      'VPN anomaly',
      'Privilege escalation',
      'Data exfiltration pattern',
      'C2 beacon detected',
    ],
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    iconName: 'Cpu',
    soundCue: 'urgent',
    queueWeight: 88,
  },

  OSINT: {
    id: 'OSINT',
    name: 'OSINT / Intel Desk',
    shortName: 'OSINT',
    description: 'Threat intel, dark web monitoring, social media, travel advisories, media alerts',
    defaultPriority: 'ROUTINE',
    defaultConfidence: 'MEDIUM',
    typicalCompleteness: 'PARTIAL',
    exampleSystems: ['Intel Platform', 'Analyst Desktop', 'Threat Feed'],
    typicalAlertTypes: [
      'Dark web mention',
      'Social media threat',
      'Travel advisory',
      'Media coverage - nearby incident',
      'Threat actor campaign',
      'Credential dump',
      'Supply chain risk',
      'Geopolitical risk',
      'Civil unrest warning',
      'Rumor - unverified',
    ],
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    iconName: 'Brain',
    soundCue: 'routine',
    queueWeight: 60,
  },

  TIP: {
    id: 'TIP',
    name: 'Tips & Human Reports',
    shortName: 'Tip Line',
    description:
      'Anonymous tips, hotline calls, email reports, chat messages, employee observations',
    defaultPriority: 'ROUTINE',
    defaultConfidence: 'LOW',
    typicalCompleteness: 'MINIMAL',
    exampleSystems: ['Hotline', 'Email Intake', 'Walk-up Report'],
    typicalAlertTypes: [
      'Anonymous tip',
      'Employee concern',
      'Suspicious person - incomplete desc',
      'Parking lot incident',
      'Workplace concern',
      'Visitor complaint',
      'Safety hazard',
      'Threatening communication',
      'WHO/WHAT/WHERE unknown',
      'Caller reliability uncertain',
    ],
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    iconName: 'MessageSquare',
    soundCue: 'routine',
    queueWeight: 45,
  },

  RADIO: {
    id: 'RADIO',
    name: 'Dispatch / Radio',
    shortName: 'Dispatch',
    description: 'Officer status, dispatch updates, ETA, on-scene reports, patrol observations',
    defaultPriority: 'URGENT',
    defaultConfidence: 'HIGH',
    typicalCompleteness: 'PARTIAL',
    exampleSystems: ['Dispatch Console', 'Radio Net', 'Mobile Unit'],
    typicalAlertTypes: [
      'Unit available',
      'Unit en route',
      'Unit on-scene',
      'ETA update',
      'Request backup',
      'All clear',
      'Perimeter secure',
      'SOP step complete',
      'Priority dispatch',
      'Medical assist needed',
    ],
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    iconName: 'Radio',
    soundCue: 'urgent',
    queueWeight: 75,
  },

  FACILITIES: {
    id: 'FACILITIES',
    name: 'BMS / Life Safety',
    shortName: 'BMS',
    description: 'Building management, HVAC, elevator, fire systems, environmental monitoring',
    defaultPriority: 'ROUTINE',
    defaultConfidence: 'HIGH',
    typicalCompleteness: 'COMPLETE',
    exampleSystems: ['Building Management', 'Fire Panel', 'Elevator Monitor'],
    typicalAlertTypes: [
      'Elevator fault',
      'Elevator entrapment',
      'Fire supervisory',
      'Fire alarm - zone',
      'HVAC deviation',
      'Water leak',
      'UPS battery low',
      'Power outage',
      'Generator running',
      'Suppression activated',
    ],
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    iconName: 'Building',
    soundCue: 'routine',
    queueWeight: 55,
  },

  VENDOR: {
    id: 'VENDOR',
    name: 'Vendor Notifications',
    shortName: 'Vendor',
    description: 'Security vendor alerts, SLA notifications, service status, emergency contacts',
    defaultPriority: 'ROUTINE',
    defaultConfidence: 'HIGH',
    typicalCompleteness: 'COMPLETE',
    exampleSystems: ['Vendor Portal', 'Service Desk', 'Emergency Line'],
    typicalAlertTypes: [
      'Service degradation',
      'Security advisory',
      'Maintenance window',
      'Incident update',
      'Credential rotation required',
      'SLA breach warning',
      'Emergency escalation',
      'Vulnerability notice',
      'Patch available',
      'Contract notice',
    ],
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/30',
    iconName: 'Package',
    soundCue: 'routine',
    queueWeight: 50,
  },

  EXECUTIVE: {
    id: 'EXECUTIVE',
    name: 'Executive Office',
    shortName: 'Exec',
    description: 'Leadership requests, executive protection, board communications, C-suite alerts',
    defaultPriority: 'URGENT',
    defaultConfidence: 'HIGH',
    typicalCompleteness: 'COMPLETE',
    exampleSystems: ['Executive Office', 'EP Team', 'Chief of Staff'],
    typicalAlertTypes: [
      'Executive travel concern',
      'Board meeting security',
      'VIP visitor arriving',
      'Briefing request',
      'EP alert',
      'Reputational threat',
      'Media inquiry',
      'Legal coordination',
      'Regulatory notification',
      'Decision required',
    ],
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    iconName: 'Crown',
    soundCue: 'urgent',
    queueWeight: 90,
  },

  LE: {
    id: 'LE',
    name: 'Law Enforcement',
    shortName: 'LE',
    description:
      'Police liaison, federal coordination, subpoenas, investigation requests, TLP advisories',
    defaultPriority: 'URGENT',
    defaultConfidence: 'HIGH',
    typicalCompleteness: 'PARTIAL',
    exampleSystems: ['LE Liaison', 'ISAC', 'Federal Contact'],
    typicalAlertTypes: [
      'TLP advisory',
      'Subpoena/legal process',
      'Investigation coordination',
      'BOLO notification',
      'Sector threat',
      'Evidence preservation',
      'Interview coordination',
      'Warrant notification',
      'Emergency disclosure',
      'Multi-victim campaign',
    ],
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    iconName: 'Shield',
    soundCue: 'urgent',
    queueWeight: 92,
  },
};

/**
 * Get channel configuration by ID
 */
export function getChannelConfig(channel: IntakeChannel): ChannelConfig {
  return INTAKE_CHANNELS[channel];
}

/**
 * Calculate effective priority based on channel defaults and inject metadata
 */
export function calculateEffectivePriority(
  intake: IntakeMetadata,
  explicitPriority?: 'IMMEDIATE' | 'URGENT' | 'ROUTINE'
): 'IMMEDIATE' | 'URGENT' | 'ROUTINE' {
  if (explicitPriority) return explicitPriority;

  const channel = INTAKE_CHANNELS[intake.channel];

  if (intake.isNoise) return 'ROUTINE';

  if (intake.isCorrection || intake.supersedes) {
    return intake.confidence === 'VERIFIED' ? 'URGENT' : 'ROUTINE';
  }

  if (intake.confidence === 'CONFLICTING') return 'URGENT';
  if (intake.pendingVerification) return 'ROUTINE';

  return channel.defaultPriority;
}

/**
 * Calculate queue weight for sorting
 * Higher weight = higher priority in queue
 */
export function calculateQueueWeight(
  intake: IntakeMetadata,
  triagePriority: 'IMMEDIATE' | 'URGENT' | 'ROUTINE'
): number {
  const channel = INTAKE_CHANNELS[intake.channel];
  let weight = channel.queueWeight;

  const priorityMultiplier = {
    IMMEDIATE: 1.5,
    URGENT: 1.0,
    ROUTINE: 0.5,
  };
  weight *= priorityMultiplier[triagePriority];

  if (intake.isNoise) weight *= 0.3;
  if (intake.isCorrection) weight *= 1.2;
  if (intake.confidence === 'CONFLICTING') weight *= 1.3;
  if (intake.pendingVerification) weight *= 0.8;

  const confidenceMultiplier: Record<IntakeConfidence, number> = {
    VERIFIED: 1.0,
    HIGH: 0.95,
    MEDIUM: 0.85,
    LOW: 0.7,
    UNVERIFIED: 0.5,
    CONFLICTING: 1.1,
  };
  weight *= confidenceMultiplier[intake.confidence];

  return Math.round(weight);
}

/**
 * Generate realistic source system string for channel
 */
export function generateSourceSystem(channel: IntakeChannel): string {
  const config = INTAKE_CHANNELS[channel];
  const systems = config.exampleSystems;
  return systems[Math.floor(Math.random() * systems.length)];
}

/**
 * Generate realistic source ID for channel
 */
export function generateSourceId(channel: IntakeChannel, location?: string): string {
  const prefixes: Record<IntakeChannel, string[]> = {
    ACS: ['ACS', 'RDR', 'DOOR'],
    VMS: ['CAM', 'PTZ', 'NVR'],
    ALARM: ['ZN', 'ALM', 'PIR'],
    SIEM: ['EVT', 'ALT', 'INC'],
    OSINT: ['INT', 'TIP', 'OSINT'],
    TIP: ['TIP', 'RPT', 'MSG'],
    RADIO: ['UNIT', 'OFC', 'PTL'],
    FACILITIES: ['BMS', 'HVAC', 'ELEV'],
    VENDOR: ['VND', 'SVC', 'TKT'],
    EXECUTIVE: ['EXEC', 'EP', 'VIP'],
    LE: ['FBI', 'PD', 'ISAC'],
  };

  const prefix = prefixes[channel][Math.floor(Math.random() * prefixes[channel].length)];
  const loc = location ? `-${location.replace(/\s+/g, '-').toUpperCase().slice(0, 8)}` : '';
  const num = Math.floor(Math.random() * 999)
    .toString()
    .padStart(3, '0');

  return `${prefix}${loc}-${num}`;
}

/**
 * Create intake metadata with realistic defaults
 */
export function createIntakeMetadata(
  channel: IntakeChannel,
  options?: Partial<IntakeMetadata>
): IntakeMetadata {
  const config = INTAKE_CHANNELS[channel];
  const now = new Date();
  const offsetMs = Math.floor(Math.random() * 30000);

  return {
    channel,
    sourceSystem: options?.sourceSystem ?? generateSourceSystem(channel),
    sourceId: options?.sourceId ?? generateSourceId(channel),
    rawTimestamp: options?.rawTimestamp ?? new Date(now.getTime() - offsetMs).toISOString(),
    receivedTimestamp: options?.receivedTimestamp ?? now.toISOString(),
    confidence: options?.confidence ?? config.defaultConfidence,
    completeness: options?.completeness ?? config.typicalCompleteness,
    attachments: options?.attachments,
    relatedInjectIds: options?.relatedInjectIds,
    supersedes: options?.supersedes,
    isCorrection: options?.isCorrection,
    isNoise: options?.isNoise,
    noiseReason: options?.noiseReason,
    requiresFollowUp: options?.requiresFollowUp,
    pendingVerification: options?.pendingVerification,
  };
}

/**
 * Helper to create a noise inject (low-priority routine item)
 */
export function createNoiseIntake(channel: IntakeChannel, reason: string): Partial<IntakeMetadata> {
  return {
    channel,
    isNoise: true,
    noiseReason: reason,
    confidence: 'LOW',
    completeness: 'MINIMAL',
  };
}

/**
 * Helper to create a correction inject (updates prior inject)
 */
export function createCorrectionIntake(
  channel: IntakeChannel,
  supersededId: string,
  confidence: IntakeConfidence = 'VERIFIED'
): Partial<IntakeMetadata> {
  return {
    channel,
    isCorrection: true,
    supersedes: supersededId,
    confidence,
    relatedInjectIds: [supersededId],
  };
}
