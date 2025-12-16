// src/components/agents/AddAgentModal.tsx (FINAL - Manual import with base64 key)
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Copy,
  Check,
  Terminal,
  Server,
  Download,
  AlertCircle,
  Key,
} from 'lucide-react';
import { toast } from 'sonner';

interface AddAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type OS = 'linux' | 'windows' | 'macos';

export default function AddAgentModal({ isOpen, onClose }: AddAgentModalProps) {
  const [agentName, setAgentName] = useState('');
  const [agentIP, setAgentIP] = useState('');
  const [selectedOS, setSelectedOS] = useState<OS>('linux');
  const [agentKey, setAgentKey] = useState('');
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});

  const WAZUH_MANAGER_IP = process.env.NEXT_PUBLIC_WAZUH_MANAGER_IP || '192.168.1.8';

  const handleGenerateAgent = async () => {
    if (!agentName) {
      toast.error('Please enter an agent name');
      return;
    }

    try {
      const response = await fetch('/api/wazuh/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentName,
          ip: agentIP || 'any',
        }),
      });

      const data = await response.json();
      
      if (data.key) {
        setAgentKey(data.key);
        setStep(2);
        toast.success('Agent registered successfully!');
      } else {
        toast.error(data.message || 'Failed to register agent');
      }
    } catch (error) {
      toast.error('Error registering agent');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [id]: true });
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied({ ...copied, [id]: false }), 2000);
  };

  const getInstallCommands = () => {
    const commands = {
      linux: {
        download: `# Download Wazuh Agent
curl -so wazuh-agent.deb https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_4.7.0-1_amd64.deb`,
        install: `# Install agent with manager configuration
sudo WAZUH_MANAGER='${WAZUH_MANAGER_IP}' WAZUH_AGENT_NAME='${agentName}' dpkg -i ./wazuh-agent_4.7.0-1_amd64.deb`,
        import: `# Import agent key interactively
sudo /var/ossec/bin/manage_agents

# When prompted:
# - Choose: I (Import key)
# - Paste the key from below (already copied to clipboard)
# - Confirm: y`,
        start: `# Start the agent
sudo systemctl daemon-reload
sudo systemctl enable wazuh-agent
sudo systemctl start wazuh-agent`,
        verify: `# Verify agent status
sudo systemctl status wazuh-agent`,
      },
      windows: {
        download: `# Download Wazuh Agent MSI (Run PowerShell as Administrator)
Invoke-WebRequest -Uri https://packages.wazuh.com/4.x/windows/wazuh-agent-4.7.0-1.msi -OutFile wazuh-agent.msi`,
        install: `# Install agent
msiexec.exe /i wazuh-agent.msi /q WAZUH_MANAGER='${WAZUH_MANAGER_IP}' WAZUH_AGENT_NAME='${agentName}'`,
        import: `# Import agent key interactively
& 'C:\\Program Files (x86)\\ossec-agent\\manage_agents.exe'

# When prompted:
# - Choose: I (Import key)
# - Paste the key from below
# - Confirm: y`,
        start: `# Start Wazuh service
NET START WazuhSvc`,
        verify: `# Verify service status
Get-Service WazuhSvc`,
      },
      macos: {
        download: `# Download Wazuh Agent
curl -so wazuh-agent.pkg https://packages.wazuh.com/4.x/macos/wazuh-agent-4.7.0-1.pkg`,
        install: `# Install agent
sudo installer -pkg wazuh-agent.pkg -target /`,
        import: `# Import agent key interactively
sudo /Library/Ossec/bin/manage_agents

# When prompted:
# - Choose: I (Import key)
# - Paste the key from below
# - Confirm: y`,
        start: `# Start the agent
sudo /Library/Ossec/bin/wazuh-control start`,
        verify: `# Verify agent status
sudo /Library/Ossec/bin/wazuh-control status`,
      },
    };

    return commands[selectedOS];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold">Add New Agent</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Configure</span>
            </div>
            <div className="flex-1 h-[2px] bg-border" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-secondary'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Install</span>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Agent Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Agent Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="e.g., web-server-01, database-prod"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      A unique name to identify this agent
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Agent IP Address (Optional)
                    </label>
                    <input
                      type="text"
                      value={agentIP}
                      onChange={(e) => setAgentIP(e.target.value)}
                      placeholder="e.g., 192.168.1.100 or leave empty for 'any'"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty for dynamic IP (recommended)
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Operating System
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['linux', 'windows', 'macos'] as OS[]).map((os) => (
                        <button
                          key={os}
                          onClick={() => setSelectedOS(os)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedOS === os
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <p className="font-medium capitalize">{os}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateAgent}
                    disabled={!agentName}
                    className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Generate Agent Key
                  </button>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <Card className="border-green-500/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      Agent Registered Successfully
                    </CardTitle>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                      {agentName}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Follow the instructions below to install the agent on your {selectedOS} system.
                  </p>
                </CardContent>
              </Card>

              {/* Agent Key Card */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Key className="h-5 w-5 text-primary" />
                      Agent Authentication Key
                    </CardTitle>
                    <button
                      onClick={() => copyToClipboard(agentKey, 'agent-key')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded transition-colors"
                    >
                      {copied['agent-key'] ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Key
                        </>
                      )}
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-background rounded border border-border">
                    <code className="text-xs break-all">{agentKey}</code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Click "Copy Key" above, then paste when prompted by manage_agents
                  </p>
                </CardContent>
              </Card>

              {/* Step-by-step Commands */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Installation Steps for {selectedOS.charAt(0).toUpperCase() + selectedOS.slice(1)}
                </h3>

                {Object.entries(getInstallCommands()).map(([key, command], idx) => (
                  <Card key={key}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          Step {idx + 1}: {key.charAt(0).toUpperCase() + key.slice(1)}
                        </p>
                        <button
                          onClick={() => copyToClipboard(command, key)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded transition-colors"
                        >
                          {copied[key] ? (
                            <>
                              <Check className="h-3 w-3" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="p-3 bg-muted rounded text-xs overflow-x-auto whitespace-pre-wrap">
                        {command}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Important Notes */}
              <Card className="border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    Important Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• All commands must be run with administrator/root privileges</li>
                    <li>• Make sure firewall allows connection to port 1514 (agent-manager communication)</li>
                    <li>• <strong>Copy the key above before running Step 3</strong></li>
                    <li>• When running manage_agents, choose "I" for Import, then paste the key</li>
                    <li>• Agent will appear in the list once it connects successfully (1-2 minutes)</li>
                    <li>• Use the "verify" command to confirm the agent is running</li>
                  </ul>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep(1);
                    setAgentName('');
                    setAgentIP('');
                    setAgentKey('');
                  }}
                  className="flex-1 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                >
                  Add Another Agent
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
