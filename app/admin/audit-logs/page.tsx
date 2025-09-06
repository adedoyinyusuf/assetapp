'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type AuditLog = {
  id: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userEmail: string;
  ipAddress: string;
  details: Record<string, unknown>;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    userEmail: ''
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        // Replace with actual API call
        // const response = await fetch(`/api/admin/audit-logs?page=${page}&${new URLSearchParams(filters)}`);
        // const data = await response.json();
        
        // Mock data
        const mockLogs: AuditLog[] = [
          {
            id: '1',
            timestamp: '2023-11-15T14:30:00Z',
            action: 'CREATE',
            entityType: 'Asset',
            entityId: 'ast-1001',
            userId: 'usr-001',
            userEmail: 'admin@example.com',
            ipAddress: '192.168.1.1',
            details: { name: 'Dell Laptop', value: 1200 }
          },
          {
            id: '2',
            timestamp: '2023-11-15T13:15:00Z',
            action: 'UPDATE',
            entityType: 'User',
            entityId: 'usr-002',
            userId: 'usr-001',
            userEmail: 'admin@example.com',
            ipAddress: '192.168.1.1',
            details: { field: 'role', from: 'User', to: 'Admin' }
          },
          {
            id: '3',
            timestamp: '2023-11-15T11:45:00Z',
            action: 'LOGIN',
            entityType: 'User',
            entityId: 'usr-003',
            userId: 'usr-003',
            userEmail: 'user1@example.com',
            ipAddress: '192.168.1.45',
            details: {}
          }
        ];

        setLogs(mockLogs);
        setTotalPages(3); // Mock total pages
      } catch (err) {
        console.error('Error fetching audit logs:', err);
        setError('Failed to load audit logs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPage(1); // Reset to first page when filters change
  };

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const getActionBadge = (action: string) => {
    const variants = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      LOGIN: 'bg-purple-100 text-purple-800',
      LOGOUT: 'bg-gray-100 text-gray-800',
    };

    const variant = variants[action as keyof typeof variants] || 'bg-gray-100 text-gray-800';
    
    return (
      <Badge className={variant}>
        {action}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            Export Logs
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Activity Log</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full md:w-auto">
              <Select 
                value={filters.action} 
                onValueChange={(value) => handleFilterChange('action', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={filters.entityType} 
                onValueChange={(value) => handleFilterChange('entityType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="Asset">Asset</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Role">Role</SelectItem>
                </SelectContent>
              </Select>
              
              <Input 
                placeholder="Filter by user email"
                value={filters.userEmail}
                onChange={(e) => handleFilterChange('userEmail', e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{log.entityType}</div>
                        <div className="text-sm text-muted-foreground">ID: {log.entityId}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{log.userEmail}</div>
                        <div className="text-sm text-muted-foreground">ID: {log.userId}</div>
                      </TableCell>
                      <TableCell>{log.ipAddress}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {Object.entries(log.details).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium">{key}:</span> {JSON.stringify(value)}
                          </div>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No audit logs found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
