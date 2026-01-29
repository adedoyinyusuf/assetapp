const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../docs/state_lga.csv.csv');
const jsonPath = path.join(__dirname, '../lib/data/nigeria_locations.json');

try {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');

    const statesMap = new Map();
    const lgas = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Header: STATE_CODE,STATE_NAME,LGA_CODE,LGA_NAME
        // Example: 1,SOKOTO,1,GUDU
        const parts = line.split(',');

        if (parts.length < 4) continue;

        const stateCodeRaw = parts[0].trim(); // "1"
        const stateName = parts[1].trim();    // "SOKOTO"
        const lgaCodeRaw = parts[2].trim();   // "1"
        const lgaName = parts[3].trim();      // "GUDU"

        if (!stateCodeRaw || !stateName || !lgaCodeRaw || !lgaName) continue;

        const stateId = parseInt(stateCodeRaw);
        const lgaId = parseInt(lgaCodeRaw); // This seems to be the LGA ID *within* the state or globally? 
        // In the previous file, LGAs had IDs 1..774. 
        // Let's verify if LGA_CODE is unique or per-state. 
        // Actually, for the purpose of the primary key 'id' in our DB, we might want to generate a unique ID if the CSV reuses 1..N for each state, 
        // OR if the CSV has unique IDs. 
        // Looking at the file: 1,SOKOTO,1,GUDU ... 1,SOKOTO,19,DANGE SHUNI ... then 2,ZAMFARA,?,?
        // We should probably generate a sequential ID for LGAs to ensure uniqueness if the CSV resets.
        // But let's trust the CSV structure for now? No, better to be safe.
        // However, the State ID seems to be the code.

        // Organization Standard Code:
        // If the user says "1" is the code, we use "1" (maybe padded to "01").
        // Let's pad it to 2 digits to look like standard codes if it's a number.
        const stateCode = stateCodeRaw.length === 1 ? `0${stateCodeRaw}` : stateCodeRaw;

        if (!statesMap.has(stateId)) {
            statesMap.set(stateId, {
                id: stateId,
                name: stateName,
                code: stateCode
            });
        }

        // For LGAs, we need a unique global ID for the database primary key.
        // We can use the row index or check if LGA_CODE is globally unique.
        // Let's generate a unique ID based on state and lga index if needed, 
        // BUT the previous seeded data used sequential IDs 1..774.
        // Let's just correct the State Code issue mostly.

        lgas.push({
            id: lgas.length + 1, // Auto-increment ID to be safe
            name: lgaName,
            stateId: stateId
        });
    }

    const data = {
        states: Array.from(statesMap.values()).sort((a, b) => a.id - b.id),
        lgas: lgas.sort((a, b) => a.id - b.id)
    };

    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    console.log(`Successfully wrote ${data.states.length} states and ${data.lgas.length} LGAs to ${jsonPath}`);
    console.log('Sample State:', data.states[0]);

} catch (error) {
    console.error('Error processing CSV:', error);
}
