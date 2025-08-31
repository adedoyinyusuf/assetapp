import { prisma } from './db';

export interface State {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface LGA {
  id: number;
  name: string;
  state_id: number;
  created_at?: string;
  updated_at?: string;
}

// State Functions
export async function getStates(): Promise<State[]> {
  try {
    const states = await prisma.$queryRaw<Array<{
      id: number;
      name: string;
      created_at: Date;
      updated_at: Date;
    }>>`
      SELECT id, name, created_at, updated_at 
      FROM states 
      ORDER BY name ASC
    `;
    
    return states.map(state => ({
      id: state.id,
      name: state.name,
      created_at: state.created_at.toISOString(),
      updated_at: state.updated_at.toISOString()
    }));
  } catch (error) {
    console.error('Error fetching states:', error);
    throw new Error('Failed to fetch states');
  }
}

export async function addState(name: string): Promise<State> {
  try {
    // Check if state with same name already exists
    const existing = await prisma.$queryRaw<Array<{id: number}>>`
      SELECT id FROM states WHERE name = ${name} LIMIT 1
    `;
    
    if (existing && existing.length > 0) {
      throw new Error('A state with this name already exists');
    }
    
    // Create the new state
    const result = await prisma.$queryRaw<Array<{
      id: number;
      name: string;
      created_at: Date;
      updated_at: Date;
    }>>`
      INSERT INTO states (name, created_at, updated_at)
      VALUES (${name}, NOW(), NOW())
      RETURNING *
    `;
    
    const newState = result[0];
    return {
      id: newState.id,
      name: newState.name,
      created_at: newState.created_at.toISOString(),
      updated_at: newState.updated_at.toISOString()
    };
  } catch (error: any) {
    console.error('Error adding state:', error);
    throw new Error(error.message || 'Failed to add state');
  }
}

export async function updateState(id: number, name: string): Promise<void> {
  try {
    // Check if state exists
    const stateExists = await prisma.$queryRaw<Array<{id: number}>>`
      SELECT id FROM states WHERE id = ${id}
    `;
    
    if (!stateExists || stateExists.length === 0) {
      throw new Error('State not found');
    }
    
    // Check if another state with the same name already exists
    const nameExists = await prisma.$queryRaw<Array<{id: number}>>`
      SELECT id FROM states WHERE name = ${name} AND id != ${id} LIMIT 1
    `;
    
    if (nameExists && nameExists.length > 0) {
      throw new Error('A state with this name already exists');
    }
    
    // Update the state
    await prisma.$executeRaw`
      UPDATE states 
      SET name = ${name}, updated_at = NOW() 
      WHERE id = ${id}
    `;
  } catch (error: any) {
    console.error('Error updating state:', error);
    throw new Error(error.message || 'Failed to update state');
  }
}

export async function deleteState(id: number): Promise<void> {
  try {
    // Check if state exists
    const stateExists = await prisma.$queryRaw<Array<{id: number}>>`
      SELECT id FROM states WHERE id = ${id}
    `;
    
    if (!stateExists || stateExists.length === 0) {
      throw new Error('State not found');
    }
    
    // Check if any LGAs are using this state
    const lgasUsingState = await prisma.$queryRaw<Array<{count: number}>>`
      SELECT COUNT(*) as count FROM lgas WHERE state_id = ${id}
    `;
    
    if (lgasUsingState && lgasUsingState[0].count > 0) {
      throw new Error('Cannot delete state: There are LGAs associated with this state');
    }
    
    // Delete the state
    await prisma.$executeRaw`
      DELETE FROM states WHERE id = ${id}
    `;
  } catch (error: any) {
    console.error('Error deleting state:', error);
    throw new Error(error.message || 'Failed to delete state');
  }
}

// LGA Functions
export async function getLGAs(stateId?: number): Promise<LGA[]> {
  try {
    let query = 'SELECT id, name, state_id, created_at, updated_at FROM lgas';
    const params: any[] = [];
    
    if (stateId) {
      query += ' WHERE state_id = $1';
      params.push(stateId);
    }
    
    query += ' ORDER BY name ASC';
    
    const lgas = await prisma.$queryRawUnsafe<Array<{
      id: number;
      name: string;
      state_id: number;
      created_at: Date;
      updated_at: Date;
    }>>(query, ...params);
    
    return lgas.map(lga => ({
      id: lga.id,
      name: lga.name,
      state_id: lga.state_id,
      created_at: lga.created_at.toISOString(),
      updated_at: lga.updated_at.toISOString()
    }));
  } catch (error) {
    console.error('Error fetching LGAs:', error);
    throw new Error('Failed to fetch LGAs');
  }
}

export async function addLGA(name: string, stateId: number): Promise<LGA> {
  try {
    // Check if LGA with same name in the same state already exists
    const existing = await prisma.$queryRaw<Array<{id: number}>>`
      SELECT id FROM lgas WHERE name = ${name} AND state_id = ${stateId} LIMIT 1
    `;
    
    if (existing && existing.length > 0) {
      throw new Error('An LGA with this name already exists in this state');
    }
    
    // Verify state exists
    const stateExists = await prisma.$queryRaw<Array<{id: number}>>`
      SELECT id FROM states WHERE id = ${stateId}
    `;
    
    if (!stateExists || stateExists.length === 0) {
      throw new Error('Invalid state');
    }
    
    // Create the new LGA
    const result = await prisma.$queryRaw<Array<{
      id: number;
      name: string;
      state_id: number;
      created_at: Date;
      updated_at: Date;
    }>>`
      INSERT INTO lgas (name, state_id, created_at, updated_at)
      VALUES (${name}, ${stateId}, NOW(), NOW())
      RETURNING *
    `;
    
    const newLGA = result[0];
    return {
      id: newLGA.id,
      name: newLGA.name,
      state_id: newLGA.state_id,
      created_at: newLGA.created_at.toISOString(),
      updated_at: newLGA.updated_at.toISOString()
    };
  } catch (error: any) {
    console.error('Error adding LGA:', error);
    throw new Error(error.message || 'Failed to add LGA');
  }
}

export async function updateLGA(id: number, name: string, stateId: number): Promise<void> {
  try {
    // Check if LGA exists
    const lgaExists = await prisma.$queryRaw<Array<{id: number}>>`
      SELECT id FROM lgas WHERE id = ${id}
    `;
    
    if (!lgaExists || lgaExists.length === 0) {
      throw new Error('LGA not found');
    }
    
    // Check if another LGA with the same name already exists in the same state
    const nameExists = await prisma.$queryRaw<Array<{id: number}>>`
      SELECT id FROM lgas WHERE name = ${name} AND state_id = ${stateId} AND id != ${id} LIMIT 1
    `;
    
    if (nameExists && nameExists.length > 0) {
      throw new Error('An LGA with this name already exists in this state');
    }
    
    // Verify state exists
    const stateExists = await prisma.$queryRaw<Array<{id: number}>>`
      SELECT id FROM states WHERE id = ${stateId}
    `;
    
    if (!stateExists || stateExists.length === 0) {
      throw new Error('Invalid state');
    }
    
    // Update the LGA
    await prisma.$executeRaw`
      UPDATE lgas 
      SET name = ${name}, state_id = ${stateId}, updated_at = NOW() 
      WHERE id = ${id}
    `;
  } catch (error: any) {
    console.error('Error updating LGA:', error);
    throw new Error(error.message || 'Failed to update LGA');
  }
}

export async function deleteLGA(id: number): Promise<void> {
  try {
    // Check if LGA exists
    const lgaExists = await prisma.$queryRaw<Array<{id: number}>>`
      SELECT id FROM lgas WHERE id = ${id}
    `;
    
    if (!lgaExists || lgaExists.length === 0) {
      throw new Error('LGA not found');
    }
    
    // Check if any assets are using this LGA
    const assetsUsingLGA = await prisma.$queryRaw<Array<{count: number}>>`
      SELECT COUNT(*) as count FROM assets WHERE lga_id = ${id}
    `;
    
    if (assetsUsingLGA && assetsUsingLGA[0].count > 0) {
      throw new Error('Cannot delete LGA: There are assets associated with this LGA');
    }
    
    // Delete the LGA
    await prisma.$executeRaw`
      DELETE FROM lgas WHERE id = ${id}
    `;
  } catch (error: any) {
    console.error('Error deleting LGA:', error);
    throw new Error(error.message || 'Failed to delete LGA');
  }
}
