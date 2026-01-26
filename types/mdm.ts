// MDM Module TypeScript Interfaces
export interface MobileDevice {
    id: number;
    // Device Identity
    imei_1: string;
    imei_2?: string | null;
    device_name?: string | null;
    serial_number?: string | null;

    // Device Details
    manufacturer?: string | null;
    model?: string | null;
    os_type?: 'iOS' | 'Android' | 'Other' | null;
    os_version?: string | null;

    // Purchase & Warranty
    purchase_date?: Date | string | null;
    purchase_value?: number | null;
    warranty_expiry?: Date | string | null;
    carrier?: string | null;

    // Current Status
    status?: 'AVAILABLE' | 'ASSIGNED' | 'REPAIR' | 'RETIRED';
    health_status?: 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL' | null;
    battery_level?: number | null;
    storage_used_gb?: number | null;
    storage_total_gb?: number | null;

    // Location
    last_location_lat?: number | null;
    last_location_lng?: number | null;
    last_location_updated?: Date | string | null;

    // MDM Control
    is_enrolled?: boolean;
    enrollment_date?: Date | string | null;
    is_locked?: boolean;
    is_lost_mode?: boolean;
    fcm_token?: string | null;
    apns_token?: string | null;

    // Metadata
    created_at?: Date | string;
    updated_at?: Date | string;
}

export interface StaffUser {
    id: number;
    staff_id: string;
    full_name: string;
    email?: string | null;
    phone_number?: string | null;
    department?: string | null;
    position?: string | null;
    state_id?: number | null;
    lga_id?: number | null;
    status?: 'ACTIVE' | 'INACTIVE';
    created_at?: Date | string;
    updated_at?: Date | string;
}

export interface DeviceAssignment {
    id: number;
    device_id: number;
    staff_id: number;
    assigned_date: Date | string;
    returned_date?: Date | string | null;
    status: 'ACTIVE' | 'RETURNED' | 'LOST';
    notes?: string | null;
    assigned_by?: string | null;
    created_at?: Date | string;

    // Relations (when populated)
    device?: MobileDevice;
    staff?: StaffUser;
}

export interface SimCard {
    id: number;
    device_id?: number | null;
    sim_number: string;
    phone_number?: string | null;
    carrier?: string | null;
    plan_type?: string | null;
    monthly_cost?: number | null;
    data_limit_gb?: number | null;
    activation_date?: Date | string | null;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    created_at?: Date | string;
    updated_at?: Date | string;

    // Relations
    device?: MobileDevice;
}

export interface DeviceCommand {
    id: number;
    device_id: number;
    command_type: 'LOCK' | 'WIPE' | 'LOCATE' | 'ALARM' | 'UNLOCK';
    status: 'PENDING' | 'SENT' | 'EXECUTED' | 'FAILED';
    initiated_by: string;
    initiated_at: Date | string;
    executed_at?: Date | string | null;
    response_data?: any;
    error_message?: string | null;
    notes?: string | null;

    // Relations
    device?: MobileDevice;
}

export interface DeviceMaintenance {
    id: number;
    device_id: number;
    maintenance_type?: string | null;
    issue_description?: string | null;
    repair_cost?: number | null;
    vendor?: string | null;
    start_date?: Date | string | null;
    completion_date?: Date | string | null;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    notes?: string | null;
    created_at?: Date | string;

    // Relations
    device?: MobileDevice;
}

// Request/Response types for API
export interface CreateDeviceRequest {
    imei_1: string;
    imei_2?: string;
    device_name?: string;
    serial_number?: string;
    manufacturer?: string;
    model?: string;
    os_type?: 'iOS' | 'Android' | 'Other';
    os_version?: string;
    purchase_date?: Date | string;
    purchase_value?: number;
    warranty_expiry?: Date | string;
    carrier?: string;
}

export interface AssignDeviceRequest {
    device_id: number;
    staff_id: number;
    notes?: string;
    assigned_by?: string;
}

export interface ExecuteCommandRequest {
    device_id: number;
    command_type: 'LOCK' | 'WIPE' | 'LOCATE' | 'ALARM' | 'UNLOCK';
    initiated_by: string;
    notes?: string;
}

export interface MDMStats {
    total_devices: number;
    assigned_devices: number;
    available_devices: number;
    devices_in_repair: number;
    enrolled_devices: number;
    ios_devices: number;
    android_devices: number;
    locked_devices: number;
}
