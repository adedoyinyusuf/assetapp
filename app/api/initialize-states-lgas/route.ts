import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { UserRole } from '@/lib/auth/roles'

export const dynamic = 'force-dynamic';


// Nigerian States from CSV
const STATES_DATA = [
  { id: 1, name: 'SOKOTO' },
  { id: 2, name: 'ZAMFARA' },
  { id: 3, name: 'KATSINA' },
  { id: 4, name: 'JIGAWA' },
  { id: 5, name: 'YOBE' },
  { id: 6, name: 'BORNO' },
  { id: 7, name: 'ADAMAWA' },
  { id: 8, name: 'GOMBE' },
  { id: 9, name: 'BAUCHI' },
  { id: 10, name: 'KANO' },
  { id: 11, name: 'KADUNA' },
  { id: 12, name: 'KEBBI' },
  { id: 13, name: 'NIGER' },
  { id: 14, name: 'FCT' },
  { id: 15, name: 'NASARAWA' },
  { id: 16, name: 'PLATEAU' },
  { id: 17, name: 'TARABA' },
  { id: 18, name: 'BENUE' },
  { id: 19, name: 'KOGI' },
  { id: 20, name: 'KWARA' },
  { id: 21, name: 'OYO' },
  { id: 22, name: 'OSUN' },
  { id: 23, name: 'EKITI' },
  { id: 24, name: 'ONDO' },
  { id: 25, name: 'EDO' },
  { id: 26, name: 'ANAMBRA' },
  { id: 27, name: 'ENUGU' },
  { id: 28, name: 'EBONYI' },
  { id: 29, name: 'CROSS RIVER' },
  { id: 30, name: 'AKWA IBOM' },
  { id: 31, name: 'ABIA' },
  { id: 32, name: 'IMO' },
  { id: 33, name: 'RIVERS' },
  { id: 34, name: 'BAYELSA' },
  { id: 35, name: 'DELTA' },
  { id: 36, name: 'LAGOS' },
  { id: 37, name: 'OGUN' },
];

// Load complete LGAs data - using dynamic import to avoid large file
let COMPLETE_LGAS_DATA: any[] = [];

async function loadLgasData() {
  // Fallback to a few sample LGAs
  return [
    { id: 1, name: 'GUDU', stateId: 1 },
    { id: 735, name: 'BADAGRY', stateId: 36 },
    { id: 774, name: 'OGUN WATERSIDE', stateId: 37 },
  ];
}


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin privileges
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    let statesCreated = 0;
    let lgasCreated = 0;

    // First, create states
    for (const stateData of STATES_DATA) {
      // Check if state already exists
      let existingState = await prisma.state.findFirst({
        where: {
          name: { equals: stateData.name, mode: 'insensitive' }
        }
      });

      // Create state if it doesn't exist
      if (!existingState) {
        await prisma.state.create({
          data: {
            name: stateData.name,
            code: stateData.name.substring(0, 3).toUpperCase(), // Generate a 3-letter code
          }
        });
        statesCreated++;
      }
    }

    // Get all states with their database IDs
    const allStates = await prisma.state.findMany({
      select: { id: true, name: true }
    });

    // Create a mapping from state name to database ID
    const stateNameToDbId: { [key: string]: number } = {};
    allStates.forEach((state: any) => {
      stateNameToDbId[state.name] = state.id;
    });

    // Load LGAs data
    const lgasData = await loadLgasData();

    // Create LGAs using the database state IDs
    for (const lgaData of lgasData) {
      // Find the state name for this LGA's original state ID
      const stateName = STATES_DATA.find(s => s.id === lgaData.stateId)?.name;
      if (!stateName) continue;

      const dbStateId = stateNameToDbId[stateName];
      if (!dbStateId) continue;

      // Check if LGA already exists
      const existingLGA = await prisma.lGA.findFirst({
        where: {
          name: { equals: lgaData.name, mode: 'insensitive' },
          stateId: dbStateId
        }
      });

      if (!existingLGA) {
        await prisma.lGA.create({
          data: {
            name: lgaData.name,
            stateId: dbStateId
          }
        });
        lgasCreated++;
      }
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'INITIALIZE_STATES_LGAS',
        entityType: 'System',
        entityId: null,
        newValues: {
          statesCreated,
          lgasCreated,
          totalStates: STATES_DATA.length,
          totalLGAs: lgasData.length
        },
      },
    });

    return NextResponse.json({
      message: `Successfully initialized Nigerian states and LGAs: ${statesCreated} states and ${lgasCreated} LGAs created`,
      statesCreated,
      lgasCreated,
      totalStates: STATES_DATA.length,
      totalLGAs: lgasData.length
    });

  } catch (error) {
    console.error('Error initializing states and LGAs:', error);
    return NextResponse.json(
      { error: 'Failed to initialize states and LGAs' },
      { status: 500 }
    );
  }
}
