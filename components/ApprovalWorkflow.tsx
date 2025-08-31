'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  User,
  Calendar,
  FileText,
  Package,
  Move,
  Settings
} from 'lucide-react';
import { PermissionGate } from './PermissionGate';
import { Task } from '@/lib/auth/roles';

interface ApprovalRequest {
  id: string;
  type: 'asset_creation' | 'asset_deletion' | 'asset_movement' | 'user_role_change' | 'system_setting';
  title: string;
  description: string;
  requester: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  details: any;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
  approvers: {
    id: string;
    name: string;
    role: string;
    status: 'pending' | 'approved' | 'rejected';
    comment?: string;
    timestamp?: Date;
  }[];
  requiredApprovals: number;
  currentApprovals: number;
}

interface ApprovalWorkflowProps {
  userRole: string;
  userId: string;
}

export default function ApprovalWorkflow({ userRole, userId }: ApprovalWorkflowProps) {
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In a real implementation, fetch approval requests from API
    loadApprovalRequests();
  }, []);

  const loadApprovalRequests = async () => {
    // Mock data for demonstration
    const mockRequests: ApprovalRequest[] = [
      {
        id: '1',
        type: 'asset_creation',
        title: 'New Server Asset Request',
        description: 'Request to add a new Dell PowerEdge R750 server to the data center',
        requester: {
          id: 'user1',
          name: 'John Doe',
          email: 'john.doe@npc.gov.ng',
          role: 'Operator'
        },
        details: {
          assetName: 'Dell PowerEdge R750',
          category: 'Server',
          value: 2500000,
          location: 'Data Center A',
          justification: 'Replace aging server infrastructure'
        },
        status: 'pending',
        priority: 'high',
        createdAt: new Date('2024-01-25T10:00:00Z'),
        updatedAt: new Date('2024-01-25T10:00:00Z'),
        approvers: [
          {
            id: 'approver1',
            name: 'Jane Manager',
            role: 'Manager',
            status: 'pending'
          },
          {
            id: 'approver2',
            name: 'Admin User',
            role: 'Admin',
            status: 'pending'
          }
        ],
        requiredApprovals: 2,
        currentApprovals: 0
      },
      {
        id: '2',
        type: 'asset_movement',
        title: 'Asset Relocation Request',
        description: 'Move office furniture from Building A to Building B',
        requester: {
          id: 'user2',
          name: 'Mike Johnson',
          email: 'mike.johnson@npc.gov.ng',
          role: 'Operator'
        },
        details: {
          assetName: 'Office Furniture Set',
          fromLocation: 'Building A, Floor 2',
          toLocation: 'Building B, Floor 1',
          reason: 'Department reorganization'
        },
        status: 'pending',
        priority: 'medium',
        createdAt: new Date('2024-01-25T09:30:00Z'),
        updatedAt: new Date('2024-01-25T09:30:00Z'),
        approvers: [
          {
            id: 'approver1',
            name: 'Jane Manager',
            role: 'Manager',
            status: 'pending'
          }
        ],
        requiredApprovals: 1,
        currentApprovals: 0
      }
    ];

    setApprovalRequests(mockRequests);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline" className="text-green-600">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-yellow-600">Medium</Badge>;
      case 'high':
        return <Badge variant="outline" className="text-orange-600">High</Badge>;
      case 'critical':
        return <Badge variant="outline" className="text-red-600">Critical</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'asset_creation':
        return <Package className="h-4 w-4" />;
      case 'asset_deletion':
        return <Package className="h-4 w-4" />;
      case 'asset_movement':
        return <Move className="h-4 w-4" />;
      case 'user_role_change':
        return <User className="h-4 w-4" />;
      case 'system_setting':
        return <Settings className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const canApprove = (request: ApprovalRequest): boolean => {
    // Check if user is an approver and hasn't approved yet
    const userApprover = request.approvers.find(a => a.id === userId);
    return userApprover ? userApprover.status === 'pending' : false;
  };

  const handleApprove = async (requestId: string, approved: boolean) => {
    setLoading(true);
    
    try {
      // In a real implementation, send approval to API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setApprovalRequests(prev => 
        prev.map(req => {
          if (req.id === requestId) {
            const updatedApprovers = req.approvers.map(approver => {
              if (approver.id === userId) {
                return {
                  ...approver,
                  status: approved ? 'approved' : 'rejected',
                  comment: approvalComment,
                  timestamp: new Date()
                };
              }
              return approver;
            });
            
            const currentApprovals = updatedApprovers.filter(a => a.status === 'approved').length;
            const status = currentApprovals >= req.requiredApprovals ? 'approved' : 
                         updatedApprovers.some(a => a.status === 'rejected') ? 'rejected' : 'pending';
            
            return {
              ...req,
              approvers: updatedApprovers,
              currentApprovals,
              status,
              updatedAt: new Date()
            };
          }
          return req;
        })
      );
      
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setApprovalComment('');
    } catch (error) {
      console.error('Approval error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openApprovalModal = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
  };

  const filteredRequests = approvalRequests.filter(request => {
    // Show requests that user can approve or that are pending
    return canApprove(request) || request.status === 'pending';
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Approval Workflow</h2>
          <p className="text-gray-600">Manage and approve pending requests</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {filteredRequests.filter(r => r.status === 'pending').length} Pending
          </Badge>
          <Badge variant="outline">
            {filteredRequests.filter(r => r.status === 'approved').length} Approved
          </Badge>
        </div>
      </div>

      {/* Approval Requests */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {getTypeIcon(request.type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{request.title}</CardTitle>
                    <p className="text-gray-600 mt-1">{request.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(request.status)}
                  {getPriorityBadge(request.priority)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Request Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Requester:</span>
                    <span>{request.requester.name} ({request.requester.role})</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Requested:</span>
                    <span>{request.createdAt.toLocaleDateString()}</span>
                  </div>
                  
                  {request.details && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Request Details:</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        {Object.entries(request.details).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="font-medium">
                              {typeof value === 'number' && key.includes('value') 
                                ? `₦${value.toLocaleString()}` 
                                : String(value)
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Approval Status */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Approval Progress:</span>
                    <span className="text-sm text-gray-600">
                      {request.currentApprovals}/{request.requiredApprovals}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {request.approvers.map((approver) => (
                      <div key={approver.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{approver.name}</span>
                          <Badge variant="outline" className="text-xs">{approver.role}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {approver.status === 'pending' && <Clock className="h-3 w-3 text-gray-500" />}
                          {approver.status === 'approved' && <CheckCircle className="h-3 w-3 text-green-500" />}
                          {approver.status === 'rejected' && <XCircle className="h-3 w-3 text-red-500" />}
                          <span className="text-xs">{approver.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Action Buttons */}
                  {canApprove(request) && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => openApprovalModal(request)}
                        className="flex-1"
                        variant="outline"
                      >
                        Review & Approve
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredRequests.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Approval Requests</h3>
              <p className="text-gray-600">You don't have any pending approval requests at the moment.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Review Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">{selectedRequest.title}</h4>
                <p className="text-sm text-gray-600">{selectedRequest.description}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Comment (Optional)</label>
                <Textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Add your approval comment..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleApprove(selectedRequest.id, true)}
                  disabled={loading}
                  className="flex-1"
                  variant="default"
                >
                  {loading ? 'Approving...' : 'Approve'}
                </Button>
                <Button
                  onClick={() => handleApprove(selectedRequest.id, false)}
                  disabled={loading}
                  className="flex-1"
                  variant="destructive"
                >
                  {loading ? 'Rejecting...' : 'Reject'}
                </Button>
                <Button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedRequest(null);
                    setApprovalComment('');
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
