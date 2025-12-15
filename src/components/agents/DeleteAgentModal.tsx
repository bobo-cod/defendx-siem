// src/components/agents/DeleteAgentModal.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Copy,
  Check,
  Terminal,
  Trash2,
  AlertTriangle,
  Server,
} from 'lucide-react';
import { toast } from 'sonner';

interface DeleteAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: {
    id: string;
    name: string;
    os?: {
      platform?: string;
      name?: string;
    };
  } | null;
  onDeleted?: () => void;
}

type OS = 'linux' | 'windows' | 'macos';

export default function DeleteAgentModal({ 
  isOpen, 
  onClose, 
  agent,
  onDeleted 
}: DeleteAgentModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUninstall, setShowUninstall] = useState(false);
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});

  if (!isOpen || !agent) return null;

  // Detect OS from agent info
  const detectOS = (): OS => {
    const platform = agent.os?.platform?.toLowerCase() || '';
    const osName = agent.os?.name?.toLowerCase() || '';
    
    if (platform.includes('windows') || osName.includes('windows')) {
      return 'windows';
    } else if (platform.includes('darwin') || osName.includes('darwin') || osName.includes('macos')) {
      return 'macos';
    }
    return 'linux';
  };

  const detectedOS = detectOS();

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/wazuh/agents/${agent.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(`Agent "${agent.name}" deleted successfully`);
        setShowUninstall(true);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete agent');
        setIsDeleting(false);
      }
    } catch (error) {
      toast.error('Error deleting agent');
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [id]: true });
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied({ ...copied, [id]: false }), 2000);
  };

  const getUninstallCommands = (os: OS) => {
    const commands = {
      linux: {
        stop: `# Stop the Wazuh agent
sudo systemctl stop wazuh-agent
sudo systemctl disable wazuh-agent`,
        remove: `# Remove Wazuh agent package
sudo apt-get remove --purge wazuh-agent -y
# Or for RPM-based systems:
# sudo yum remove wazuh-agent -y`,
        cleanup: `# Remove configuration files (optional)
sudo rm -rf /var/ossec`,
        verify: `# Verify removal
which wazuh-agent`,
      },
      windows: {
        stop: `# Stop Wazuh service (Run PowerShell as Administrator)
NET STOP WazuhSvc`,
        remove: `# Uninstall Wazuh agent
# Method 1: Via Control Panel
# - Open Control Panel > Programs > Uninstall a program
# - Select "Wazuh Agent" and click Uninstall

# Method 2: Via PowerShell
$app = Get-WmiObject -Class Win32_Product | Where-Object { $_.Name -match "Wazuh" }
$app.Uninstall()`,
        cleanup: `# Remove installation directory (optional)
Remove-Item -Recurse -Force "C:\\Program Files (x86)\\ossec-agent"`,
        verify: `# Verify removal
Get-Service WazuhSvc`,
      },
      macos: {
        stop: `# Stop the Wazuh agent
sudo /Library/Ossec/bin/wazuh-control stop`,
        remove: `# Remove Wazuh agent
sudo /bin/rm -r /Library/Ossec
sudo /bin/rm -f /Library/LaunchDaemons/com.wazuh.agent.plist
sudo /bin/rm -rf /Library/StartupItems/WAZUH`,
        cleanup: `# Remove user and group (optional)
sudo /usr/bin/dscl . -delete "/Users/wazuh"
sudo /usr/bin/dscl . -delete "/Groups/wazuh"`,
        verify: `# Verify removal
ls /Library/Ossec`,
      },
    };

    return commands[os];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-red-500" />
            Delete Agent
          </h2>
          <button
            onClick={() => {
              onClose();
              if (showUninstall && onDeleted) {
                onDeleted();
              }
            }}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!showUninstall ? (
            <>
              {/* Confirmation Section */}
              <Card className="border-red-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-500">
                    <AlertTriangle className="h-5 w-5" />
                    Warning: This action cannot be undone
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You are about to delete the following agent from the Wazuh manager:
                  </p>
                  
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Agent Name:</span>
                      <span className="text-sm font-mono">{agent.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Agent ID:</span>
                      <span className="text-sm font-mono">{agent.id}</span>
                    </div>
                    {agent.os && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Operating System:</span>
                        <span className="text-sm">{agent.os.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-sm text-yellow-600 dark:text-yellow-500">
                      <strong>Note:</strong> Deleting the agent from the manager does not uninstall 
                      the software from the machine. You will need to manually uninstall it.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="spinner h-4 w-4 border-2 rounded-full" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete Agent
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Uninstall Instructions */}
              <Card className="border-green-500/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      Agent Deleted from Manager
                    </CardTitle>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                      {agent.name}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    The agent has been removed from the Wazuh manager. Follow the instructions below 
                    to uninstall the agent software from the machine.
                  </p>
                </CardContent>
              </Card>

              {/* Uninstall Commands */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Uninstall Instructions for {detectedOS.charAt(0).toUpperCase() + detectedOS.slice(1)}
                </h3>

                {Object.entries(getUninstallCommands(detectedOS)).map(([key, command], idx) => (
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
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Important Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• All commands must be run with administrator/root privileges</li>
                    <li>• Stop the agent before uninstalling to prevent service errors</li>
                    <li>• The cleanup step removes all configuration and logs</li>
                    <li>• Verify the removal with the final verification command</li>
                    <li>• You can now safely remove this machine from your network</li>
                  </ul>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onClose();
                    if (onDeleted) onDeleted();
                  }}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
