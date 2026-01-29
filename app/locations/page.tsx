'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Building2,
  Globe,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  Check,
  AlertTriangle,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { UserRole } from '@/lib/auth/roles'

interface State {
  id: number;
  name: string;
  code: string;
  assetCount: number;
  lgaCount: number;
  createdAt: string;
  updatedAt: string;
}

interface LGA {
  id: number;
  name: string;
  stateId: number;
  state: {
    id: number;
    name: string;
    code: string;
  };
  assetCount: number;
  createdAt: string;
  updatedAt: string;
}

interface StateFormData {
  name: string;
  code: string;
}

interface LGAFormData {
  name: string;
  stateId: number;
}

interface Modal {
  isOpen: boolean;
  type: 'create' | 'edit' | 'delete';
  entity: 'state' | 'lga';
  data?: any;
}

export default function LocationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // States
  const [states, setStates] = useState<State[]>([]);
  const [lgas, setLGAs] = useState<LGA[]>([]);
  const [filteredStates, setFilteredStates] = useState<State[]>([]);
  const [filteredLGAs, setFilteredLGAs] = useState<LGA[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters and search
  const [stateSearch, setStateSearch] = useState('');
  const [lgaSearch, setLGASearch] = useState('');
  const [selectedStateForLGA, setSelectedStateForLGA] = useState<string>('');
  const [activeTab, setActiveTab] = useState('states');

  // Modal state
  const [modal, setModal] = useState<Modal>({ isOpen: false, type: 'create', entity: 'state' });
  const [stateForm, setStateForm] = useState<StateFormData>({ name: '', code: '' });
  const [lgaForm, setLGAForm] = useState<LGAFormData>({ name: '', stateId: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Fetch states
  const fetchStates = useCallback(async () => {
    try {
      const response = await fetch('/api/states');
      const data = await response.json();

      if (response.ok) {
        setStates(Array.isArray(data) ? data : data.data || []);
      } else {
        toast.error('Failed to fetch states', {
          description: data.error || 'Failed to fetch states'
        });
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      toast.error('Failed to fetch states');
    }
  }, []);

  // Fetch LGAs
  const fetchLGAs = useCallback(async () => {
    try {
      const response = await fetch('/api/lgas');
      const data = await response.json();

      if (response.ok) {
        setLGAs(Array.isArray(data) ? data : data.data || []);
      } else {
        toast.error('Failed to fetch LGAs', {
          description: data.error || 'Failed to fetch LGAs'
        });
      }
    } catch (error) {
      console.error('Error fetching LGAs:', error);
      toast.error('Failed to fetch LGAs');
    }
  }, []);

  // Load data
  useEffect(() => {
    if (session) {
      setIsLoading(true);
      Promise.all([fetchStates(), fetchLGAs()])
        .finally(() => setIsLoading(false));
    }
  }, [session, fetchStates, fetchLGAs]);

  // Filter states
  useEffect(() => {
    let filtered = [...states];

    if (stateSearch) {
      filtered = filtered.filter(state =>
        state.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
        state.code.toLowerCase().includes(stateSearch.toLowerCase())
      );
    }

    setFilteredStates(filtered);
  }, [states, stateSearch]);

  // Filter LGAs
  useEffect(() => {
    let filtered = [...lgas];

    if (lgaSearch) {
      filtered = filtered.filter(lga =>
        lga.name.toLowerCase().includes(lgaSearch.toLowerCase()) ||
        lga.state.name.toLowerCase().includes(lgaSearch.toLowerCase())
      );
    }

    if (selectedStateForLGA) {
      filtered = filtered.filter(lga =>
        lga.stateId.toString() === selectedStateForLGA
      );
    }

    setFilteredLGAs(filtered);
  }, [lgas, lgaSearch, selectedStateForLGA]);

  // Handle state submission
  const handleStateSubmit = async () => {
    if (!stateForm.name.trim() || !stateForm.code.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = modal.type === 'edit' ? '/api/states' : '/api/states';
      const method = modal.type === 'edit' ? 'PUT' : 'POST';
      const body = modal.type === 'edit'
        ? { ...stateForm, id: modal.data.id }
        : stateForm;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`State ${modal.type === 'edit' ? 'updated' : 'created'} successfully`);
        setModal({ isOpen: false, type: 'create', entity: 'state' });
        setStateForm({ name: '', code: '' });
        fetchStates();
      } else {
        toast.error(`Failed to ${modal.type} state`, {
          description: data.error || `Failed to ${modal.type} state`
        });
      }
    } catch (error) {
      console.error(`Error ${modal.type}ing state:`, error);
      toast.error(`Failed to ${modal.type} state`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle LGA submission
  const handleLGASubmit = async () => {
    if (!lgaForm.name.trim() || !lgaForm.stateId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = modal.type === 'edit' ? '/api/lgas' : '/api/lgas';
      const method = modal.type === 'edit' ? 'PUT' : 'POST';
      const body = modal.type === 'edit'
        ? { ...lgaForm, id: modal.data.id }
        : lgaForm;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`LGA ${modal.type === 'edit' ? 'updated' : 'created'} successfully`);
        setModal({ isOpen: false, type: 'create', entity: 'lga' });
        setLGAForm({ name: '', stateId: 0 });
        fetchLGAs();
      } else {
        toast.error(`Failed to ${modal.type} LGA`, {
          description: data.error || `Failed to ${modal.type} LGA`
        });
      }
    } catch (error) {
      console.error(`Error ${modal.type}ing LGA:`, error);
      toast.error(`Failed to ${modal.type} LGA`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!modal.data) return;

    setIsSubmitting(true);
    try {
      const url = modal.entity === 'state'
        ? `/api/states?id=${modal.data.id}`
        : `/api/lgas?id=${modal.data.id}`;

      const response = await fetch(url, { method: 'DELETE' });

      if (response.ok) {
        toast.success(`${modal.entity.toUpperCase()} deleted successfully`);
        setModal({ isOpen: false, type: 'create', entity: 'state' });

        if (modal.entity === 'state') {
          fetchStates();
        } else {
          fetchLGAs();
        }
      } else {
        const data = await response.json();
        toast.error(`Failed to delete ${modal.entity}`, {
          description: data.error || `Failed to delete ${modal.entity}`
        });
      }
    } catch (error) {
      console.error(`Error deleting ${modal.entity}:`, error);
      toast.error(`Failed to delete ${modal.entity}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open modal for editing
  const openEditModal = (entity: 'state' | 'lga', data: any) => {
    setModal({ isOpen: true, type: 'edit', entity, data });

    if (entity === 'state') {
      setStateForm({ name: data.name, code: data.code });
    } else {
      setLGAForm({ name: data.name, stateId: data.stateId });
    }
  };

  // Open delete modal
  const openDeleteModal = (entity: 'state' | 'lga', data: any) => {
    setModal({ isOpen: true, type: 'delete', entity, data });
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) return null;

  // Check permissions
  const canManage = session?.user?.role === UserRole.SUPER_ADMIN || session?.user?.role === UserRole.ADMIN

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MapPin className="h-8 w-8 text-primary" />
            Location Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage states and local government areas (LGAs)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setModal({ isOpen: true, type: 'create', entity: 'state' })}
            disabled={!canManage}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add State
          </Button>
          <Button
            variant="outline"
            onClick={() => setModal({ isOpen: true, type: 'create', entity: 'lga' })}
            disabled={!canManage || states.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add LGA
          </Button>
          <Button
            variant="outline"
            onClick={() => Promise.all([fetchStates(), fetchLGAs()])}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total States</p>
                <p className="text-2xl font-bold text-gray-900">
                  {states.length}
                </p>
              </div>
              <Globe className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total LGAs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {lgas.length}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Assets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {states.reduce((sum, state) => sum + state.assetCount, 0)}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. LGAs per State</p>
                <p className="text-2xl font-bold text-gray-900">
                  {states.length > 0
                    ? Math.round(lgas.length / states.length)
                    : 0
                  }
                </p>
              </div>
              <MapPin className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="states">States ({states.length})</TabsTrigger>
              <TabsTrigger value="lgas">LGAs ({lgas.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="states" className="space-y-4">
              {/* States Search */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search states..."
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* States Table */}
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredStates.length === 0 ? (
                  <div className="text-center py-12">
                    <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No states found</h3>
                    <p className="text-gray-500">
                      {states.length === 0
                        ? "Add states to get started."
                        : "Try adjusting your search."
                      }
                    </p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">State</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Code</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">LGAs</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Assets</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStates.map((state, index) => (
                        <motion.tr
                          key={state.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-4 px-4">
                            <div className="font-medium text-gray-900">{state.name}</div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="secondary">{state.code}</Badge>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-gray-700">{state.lgaCount}</span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-gray-700">{state.assetCount}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-2">
                              {canManage && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditModal('state', state)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDeleteModal('state', state)}
                                    className="text-red-600 hover:text-red-700"
                                    disabled={state.assetCount > 0 || state.lgaCount > 0}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </TabsContent>

            <TabsContent value="lgas" className="space-y-4">
              {/* LGAs Search and Filter */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search LGAs..."
                    value={lgaSearch}
                    onChange={(e) => setLGASearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedStateForLGA} onValueChange={setSelectedStateForLGA}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All states</SelectItem>
                    {states.map(state => (
                      <SelectItem key={state.id} value={state.id.toString()}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* LGAs Table */}
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredLGAs.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No LGAs found</h3>
                    <p className="text-gray-500">
                      {lgas.length === 0
                        ? "Add LGAs to get started."
                        : "Try adjusting your search or filter."
                      }
                    </p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">LGA</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">State</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Assets</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLGAs.map((lga, index) => (
                        <motion.tr
                          key={lga.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-4 px-4">
                            <div className="font-medium text-gray-900">{lga.name}</div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="outline">{lga.state.name}</Badge>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-gray-700">{lga.assetCount}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-2">
                              {canManage && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditModal('lga', lga)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDeleteModal('lga', lga)}
                                    className="text-red-600 hover:text-red-700"
                                    disabled={lga.assetCount > 0}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal */}
      <AnimatePresence>
        {modal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setModal({ isOpen: false, type: 'create', entity: 'state' })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {modal.type === 'delete'
                    ? `Delete ${modal.entity.toUpperCase()}`
                    : `${modal.type === 'edit' ? 'Edit' : 'Create'} ${modal.entity.toUpperCase()}`
                  }
                </h2>
              </div>

              <div className="p-6">
                {modal.type === 'delete' ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
                      <div>
                        <p className="text-gray-900 font-medium">
                          Are you sure you want to delete this {modal.entity}?
                        </p>
                        <p className="text-gray-600 text-sm mt-1">
                          This action cannot be undone.
                        </p>
                      </div>
                    </div>
                    {modal.data && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-medium text-gray-900">{modal.data.name}</p>
                        {modal.entity === 'state' && (
                          <p className="text-sm text-gray-600">Code: {modal.data.code}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {modal.entity === 'state' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State Name *
                          </label>
                          <Input
                            value={stateForm.name}
                            onChange={(e) => setStateForm({ ...stateForm, name: e.target.value })}
                            placeholder="Enter state name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State Code *
                          </label>
                          <Input
                            value={stateForm.code}
                            onChange={(e) => setStateForm({ ...stateForm, code: e.target.value.toUpperCase() })}
                            placeholder="Enter state code"
                            maxLength={10}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            LGA Name *
                          </label>
                          <Input
                            value={lgaForm.name}
                            onChange={(e) => setLGAForm({ ...lgaForm, name: e.target.value })}
                            placeholder="Enter LGA name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State *
                          </label>
                          <Select
                            value={lgaForm.stateId.toString()}
                            onValueChange={(value) => setLGAForm({ ...lgaForm, stateId: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              {states.map(state => (
                                <SelectItem key={state.id} value={state.id.toString()}>
                                  {state.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setModal({ isOpen: false, type: 'create', entity: 'state' })}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={modal.type === 'delete'
                    ? handleDelete
                    : modal.entity === 'state'
                      ? handleStateSubmit
                      : handleLGASubmit
                  }
                  disabled={isSubmitting}
                  variant={modal.type === 'delete' ? 'destructive' : 'default'}
                  className={modal.type !== 'delete' ? 'bg-primary hover:bg-primary/90' : ''}
                >
                  {isSubmitting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : modal.type === 'delete' ? (
                    <Trash2 className="h-4 w-4 mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {modal.type === 'delete'
                    ? 'Delete'
                    : modal.type === 'edit'
                      ? 'Update'
                      : 'Create'
                  }
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
