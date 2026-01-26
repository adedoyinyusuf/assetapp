
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting location restoration...');

    // Conflict Resolution for FCT
    const fctState = await prisma.state.findUnique({ where: { name: 'FCT' } });
    const fcCodeState = await prisma.state.findUnique({ where: { code: 'FC' } });

    if (fctState && fctState.code !== 'FC') {
        console.log('⚠️ Found FCT state with non-standard code:', fctState.code);
        if (fcCodeState) {
            console.log('⚠️ Found conflicting state with code FC (Abuja?). Deleting it...');
            // Delete the conflicting 'FC' state (likely 'Abuja' created recently)
            // We delete related LGAs first if no cascade
            await prisma.lGA.deleteMany({ where: { stateId: fcCodeState.id } });
            await prisma.state.delete({ where: { id: fcCodeState.id } });
        }
        console.log('🔄 Updating FCT state code to FC...');
        await prisma.state.update({
            where: { id: fctState.id },
            data: { code: 'FC' }
        });
    }

    const nigeriaStates = [
        {
            name: "Abia",
            code: "AB",
            lgAs: [
                "Aba North", "Aba South", "Arochukwu", "Bende", "Ikwuano", "Isiala Ngwa North",
                "Isiala Ngwa South", "Isuikwuato", "Obi Ngwa", "Ohafia", "Osisioma",
                "Ugwunagbo", "Ukwa East", "Ukwa West", "Umuahia North", "Umuahia South", "Umu Nneochi"
            ]
        },
        {
            name: "Adamawa",
            code: "AD",
            lgAs: [
                "Demsa", "Fufure", "Ganye", "Gayuk", "Gombi", "Grie", "Hong", "Jada",
                "Lamurde", "Madagali", "Maiha", "Mayo Belwa", "Michika", "Mubi North",
                "Mubi South", "Numan", "Shelleng", "Song", "Toungo", "Yola North", "Yola South"
            ]
        },
        {
            name: "Akwa Ibom",
            code: "AK",
            lgAs: [
                "Abak", "Eastern Obolo", "Eket", "Esit Eket", "Essien Udim", "Etim Ekpo",
                "Etinan", "Ibeno", "Ibesikpo Asutan", "Ibiono-Ibom", "Ika", "Ikono",
                "Ikot Abasi", "Ikot Ekpene", "Ini", "Itu", "Mbo", "Mkpat-Enin", "Nsit-Atai",
                "Nsit-Ibom", "Nsit-Ubium", "Obot Akara", "Okobo", "Onna", "Oron", "Oruk Anam",
                "Udung-Uko", "Ukanafun", "Uruan", "Urue-Offong/Oruko", "Uyo"
            ]
        },
        {
            name: "Anambra",
            code: "AN",
            lgAs: [
                "Aguata", "Anambra East", "Anambra West", "Anaocha", "Awka North", "Awka South",
                "Ayamelum", "Dunukofia", "Ekwusigo", "Idemili North", "Idemili South", "Ihiala",
                "Njikoka", "Nnewi North", "Nnewi South", "Ogbaru", "Onitsha North", "Onitsha South",
                "Orumba North", "Orumba South", "Oyi"
            ]
        },
        {
            name: "Bauchi",
            code: "BA",
            lgAs: [
                "Alkaleri", "Bauchi", "Bogoro", "Damban", "Darazo", "Dass", "Gamawa", "Ganjuwa",
                "Giade", "Itas/Gadau", "Jama'are", "Katagum", "Kirfi", "Misau", "Ningi", "Shira",
                "Tafawa Balewa", "Toro", "Warji", "Zaki"
            ]
        },
        {
            name: "Bayelsa",
            code: "BY",
            lgAs: [
                "Brass", "Ekeremor", "Kolokuma/Opokuma", "Nembe", "Ogbia", "Sagbama",
                "Southern Ijaw", "Yenagoa"
            ]
        },
        {
            name: "Benue",
            code: "BE",
            lgAs: [
                "Ado", "Agatu", "Apa", "Buruku", "Gboko", "Guma", "Gwer East", "Gwer West",
                "Katsina-Ala", "Konshisha", "Kwande", "Logo", "Makurdi", "Obi", "Ogbadibo",
                "Ohimini", "Oju", "Okpokwu", "Otukpo", "Tarka", "Ukum", "Ushongo", "Vandeikya"
            ]
        },
        {
            name: "Borno",
            code: "BO",
            lgAs: [
                "Abadam", "Askira/Uba", "Bama", "Bayo", "Biu", "Chibok", "Damboa", "Dikwa",
                "Gubio", "Guzamala", "Gwoza", "Hawul", "Jere", "Kaga", "Kala/Balge", "Konduga",
                "Kukawa", "Kwaya Kusar", "Mafa", "Magumeri", "Maiduguri", "Marte", "Mobbar",
                "Monguno", "Ngala", "Nganzai", "Shani"
            ]
        },
        {
            name: "Cross River",
            code: "CR",
            lgAs: [
                "Abi", "Akamkpa", "Akpabuyo", "Bakassi", "Bekwarra", "Biase", "Boki",
                "Calabar Municipal", "Calabar South", "Etung", "Ikom", "Obanliku", "Obubra",
                "Obudu", "Odukpani", "Ogoja", "Yakuur", "Yala"
            ]
        },
        {
            name: "Delta",
            code: "DE",
            lgAs: [
                "Aniocha North", "Aniocha South", "Bomadi", "Burutu", "Ethiope East",
                "Ethiope West", "Ika North East", "Ika South", "Isoko North", "Isoko South",
                "Ndokwa East", "Ndokwa West", "Okpe", "Oshimili North", "Oshimili South",
                "Patani", "Sapele", "Udu", "Ughelli North", "Ughelli South", "Ukwuani",
                "Uvwie", "Warri North", "Warri South", "Warri South West"
            ]
        },
        {
            name: "Ebonyi",
            code: "EB",
            lgAs: [
                "Abakaliki", "Afikpo North", "Afikpo South", "Ebonyi", "Ezza North", "Ezza South",
                "Ikwo", "Ishielu", "Ivo", "Izzi", "Ohaozara", "Ohaukwu", "Onicha"
            ]
        },
        {
            name: "Edo",
            code: "ED",
            lgAs: [
                "Akoko-Edo", "Egor", "Esan Central", "Esan North-East", "Esan South-East",
                "Esan West", "Etsako Central", "Etsako East", "Etsako West", "Igueben",
                "Ikpoba Okha", "Oredo", "Orhionmwon", "Ovia North-East", "Ovia South-West",
                "Owan East", "Owan West", "Uhunmwonde"
            ]
        },
        {
            name: "Ekiti",
            code: "EK",
            lgAs: [
                "Ado Ekiti", "Efon", "Ekiti East", "Ekiti South-West", "Ekiti West",
                "Emure", "Gbonyin", "Ido Osi", "Ijero", "Ikere", "Ikole", "Ilejemeje",
                "Irepodun/Ifelodun", "Ise/Orun", "Moba", "Oye"
            ]
        },
        {
            name: "Enugu",
            code: "EN",
            lgAs: [
                "Aninri", "Awgu", "Enugu East", "Enugu North", "Enugu South", "Ezeagu",
                "Igbo Etiti", "Igbo Eze North", "Igbo Eze South", "Isi Uzo", "Nkanu East",
                "Nkanu West", "Nsukka", "Oji River", "Udenu", "Udi", "Uzo Uwani"
            ]
        },
        {
            name: "FCT",
            code: "FC",
            lgAs: [
                "Abaji", "Bwari", "Gwagwalada", "Kuje", "Kwali", "Municipal Area Council"
            ]
        },
        {
            name: "Gombe",
            code: "GO",
            lgAs: [
                "Akko", "Balanga", "Billiri", "Dukku", "Funakaye", "Gombe", "Kaltungo",
                "Kwami", "Nafada", "Shongom", "Yamaltu/Deba"
            ]
        },
        {
            name: "Imo",
            code: "IM",
            lgAs: [
                "Aboh Mbaise", "Ahiazu Mbaise", "Ehime Mbano", "Ezinihitte", "Ideato North",
                "Ideato South", "Ihitte/Uboma", "Ikeduru", "Isiala Mbano", "Isu", "Mbaitoli",
                "Ngor Okpala", "Njaba", "Nkwerre", "Nwangele", "Obowo", "Oguta", "Ohaji/Egbema",
                "Okigwe", "Orlu", "Orsu", "Oru East", "Oru West", "Owerri Municipal",
                "Owerri North", "Owerri West", "Unuimo"
            ]
        },
        {
            name: "Jigawa",
            code: "JI",
            lgAs: [
                "Auyo", "Babura", "Biriniwa", "Birnin Kudu", "Buji", "Dutse", "Gagarawa",
                "Garki", "Gumel", "Guri", "Gwaram", "Gwiwa", "Hadejia", "Jahun", "Kafin Hausa",
                "Kaugama", "Kazaure", "Kiri Kasama", "Kiyawa", "Maigatari", "Malam Madori",
                "Miga", "Ringim", "Roni", "Sule Tankarkar", "Taura", "Yankwashi"
            ]
        },
        {
            name: "Kaduna",
            code: "KD",
            lgAs: [
                "Birnin Gwari", "Chikun", "Giwa", "Igabi", "Ikara", "Jaba", "Jema'a",
                "Kachia", "Kaduna North", "Kaduna South", "Kagarko", "Kajuru", "Kaura",
                "Kauru", "Kubau", "Kudan", "Lere", "Makarfi", "Sabon Gari", "Sanga",
                "Soba", "Zangon Kataf", "Zaria"
            ]
        },
        {
            name: "Kano",
            code: "KN",
            lgAs: [
                "Ajingi", "Albasu", "Bagwai", "Bebeji", "Bichi", "Bunkure", "Dala", "Dambatta",
                "Dawakin Kudu", "Dawakin Tofa", "Doguwa", "Fagge", "Gabasawa", "Garko",
                "Garun Mallam", "Gaya", "Gezawa", "Gwale", "Gwarzo", "Kabo", "Kano Municipal",
                "Karaye", "Kibiya", "Kiru", "Kumbotso", "Kunchi", "Kura", "Madobi", "Makoda",
                "Minjibir", "Nasarawa", "Rano", "Rimin Gado", "Rogo", "Shanono", "Sumaila",
                "Takai", "Tarauni", "Tofa", "Tsanyawa", "Tudun Wada", "Ungogo", "Warawa", "Wudil"
            ]
        },
        {
            name: "Katsina",
            code: "KT",
            lgAs: [
                "Bakori", "Batagarawa", "Batsari", "Baure", "Bindawa", "Charanchi", "Dandume",
                "Danja", "Dan Musa", "Daura", "Dutsi", "Dutsin Ma", "Faskari", "Funtua",
                "Ingawa", "Jibia", "Kafur", "Kaita", "Kankara", "Kankia", "Katsina",
                "Kurfi", "Kusada", "Mai'Adua", "Malumfashi", "Mani", "Mashi", "Matazu",
                "Musawa", "Rimi", "Sabuwa", "Safana", "Sandamu", "Zango"
            ]
        },
        {
            name: "Kebbi",
            code: "KE",
            lgAs: [
                "Aleiro", "Arewa Dandi", "Argungu", "Augie", "Bagudo", "Birnin Kebbi", "Bunza",
                "Dandi", "Fakai", "Gwandu", "Jega", "Kalgo", "Koko/Besse", "Maiyama", "Ngaski",
                "Sakaba", "Shanga", "Suru", "Wasagu/Danko", "Yauri", "Zuru"
            ]
        },
        {
            name: "Kogi",
            code: "KO",
            lgAs: [
                "Adavi", "Ajaokuta", "Ankpa", "Bassa", "Dekina", "Ibaji", "Idah", "Igalamela Odolu",
                "Ijumu", "Kabba/Bunu", "Kogi", "Lokoja", "Mopa Muro", "Ofu", "Ogori/Magongo",
                "Okehi", "Okene", "Olamaboro", "Omala", "Yagba East", "Yagba West"
            ]
        },
        {
            name: "Kwara",
            code: "KW",
            lgAs: [
                "Asa", "Baruten", "Edu", "Ekiti", "Ifelodun", "Ilorin East", "Ilorin South",
                "Ilorin West", "Irepodun", "Isin", "Kaiama", "Moro", "Offa", "Oke Ero",
                "Oyun", "Pategi"
            ]
        },
        {
            name: "Lagos",
            code: "LA",
            lgAs: [
                "Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry",
                "Epe", "Eti Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu", "Kosofe",
                "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu",
                "Surulere"
            ]
        },
        {
            name: "Nasarawa",
            code: "NA",
            lgAs: [
                "Akwanga", "Awe", "Doma", "Karu", "Keana", "Keffi", "Kokona", "Lafia",
                "Nasarawa", "Nasarawa Egon", "Obi", "Toto", "Wamba"
            ]
        },
        {
            name: "Niger",
            code: "NI",
            lgAs: [
                "Agaie", "Agwara", "Bida", "Borgu", "Bosso", "Chanchaga", "Edati", "Gbako",
                "Gurara", "Katcha", "Kontagora", "Lapai", "Lavun", "Magama", "Mariga",
                "Mashegu", "Mokwa", "Moya", "Paikoro", "Rafi", "Rijau", "Shiroro",
                "Suleja", "Tafa", "Wushishi"
            ]
        },
        {
            name: "Ogun",
            code: "OG",
            lgAs: [
                "Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Egbado North", "Egbado South",
                "Ewekoro", "Ifo", "Ijebu East", "Ijebu North", "Ijebu North East", "Ijebu Ode",
                "Ikenne", "Imeko Afon", "Ipokia", "Obafemi Owode", "Odeda", "Odogbolu",
                "Ogun Waterside", "Remo North", "Shagamu"
            ]
        },
        {
            name: "Ondo",
            code: "ON",
            lgAs: [
                "Akoko North-East", "Akoko North-West", "Akoko South-East", "Akoko South-West",
                "Akure North", "Akure South", "Ese Odo", "Idanre", "Ifedore", "Ilaje",
                "Ile Oluji/Okeigbo", "Irele", "Odigbo", "Okitipupa", "Ondo East", "Ondo West",
                "Ose", "Owo"
            ]
        },
        {
            name: "Osun",
            code: "OS",
            lgAs: [
                "Atakunmosa East", "Atakunmosa West", "Aiyedaade", "Aiyedire", "Boluwaduro",
                "Boripe", "Ede North", "Ede South", "Egbedore", "Ejigbo", "Ife Central",
                "Ife East", "Ife North", "Ife South", "Ifedayo", "Ifelodun", "Ila", "Ilesa East",
                "Ilesa West", "Irepodun", "Irewole", "Isokan", "Iwo", "Obokun", "Odo Otin",
                "Ola Oluwa", "Olorunda", "Oriade", "Orolu", "Osogbo"
            ]
        },
        {
            name: "Oyo",
            code: "OY",
            lgAs: [
                "Afijio", "Akinyele", "Atiba", "Atisbo", "Egbeda", "Ibadan North", "Ibadan North-East",
                "Ibadan North-West", "Ibadan South-East", "Ibadan South-West", "Ibarapa Central",
                "Ibarapa East", "Ibarapa North", "Ido", "irepo", "Iseyin", "Itesiwaju",
                "iwajowa", "Kajola", "Lagelu", "Ogbomosho North", "Ogbomosho South", "Ogo Oluwa",
                "Olorunsogo", "Oluyole", "Ona Ara", "Orelope", "Ori Ire", "Oyo East", "Oyo West",
                "Saki East", "Saki West", "Surulere"
            ]
        },
        {
            name: "Plateau",
            code: "PL",
            lgAs: [
                "Barkin Ladi", "Bassa", "Bokkos", "Jos East", "Jos North", "Jos South",
                "Kanam", "Kanke", "Langtang North", "Langtang South", "Mangu", "Mikang",
                "Pankshin", "Qua'an Pan", "Riyom", "Shendam", "Wase"
            ]
        },
        {
            name: "Rivers",
            code: "RI",
            lgAs: [
                "Abua/Odual", "Ahoada East", "Ahoada West", "Akuku-Toru", "Andoni", "Asari-Toru",
                "Bonny", "Degema", "Eleme", "Emohua", "Etche", "Gokana", "Ikwerre", "Khana",
                "Obio/Akpor", "Ogba/Egbema/Ndoni", "Ogu/Bolo", "Okrika", "Omuma", "Opobo/Nkoro",
                "Oyigbo", "Port Harcourt", "Tai"
            ]
        },
        {
            name: "Sokoto",
            code: "SO",
            lgAs: [
                "Binji", "Bodinga", "Dange Shuni", "Gada", "Goronyo", "Gudu", "Gwadabawa",
                "Illela", "Isa", "Kebbe", "Kware", "Rabah", "Sabon Birni", "Shagari",
                "Silame", "Sokoto North", "Sokoto South", "Tambuwal", "Tangaza", "Tureta",
                "Wamakko", "Wurno", "Yabo"
            ]
        },
        {
            name: "Taraba",
            code: "TA",
            lgAs: [
                "Ardo Kola", "Bali", "Donga", "Gashaka", "Gassol", "Ibi", "Jalingo",
                "Karim Lamido", "Kumi", "Lau", "Sardauna", "Takum", "Ussa", "Wukari",
                "Yorro", "Zing"
            ]
        },
        {
            name: "Yobe",
            code: "YO",
            lgAs: [
                "Bade", "Bursari", "Damaturu", "Fika", "Fune", "Geidam", "Gujba", "Gulani",
                "Jakusko", "Karasuwa", "Machina", "Nangere", "Nguru", "Potiskum", "Tarmuwa",
                "Yunusari", "Yusufari"
            ]
        },
        {
            name: "Zamfara",
            code: "ZA",
            lgAs: [
                "Anka", "Bakura", "Birnin Magaji/Kiyaw", "Bukkuyum", "Bungudu", "Gummi",
                "Gusau", "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara",
                "Tsafe", "Zurmi"
            ]
        }
    ];

    let statesCreated = 0;
    let lgasCreated = 0;

    for (const stateData of nigeriaStates) {
        // Upsert State
        const state = await prisma.state.upsert({
            where: { code: stateData.code },
            update: { name: stateData.name }, // Ensure name is correct
            create: {
                name: stateData.name,
                code: stateData.code,
            },
        });

        if (state) statesCreated++;

        for (const lgaName of stateData.lgAs) {
            // Upsert LGA
            await prisma.lGA.upsert({
                where: {
                    name_stateId: {
                        name: lgaName,
                        stateId: state.id
                    }
                },
                update: {}, // No update needed if exists
                create: {
                    name: lgaName,
                    stateId: state.id,
                },
            });
            lgasCreated++;
        }
        console.log(`✅ Processed ${stateData.name}: ${stateData.lgAs.length} LGAs`);
    }

    console.log(`\n🎉 Restoration Complete!`);
    console.log(`States processed: ${statesCreated}`);
    console.log(`LGAs processed: ${lgasCreated}`);
}

main()
    .catch((e) => {
        console.error('Error restoring locations:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
