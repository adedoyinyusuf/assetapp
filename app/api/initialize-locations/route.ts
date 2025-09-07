import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options-simple';

// Nigerian States and LGAs data
const NIGERIAN_STATES_AND_LGAS = [
  {
    name: "Lagos",
    code: "LA",
    lgas: [
      "Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", 
      "Badagry", "Epe", "Eti-Osa", "Ibeju-Lekki", "Ifako-Ijaiye",
      "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland",
      "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere"
    ]
  },
  {
    name: "Abuja",
    code: "FC",
    lgas: [
      "Abaji", "Bwari", "Gwagwalada", "Kuje", "Kwali", "Municipal Area Council"
    ]
  },
  {
    name: "Kano",
    code: "KN",
    lgas: [
      "Ajingi", "Albasu", "Bagwai", "Bebeji", "Bichi", "Bunkure",
      "Dala", "Dambatta", "Dawakin Kudu", "Dawakin Tofa", "Doguwa",
      "Fagge", "Gabasawa", "Garko", "Garun Mallam", "Gaya", "Gezawa",
      "Gwale", "Gwarzo", "Kabo", "Kano Municipal", "Karaye", "Kibiya",
      "Kiru", "Kumbotso", "Kunchi", "Kura", "Madobi", "Makoda",
      "Minjibir", "Nasarawa", "Rano", "Rimin Gado", "Rogo", "Shanono",
      "Sumaila", "Takai", "Tarauni", "Tofa", "Tsanyawa", "Tudun Wada",
      "Ungogo", "Warawa", "Wudil"
    ]
  },
  {
    name: "Rivers",
    code: "RV",
    lgas: [
      "Abua/Odual", "Ahoada East", "Ahoada West", "Akuku-Toru", "Andoni",
      "Asari-Toru", "Bonny", "Degema", "Eleme", "Emuoha", "Etche",
      "Gokana", "Ikwerre", "Khana", "Obio/Akpor", "Ogba/Egbema/Ndoni",
      "Ogu/Bolo", "Okrika", "Omuma", "Opobo/Nkoro", "Oyigbo",
      "Port Harcourt", "Tai"
    ]
  },
  {
    name: "Oyo",
    code: "OY",
    lgas: [
      "Afijio", "Akinyele", "Atiba", "Atisbo", "Egbeda", "Ibadan North",
      "Ibadan North-East", "Ibadan North-West", "Ibadan South-East",
      "Ibadan South-West", "Ibarapa Central", "Ibarapa East", "Ibarapa North",
      "Ido", "Irepo", "Iseyin", "Itesiwaju", "Iwajowa", "Kajola",
      "Lagelu", "Ogbomoso North", "Ogbomoso South", "Ogo Oluwa", "Olorunsogo",
      "Oluyole", "Ona Ara", "Orelope", "Ori Ire", "Oyo East", "Oyo West",
      "Saki East", "Saki West", "Surulere"
    ]
  }
];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    let statesCreated = 0;
    let lgasCreated = 0;

    for (const stateData of NIGERIAN_STATES_AND_LGAS) {
      // Check if state already exists
      let state = await prisma.state.findFirst({
        where: {
          OR: [
            { name: { equals: stateData.name, mode: 'insensitive' } },
            { code: { equals: stateData.code, mode: 'insensitive' } }
          ]
        }
      });

      // Create state if it doesn't exist
      if (!state) {
        state = await prisma.state.create({
          data: {
            name: stateData.name,
            code: stateData.code,
          }
        });
        statesCreated++;
      }

      // Create LGAs for this state
      for (const lgaName of stateData.lgas) {
        // Check if LGA already exists in this state
        const existingLGA = await prisma.lGA.findFirst({
          where: {
            name: { equals: lgaName, mode: 'insensitive' },
            stateId: state.id
          }
        });

        if (!existingLGA) {
          await prisma.lGA.create({
            data: {
              name: lgaName,
              stateId: state.id
            }
          });
          lgasCreated++;
        }
      }
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'INITIALIZE_LOCATIONS',
        entityType: 'System',
        entityId: null,
        newValues: {
          statesCreated,
          lgasCreated,
          totalStates: NIGERIAN_STATES_AND_LGAS.length,
          totalLGAs: NIGERIAN_STATES_AND_LGAS.reduce((sum, state) => sum + state.lgas.length, 0)
        },
      },
    });

    return NextResponse.json({
      message: `Successfully initialized locations: ${statesCreated} states and ${lgasCreated} LGAs created`,
      statesCreated,
      lgasCreated
    });

  } catch (error) {
    console.error('Error initializing locations:', error);
    return NextResponse.json(
      { error: 'Failed to initialize locations' },
      { status: 500 }
    );
  }
}
