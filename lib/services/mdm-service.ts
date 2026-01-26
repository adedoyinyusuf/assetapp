import { Pool } from 'pg';
import type {
    MobileDevice,
    StaffUser,
    DeviceAssignment,
    SimCard,
    DeviceCommand,
    DeviceMaintenance,
    CreateDeviceRequest,
    AssignDeviceRequest,
    ExecuteCommandRequest,
    MDMStats
} from '@/types/mdm';

export class MDMService {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    // ==================== DEVICE MANAGEMENT ====================

    async getAllDevices(): Promise<MobileDevice[]> {
        const { rows } = await this.pool.query(`
      SELECT * FROM mobile_devices 
      ORDER BY created_at DESC
    `);
        return rows;
    }

    async getDeviceById(id: number): Promise<MobileDevice | null> {
        const { rows } = await this.pool.query(
            'SELECT * FROM mobile_devices WHERE id = $1',
            [id]
        );
        return rows[0] || null;
    }

    async getDeviceByIMEI(imei: string): Promise<MobileDevice | null> {
        const { rows } = await this.pool.query(
            'SELECT * FROM mobile_devices WHERE imei_1 = $1 OR imei_2 = $1',
            [imei]
        );
        return rows[0] || null;
    }

    async createDevice(data: CreateDeviceRequest): Promise<MobileDevice> {
        const { rows } = await this.pool.query(
            `INSERT INTO mobile_devices (
        imei_1, imei_2, device_name, serial_number, manufacturer, model,
        os_type, os_version, purchase_date, purchase_value, warranty_expiry, carrier
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
            [
                data.imei_1,
                data.imei_2 || null,
                data.device_name || null,
                data.serial_number || null,
                data.manufacturer || null,
                data.model || null,
                data.os_type || null,
                data.os_version || null,
                data.purchase_date || null,
                data.purchase_value || null,
                data.warranty_expiry || null,
                data.carrier || null
            ]
        );
        return rows[0];
    }

    async updateDevice(id: number, data: Partial<MobileDevice>): Promise<MobileDevice> {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(data)) {
            if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
                fields.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        values.push(id);

        const { rows } = await this.pool.query(
            `UPDATE mobile_devices SET ${fields.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramIndex} RETURNING *`,
            values
        );
        return rows[0];
    }

    async deleteDevice(id: number): Promise<void> {
        await this.pool.query('DELETE FROM mobile_devices WHERE id = $1', [id]);
    }

    async updateDeviceLocation(
        id: number,
        lat: number,
        lng: number
    ): Promise<void> {
        await this.pool.query(
            `UPDATE mobile_devices 
       SET last_location_lat = $1, last_location_lng = $2, last_location_updated = NOW()
       WHERE id = $3`,
            [lat, lng, id]
        );
    }

    async enrollDevice(id: number, fcmToken?: string, apnsToken?: string): Promise<void> {
        await this.pool.query(
            `UPDATE mobile_devices 
       SET is_enrolled = true, enrollment_date = NOW(), fcm_token = $1, apns_token = $2
       WHERE id = $3`,
            [fcmToken || null, apnsToken || null, id]
        );
    }

    // ==================== STAFF MANAGEMENT ====================

    async getAllStaff(): Promise<StaffUser[]> {
        const { rows } = await this.pool.query('SELECT * FROM staff_users ORDER BY full_name');
        return rows;
    }

    async getStaffById(id: number): Promise<StaffUser | null> {
        const { rows } = await this.pool.query('SELECT * FROM staff_users WHERE id = $1', [id]);
        return rows[0] || null;
    }

    async createStaff(data: Omit<StaffUser, 'id' | 'created_at' | 'updated_at'>): Promise<StaffUser> {
        const { rows } = await this.pool.query(
            `INSERT INTO staff_users (
        staff_id, full_name, email, phone_number, department, position, state_id, lga_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
            [
                data.staff_id,
                data.full_name,
                data.email || null,
                data.phone_number || null,
                data.department || null,
                data.position || null,
                data.state_id || null,
                data.lga_id || null,
                data.status || 'ACTIVE'
            ]
        );
        return rows[0];
    }

    // ==================== DEVICE ASSIGNMENTS ====================

    async assignDevice(data: AssignDeviceRequest): Promise<DeviceAssignment> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            // Create assignment
            const { rows } = await client.query(
                `INSERT INTO device_assignments (device_id, staff_id, notes, assigned_by)
         VALUES ($1, $2, $3, $4) RETURNING *`,
                [data.device_id, data.staff_id, data.notes || null, data.assigned_by || null]
            );

            // Update device status
            await client.query(
                'UPDATE mobile_devices SET status = $1 WHERE id = $2',
                ['ASSIGNED', data.device_id]
            );

            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async returnDevice(assignmentId: number): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            // Get device_id from assignment
            const { rows } = await client.query(
                'SELECT device_id FROM device_assignments WHERE id = $1',
                [assignmentId]
            );

            if (rows.length === 0) {
                throw new Error('Assignment not found');
            }

            const deviceId = rows[0].device_id;

            // Update assignment
            await client.query(
                `UPDATE device_assignments 
         SET status = 'RETURNED', returned_date = NOW() 
         WHERE id = $1`,
                [assignmentId]
            );

            // Update device status
            await client.query(
                'UPDATE mobile_devices SET status = $1 WHERE id = $2',
                ['AVAILABLE', deviceId]
            );

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getDeviceAssignments(deviceId: number): Promise<DeviceAssignment[]> {
        const { rows } = await this.pool.query(
            `SELECT da.*, su.full_name as staff_name 
       FROM device_assignments da
       LEFT JOIN staff_users su ON da.staff_id = su.id
       WHERE da.device_id = $1
       ORDER BY da.assigned_date DESC`,
            [deviceId]
        );
        return rows;
    }

    async getStaffAssignments(staffId: number): Promise<DeviceAssignment[]> {
        const { rows } = await this.pool.query(
            `SELECT da.*, md.device_name, md.model, md.imei_1
       FROM device_assignments da
       LEFT JOIN mobile_devices md ON da.device_id = md.id
       WHERE da.staff_id = $1
       ORDER BY da.assigned_date DESC`,
            [staffId]
        );
        return rows;
    }

    // ==================== SIM CARD MANAGEMENT ====================

    async getAllSimCards(): Promise<SimCard[]> {
        const { rows } = await this.pool.query('SELECT * FROM sim_cards ORDER BY phone_number');
        return rows;
    }

    async createSimCard(data: Omit<SimCard, 'id' | 'created_at' | 'updated_at'>): Promise<SimCard> {
        const { rows } = await this.pool.query(
            `INSERT INTO sim_cards (
        device_id, sim_number, phone_number, carrier, plan_type,
        monthly_cost, data_limit_gb, activation_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
            [
                data.device_id || null,
                data.sim_number,
                data.phone_number || null,
                data.carrier || null,
                data.plan_type || null,
                data.monthly_cost || null,
                data.data_limit_gb || null,
                data.activation_date || null,
                data.status || 'ACTIVE'
            ]
        );
        return rows[0];
    }

    async assignSimToDevice(simId: number, deviceId: number): Promise<void> {
        await this.pool.query(
            'UPDATE sim_cards SET device_id = $1 WHERE id = $2',
            [deviceId, simId]
        );
    }

    // ==================== COMMAND MANAGEMENT ====================

    async executeCommand(data: ExecuteCommandRequest): Promise<DeviceCommand> {
        const { rows } = await this.pool.query(
            `INSERT INTO device_commands (device_id, command_type, initiated_by, notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [data.device_id, data.command_type, data.initiated_by, data.notes || null]
        );

        const command = rows[0];

        // Update device status based on command
        if (data.command_type === 'LOCK') {
            await this.pool.query(
                'UPDATE mobile_devices SET is_locked = true WHERE id = $1',
                [data.device_id]
            );
        } else if (data.command_type === 'UNLOCK') {
            await this.pool.query(
                'UPDATE mobile_devices SET is_locked = false WHERE id = $1',
                [data.device_id]
            );
        }

        // TODO: Send actual push notification via FCM/APNS
        // This would integrate with Firebase or Apple Push Notification Service

        return command;
    }

    async getCommandHistory(deviceId: number): Promise<DeviceCommand[]> {
        const { rows } = await this.pool.query(
            'SELECT * FROM device_commands WHERE device_id = $1 ORDER BY initiated_at DESC',
            [deviceId]
        );
        return rows;
    }

    async updateCommandStatus(
        commandId: number,
        status: 'SENT' | 'EXECUTED' | 'FAILED',
        responseData?: any,
        errorMessage?: string
    ): Promise<void> {
        await this.pool.query(
            `UPDATE device_commands 
       SET status = $1, executed_at = NOW(), response_data = $2, error_message = $3
       WHERE id = $4`,
            [status, responseData ? JSON.stringify(responseData) : null, errorMessage || null, commandId]
        );
    }

    // ==================== MAINTENANCE MANAGEMENT ====================

    async createMaintenance(data: Omit<DeviceMaintenance, 'id' | 'created_at'>): Promise<DeviceMaintenance> {
        const { rows } = await this.pool.query(
            `INSERT INTO device_maintenance (
        device_id, maintenance_type, issue_description, repair_cost,
        vendor, start_date, completion_date, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
            [
                data.device_id,
                data.maintenance_type || null,
                data.issue_description || null,
                data.repair_cost || null,
                data.vendor || null,
                data.start_date || null,
                data.completion_date || null,
                data.status || 'IN_PROGRESS',
                data.notes || null
            ]
        );

        // Update device status to REPAIR
        await this.pool.query(
            'UPDATE mobile_devices SET status = $1 WHERE id = $2',
            ['REPAIR', data.device_id]
        );

        return rows[0];
    }

    async getDeviceMaintenance(deviceId: number): Promise<DeviceMaintenance[]> {
        const { rows } = await this.pool.query(
            'SELECT * FROM device_maintenance WHERE device_id = $1 ORDER BY start_date DESC',
            [deviceId]
        );
        return rows;
    }

    // ==================== STATISTICS ====================

    async getStats(): Promise<MDMStats> {
        const statsQuery = await this.pool.query(`
      SELECT 
        COUNT(*) as total_devices,
        SUM(CASE WHEN status = 'ASSIGNED' THEN 1 ELSE 0 END) as assigned_devices,
        SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) as available_devices,
        SUM(CASE WHEN status = 'REPAIR' THEN 1 ELSE 0 END) as devices_in_repair,
        SUM(CASE WHEN is_enrolled = true THEN 1 ELSE 0 END) as enrolled_devices,
        SUM(CASE WHEN os_type = 'iOS' THEN 1 ELSE 0 END) as ios_devices,
        SUM(CASE WHEN os_type = 'Android' THEN 1 ELSE 0 END) as android_devices,
        SUM(CASE WHEN is_locked = true THEN 1 ELSE 0 END) as locked_devices
      FROM mobile_devices
    `);

        const stats = statsQuery.rows[0];
        return {
            total_devices: parseInt(stats.total_devices) || 0,
            assigned_devices: parseInt(stats.assigned_devices) || 0,
            available_devices: parseInt(stats.available_devices) || 0,
            devices_in_repair: parseInt(stats.devices_in_repair) || 0,
            enrolled_devices: parseInt(stats.enrolled_devices) || 0,
            ios_devices: parseInt(stats.ios_devices) || 0,
            android_devices: parseInt(stats.android_devices) || 0,
            locked_devices: parseInt(stats.locked_devices) || 0
        };
    }
}
