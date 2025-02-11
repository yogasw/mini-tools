const fs = require('fs');

fs.readFile('tools.json', 'utf8', (err, data) => {
    if (err) {
        console.error("Gagal membaca file:", err);
        return;
    }

    try {
        const jsonData = JSON.parse(data);
        const appData = jsonData.app[0]?.definition?.appV2 || {};

        // 1. Ambil semua query dari dataQueries dan simpan di allQueries
        let allQueries = appData.dataQueries?.map(query => ({
            id: query.id,
            name: query.name
        })) || [];

        console.log("\n=== Semua Query dari dataQueries ===");
        allQueries.forEach(query => {
            console.log(`- ID: ${query.id} | Name: ${query.name}`);
        });

        // 2. Cari semua queryId yang digunakan dalam components tanpa parsing JSON
        const regex = /"queryId":\s*"([a-f0-9-]+)"/g;
        let match;
        let usedQueryIds = new Set();

        while ((match = regex.exec(data)) !== null) {
            usedQueryIds.add(match[1]);
        }

        console.log("\n=== Semua queryId yang Dipakai dalam Components ===");
        usedQueryIds.forEach(id => console.log(`- Query ID: ${id}`));

        // 3. Hapus query yang tidak digunakan dari allQueries
        let cleanAllQueries = allQueries.filter(query => usedQueryIds.has(query.id));

        console.log("\n=== Query yang Masih Digunakan Setelah Pembersihan ===");
        if (cleanAllQueries.length === 0) {
            console.log("Tidak ada query yang digunakan.");
        } else {
            cleanAllQueries.forEach(query => {
                console.log(`- ID: ${query.id} | Name: ${query.name}`);
            });
        }

        let uniqueQueriesName = {};// id and name with key name
        allQueries.forEach(query => {
            if (!uniqueQueriesName[query.name]) {
                uniqueQueriesName[query.name] = query.id;
            }
        });

        console.log("\n=== Query yang unik berdasarkan nama dan tidak di gunakan ===");
        Object.keys(uniqueQueriesName).forEach(name => {
            let id = uniqueQueriesName[name];
            let hashQuery = false;
            cleanAllQueries.forEach(query => {
                if (query.name === name) {
                    hashQuery = true;
                }
            })

            if (!hashQuery) {
                console.log(`Query ini unik: ID: ${id} | Name: ${name}`);
                cleanAllQueries.push({id, name});
            }
        })

        let newJson = jsonData;
        newJson.app[0].definition.appV2.dataQueries = newJson.app[0].definition.appV2.dataQueries.filter(query => {
            let remove = false
            cleanAllQueries.forEach(usedQuery => {
                if (query.id === usedQuery.id) {
                    remove = true;
                }
            });
            return remove;
        });

        // 4. Simpan hasil akhir ke dalam file JSON baru setelah query yang tidak digunakan dihapus
        fs.writeFile('cleaned-queries.json', JSON.stringify(newJson, null, 2), (err) => {
            if (err) {
                console.error("Gagal menyimpan file JSON baru:", err);
            } else {
                console.log("\n✅ File 'cleaned-queries.json' berhasil dibuat setelah pembersihan!");
            }
        });

    } catch (parseError) {
        console.error("Gagal parse JSON:", parseError);
    }
});
