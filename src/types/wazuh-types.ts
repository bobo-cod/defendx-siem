// src/types/wazuh.ts
// Complete TypeScript definitions for Wazuh API

export interface WazuhAPIResponse<T> {
  data: {
    affected_items: T[];
    total_affected_items: number;
    total_failed_items: number;
    failed_items: any[];
  };
  message: string;
  error: number;
}

export interface WazuhAgent {
  id: string;
  name: string;
  ip: string;
  status: 'active' | 'disconnected' | 'never_connected' | 'pending';
  node_name: string;
  dateAdd: string;
  lastKeepAlive: string;
  os: {
    arch: string;
    codename: string;
    major: string;
    minor: string;
    name: string;
    platform: string;
    uname: string;
    version: string;
  };
  version: string;
  manager: string;
  group: string[];
  registerIP: string;
  mergedSum: string;
  configSum: string;
}

export interface WazuhAlert {
  _id: string;
  _index: string;
  _source: {
    agent: {
      id: string;
      name: string;
      ip?: string;
    };
    rule: {
      description: string;
      level: number;
      id: string;
      mitre?: {
        id: string[];
        tactic: string[];
        technique: string[];
      };
      groups: string[];
      firedtimes: number;
    };
    timestamp: string;
    location?: string;
    decoder?: {
      name: string;
    };
    data?: any;
    full_log?: string;
    predecoder?: {
      hostname?: string;
      program_name?: string;
      timestamp?: string;
    };
  };
}

export interface WazuhVulnerability {
  agent_id: string;
  agent_name: string;
  cve: string;
  name: string;
  version: string;
  architecture: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'None';
  cvss2_score?: number;
  cvss3_score?: number;
  published: string;
  updated: string;
  reference: string;
  status: 'Valid' | 'Solved';
  detection_time: string;
  condition?: string;
  title?: string;
  rationale?: string;
  description?: string;
}

export interface WazuhFIMEvent {
  agent: {
    id: string;
    name: string;
  };
  syscheck: {
    path: string;
    event: 'added' | 'modified' | 'deleted';
    mode: 'whodata' | 'realtime' | 'scheduled';
    sha1_after?: string;
    sha256_after?: string;
    md5_after?: string;
    size_after?: number;
    perm_after?: string;
    uid_after?: string;
    gid_after?: string;
    mtime_after?: string;
    inode_after?: number;
  };
  timestamp: string;
  rule: {
    id: string;
    description: string;
    level: number;
    groups: string[];
  };
}

export interface WazuhRule {
  id: number;
  description: string;
  level: number;
  status: string;
  groups: string[];
  filename: string;
  relative_dirname: string;
  pci_dss?: string[];
  gpg13?: string[];
  gdpr?: string[];
  hipaa?: string[];
  nist_800_53?: string[];
  tsc?: string[];
  mitre?: {
    id: string[];
    tactic: string[];
    technique: string[];
  };
  details?: {
    frequency?: number;
    timeframe?: number;
    if_sid?: string;
    if_group?: string;
    match?: string;
    regex?: string;
    decoded_as?: string;
  };
}

export interface MitreAttack {
  id: string;
  tactic: string;
  technique: string;
  count: number;
  agents: string[];
  alerts: WazuhAlert[];
}

export interface SyscollectorData {
  agent_id: string;
  scan_id: string;
  scan_time: string;
  hardware?: {
    cpu_cores: number;
    cpu_mhz: number;
    cpu_name: string;
    ram_free: number;
    ram_total: number;
    ram_usage: number;
  };
  network?: {
    iface: string;
    state: string;
    mtu: number;
    mac: string;
    tx_bytes: number;
    rx_bytes: number;
    tx_packets: number;
    rx_packets: number;
    tx_errors: number;
    rx_errors: number;
  }[];
  os?: {
    architecture: string;
    hostname: string;
    os_name: string;
    os_version: string;
    os_platform: string;
  };
  packages?: {
    name: string;
    version: string;
    architecture: string;
    vendor: string;
    description: string;
    install_time: string;
  }[];
  processes?: {
    pid: string;
    name: string;
    state: string;
    ppid: string;
    euser: string;
    cmd: string;
    argvs: string;
    size: number;
    vm_size: number;
    priority: number;
    nlwp: number;
    start_time: string;
  }[];
}

export interface DashboardStats {
  totalAgents: number;
  activeAgents: number;
  disconnectedAgents: number;
  neverConnectedAgents: number;
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  fimEvents: number;
  topAgents: {
    id: string;
    name: string;
    alertCount: number;
  }[];
  topRules: {
    id: string;
    description: string;
    count: number;
  }[];
  alertsTimeline: {
    timestamp: string;
    count: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }[];
}

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AgentStatus = 'active' | 'disconnected' | 'never_connected' | 'pending';
export type VulnerabilitySeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'None';
export type FIMEventType = 'added' | 'modified' | 'deleted';
