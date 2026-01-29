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

        // Split by comma, handling potential quotes if any (simple split for now as data seems clean)
        const [stateId, stateName, lgaId, lgaName] = line.split(',');

        if (!stateId || !stateName || !lgaId || !lgaName) continue;

        const sId = parseInt(stateId);
        const lId = parseInt(lgaId);

        if (!statesMap.has(sId)) {
            statesMap.set(sId, {
                id: sId,
                name: stateName.trim()
            });
        }

        lgas.push({
            id: lId,
            name: lgaName.trim(),
            stateId: sId
        });
    }

    const stateCodes = {
        'ABIA': 'AB', 'ADAMAWA': 'AD', 'AKWA IBOM': 'AK', 'ANAMBRA': 'AN', 'BAUCHI': 'BA',
        'BAYELSA': 'BY', 'BENUE': 'BE', 'BORNO': 'BO', 'CROSS RIVER': 'CR', 'DELTA': 'DE',
        'EBONYI': 'EB', 'EDO': 'ED', 'EKITI': 'EK', 'ENUGU': 'EN', 'FCT': 'FC',
        'GOMBE': 'GO', 'IMO': 'IM', 'JIGAWA': 'JI', 'KADUNA': 'KD', 'KANO': 'KN',
        'KATSINA': 'KT', 'KEBBI': 'KE', 'KOGI': 'KG', 'KWARA': 'KW', 'LAGOS': 'LA',
        'NASARAWA': 'NA', 'NIGER': 'NI', 'OGUN': 'OG', 'ONDO': 'ON', 'OSUN': 'OS',
        'OYO': 'OY', 'PLATEAU': 'PL', 'RIVERS': 'RI', 'SOKOTO': 'SO', 'TARABA': 'TA',
        'YOBE': 'YO', 'ZAMFARA': 'ZA'
    };

    const data = {
        states: Array.from(statesMap.values()).map(s => ({
            ...s,
            code: stateCodes[s.name.toUpperCase()] || s.name.substring(0, 2).toUpperCase()
        })).sort((a, b) => a.id - b.id),
        lgas: lgas.sort((a, b) => a.id - b.id)
    };

    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    console.log(`Successfully wrote ${data.states.length} states and ${data.lgas.length} LGAs to ${jsonPath}`);

} catch (error) {
    console.error('Error processing CSV:', error);
}
